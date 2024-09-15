const { ethers } = require('ethers');
const axios = require('axios');
const config = require('../config');

class CrossChainService {
  constructor() {
    this.providers = {};
    this.networks = {
      ethereum: {
        name: 'Ethereum Mainnet',
        rpcUrl: 'https://eth.llamarpc.com',
        chainId: 1,
        explorer: 'https://api.etherscan.io/api',
        apiKey: process.env.ETHERSCAN_API_KEY || 'demo'
      },
      polygon: {
        name: 'Polygon Mainnet',
        rpcUrl: 'https://polygon.llamarpc.com',
        chainId: 137,
        explorer: 'https://api.polygonscan.com/api',
        apiKey: process.env.POLYGONSCAN_API_KEY || 'demo'
      },
      bsc: {
        name: 'BNB Smart Chain',
        rpcUrl: 'https://bsc.llamarpc.com',
        chainId: 56,
        explorer: 'https://api.bscscan.com/api',
        apiKey: process.env.BSCSCAN_API_KEY || 'demo'
      },
      avalanche: {
        name: 'Avalanche C-Chain',
        rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        chainId: 43114,
        explorer: 'https://api.snowtrace.io/api',
        apiKey: process.env.SNOWTRACE_API_KEY || 'demo'
      },
      arbitrum: {
        name: 'Arbitrum One',
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        chainId: 42161,
        explorer: 'https://api.arbiscan.io/api',
        apiKey: process.env.ARBISCAN_API_KEY || 'demo'
      },
      optimism: {
        name: 'Optimism',
        rpcUrl: 'https://mainnet.optimism.io',
        chainId: 10,
        explorer: 'https://api-optimistic.etherscan.io/api',
        apiKey: process.env.OPTIMISM_API_KEY || 'demo'
      },
      somnia: {
        name: 'Somnia Testnet',
        rpcUrl: config.SOMNIA_RPC_URL,
        chainId: config.SOMNIA_CHAIN_ID,
        explorer: config.SOMNIA_EXPLORER_API,
        apiKey: 'none'
      }
    };
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('🌐 Initializing Cross-Chain Analysis Service...');
      
      // Initialize providers for each network
      for (const [networkKey, network] of Object.entries(this.networks)) {
        try {
          this.providers[networkKey] = new ethers.JsonRpcProvider(network.rpcUrl);
          
          // Test connection with a simple call
          await this.providers[networkKey].getBlockNumber();
          console.log(`✅ Connected to ${network.name} (Chain ID: ${network.chainId})`);
        } catch (error) {
          console.log(`⚠️ Failed to connect to ${network.name}: ${error.message}`);
          // Continue with other networks even if one fails
        }
      }
      
      this.initialized = true;
      console.log('✅ Cross-Chain Analysis Service ready');
    } catch (error) {
      console.error('❌ Cross-Chain Analysis Service initialization failed:', error.message);
      this.initialized = false;
    }
  }

  async analyzeContractAcrossChains(contractAddress) {
    try {
      console.log(`🔍 Cross-chain analysis for contract: ${contractAddress}`);
      
      const results = {
        contractAddress,
        chains: {},
        summary: {
          deployedNetworks: [],
          totalNetworks: 0,
          riskConsistency: 'unknown',
          crossChainRisks: []
        },
        timestamp: new Date().toISOString()
      };

      // Analyze contract on each network
      const analysisPromises = Object.entries(this.networks).map(async ([networkKey, network]) => {
        try {
          const analysis = await this.analyzeContractOnNetwork(contractAddress, networkKey);
          results.chains[networkKey] = analysis;
          
          if (analysis.exists) {
            results.summary.deployedNetworks.push(networkKey);
          }
        } catch (error) {
          console.error(`Error analyzing ${networkKey}:`, error.message);
          results.chains[networkKey] = {
            network: network.name,
            error: error.message,
            exists: false
          };
        }
      });

      await Promise.all(analysisPromises);
      
      // Generate cross-chain risk summary
      results.summary = this.generateCrossChainSummary(results.chains);
      
      return results;
    } catch (error) {
      console.error('Cross-chain analysis error:', error);
      throw error;
    }
  }

  async analyzeContractOnNetwork(contractAddress, networkKey) {
    const network = this.networks[networkKey];
    const provider = this.providers[networkKey];
    
    if (!provider) {
      throw new Error(`Provider not available for ${networkKey}`);
    }

    try {
      // Check if contract exists
      const code = await provider.getCode(contractAddress);
      const exists = code !== '0x';
      
      const analysis = {
        network: network.name,
        chainId: network.chainId,
        exists,
        contractAddress
      };

      if (!exists) {
        analysis.reason = 'Contract not deployed on this network';
        return analysis;
      }

      // Get additional contract information
      const [balance, transactionCount, creationInfo] = await Promise.all([
        provider.getBalance(contractAddress),
        provider.getTransactionCount(contractAddress),
        this.getContractCreationInfo(contractAddress, networkKey)
      ]);

      analysis.balance = ethers.formatEther(balance);
      analysis.transactionCount = transactionCount;
      analysis.creationInfo = creationInfo;
      
      // Get contract source code if available
      if (network.explorer && network.apiKey !== 'demo') {
        analysis.sourceCode = await this.getContractSourceCode(contractAddress, networkKey);
      }
      
      // Perform network-specific risk analysis
      analysis.riskAnalysis = await this.performNetworkRiskAnalysis(contractAddress, networkKey, code);
      
      return analysis;
    } catch (error) {
      throw new Error(`Analysis failed on ${network.name}: ${error.message}`);
    }
  }

  async getContractCreationInfo(contractAddress, networkKey) {
    const network = this.networks[networkKey];
    
    try {
      if (network.explorer && network.apiKey !== 'demo') {
        const response = await axios.get(network.explorer, {
          params: {
            module: 'contract',
            action: 'getcontractcreation',
            contractaddresses: contractAddress,
            apikey: network.apiKey
          },
          timeout: 5000
        });
        
        if (response.data && response.data.result && response.data.result.length > 0) {
          const creation = response.data.result[0];
          return {
            txHash: creation.txHash,
            creator: creation.contractCreator,
            block: creation.blockNumber
          };
        }
      }
      
      return { unavailable: 'API key required or network not supported' };
    } catch (error) {
      console.log(`⚠️ Could not fetch creation info for ${networkKey}:`, error.message);
      return { error: error.message };
    }
  }

  async getContractSourceCode(contractAddress, networkKey) {
    const network = this.networks[networkKey];
    
    try {
      if (network.apiKey === 'demo') {
        return { unavailable: 'API key required' };
      }
      
      const response = await axios.get(network.explorer, {
        params: {
          module: 'contract',
          action: 'getsourcecode',
          address: contractAddress,
          apikey: network.apiKey
        },
        timeout: 10000
      });
      
      if (response.data && response.data.result && response.data.result.length > 0) {
        const sourceData = response.data.result[0];
        return {
          sourceCode: sourceData.SourceCode,
          contractName: sourceData.ContractName,
          compilerVersion: sourceData.CompilerVersion,
          optimizationUsed: sourceData.OptimizationUsed,
          constructorArguments: sourceData.ConstructorArguments,
          isVerified: sourceData.SourceCode !== ''
        };
      }
      
      return { isVerified: false, reason: 'Source code not verified' };
    } catch (error) {
      console.log(`⚠️ Could not fetch source code for ${networkKey}:`, error.message);
      return { error: error.message };
    }
  }

  async performNetworkRiskAnalysis(contractAddress, networkKey, bytecode) {
    const analysis = {
      networkSpecificRisks: [],
      bytecodeRisks: [],
      riskScore: 0
    };
    
    try {
      // Analyze bytecode patterns
      analysis.bytecodeRisks = this.analyzeBytecodePatterns(bytecode);
      
      // Network-specific risk factors
      const networkRisks = this.getNetworkSpecificRisks(networkKey);
      analysis.networkSpecificRisks = networkRisks;
      
      // Calculate risk score
      analysis.riskScore = this.calculateNetworkRiskScore(analysis.bytecodeRisks, networkRisks);
      
      return analysis;
    } catch (error) {
      console.error(`Risk analysis failed for ${networkKey}:`, error);
      return analysis;
    }
  }

  analyzeBytecodePatterns(bytecode) {
    const risks = [];
    
    // Common dangerous patterns in bytecode
    const patterns = [
      { name: 'selfdestruct', pattern: '6000805af2', risk: 'Contract can be destroyed' },
      { name: 'delegatecall', pattern: '6000805af4', risk: 'Proxy vulnerability possible' },
      { name: 'large_bytecode', pattern: null, risk: 'Unusually large contract' }
    ];
    
    patterns.forEach(({ name, pattern, risk }) => {
      if (pattern && bytecode.includes(pattern)) {
        risks.push({ type: name, description: risk, severity: 'HIGH' });
      } else if (name === 'large_bytecode' && bytecode.length > 50000) {
        risks.push({ type: name, description: risk, severity: 'MEDIUM' });
      }
    });
    
    return risks;
  }

  getNetworkSpecificRisks(networkKey) {
    const networkRisks = {
      ethereum: ['high_gas_costs', 'front_running'],
      polygon: ['validator_centralization', 'bridge_risks'],
      bsc: ['centralized_validators', 'validator_concentration'],
      avalanche: ['subnet_risks', 'consensus_mechanism'],
      arbitrum: ['l2_bridge_risks', 'sequencer_centralization'],
      optimism: ['l2_bridge_risks', 'fraud_proof_delays'],
      somnia: ['new_network', 'limited_history']
    };
    
    return networkRisks[networkKey] || ['unknown_network_risks'];
  }

  calculateNetworkRiskScore(bytecodeRisks, networkRisks) {
    let score = 20; // Base score
    
    // Add score for bytecode risks
    bytecodeRisks.forEach(risk => {
      if (risk.severity === 'HIGH') score += 25;
      else if (risk.severity === 'MEDIUM') score += 15;
      else score += 5;
    });
    
    // Add score for network-specific risks
    score += networkRisks.length * 5;
    
    return Math.min(score, 100);
  }

  generateCrossChainSummary(chainsData) {
    const summary = {
      deployedNetworks: [],
      totalNetworks: Object.keys(chainsData).length,
      riskConsistency: 'unknown',
      crossChainRisks: [],
      averageRiskScore: 0,
      recommendations: []
    };
    
    const deployedChains = [];
    const riskScores = [];
    
    // Collect data from all chains
    Object.entries(chainsData).forEach(([networkKey, chainData]) => {
      if (chainData.exists) {
        deployedChains.push(networkKey);
        summary.deployedNetworks.push(networkKey);
        
        if (chainData.riskAnalysis && chainData.riskAnalysis.riskScore) {
          riskScores.push(chainData.riskAnalysis.riskScore);
        }
      }
    });
    
    // Calculate average risk score
    if (riskScores.length > 0) {
      summary.averageRiskScore = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
    }
    
    // Analyze risk consistency
    if (riskScores.length > 1) {
      const maxRisk = Math.max(...riskScores);
      const minRisk = Math.min(...riskScores);
      const variance = maxRisk - minRisk;
      
      if (variance > 30) {
        summary.riskConsistency = 'inconsistent';
        summary.crossChainRisks.push('Risk scores vary significantly across chains');
      } else if (variance > 15) {
        summary.riskConsistency = 'moderate_variance';
        summary.crossChainRisks.push('Moderate risk variance across chains');
      } else {
        summary.riskConsistency = 'consistent';
      }
    }
    
    // Cross-chain specific risks
    if (deployedChains.length > 1) {
      summary.crossChainRisks.push('Multi-chain deployment requires careful analysis');
      summary.recommendations.push('Verify contract consistency across all chains');
    }
    
    if (deployedChains.includes('bsc') || deployedChains.includes('polygon')) {
      summary.crossChainRisks.push('Deployment on lower-security chains detected');
      summary.recommendations.push('Exercise extra caution on lower-security networks');
    }
    
    // Generate recommendations
    if (summary.averageRiskScore > 70) {
      summary.recommendations.push('High cross-chain risk detected - avoid interaction');
    } else if (summary.averageRiskScore > 40) {
      summary.recommendations.push('Moderate risk - proceed with caution');
    } else {
      summary.recommendations.push('Cross-chain analysis shows acceptable risk levels');
    }
    
    return summary;
  }

  async getNetworkStats() {
    const stats = {};
    
    for (const [networkKey, network] of Object.entries(this.networks)) {
      try {
        const provider = this.providers[networkKey];
        if (provider) {
          const blockNumber = await provider.getBlockNumber();
          stats[networkKey] = {
            name: network.name,
            chainId: network.chainId,
            blockNumber,
            status: 'connected'
          };
        } else {
          stats[networkKey] = {
            name: network.name,
            chainId: network.chainId,
            status: 'disconnected'
          };
        }
      } catch (error) {
        stats[networkKey] = {
          name: network.name,
          chainId: network.chainId,
          status: 'error',
          error: error.message
        };
      }
    }
    
    return stats;
  }

  async searchContractAcrossChains(criteria) {
    // Future enhancement: Search for contracts matching specific criteria across all chains
    // This could include searching by:
    // - Similar bytecode patterns
    // - Same creator address
    // - Similar function signatures
    // - Token characteristics
    
    return {
      message: 'Cross-chain contract search feature coming soon',
      criteria,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new CrossChainService();
