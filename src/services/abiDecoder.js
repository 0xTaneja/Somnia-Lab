/**
 * Enhanced ABI Decoder Service
 * Provides comprehensive transaction decoding and analysis
 */

const { ethers } = require('ethers');

class ABIDecoder {
  constructor() {
    this.knownSignatures = new Map();
    this.knownInterfaces = new Map();
    this.initializeKnownSignatures();
  }

  initializeKnownSignatures() {
    // Common ERC standards and malicious patterns
    const signatures = {
      // ERC-20 Standard
      '0x095ea7b3': {
        name: 'approve',
        signature: 'approve(address,uint256)',
        params: ['spender', 'amount'],
        risk: 'medium',
        description: 'Token approval - check amount carefully'
      },
      '0xa9059cbb': {
        name: 'transfer',
        signature: 'transfer(address,uint256)',
        params: ['to', 'amount'],
        risk: 'low',
        description: 'Token transfer'
      },
      '0x23b872dd': {
        name: 'transferFrom',
        signature: 'transferFrom(address,address,uint256)',
        params: ['from', 'to', 'amount'],
        risk: 'medium',
        description: 'Transfer tokens from another address'
      },

      // ERC-721 (NFT)
      '0x42842e0e': {
        name: 'safeTransferFrom',
        signature: 'safeTransferFrom(address,address,uint256)',
        params: ['from', 'to', 'tokenId'],
        risk: 'medium',
        description: 'NFT transfer'
      },
      '0xb88d4fde': {
        name: 'safeTransferFrom',
        signature: 'safeTransferFrom(address,address,uint256,bytes)',
        params: ['from', 'to', 'tokenId', 'data'],
        risk: 'medium',
        description: 'NFT transfer with data'
      },
      '0xa22cb465': {
        name: 'setApprovalForAll',
        signature: 'setApprovalForAll(address,bool)',
        params: ['operator', 'approved'],
        risk: 'high',
        description: 'Approve all NFTs to operator - DANGEROUS'
      },

      // Ownership patterns (often malicious)
      '0xf2fde38b': {
        name: 'transferOwnership',
        signature: 'transferOwnership(address)',
        params: ['newOwner'],
        risk: 'critical',
        description: 'Transfer contract ownership - HIGH RISK'
      },
      '0x715018a6': {
        name: 'renounceOwnership',
        signature: 'renounceOwnership()',
        params: [],
        risk: 'medium',
        description: 'Renounce contract ownership'
      },

      // Access control
      '0x2f2ff15d': {
        name: 'grantRole',
        signature: 'grantRole(bytes32,address)',
        params: ['role', 'account'],
        risk: 'high',
        description: 'Grant administrative role'
      },
      '0xd547741f': {
        name: 'revokeRole',
        signature: 'revokeRole(bytes32,address)',
        params: ['role', 'account'],
        risk: 'medium',
        description: 'Revoke administrative role'
      },

      // Permit (EIP-2612) - often exploited
      '0xd505accf': {
        name: 'permit',
        signature: 'permit(address,address,uint256,uint256,uint8,bytes32,bytes32)',
        params: ['owner', 'spender', 'value', 'deadline', 'v', 'r', 's'],
        risk: 'critical',
        description: 'Gasless approval via signature - CHECK CAREFULLY'
      },

      // DEX/AMM patterns
      '0x38ed1739': {
        name: 'swapExactTokensForTokens',
        signature: 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)',
        params: ['amountIn', 'amountOutMin', 'path', 'to', 'deadline'],
        risk: 'low',
        description: 'DEX token swap'
      },
      '0x7ff36ab5': {
        name: 'swapExactETHForTokens',
        signature: 'swapExactETHForTokens(uint256,address[],address,uint256)',
        params: ['amountOutMin', 'path', 'to', 'deadline'],
        risk: 'low',
        description: 'DEX ETH to token swap'
      },

      // Liquidity operations
      '0xe8e33700': {
        name: 'addLiquidity',
        signature: 'addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)',
        params: ['tokenA', 'tokenB', 'amountADesired', 'amountBDesired', 'amountAMin', 'amountBMin', 'to', 'deadline'],
        risk: 'low',
        description: 'Add liquidity to pool'
      },
      '0xbaa2abde': {
        name: 'removeLiquidity',
        signature: 'removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)',
        params: ['tokenA', 'tokenB', 'liquidity', 'amountAMin', 'amountBMin', 'to', 'deadline'],
        risk: 'high',
        description: 'Remove liquidity from pool - CHECK IF AUTHORIZED'
      },

      // Proxy patterns (often malicious)
      '0x3659cfe6': {
        name: 'upgradeTo',
        signature: 'upgradeTo(address)',
        params: ['newImplementation'],
        risk: 'critical',
        description: 'Upgrade proxy implementation - VERY DANGEROUS'
      },
      '0x4f1ef286': {
        name: 'upgradeToAndCall',
        signature: 'upgradeToAndCall(address,bytes)',
        params: ['newImplementation', 'data'],
        risk: 'critical',
        description: 'Upgrade proxy and execute - EXTREMELY DANGEROUS'
      },

      // Multicall patterns (often used in exploits)
      '0xac9650d8': {
        name: 'multicall',
        signature: 'multicall(bytes[])',
        params: ['data'],
        risk: 'high',
        description: 'Execute multiple calls - CHECK ALL NESTED CALLS'
      },

      // Flashloan patterns
      '0x5cffe9de': {
        name: 'flashLoan',
        signature: 'flashLoan(address,address,uint256,bytes)',
        params: ['receiverAddress', 'asset', 'amount', 'params'],
        risk: 'high',
        description: 'Flash loan - often used in attacks'
      }
    };

