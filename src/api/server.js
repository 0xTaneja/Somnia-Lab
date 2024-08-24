const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { ethers } = require('ethers');
require('dotenv').config();

// Import existing services
const { analyzeTransaction } = require('../analysis/rugDetector');
const { getRiskScore, getDetailedRiskAssessment } = require('../utils/riskScorer');
const { somniaService } = require('../services/somniaService');
const { abiDecoder } = require('../services/abiDecoder');

// Import new enhanced services
const aiAnalysisService = require('../services/aiAnalysisService');
const crossChainService = require('../services/crossChainService');
const socialAnalysisService = require('../services/socialAnalysisService');
const tokenomicsService = require('../services/tokenomicsService');
const websocketService = require('../services/websocketService');
const telegramBot = require('../services/telegramBot');
const contractService = require('../services/contractService');
const somniaMonitorService = require('../services/somniaMonitorService');
const semanticTransactionDecoder = require('../services/semanticTransactionDecoder');
const advancedThreatMonitor = require('../services/advancedThreatMonitor');
const aiContractTools = require('../services/aiContractTools');
// Social security service removed

const config = require('../config');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Debug: log HTTP upgrade requests to help diagnose WebSocket handshakes
server.on('upgrade', (request, socket, head) => {
  try {
    console.log(`🛰️ HTTP upgrade requested for ${request.url} from ${request.socket && request.socket.remoteAddress}`);
  } catch (_) {
    console.log('🛰️ HTTP upgrade requested');
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.API_RATE_LIMIT || 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});
app.use('/api/', limiter);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../../frontend')));

// Enhanced health check with all services
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      api: 'operational',
      somniaNetwork: somniaService.isConnected() ? 'connected' : 'disconnected',
      abiDecoder: 'operational',
      riskAnalysis: 'operational',
      aiAnalysis: aiAnalysisService.initialized ? 'operational' : 'initializing',
      crossChain: crossChainService.initialized ? 'operational' : 'initializing',
      socialAnalysis: socialAnalysisService.initialized ? 'operational' : 'initializing',
      tokenomics: tokenomicsService.initialized ? 'operational' : 'initializing',
      websocket: websocketService.initialized ? 'operational' : 'disabled',
      telegramBot: telegramBot.initialized ? 'operational' : 'disabled',
      contracts: contractService.isAvailable() ? 'operational' : 'disabled',
      somniaMonitor: somniaMonitorService.initialized ? 'operational' : 'disabled'
    }
  };

  // Add real network info if connected
  if (somniaService.isConnected()) {
    try {
      const stats = await somniaService.getNetworkStats();
      health.network = stats;
    } catch (error) {
      health.services.somniaNetwork = 'connected_with_errors';
    }
  }

  // Add WebSocket stats
  if (websocketService.initialized) {
    health.websocket = websocketService.getServerStats();
  }

  // Add Telegram bot stats
  if (telegramBot.initialized) {
    health.telegram = telegramBot.getStats();
  }

  // Add contract service info
  if (contractService.isAvailable()) {
    health.contracts = {
      available: true,
      addresses: contractService.getContractAddresses(),
      contracts: contractService.getAvailableContracts(),
      networkInfo: await contractService.getNetworkInfo()
    };
  }

  res.json(health);
});

// Network information endpoint
app.get('/api/network-info', async (req, res) => {
  try {
    const networkInfo = {
      somnia: somniaService.isConnected() ? await somniaService.getNetworkStats() : null,
      crossChain: crossChainService.initialized ? await crossChainService.getNetworkStats() : null,
      timestamp: new Date().toISOString()
    };

    res.json(networkInfo);
  } catch (error) {
    console.error('Network info error:', error);
    res.status(500).json({
      error: 'Failed to fetch network information',
      message: error.message
    });
  }
});

