const ethers = require('ethers');
const axios = require('axios');
const config = require('../config');
const semanticTransactionDecoder = require('./semanticTransactionDecoder');

class SomniaMonitorService {
  constructor() {
    this.initialized = false;
    this.monitoringActive = false;
    this.websocketService = null;
    this.processedTxs = new Set(); // Avoid duplicates
    this.lastApiCall = 0;
  }

  async initialize(websocketService) {
    try {
      console.log('🔍 Initializing Somnia API Monitor...');
      this.websocketService = websocketService;
      
      // Test API connection
      const response = await axios.get('https://somnia.w3us.site/api/v2/internal-transactions', {
        headers: { 'accept': 'application/json' },
        timeout: 5000
      });
      console.log('✅ Connected to Somnia API');
      
      this.initialized = true;
      console.log('✅ Somnia Monitor Service ready');
      
      // Start monitoring after a short delay
      setTimeout(() => {
        this.startMonitoring();
      }, 3000);
      
    } catch (error) {
      console.error('❌ Somnia Monitor Service initialization failed:', error.message);
      this.initialized = false;
    }
  }

  async startMonitoring() {
    if (!this.initialized || this.monitoringActive) {
      return;
    }

    try {
      console.log('🔍 Starting Somnia API transaction monitoring...');
      this.monitoringActive = true;

      // Poll Somnia API every 15-20 seconds (slower for better semantic analysis examination)
      const monitorInterval = setInterval(async () => {
        if (!this.monitoringActive) {
          clearInterval(monitorInterval);
          return;
        }

        try {
          await this.fetchRecentTransactions();
        } catch (error) {
          console.error('🔍 Error fetching transactions:', error.message);
        }
      }, 18000); // Check every 18 seconds - perfect for examining semantic analysis

      console.log('✅ Somnia API monitoring active');
    } catch (error) {
      console.error('❌ Failed to start monitoring:', error.message);
      this.monitoringActive = false;
    }
  }