    // Store all signatures
    for (const [sig, info] of Object.entries(signatures)) {
      this.knownSignatures.set(sig, info);
    }
  }

  decodeTransaction(transactionData) {
    if (!transactionData || !transactionData.data || transactionData.data === '0x') {
      return {
        type: 'native_transfer',
        value: transactionData.value || '0',
        risk: 'low',
        description: 'Native token transfer'
      };
    }

    const data = transactionData.data;
    const methodId = data.slice(0, 10);
    
    const knownMethod = this.knownSignatures.get(methodId);
    
    if (knownMethod) {
      const decodedParams = this.decodeParameters(data, knownMethod);
      
      return {
        methodId,
        methodName: knownMethod.name,
        signature: knownMethod.signature,
        parameters: decodedParams,
        risk: knownMethod.risk,
        description: knownMethod.description,
        riskAnalysis: this.analyzeMethodRisk(knownMethod, decodedParams)
      };
    }

    // Unknown method - try to analyze anyway
    return {
      methodId,
      methodName: 'unknown',
      signature: 'unknown',
      risk: 'medium',
      description: 'Unknown method - exercise caution',
      riskAnalysis: {
        isUnknown: true,
        recommendation: 'Verify contract source code before proceeding'
      }
    };
  }

  decodeParameters(data, methodInfo) {
    try {
      const paramData = data.slice(10); // Remove method signature
      const params = {};
      
      // Basic parameter extraction for known patterns
      switch (methodInfo.name) {
        case 'approve':
        case 'transfer':
          params.address = '0x' + paramData.slice(24, 64);
          params.amount = this.parseUint256(paramData.slice(64, 128));
          break;
          
        case 'transferFrom':
        case 'safeTransferFrom':
          params.from = '0x' + paramData.slice(24, 64);
          params.to = '0x' + paramData.slice(88, 128);
          params.amount = this.parseUint256(paramData.slice(128, 192));
          break;
          
        case 'setApprovalForAll':
          params.operator = '0x' + paramData.slice(24, 64);
          params.approved = paramData.slice(127, 128) === '1';
          break;
          
        case 'transferOwnership':
          params.newOwner = '0x' + paramData.slice(24, 64);
          break;
          
        case 'permit':
          params.owner = '0x' + paramData.slice(24, 64);
          params.spender = '0x' + paramData.slice(88, 128);
          params.value = this.parseUint256(paramData.slice(128, 192));
          params.deadline = this.parseUint256(paramData.slice(192, 256));
          // v, r, s signature components follow
          break;
          
        default:
          // Try to extract first few parameters as addresses/amounts
          if (paramData.length >= 64) {
            params.param1 = '0x' + paramData.slice(24, 64);
          }
          if (paramData.length >= 128) {
            params.param2 = this.parseUint256(paramData.slice(64, 128));
          }
      }
      
      return params;
      
    } catch (error) {
      return { error: error.message };
    }
  }

  parseUint256(hexData) {
    try {
      const value = BigInt('0x' + hexData);
      
      // Check if it's a suspicious amount (like max uint256)
      const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
      
      if (value === maxUint256) {
        return {
          value: value.toString(),
          formatted: 'MAX (unlimited)',
          isUnlimited: true,
          warning: 'UNLIMITED APPROVAL - HIGH RISK'
        };
      }
      
      // Format large numbers
      if (value > BigInt(10 ** 18)) {
        const ethValue = Number(value) / (10 ** 18);
        return {
          value: value.toString(),
          formatted: `${ethValue.toFixed(4)} tokens`,
          isLarge: ethValue > 1000
        };
      }
      
      return {
        value: value.toString(),
        formatted: value.toString()
      };
      
    } catch (error) {
      return { error: error.message };
    }
  }

  analyzeMethodRisk(methodInfo, decodedParams) {
    const analysis = {
      riskFactors: [],
      recommendations: [],
      severity: methodInfo.risk
    };

    // Specific risk analysis based on method and parameters
    switch (methodInfo.name) {
      case 'approve':
        if (decodedParams.amount?.isUnlimited) {
          analysis.riskFactors.push('UNLIMITED_APPROVAL');
          analysis.recommendations.push('Consider setting a limited approval amount');
          analysis.severity = 'critical';
        }
        break;

      case 'setApprovalForAll':
        if (decodedParams.approved) {
          analysis.riskFactors.push('APPROVE_ALL_NFTS');
          analysis.recommendations.push('This gives full control of ALL your NFTs to the operator');
          analysis.severity = 'critical';
        }
        break;

      case 'transferOwnership':
        analysis.riskFactors.push('OWNERSHIP_TRANSFER');
        analysis.recommendations.push('Verify the new owner address is trusted');
        break;

      case 'permit':
        analysis.riskFactors.push('PERMIT_SIGNATURE');
        analysis.recommendations.push('Verify signature parameters carefully');
        if (decodedParams.value?.isUnlimited) {
          analysis.riskFactors.push('UNLIMITED_PERMIT');
          analysis.severity = 'critical';
        }
        break;

      case 'multicall':
        analysis.riskFactors.push('BATCH_EXECUTION');
        analysis.recommendations.push('Check all nested function calls');
        break;

      case 'upgradeTo':
      case 'upgradeToAndCall':
        analysis.riskFactors.push('PROXY_UPGRADE');
        analysis.recommendations.push('Contract logic will be completely changed');
        break;
    }

    return analysis;
  }

  getHumanReadableDescription(decodedTx) {
    if (!decodedTx.methodName || decodedTx.methodName === 'unknown') {
      return 'Execute unknown function on contract';
    }

    const method = decodedTx.methodName;
    const params = decodedTx.parameters;

    switch (method) {
      case 'approve':
        const amount = params.amount?.formatted || 'unknown amount';
        return `Approve ${amount} tokens to ${params.address}`;

      case 'transfer':
        const transferAmount = params.amount?.formatted || 'unknown amount';
        return `Transfer ${transferAmount} tokens to ${params.address}`;

      case 'transferFrom':
        const fromAmount = params.amount?.formatted || 'unknown amount';
        return `Transfer ${fromAmount} tokens from ${params.from} to ${params.to}`;

      case 'setApprovalForAll':
        const approval = params.approved ? 'approve all' : 'revoke approval for all';
        return `${approval} NFTs to operator ${params.operator}`;

      case 'transferOwnership':
        return `Transfer contract ownership to ${params.newOwner}`;

      case 'permit':
        const permitAmount = params.value?.formatted || 'unknown amount';
        return `Permit ${permitAmount} token approval via signature`;

      default:
        return `Execute ${method} function`;
    }
  }
}

// Singleton instance
const abiDecoder = new ABIDecoder();

module.exports = {
  ABIDecoder,
  abiDecoder
};
