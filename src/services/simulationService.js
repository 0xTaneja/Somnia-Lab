/**
 * Transaction Simulation Service
 * Handles real blockchain interaction and transaction simulation
 */

const { ethers } = require('ethers');
const config = require('../config');

class SimulationService {
  constructor() {
    this.provider = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Initialize provider - will use generic RPC endpoint that can be configured for Somnia
      const rpcUrl = config.SOMNIA_RPC_URL || 'http://localhost:8545'; // Fallback to local
      
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Test connection
      await this.provider.getNetwork();
      this.initialized = true;
      console.log(`✅ Connected to blockchain: ${rpcUrl}`);
      
    } catch (error) {
      console.warn(`⚠️ RPC connection failed (${error.message}), using mock simulation`);
      this.initialized = false;
    }
  }

  async simulateTransaction(transaction, contractAddress) {
    if (!this.initialized) {
      return this.mockSimulation(transaction, contractAddress);
    }

    try {
      // Real simulation using eth_call
      const result = await this.provider.call({
        to: contractAddress,
        data: transaction.data || '0x',
        value: transaction.value || '0x0',
        from: transaction.from || ethers.ZeroAddress
      });

      // Get transaction trace if available
      const trace = await this.getTransactionTrace(transaction, contractAddress);
      
      // Get state changes
      const stateChanges = await this.getStateChanges(transaction, contractAddress);

      return {
        success: true,
        result,
        trace,
        stateChanges,
        gasEstimate: await this.estimateGas(transaction, contractAddress),
        timestamp: new Date().toISOString(),
        networkId: (await this.provider.getNetwork()).chainId.toString()
      };

    } catch (error) {
      console.error('Simulation error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.mockSimulation(transaction, contractAddress)
      };
    }
  }

  async getTransactionTrace(transaction, contractAddress) {
    try {
      // Some networks support debug_traceCall
      const trace = await this.provider.send('debug_traceCall', [
        {
          to: contractAddress,
          data: transaction.data,
          value: transaction.value || '0x0',
          from: transaction.from || ethers.ZeroAddress
        },
        'latest',
        { tracer: 'callTracer' }
      ]);
      
      return trace;
    } catch (error) {
      // Not all networks support tracing
      return null;
    }
  }

  async getStateChanges(transaction, contractAddress) {
    try {
      // Get state changes using eth_getStorageAt before/after simulation
      // This is a simplified version - full implementation would need more sophisticated state tracking
      
      const blockNumber = await this.provider.getBlockNumber();
      
      // Check if this is an ERC-20 token contract
      const isERC20 = await this.isERC20Contract(contractAddress);
      
      if (isERC20) {
        return await this.getERC20StateChanges(transaction, contractAddress);
      }

      return {
        storageChanges: [],
        balanceChanges: [],
        contractType: 'unknown'
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  async isERC20Contract(contractAddress) {
    try {
      // Check if contract has ERC-20 methods
      const erc20Abi = [
        'function totalSupply() view returns (uint256)',
        'function balanceOf(address) view returns (uint256)',
        'function transfer(address, uint256) returns (bool)'
      ];
      
      const contract = new ethers.Contract(contractAddress, erc20Abi, this.provider);
      
      // Try to call totalSupply - if it exists, likely ERC-20
      await contract.totalSupply();
      return true;
      
    } catch (error) {
      return false;
    }
  }

  async getERC20StateChanges(transaction, contractAddress) {
    try {
      const changes = {
        contractType: 'ERC20',
        transferEvents: [],
        approvalEvents: [],
        balanceChanges: []
      };

      // Decode transfer/approval calls from transaction data
      if (transaction.data) {
        const decodedData = this.decodeTransactionData(transaction.data);
        
        if (decodedData.method === 'transfer') {
          changes.transferEvents.push({
            from: transaction.from,
            to: decodedData.params.to,
            amount: decodedData.params.amount,
            type: 'transfer'
          });
        } else if (decodedData.method === 'approve') {
          changes.approvalEvents.push({
            owner: transaction.from,
            spender: decodedData.params.spender,
            amount: decodedData.params.amount,
            type: 'approval'
          });
        }
      }

      return changes;
      
    } catch (error) {
      return { error: error.message };
    }
  }

  decodeTransactionData(data) {
    try {
      if (!data || data === '0x') return null;

      // Common ERC-20 method signatures
      const signatures = {
        '0xa9059cbb': 'transfer', // transfer(address,uint256)
        '0x095ea7b3': 'approve',  // approve(address,uint256)
        '0x23b872dd': 'transferFrom', // transferFrom(address,address,uint256)
        '0x42842e0e': 'safeTransferFrom', // safeTransferFrom(address,address,uint256)
        '0xf2fde38b': 'transferOwnership', // transferOwnership(address)
        '0x715018a6': 'renounceOwnership', // renounceOwnership()
        '0xd505accf': 'permit' // permit(address,address,uint256,uint256,uint8,bytes32,bytes32)
      };

      const methodId = data.slice(0, 10);
      const methodName = signatures[methodId];

      if (!methodName) return { method: 'unknown', signature: methodId };

      // Basic parameter extraction for common methods
      const params = this.extractBasicParams(data, methodName);

      return {
        method: methodName,
        signature: methodId,
        params,
        rawData: data
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  extractBasicParams(data, methodName) {
    try {
      const paramData = data.slice(10); // Remove method signature

      switch (methodName) {
        case 'transfer':
        case 'approve':
          // Both have (address, uint256) parameters
          const to = '0x' + paramData.slice(24, 64); // Extract address
          const amount = '0x' + paramData.slice(64, 128); // Extract amount
          return { 
            [methodName === 'transfer' ? 'to' : 'spender']: to, 
            amount: amount 
          };

        case 'transferFrom':
          const from = '0x' + paramData.slice(24, 64);
          const toAddr = '0x' + paramData.slice(88, 128);
          const value = '0x' + paramData.slice(128, 192);
          return { from, to: toAddr, amount: value };

        case 'transferOwnership':
          const newOwner = '0x' + paramData.slice(24, 64);
          return { newOwner };

        default:
          return {};
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  async estimateGas(transaction, contractAddress) {
    try {
      if (!this.initialized) return '21000'; // Default gas estimate

      const gasEstimate = await this.provider.estimateGas({
        to: contractAddress,
        data: transaction.data || '0x',
        value: transaction.value || '0x0',
        from: transaction.from || ethers.ZeroAddress
      });

      return gasEstimate.toString();
      
    } catch (error) {
      return '21000'; // Fallback
    }
  }

  mockSimulation(transaction, contractAddress) {
    // Enhanced mock simulation based on transaction data analysis
    const simulation = {
      success: true,
      result: '0x',
      mockMode: true,
      gasEstimate: '21000',
      timestamp: new Date().toISOString(),
      networkId: 'mock'
    };

    // Analyze transaction data to provide more realistic mock responses
    if (transaction.data) {
      const decoded = this.decodeTransactionData(transaction.data);
      
      if (decoded.method === 'transfer') {
        simulation.stateChanges = {
          contractType: 'ERC20',
          transferEvents: [{
            from: transaction.from,
            to: decoded.params.to,
            amount: decoded.params.amount,
            type: 'transfer'
          }]
        };
      } else if (decoded.method === 'approve') {
        simulation.stateChanges = {
          contractType: 'ERC20',
          approvalEvents: [{
            owner: transaction.from,
            spender: decoded.params.spender,
            amount: decoded.params.amount,
            type: 'approval'
          }]
        };
      }
    }

    return simulation;
  }

  async getContractCode(contractAddress) {
    try {
      if (!this.initialized) return '0x'; // Mock mode
      
      const code = await this.provider.getCode(contractAddress);
      return code;
      
    } catch (error) {
      return '0x';
    }
  }

  async getContractCreationInfo(contractAddress) {
    try {
      if (!this.initialized) return null;

      // This would require additional RPC methods or indexing
      // For now, return basic info
      const code = await this.getContractCode(contractAddress);
      
      return {
        hasCode: code !== '0x',
        codeSize: code.length,
        isContract: code !== '0x'
      };
      
    } catch (error) {
      return null;
    }
  }
}

// Singleton instance
const simulationService = new SimulationService();

module.exports = {
  SimulationService,
  simulationService
};