  async fetchRecentTransactions() {
    try {
      this.lastApiCall = Date.now();
      
      // Use the main-page/transactions endpoint as requested
      const response = await axios.get('https://somnia.w3us.site/api/v2/main-page/transactions', {
        headers: { 'accept': 'application/json' },
        timeout: 8000
      });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log(`📡 Found ${response.data.length} transactions from Somnia API`);
        
        // Process all transactions from the response
        for (const tx of response.data) {
          await this.processApiTransaction(tx);
        }
        return;
      }

      console.log('📡 No transactions found in API response - API returned:', typeof response.data, response.data?.length || 'not array');
      
    } catch (error) {
      console.error('🔍 Error fetching transactions from Somnia API:', error.message);
    }
  }

  async processApiTransaction(tx) {
    try {
      // Skip if already processed
      const txId = tx.hash || tx.transaction_hash || tx.id || JSON.stringify(tx).substring(0, 32);
      if (this.processedTxs.has(txId)) {
        return;
      }
      this.processedTxs.add(txId);

      // Clean up old processed txs
      if (this.processedTxs.size > 1000) {
        const txArray = Array.from(this.processedTxs);
        this.processedTxs = new Set(txArray.slice(-500));
      }

      console.log(`🔍 Processing API transaction: ${txId}`);

      // Calculate risk score
      const riskScore = this.calculateApiRiskScore(tx);
      const riskLevel = this.getRiskLevel(riskScore);

      // Extract string address from object (Somnia API returns objects for addresses)
      const getAddressString = (addressObj) => {
        if (typeof addressObj === 'string') return addressObj;
        if (addressObj && typeof addressObj === 'object') {
          return addressObj.hash || addressObj.address || JSON.stringify(addressObj).substring(0, 42);
        }
        return 'Unknown';
      };

      // 🧠 SEMANTIC ANALYSIS - Revolutionary Feature!
      let semanticAnalysis = null;
      try {
        // Only perform semantic analysis on higher risk transactions to optimize performance
        if (riskScore >= 40 || tx.input?.length > 10) {
          console.log(`🧠 Performing semantic analysis for tx: ${txId.substring(0, 10)}...`);
          
          // Prepare transaction data for semantic decoder
          const transactionData = {
            hash: tx.hash || tx.transaction_hash || txId,
            from: getAddressString(tx.from || tx.from_address),
            to: getAddressString(tx.to || tx.to_address),
            value: tx.value || '0',
            input: tx.input || tx.data || '0x',
            gasUsed: tx.gas_used || tx.gas || '0',
            gasPrice: tx.gas_price || '0'
          };
          
          // Perform semantic decoding (with generous timeout for thorough analysis)
          const semanticPromise = semanticTransactionDecoder.decodeTransaction(transactionData);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Semantic analysis timeout')), 8000)
          );
          
          semanticAnalysis = await Promise.race([semanticPromise, timeoutPromise]);
          console.log(`✅ Semantic analysis completed for ${txId.substring(0, 10)}... (Intent: ${semanticAnalysis.transactionIntent?.estimatedPurpose || 'Unknown'})`);
          
          // 🐌 Add delay for better UX testing - let users examine the analysis
          console.log(`⏳ Waiting 3 seconds before broadcasting for better examination...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.log(`⚠️ Semantic analysis failed for ${txId.substring(0, 10)}...: ${error.message}`);
        // Continue without semantic analysis
      }

      // Create transaction event with semantic analysis
      const transactionEvent = {
        type: 'live_transaction',
        transactionHash: tx.hash || tx.transaction_hash || txId,
        contractAddress: getAddressString(tx.to || tx.to_address),
        from: getAddressString(tx.from || tx.from_address),
        value: tx.value || '0',
        riskScore,
        riskLevel,
        timestamp: new Date().toISOString(),
        timestampDisplay: "Live Somnia", // For frontend display
        isRealTransaction: true,
        data: tx,
        
        // 🧠 Revolutionary Semantic Analysis Data
        semanticAnalysis: semanticAnalysis ? {
          intent: semanticAnalysis.transactionIntent?.estimatedPurpose || 'Unknown',
          functionName: semanticAnalysis.transactionIntent?.functionName || null,
          humanExplanation: semanticAnalysis.semanticExplanation?.humanReadable || null,
          securityWarnings: semanticAnalysis.userWarnings?.detailedWarnings || [],
          riskFactors: semanticAnalysis.securityAssessment?.riskFactors || [],
          confidence: semanticAnalysis.confidenceScore || 0
        } : null,
        
        // Enhanced display data
        displayData: {
          intent: semanticAnalysis?.transactionIntent?.estimatedPurpose || 'Unknown Action',
          riskLevel: riskLevel,
          hasSemanticAnalysis: !!semanticAnalysis,
          shortExplanation: semanticAnalysis?.semanticExplanation?.humanReadable?.substring(0, 100) + '...' || 'Transaction analysis not available'
        }
      };

      // Broadcast to WebSocket
      if (this.websocketService && this.websocketService.initialized) {
        this.websocketService.broadcastToAll(transactionEvent);
        console.log(`📡 Broadcasting Somnia transaction: ${txId.substring(0, 10)}... (Risk: ${riskScore})`);
      }

      // Create security alert for high risk transactions
      if (riskScore >= 70) {
        const alertEvent = {
          type: 'security_alert',
          alertType: 'high_risk_transaction',
          contractAddress: getAddressString(tx.to || tx.to_address),
          riskScore,
          message: `High risk transaction detected from Somnia API`,
          transactionHash: tx.hash || tx.transaction_hash || txId,
          timestamp: new Date().toISOString()
        };

        if (this.websocketService && this.websocketService.initialized) {
          this.websocketService.broadcastToAll(alertEvent);
        }
      }

    } catch (error) {
      console.error(`🔍 Error processing API transaction:`, error.message);
    }
  }

  calculateApiRiskScore(tx) {
    let score = 25; // Base score

    // Large value transfers
    if (tx.value) {
      try {
        const value = parseFloat(tx.value);
        if (value > 1000) score += 30;
        else if (value > 100) score += 20;
        else if (value > 10) score += 10;
      } catch (e) {}
    }

    // Contract interactions
    if (tx.method || tx.function_name) {
      score += 15;
    }

    // Random variation
    score += Math.floor(Math.random() * 20) - 10;

    return Math.max(10, Math.min(100, score));
  }


  stopMonitoring() {
    console.log('🛑 Stopping Somnia API monitoring');
    this.monitoringActive = false;
  }

  getRiskLevel(score) {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  }

  getStatus() {
    return {
      initialized: this.initialized,
      monitoring: this.monitoringActive,
      lastApiCall: this.lastApiCall,
      processedTransactions: this.processedTxs.size
    };
  }
}

module.exports = new SomniaMonitorService();
