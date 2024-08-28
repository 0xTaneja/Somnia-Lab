/**
 * Real Somnia Blockchain Integration Service
 * Leverages Somnia's sub-second finality and high TPS for real-time transaction analysis
 */

const { ethers } = require('ethers');
const config = require('../config');

class SomniaService {
  constructor() {
    this.provider = null;
    this.network = null;
    this.connected = false;
  }

  async initialize() {
    console.log('🔗 Connecting to Somnia Testnet...');
    
    try {
      // Create provider with Somnia testnet RPC
      this.provider = new ethers.JsonRpcProvider(config.SOMNIA_RPC_URL, {
        chainId: config.SOMNIA_CHAIN_ID,
        name: config.NETWORK_NAME
      });

      // Test connection and get network info
      this.network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getFeeData();

      console.log(`✅ Connected to ${this.network.name} (Chain ID: ${this.network.chainId})`);
      console.log(`📊 Current block: ${blockNumber}`);
      console.log(`⛽ Gas price: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`);

      this.connected = true;
      return true;

    } catch (error) {
      console.error('❌ Failed to connect to Somnia testnet:', error.message);
      this.connected = false;
      throw new Error(`Somnia connection failed: ${error.message}`);
    }
  }

  async simulateTransaction(transaction, contractAddress) {
    if (!this.connected) {
      throw new Error('Not connected to Somnia network');
    }

    const startTime = Date.now();
    console.log(`⚡ Simulating transaction on Somnia (leveraging sub-second finality)...`);

    try {
      // Prepare transaction for simulation with proper data structure
      const txRequest = {
        to: contractAddress,
        data: transaction.data || '0x',
        value: ethers.parseEther('0'), // Always 0 ETH for contract calls
        from: transaction.from || ethers.ZeroAddress
      };

      // Ensure data is properly formatted
      if (txRequest.data && !txRequest.data.startsWith('0x')) {
        txRequest.data = '0x' + txRequest.data;
      }

      // Real transaction simulation using eth_call
      // First check if contract exists
      const contractCode = await this.provider.getCode(contractAddress);
      if (contractCode === '0x') {
        console.log(`⚠️ Contract ${contractAddress} does not exist on Somnia testnet`);
        // For non-existent contracts, we can still do analysis but mark simulation as N/A
        return {
          success: true,
          result: '0x',
          contractExists: false,
          analysisStillValid: true,
          gasEstimate: '21000',
          stateChanges: { contractExists: false },
          eventLogs: [],
          trace: { available: false, reason: 'Contract does not exist' },
          simulationTime: `${Date.now() - startTime}ms`,
          blockNumber: await this.provider.getBlockNumber(),
          timestamp: new Date().toISOString(),
          network: {
            name: this.network.name,
            chainId: this.network.chainId.toString(),
            rpcUrl: config.SOMNIA_RPC_URL
          }
        };
      }
      
      const result = await this.provider.call(txRequest);
      
      // Get detailed simulation data
      const [gasEstimate, stateChanges, eventLogs, traceData] = await Promise.all([
        this.estimateGas(txRequest),
        this.analyzeStateChanges(txRequest, contractAddress),
        this.getEventLogs(txRequest, contractAddress),
        this.getTransactionTrace(txRequest)
      ]);

      const simulationTime = Date.now() - startTime;

      return {
        success: true,
        result,
        gasEstimate: gasEstimate.toString(),
        stateChanges,
        eventLogs,
        trace: traceData,
        simulationTime: `${simulationTime}ms`,
        blockNumber: await this.provider.getBlockNumber(),
        timestamp: new Date().toISOString(),
        network: {
          name: this.network.name,
          chainId: this.network.chainId.toString(),
          rpcUrl: config.SOMNIA_RPC_URL
        }
      };

    } catch (error) {
      console.error('❌ Simulation failed:', error);
      
      // Even if simulation fails, we can still analyze the transaction data
      return {
        success: false,
        error: error.message,
        gasEstimate: 'estimation_failed',
        analysisStillValid: true,
        network: {
          name: this.network.name,
          chainId: this.network.chainId.toString()
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  async estimateGas(txRequest) {
    try {
      return await this.provider.estimateGas(txRequest);
    } catch (error) {
      console.warn('Gas estimation failed:', error.message);
      return ethers.toBigInt('21000'); // Fallback
    }
  }

  async analyzeStateChanges(txRequest, contractAddress) {
    try {
      // Check if contract exists
      const contractCode = await this.provider.getCode(contractAddress);
      const isContract = contractCode !== '0x';

      if (!isContract) {
        return {
          contractExists: false,
          analysis: 'Target address is not a contract'
        };
      }

      // Analyze contract type and potential state changes
      const contractAnalysis = await this.analyzeContract(contractAddress);
      
      // For ERC-20/721 contracts, decode potential state changes
      const stateAnalysis = await this.predictStateChanges(txRequest, contractAnalysis);

      return {
        contractExists: true,
        contractType: contractAnalysis.type,
        contractInfo: contractAnalysis,
        predictedChanges: stateAnalysis,
        codeSize: contractCode.length
      };

    } catch (error) {
      return {
        error: error.message,
        contractExists: null
      };
    }
  }

  async analyzeContract(contractAddress) {
    try {
      const code = await this.provider.getCode(contractAddress);
      
      // Basic contract type detection
      const analysis = {
        type: 'unknown',
        hasCode: code !== '0x',
        codeSize: code.length,
        features: []
      };

      if (code === '0x') {
        analysis.type = 'EOA';
        return analysis;
      }

      // Check for common interface signatures in bytecode
      const commonSignatures = {
        'totalSupply()': 'erc20',
        'balanceOf(address)': 'erc20', 
        'ownerOf(uint256)': 'erc721',
        'owner()': 'ownable',
        'implementation()': 'proxy'
      };

      // Simple bytecode analysis (this could be much more sophisticated)
      const bytecode = code.toLowerCase();
      
      if (bytecode.includes('18160ddd')) { // totalSupply() selector
        analysis.type = 'erc20';
        analysis.features.push('ERC20');
      }
      
      if (bytecode.includes('6352211e')) { // ownerOf(uint256) selector  
        analysis.type = 'erc721';
        analysis.features.push('ERC721');
      }
      
      if (bytecode.includes('8da5cb5b')) { // owner() selector
        analysis.features.push('Ownable');
      }

      // Try to get actual contract info
      try {
        // Test ERC-20 interface
        const erc20Interface = new ethers.Interface([
          'function name() view returns (string)',
          'function symbol() view returns (string)',
          'function decimals() view returns (uint8)',
          'function totalSupply() view returns (uint256)'
        ]);

        const contract = new ethers.Contract(contractAddress, erc20Interface, this.provider);
        
        const [name, symbol, decimals, totalSupply] = await Promise.allSettled([
          contract.name(),
          contract.symbol(), 
          contract.decimals(),
          contract.totalSupply()
        ]);

        if (name.status === 'fulfilled') {
          analysis.type = 'erc20';
          analysis.tokenInfo = {
            name: name.value,
            symbol: symbol.status === 'fulfilled' ? symbol.value : 'UNKNOWN',
            decimals: decimals.status === 'fulfilled' ? decimals.value : 18,
            totalSupply: totalSupply.status === 'fulfilled' ? totalSupply.value.toString() : '0'
          };
        }

      } catch (error) {
        // Contract doesn't implement ERC-20, continue with basic analysis
      }

      return analysis;

    } catch (error) {
      return {
        type: 'unknown',
        error: error.message
      };
    }
  }

  async predictStateChanges(txRequest, contractAnalysis) {
    try {
      if (!txRequest.data || txRequest.data === '0x') {
        return { type: 'native_transfer', value: txRequest.value };
      }

      const methodId = txRequest.data.slice(0, 10);
      
      // Predict changes based on method signature and contract type
      const predictions = {
        methodId,
        contractType: contractAnalysis.type,
        predictedEffects: []
      };

      // Common method predictions
      switch (methodId) {
        case '0xa9059cbb': // transfer(address,uint256)
          if (contractAnalysis.type === 'erc20') {
            predictions.predictedEffects.push({
              type: 'token_transfer',
              description: 'ERC-20 token balance will decrease for sender',
              critical: false
            });
          }
          break;

        case '0x095ea7b3': // approve(address,uint256) 
          predictions.predictedEffects.push({
            type: 'token_approval',
            description: 'Token spending allowance will be set',
            critical: true,
            warning: 'Check approval amount carefully'
          });
          break;

        case '0xf2fde38b': // transferOwnership(address)
          predictions.predictedEffects.push({
            type: 'ownership_transfer',
            description: 'Contract ownership will change',
            critical: true,
            warning: 'VERY DANGEROUS - Contract control will be transferred'
          });
          break;

        case '0xa22cb465': // setApprovalForAll(address,bool)
          predictions.predictedEffects.push({
            type: 'approval_all',
            description: 'All NFTs will be approved to operator',
            critical: true,
            warning: 'DANGEROUS - Gives control of ALL NFTs'
          });
          break;
      }

      return predictions;

    } catch (error) {
      return { error: error.message };
    }
  }

  async getEventLogs(txRequest, contractAddress) {
    try {
      // For simulation, we can't get actual events, but we can predict them
      // based on the transaction type and method being called
      
      if (!txRequest.data || txRequest.data === '0x') {
        return [];
      }

      const methodId = txRequest.data.slice(0, 10);
      const predictedEvents = [];

      // Predict events based on method signatures
      switch (methodId) {
        case '0xa9059cbb': // transfer
          predictedEvents.push({
            event: 'Transfer',
            signature: 'Transfer(address,address,uint256)',
            predicted: true,
            description: 'Token transfer event will be emitted'
          });
          break;

        case '0x095ea7b3': // approve
          predictedEvents.push({
            event: 'Approval', 
            signature: 'Approval(address,address,uint256)',
            predicted: true,
            description: 'Approval event will be emitted'
          });
          break;

        case '0xf2fde38b': // transferOwnership
          predictedEvents.push({
            event: 'OwnershipTransferred',
            signature: 'OwnershipTransferred(address,address)',
            predicted: true,
            description: 'Ownership transfer event will be emitted'
          });
          break;
      }

      return predictedEvents;

    } catch (error) {
      return [];
    }
  }

  async getTransactionTrace(txRequest) {
    try {
      // Try to get transaction trace using debug_traceCall if available
      const trace = await this.provider.send('debug_traceCall', [
        txRequest,
        'latest',
        { tracer: 'callTracer' }
      ]);

      return {
        available: true,
        trace,
        description: 'Full transaction trace available'
      };

    } catch (error) {
      // Somnia might not support debug_traceCall, return basic info
      return {
        available: false,
        reason: 'Trace calls not supported on this network',
        basicInfo: {
          to: txRequest.to,
          data: txRequest.data,
          value: txRequest.value
        }
      };
    }
  }

  async getLatestBlock() {
    if (!this.connected) return null;
    
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const block = await this.provider.getBlock(blockNumber);
      return block;
    } catch (error) {
      console.error('Failed to get latest block:', error);
      return null;
    }
  }

  async getNetworkStats() {
    if (!this.connected) return null;

    try {
      const [blockNumber, gasPrice, feeData] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getFeeData(),
        this.provider.getFeeData()
      ]);

      return {
        blockNumber,
        gasPrice: {
          standard: ethers.formatUnits(gasPrice.gasPrice, 'gwei'),
          fast: ethers.formatUnits(gasPrice.gasPrice * BigInt(120) / BigInt(100), 'gwei')
        },
        networkId: this.network.chainId.toString(),
        networkName: this.network.name,
        tpsCapability: '1,000,000+',
        finality: 'Sub-second'
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  isConnected() {
    return this.connected;
  }

  getProvider() {
    return this.provider;
  }

  getNetwork() {
    return this.network;
  }
}

// Singleton instance
const somniaService = new SomniaService();

module.exports = {
  SomniaService,
  somniaService
};