// ENHANCED TRANSACTION ANALYSIS with AI integration
app.post('/api/analyze-transaction', async (req, res) => {
  try {
    const { transactionData, contractAddress, includeAI = true, includeSocial = false } = req.body;

    if (!transactionData || !contractAddress) {
      return res.status(400).json({
        error: 'Missing required fields: transactionData and contractAddress'
      });
    }

    console.log(`🔍 Enhanced analysis for contract: ${contractAddress}`);

    // 1. Decode transaction using enhanced ABI decoder
    const decodedTransaction = abiDecoder.decodeTransaction(transactionData);
    console.log(`📝 Decoded method: ${decodedTransaction.methodName}`);

    // 2. Simulate transaction on real Somnia testnet
    const formattedTx = {
      data: transactionData.data || '0x',
      to: contractAddress,
      value: transactionData.value || '0x0',
      from: transactionData.from || ethers.ZeroAddress
    };
    const simulation = await somniaService.simulateTransaction(formattedTx, contractAddress);
    console.log(`⚡ Somnia simulation ${simulation.success ? 'successful' : 'failed'}`);

    // 3. Perform traditional risk analysis
    const analysis = await analyzeTransaction(transactionData, contractAddress);
    analysis.decodedTransaction = decodedTransaction;
    analysis.simulation = simulation;

    // 4. AI Analysis (if enabled)
    let aiAnalysis = null;
    if (includeAI) {
      try {
        // Get contract code for AI analysis
        const provider = somniaService.provider;
        const contractCode = await provider.getCode(contractAddress);
        aiAnalysis = await aiAnalysisService.analyzeContractWithAI(contractCode, contractAddress, transactionData);
        console.log(`🤖 AI analysis completed with ${aiAnalysis.confidence} confidence`);
      } catch (error) {
        console.log(`⚠️ AI analysis failed: ${error.message}`);
        aiAnalysis = { error: error.message };
      }
    }

    // 5. Social sentiment analysis (if enabled)
    let socialAnalysis = null;
    if (includeSocial) {
      try {
        socialAnalysis = await socialAnalysisService.analyzeSocialSentiment(contractAddress);
        console.log(`📱 Social analysis completed: ${socialAnalysis.overallSentiment.label}`);
      } catch (error) {
        console.log(`⚠️ Social analysis failed: ${error.message}`);
        socialAnalysis = { error: error.message };
      }
    }

    // 6. Generate comprehensive risk assessment
    const riskAssessment = getDetailedRiskAssessment(analysis, aiAnalysis, socialAnalysis);

    // 7. Add human-readable description
    const humanDescription = abiDecoder.getHumanReadableDescription(decodedTransaction);

    // 8. Broadcast real-time alert if high risk
    if (riskAssessment.score > 70) {
      const alertData = {
        contractAddress,
        riskLevel: riskAssessment.level,
        riskScore: riskAssessment.score,
        alertType: 'high_risk_transaction',
        message: `High risk transaction detected: ${humanDescription}`,
        timestamp: new Date().toISOString()
      };

      // Broadcast via WebSocket
      if (websocketService.initialized) {
        websocketService.broadcastRiskAlert(alertData);
      }

      // Broadcast via Telegram
      if (telegramBot.initialized) {
        await telegramBot.broadcastRiskAlert(alertData);
      }
    }

    const response = {
      contractAddress,
      riskScore: riskAssessment.score,
      riskLevel: riskAssessment.level,
      humanDescription,
      analysis,
      decodedTransaction,
      simulation: simulation.success ? simulation : { error: simulation.error, mockMode: true },
      aiAnalysis,
      socialAnalysis,
      riskAssessment,
      recommendations: riskAssessment.recommendations,
      timestamp: new Date().toISOString(),
      enhancedFeatures: {
        aiAnalysis: includeAI,
        socialAnalysis: includeSocial,
        realTimeAlerts: websocketService.initialized
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Enhanced analysis error:', error);
    res.status(500).json({
      error: 'Enhanced analysis failed',
      message: error.message
    });
  }
});

// ENHANCED CONTRACT ASSESSMENT with full analysis
app.post('/api/assess-contract', async (req, res) => {
  try {
    const { contractAddress, includeAI = true, includeSocial = true, includeTokenomics = true, includeCrossChain = false } = req.body;

    if (!contractAddress) {
      return res.status(400).json({
        error: 'Missing required field: contractAddress'
      });
    }

    console.log(`🔍 Comprehensive assessment for: ${contractAddress}`);

    const assessment = {
      contractAddress,
      timestamp: new Date().toISOString(),
      basicAnalysis: {},
      aiAnalysis: null,
      socialAnalysis: null,
      tokenomicsAnalysis: null,
      crossChainAnalysis: null,
      overallRisk: {
        score: 0,
        level: 'UNKNOWN',
        confidence: 0
      },
      recommendations: []
    };

    // 1. Basic contract analysis
    const provider = somniaService.provider;
    const contractCode = await provider.getCode(contractAddress);
    
    if (contractCode === '0x') {
      return res.status(404).json({
        error: 'Contract not found on Somnia network',
        contractAddress
      });
    }

    // Simulate basic transaction to get info
    const basicTx = {
      to: contractAddress,
      data: '0x',
      value: '0x0',
      from: ethers.ZeroAddress
    };
    
    assessment.basicAnalysis = await somniaService.simulateTransaction(basicTx, contractAddress);

    // 2. AI Analysis
    if (includeAI) {
      try {
        assessment.aiAnalysis = await aiAnalysisService.analyzeContractWithAI(contractCode, contractAddress);
        console.log(`🤖 AI analysis: ${assessment.aiAnalysis.analysis.riskLevel} risk`);
      } catch (error) {
        assessment.aiAnalysis = { error: error.message };
      }
    }

    // 3. Social Analysis
    if (includeSocial) {
      try {
        assessment.socialAnalysis = await socialAnalysisService.analyzeSocialSentiment(contractAddress);
        console.log(`📱 Social sentiment: ${assessment.socialAnalysis.overallSentiment.label}`);
      } catch (error) {
        assessment.socialAnalysis = { error: error.message };
      }
    }

    // 4. Tokenomics Analysis
    if (includeTokenomics) {
      try {
        assessment.tokenomicsAnalysis = await tokenomicsService.analyzeTokenomics(contractAddress, provider, 'somnia');
        console.log(`💰 Tokenomics risk: ${assessment.tokenomicsAnalysis.riskLevel}`);
      } catch (error) {
        assessment.tokenomicsAnalysis = { error: error.message };
      }
    }

    // 5. Cross-Chain Analysis
    if (includeCrossChain) {
      try {
        assessment.crossChainAnalysis = await crossChainService.analyzeContractAcrossChains(contractAddress);
        console.log(`🌐 Cross-chain: ${assessment.crossChainAnalysis.summary.deployedNetworks.length} networks`);
      } catch (error) {
        assessment.crossChainAnalysis = { error: error.message };
      }
    }

    // 6. Add on-chain analysis if available
    if (contractService.isAvailable()) {
      try {
        assessment.onChainAnalysis = await contractService.getEnhancedContractAnalysis(contractAddress);
        console.log(`🔗 On-chain analysis included`);
      } catch (error) {
        console.log(`⚠️ On-chain analysis failed: ${error.message}`);
        assessment.onChainAnalysis = { error: error.message };
      }
    }

    // 7. Calculate overall risk
    assessment.overallRisk = calculateOverallRisk(assessment);

    // 8. Generate comprehensive recommendations
    assessment.recommendations = generateComprehensiveRecommendations(assessment);

    // 9. Broadcast contract analysis if significant
    const analysisData = {
      contractAddress,
      riskLevel: assessment.overallRisk.level,
      riskScore: assessment.overallRisk.score,
      analysisComplete: true,
      timestamp: new Date().toISOString()
    };

    if (websocketService.initialized) {
      websocketService.broadcastContractAnalysis(analysisData);
    }

    // Send Telegram alert for high-risk contracts
    if (assessment.overallRisk.score > 60 && telegramBot.initialized) {
      await telegramBot.broadcastRiskAlert({
        ...analysisData,
        alertType: 'high_risk_contract',
        message: `High risk contract detected during comprehensive analysis`
      });
    }

    res.json(assessment);

  } catch (error) {
    console.error('Contract assessment error:', error);
    res.status(500).json({
      error: 'Contract assessment failed',
      message: error.message
    });
  }
});

// NEW: AI Analysis endpoint
app.post('/api/ai-analysis', async (req, res) => {
  try {
    const { contractAddress, contractCode, transactionData } = req.body;

    if (!contractAddress) {
      return res.status(400).json({
        error: 'Missing required field: contractAddress'
      });
    }

    let codeToAnalyze = contractCode;
    if (!codeToAnalyze && somniaService.isConnected()) {
      codeToAnalyze = await somniaService.provider.getCode(contractAddress);
    }

    const analysis = await aiAnalysisService.analyzeContractWithAI(codeToAnalyze, contractAddress, transactionData);
    
    res.json({
      contractAddress,
      aiAnalysis: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'AI analysis failed',
      message: error.message
    });
  }
});

// NEW: Cross-Chain Analysis endpoint
app.post('/api/cross-chain-analysis', async (req, res) => {
  try {
    const { contractAddress } = req.body;

    if (!contractAddress) {
      return res.status(400).json({
        error: 'Missing required field: contractAddress'
      });
    }

    const analysis = await crossChainService.analyzeContractAcrossChains(contractAddress);
    
    res.json({
      contractAddress,
      crossChainAnalysis: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Cross-chain analysis failed',
      message: error.message
    });
  }
});

// NEW: Social Media Analysis endpoint
app.post('/api/social-analysis', async (req, res) => {
  try {
    const { contractAddress, projectName, searchTerms } = req.body;

    if (!contractAddress) {
      return res.status(400).json({
        error: 'Missing required field: contractAddress'
      });
    }

    const analysis = await socialAnalysisService.analyzeSocialSentiment(contractAddress, projectName, searchTerms || []);
    
    res.json({
      contractAddress,
      socialAnalysis: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Social analysis failed',
      message: error.message
    });
  }
});

// NEW: Tokenomics Analysis endpoint
app.post('/api/tokenomics-analysis', async (req, res) => {
  try {
    const { contractAddress, networkKey = 'somnia' } = req.body;

    if (!contractAddress) {
      return res.status(400).json({
        error: 'Missing required field: contractAddress'
      });
    }

    const provider = somniaService.provider;
    const analysis = await tokenomicsService.analyzeTokenomics(contractAddress, provider, networkKey);
    
    res.json({
      contractAddress,
      tokenomicsAnalysis: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Tokenomics analysis failed',
      message: error.message
    });
  }
});

// NEW: Semantic Transaction Decoder endpoints 🧠
app.post('/api/semantic-decode', async (req, res) => {
  try {
    const { transactionData, contractCode = null } = req.body;

    if (!transactionData) {
      return res.status(400).json({
        error: 'Missing required field: transactionData'
      });
    }

    console.log('🧠 Processing semantic transaction decode request...');
    const startTime = Date.now();
    
    // Perform semantic decoding
    const semanticAnalysis = await semanticTransactionDecoder.decodeTransaction(transactionData, contractCode);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Semantic decoding completed in ${processingTime}ms`);

    res.json({
      success: true,
      semanticAnalysis,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Semantic decoding failed:', error);
    res.status(500).json({
      error: 'Semantic transaction decoding failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// NEW: Batch Semantic Analysis for multiple transactions
app.post('/api/semantic-decode-batch', async (req, res) => {
  try {
    const { transactions, maxConcurrent = 3 } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        error: 'Missing required field: transactions (array)'
      });
    }

    if (transactions.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 transactions allowed per batch request'
      });
    }

    console.log(`🧠 Processing batch semantic decode for ${transactions.length} transactions...`);
    const startTime = Date.now();
    
    // Process transactions in batches to avoid overwhelming the system
    const results = [];
    for (let i = 0; i < transactions.length; i += maxConcurrent) {
      const batch = transactions.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (txData, index) => {
        try {
          const analysis = await semanticTransactionDecoder.decodeTransaction(txData.transactionData, txData.contractCode);
          return {
            index: i + index,
            success: true,
            transactionHash: txData.transactionData.hash || txData.transactionData.txHash,
            semanticAnalysis: analysis
          };
        } catch (error) {
          return {
            index: i + index,
            success: false,
            transactionHash: txData.transactionData.hash || txData.transactionData.txHash,
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    const processingTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    
    console.log(`✅ Batch semantic decoding completed: ${successCount}/${transactions.length} successful in ${processingTime}ms`);

    res.json({
      success: true,
      totalTransactions: transactions.length,
      successfulAnalyses: successCount,
      results,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Batch semantic decoding failed:', error);
    res.status(500).json({
      error: 'Batch semantic transaction decoding failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// NEW: Transaction Intent Analysis (quick analysis)
app.post('/api/transaction-intent', async (req, res) => {
  try {
    const { transactionData } = req.body;

    if (!transactionData) {
      return res.status(400).json({
        error: 'Missing required field: transactionData'
      });
    }

    console.log('🎯 Analyzing transaction intent...');
    
    // Quick intent analysis without full semantic decoding
    const intent = await semanticTransactionDecoder.extractTransactionIntent(transactionData);
    
    res.json({
      success: true,
      transactionHash: transactionData.hash || transactionData.txHash,
      intent,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Intent analysis failed:', error);
    res.status(500).json({
      error: 'Transaction intent analysis failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// NEW: Bytecode Decompilation endpoint
app.post('/api/decompile-bytecode', async (req, res) => {
  try {
    const { contractCode, contractAddress } = req.body;

    if (!contractCode && !contractAddress) {
      return res.status(400).json({
        error: 'Either contractCode or contractAddress is required'
      });
    }

    console.log('🔬 Decompiling contract bytecode...');
    
    const decompilation = await semanticTransactionDecoder.decompileBytecode(contractCode, contractAddress);
    
    res.json({
      success: true,
      contractAddress,
      decompilation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Bytecode decompilation failed:', error);
    res.status(500).json({
      error: 'Bytecode decompilation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// NEW: Advanced Threat Monitoring endpoints 🔍
app.post('/api/threat-analysis', async (req, res) => {
  try {
    const { transactionData, semanticAnalysis = null } = req.body;

    if (!transactionData) {
      return res.status(400).json({
        error: 'Missing required field: transactionData'
      });
    }

    console.log('🔍 Processing advanced threat analysis request...');
    const startTime = Date.now();
    
    // Perform advanced threat analysis
    const threatAnalysis = await advancedThreatMonitor.analyzeThreat(transactionData, semanticAnalysis);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Advanced threat analysis completed in ${processingTime}ms`);

    res.json({
      success: true,
      threatAnalysis,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Advanced threat analysis failed:', error);
    res.status(500).json({
      error: 'Advanced threat analysis failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// NEW: Batch Threat Analysis for multiple transactions
app.post('/api/threat-analysis-batch', async (req, res) => {
  try {
    const { transactions, maxConcurrent = 3 } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        error: 'Missing required field: transactions (array)'
      });
    }

    if (transactions.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 transactions allowed per batch request'
      });
    }

    console.log(`🔍 Processing batch threat analysis for ${transactions.length} transactions...`);
    const startTime = Date.now();
    
    // Process transactions in batches
    const results = [];
    for (let i = 0; i < transactions.length; i += maxConcurrent) {
      const batch = transactions.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (txData, index) => {
        try {
          const analysis = await advancedThreatMonitor.analyzeThreat(txData.transactionData, txData.semanticAnalysis);
          return {
            index: i + index,
            success: true,
            transactionHash: txData.transactionData.hash || txData.transactionData.txHash,
            threatAnalysis: analysis
          };
        } catch (error) {
          return {
            index: i + index,
            success: false,
            transactionHash: txData.transactionData.hash || txData.transactionData.txHash,
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    const processingTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    
    console.log(`✅ Batch threat analysis completed: ${successCount}/${transactions.length} successful in ${processingTime}ms`);

    res.json({
      success: true,
      totalTransactions: transactions.length,
      successfulAnalyses: successCount,
      results,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Batch threat analysis failed:', error);
    res.status(500).json({
      error: 'Batch threat analysis failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// NEW: Threat Intelligence Lookup
app.post('/api/threat-intel', async (req, res) => {
  try {
    const { address, checkType = 'all' } = req.body;

    if (!address) {
      return res.status(400).json({
        error: 'Missing required field: address'
      });
    }

    console.log('🌐 Checking threat intelligence...');
    
    const threatIntel = await advancedThreatMonitor.checkExternalThreatIntelligence({
      from: address,
      to: address
    });
    
    res.json({
      success: true,
      address,
      threatIntelligence: threatIntel,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Threat intelligence lookup failed:', error);
    res.status(500).json({
      error: 'Threat intelligence lookup failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Social Security Service endpoints removed

// NEW: Real-time monitoring endpoints
app.post('/api/monitor-contract', async (req, res) => {
  try {
    const { contractAddress, options = {} } = req.body;

    if (!contractAddress) {
      return res.status(400).json({
        error: 'Missing required field: contractAddress'
      });
    }

    if (!websocketService.initialized) {
      return res.status(503).json({
        error: 'WebSocket service not available'
      });
    }

    const monitoring = websocketService.monitorContract(contractAddress, options);
    
    res.json({
      message: 'Contract monitoring started',
      contractAddress,
      monitoring,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to start monitoring',
      message: error.message
    });
  }
});

// NEW: WebSocket connection info
app.get('/api/websocket-info', (req, res) => {
  if (!websocketService.initialized) {
    return res.json({
      available: false,
      message: 'WebSocket service not initialized'
    });
  }

  res.json({
    available: true,
    endpoint: '/ws',
    stats: websocketService.getServerStats(),
    clients: websocketService.getConnectedClients(),
    timestamp: new Date().toISOString()
  });
});

// NEW: Test alert endpoint (for demonstration)
app.post('/api/test-alert', (req, res) => {
  if (!websocketService.initialized) {
    return res.status(503).json({
      error: 'WebSocket service not available'
    });
  }

  const { alertType = 'risk_alert' } = req.body;
  const alert = websocketService.simulateAlert(alertType);
  
  res.json({
    message: 'Test alert sent',
    alert,
    timestamp: new Date().toISOString()
  });
});

// NEW: On-chain analysis endpoint
app.post('/api/on-chain-analysis', async (req, res) => {
  try {
    const { contractAddress } = req.body;

    if (!contractAddress) {
      return res.status(400).json({
        error: 'Missing required field: contractAddress'
      });
    }

    if (!contractService.isAvailable()) {
      return res.status(503).json({
        error: 'Smart contracts not available',
        message: 'Contract service is not initialized or contracts not deployed'
      });
    }

    const onChainData = await contractService.getEnhancedContractAnalysis(contractAddress);
    
    res.json({
      contractAddress,
      onChainAnalysis: onChainData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'On-chain analysis failed',
      message: error.message
    });
  }
});

// NEW: Submit analysis to blockchain
app.post('/api/submit-to-chain', async (req, res) => {
  try {
    const { contractAddress, riskScore, riskLevel, analysisData, confidence } = req.body;

    if (!contractAddress || riskScore === undefined || riskLevel === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: contractAddress, riskScore, riskLevel'
      });
    }

    if (!contractService.isAvailable()) {
      return res.status(503).json({
        error: 'Smart contracts not available'
      });
    }

    // Convert risk level to number if it's a string
    const riskLevelNum = typeof riskLevel === 'string' ? 
      { 'LOW': 0, 'MEDIUM': 1, 'HIGH': 2, 'CRITICAL': 3 }[riskLevel] || 0 : riskLevel;

    // For now, use a placeholder IPFS hash - in production this would store full analysis data
    const ipfsHash = `analysis_${contractAddress}_${Date.now()}`;

    const result = await contractService.submitAnalysisToChain(
      contractAddress,
      Math.min(100, Math.max(0, riskScore)), // Ensure 0-100
      riskLevelNum,
      ipfsHash,
      confidence || 80
    );

    if (!result) {
      return res.status(503).json({
        error: 'Failed to submit to blockchain',
        message: 'Contract service may be in read-only mode'
      });
    }

    res.json({
      contractAddress,
      submitted: true,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
      ipfsHash,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Blockchain submission failed',
      message: error.message
    });
  }
});

// NEW: Community threat reporting
app.post('/api/report-threat-on-chain', async (req, res) => {
  try {
    const { contractAddress, threatType, description, severity, evidenceHash } = req.body;

    if (!contractAddress || threatType === undefined || !description) {
      return res.status(400).json({
        error: 'Missing required fields: contractAddress, threatType, description'
      });
    }

    if (!contractService.isAvailable()) {
      return res.status(503).json({
        error: 'Smart contracts not available'
      });
    }

    // Convert threat type to number if needed
    const threatTypeNum = typeof threatType === 'string' ? 
      { 'RUG_PULL': 0, 'HONEYPOT': 1, 'FAKE_TOKEN': 2, 'PUMP_DUMP': 3, 'PHISHING': 4, 'MALICIOUS_CONTRACT': 5, 'SUSPICIOUS_ACTIVITY': 6, 'OTHER': 7 }[threatType] || 7 : threatType;

    const result = await contractService.reportThreatToChain(
      contractAddress,
      threatTypeNum,
      description,
      evidenceHash || `evidence_${Date.now()}`,
      severity || 5
    );

    if (!result) {
      return res.status(503).json({
        error: 'Failed to report threat to blockchain',
        message: 'Contract service may be in read-only mode'
      });
    }

    res.json({
      contractAddress,
      reported: true,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Threat reporting failed',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🤖 AI CONTRACT TOOLS ENDPOINTS (Phase 2 Revolutionary Features)
// ═══════════════════════════════════════════════════════════════

// AI Contract Generator
app.post('/api/ai-generate-contract', async (req, res) => {
  try {
    const { requirements } = req.body;

    if (!requirements) {
      return res.status(400).json({
        error: 'Missing required field: requirements'
      });
    }

    console.log('🤖 Generating smart contract with AI...');
    
    const result = await aiContractTools.generateContract(requirements);
    
    res.json({
      success: true,
      contract: result.contract,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Contract generation failed:', error);
    res.status(500).json({
      error: 'Contract generation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Real-time Vulnerability Scanner
app.post('/api/ai-scan-vulnerabilities', async (req, res) => {
  try {
    const { contractCode, contractAddress } = req.body;

    if (!contractCode) {
      return res.status(400).json({
        error: 'Missing required field: contractCode'
      });
    }

    console.log('🔍 Scanning contract for vulnerabilities...');
    
    const result = await aiContractTools.scanContractVulnerabilities(contractCode, contractAddress);
    
    res.json({
      success: true,
      vulnerabilityReport: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Vulnerability scanning failed:', error);
    res.status(500).json({
      error: 'Vulnerability scanning failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// AI Chat Interface
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { message, context = {} } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Missing required field: message'
      });
    }

    console.log('💬 Processing AI chat message...');
    
    const result = await aiContractTools.processChatMessage(message, context);
    
    res.json({
      success: true,
      response: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 AI chat processing failed:', error);
    res.status(500).json({
      error: 'AI chat processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get Audit Dataset Stats
app.get('/api/ai-audit-stats', async (req, res) => {
  try {
    console.log('📊 Fetching audit dataset statistics...');
    
    const stats = {
      totalAudits: aiContractTools.auditDataset.length,
      contractTypes: [...new Set(aiContractTools.auditDataset.map(audit => audit.contractType))],
      vulnerabilityTypes: [...new Set(aiContractTools.auditDataset.flatMap(audit => audit.vulnerabilities))],
      severityDistribution: aiContractTools.auditDataset.reduce((acc, audit) => {
        acc[audit.severity] = (acc[audit.severity] || 0) + 1;
        return acc;
      }, {}),
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      auditStats: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Audit stats fetch failed:', error);
    res.status(500).json({
      error: 'Audit stats fetch failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Search Audit Dataset
app.post('/api/ai-audit-search', async (req, res) => {
  try {
    const { query, contractType, severity, limit = 10 } = req.body;

    console.log('🔍 Searching audit dataset...');
    
    let results = aiContractTools.auditDataset;
    
    // Filter by contract type
    if (contractType) {
      results = results.filter(audit => audit.contractType.toLowerCase().includes(contractType.toLowerCase()));
    }
    
    // Filter by severity
    if (severity) {
      results = results.filter(audit => audit.severity.toLowerCase() === severity.toLowerCase());
    }
    
    // Filter by query text
    if (query) {
      results = results.filter(audit => 
        audit.description.toLowerCase().includes(query.toLowerCase()) ||
        audit.vulnerabilities.some(vuln => vuln.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    // Limit results
    results = results.slice(0, limit);
    
    res.json({
      success: true,
      results: results,
      total: results.length,
      query: { query, contractType, severity, limit },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Audit search failed:', error);
    res.status(500).json({
      error: 'Audit search failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Comprehensive risk calculation helper
function calculateOverallRisk(assessment) {
  let totalScore = 0;
  let weightedScores = 0;
  let confidence = 0;

  // Weight different analysis types
  const weights = {
    basic: 0.15,
    ai: 0.25,
    social: 0.15,
    tokenomics: 0.2,
    crossChain: 0.1,
    onChain: 0.15
  };

  // Basic analysis
  if (assessment.basicAnalysis && !assessment.basicAnalysis.error) {
    totalScore += 30 * weights.basic; // Default moderate risk
    weightedScores += weights.basic;
  }

  // AI analysis
  if (assessment.aiAnalysis && !assessment.aiAnalysis.error) {
    totalScore += (assessment.aiAnalysis.analysis?.riskScore || 50) * weights.ai;
    weightedScores += weights.ai;
    confidence += assessment.aiAnalysis.confidence || 0.5;
  }

  // Social analysis
  if (assessment.socialAnalysis && !assessment.socialAnalysis.error) {
    const socialRisk = assessment.socialAnalysis.overallSentiment.label === 'very_negative' ? 80 :
                      assessment.socialAnalysis.overallSentiment.label === 'negative' ? 60 :
                      assessment.socialAnalysis.overallSentiment.label === 'positive' ? 20 : 40;
    totalScore += socialRisk * weights.social;
    weightedScores += weights.social;
    confidence += assessment.socialAnalysis.overallSentiment.confidence || 0.3;
  }

  // Tokenomics analysis
  if (assessment.tokenomicsAnalysis && !assessment.tokenomicsAnalysis.error) {
    totalScore += assessment.tokenomicsAnalysis.riskScore * weights.tokenomics;
    weightedScores += weights.tokenomics;
    confidence += 0.7; // Tokenomics analysis is usually reliable
  }

  // Cross-chain analysis
  if (assessment.crossChainAnalysis && !assessment.crossChainAnalysis.error) {
    totalScore += (assessment.crossChainAnalysis.summary?.averageRiskScore || 40) * weights.crossChain;
    weightedScores += weights.crossChain;
    confidence += 0.6;
  }

  // On-chain analysis
  if (assessment.onChainAnalysis && !assessment.onChainAnalysis.error && assessment.onChainAnalysis.onChainDataAvailable) {
    let onChainRisk = 40; // Default moderate risk
    
    // Factor in community threat level
    if (assessment.onChainAnalysis.communityThreatLevel > 0) {
      onChainRisk += assessment.onChainAnalysis.communityThreatLevel * 0.6; // Scale 0-100 to 0-60 additional risk
    }
    
    // Factor in reputation score (inverse - lower reputation = higher risk)
    if (assessment.onChainAnalysis.reputationPercentage > 0) {
      onChainRisk = onChainRisk * (1 - (assessment.onChainAnalysis.reputationPercentage / 200)); // Reputation reduces risk
    }
    
    // Factor in active threats
    if (assessment.onChainAnalysis.hasActiveThreats) {
      onChainRisk += 20; // +20 for active threats
    }
    
    // Factor in critical alerts
    if (assessment.onChainAnalysis.hasCriticalAlerts) {
      onChainRisk += 30; // +30 for critical alerts
    }
    
    totalScore += Math.min(100, onChainRisk) * weights.onChain;
    weightedScores += weights.onChain;
    confidence += 0.8; // On-chain data is highly reliable
  }

  // Calculate final scores
  const finalScore = weightedScores > 0 ? totalScore / weightedScores : 50;
  const finalConfidence = Math.min(confidence / (weightedScores > 0 ? weightedScores * 2 : 1), 1);

  return {
    score: Math.round(finalScore),
    level: finalScore >= 80 ? 'CRITICAL' : finalScore >= 60 ? 'HIGH' : finalScore >= 40 ? 'MEDIUM' : 'LOW',
    confidence: Math.round(finalConfidence * 100) / 100
  };
}

// Comprehensive recommendations helper
function generateComprehensiveRecommendations(assessment) {
  const recommendations = [];

  // Overall risk recommendations
  if (assessment.overallRisk.score >= 80) {
    recommendations.push('🚨 CRITICAL RISK: Do not interact with this contract');
    recommendations.push('🛑 High probability of rug pull or scam');
  } else if (assessment.overallRisk.score >= 60) {
    recommendations.push('⚠️ HIGH RISK: Exercise extreme caution');
    recommendations.push('🔍 Conduct thorough research before any interaction');
  } else if (assessment.overallRisk.score >= 40) {
    recommendations.push('⚡ MEDIUM RISK: Proceed with caution');
    recommendations.push('📊 Monitor closely for any changes');
  } else {
    recommendations.push('✅ LOW RISK: Appears relatively safe');
    recommendations.push('🔄 Continue monitoring for any developments');
  }

  // AI-specific recommendations
  if (assessment.aiAnalysis && assessment.aiAnalysis.analysis?.recommendations) {
    recommendations.push(...assessment.aiAnalysis.analysis.recommendations.map(rec => `🤖 AI: ${rec}`));
  }

  // Social-specific recommendations
  if (assessment.socialAnalysis && assessment.socialAnalysis.overallSentiment.label === 'very_negative') {
    recommendations.push('📱 Social: Negative sentiment detected - investigate community concerns');
  }

  // Tokenomics-specific recommendations
  if (assessment.tokenomicsAnalysis && assessment.tokenomicsAnalysis.recommendations) {
    recommendations.push(...assessment.tokenomicsAnalysis.recommendations.map(rec => `💰 Tokenomics: ${rec}`));
  }

  return recommendations;
}

// Initialize services
async function initializeServices() {
  console.log('🚀 Initializing Ultimate DeFi Security Platform...');
  
  try {
    // Initialize core services
    await somniaService.initialize();
    console.log('✅ Somnia service initialized');

    // Initialize enhanced services
    await aiAnalysisService.initialize();
    console.log('✅ AI Analysis service initialized');

    await crossChainService.initialize();
    console.log('✅ Cross-Chain service initialized');

    await socialAnalysisService.initialize();
    console.log('✅ Social Analysis service initialized');

    await tokenomicsService.initialize();
    console.log('✅ Tokenomics service initialized');

    // Initialize Telegram Bot service
    await telegramBot.initialize();
    console.log('✅ Telegram Bot service initialized');

    // Initialize Contract service
    await contractService.initialize();
    console.log('✅ Contract service initialized');

    // Initialize Semantic Transaction Decoder (Revolutionary Feature!)
    await semanticTransactionDecoder.initialize();
    console.log('✅ Semantic Transaction Decoder initialized');

    // Initialize Advanced Threat Monitor (SecureMon Integration!)
    await advancedThreatMonitor.initialize();
    console.log('✅ Advanced Threat Monitor initialized');

    // Initialize AI Contract Tools (DefiBuilder Integration!)
    await aiContractTools.initialize();
    console.log('✅ AI Contract Tools initialized');

  // Social Security Service removed

    // Initialize Somnia Monitor service (for live testnet monitoring)
    await somniaMonitorService.initialize(websocketService);
    console.log('✅ Somnia Monitor service initialized');

    // Display startup banner
    console.log(`
🔒 ULTIMATE DEFI SECURITY PLATFORM READY! 🔒
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 AI-Powered Analysis      ✅ ACTIVE
🧠 Semantic TX Decoder      ✅ ACTIVE  🔥 NEW!
🔍 Advanced Threat Monitor  ✅ ACTIVE  🔥 NEW!
🛠️ AI Contract Tools        ✅ ACTIVE  🚀 PHASE 2!
// Social Security Layer removed
🌐 Cross-Chain Detection    ✅ ACTIVE  
📱 Social Sentiment         ✅ ACTIVE
💰 Tokenomics Analysis      ✅ ACTIVE
⚡ Real-Time WebSocket      ✅ ACTIVE
🤖 Telegram Bot             ${telegramBot.initialized ? '✅ ACTIVE' : '⚠️ DISABLED'}
🔗 Smart Contracts          ${contractService.isAvailable() ? '✅ ACTIVE' : '⚠️ DISABLED'}
🛡️ Transaction Protection   ✅ ACTIVE

🔗 API Endpoints:
   • /api/analyze-transaction      (Enhanced with AI)
   • /api/assess-contract          (Full analysis)
   • /api/ai-analysis             (AI-powered insights)
   • /api/cross-chain-analysis    (Multi-network)
   • /api/social-analysis         (Sentiment tracking)
   • /api/tokenomics-analysis     (Whale detection)
   • /api/on-chain-analysis       (Smart contract data)
   • /api/submit-to-chain         (Store analysis on-chain)
   🚀 • /api/ai-generate-contract   (AI Contract Generator)
   🚀 • /api/ai-scan-vulnerabilities (Real-time Scanner)
   🚀 • /api/ai-chat                (AI Chat Interface)
   🚀 • /api/ai-audit-stats         (Audit Dataset Stats)
   • /ws                          (Real-time alerts)

🌐 Server: http://localhost:${PORT}
⚡ WebSocket: ws://localhost:${PORT}/ws

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

  } catch (error) {
    console.error('❌ Service initialization failed:', error);
  }
}

// Initialize WebSocket service BEFORE server starts listening
console.log('⚡ Initializing WebSocket Service...');
websocketService.initialize(server);
console.log('✅ WebSocket service initialized');

// Start server
server.listen(PORT, async () => {
  await initializeServices();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔌 Shutting down gracefully...');
  websocketService.shutdown();
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;