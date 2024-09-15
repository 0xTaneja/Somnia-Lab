const OpenAI = require('openai');
const axios = require('axios');
const ethers = require('ethers');
const aiAnalysisService = require('./aiAnalysisService');

class SemanticTransactionDecoder {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'demo-key-for-testing'
    });
    this.initialized = false;
    this.bytecodeCache = new Map();
    this.semanticCache = new Map();
  }

  async initialize() {
    try {
      console.log('🧠 Initializing Semantic Transaction Decoder...');
      this.initialized = true;
      console.log('✅ Semantic Transaction Decoder ready for revolutionary analysis!');
    } catch (error) {
      console.error('❌ Semantic Transaction Decoder initialization failed:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Main entry point: Decode transaction with full semantic analysis
   */
  async decodeTransaction(transactionData, contractCode = null) {
    try {
      console.log('🔍 Starting semantic transaction decoding...');
      
      const startTime = Date.now();
      
      // Step 1: Extract transaction intent
      const transactionIntent = await this.extractTransactionIntent(transactionData);
      
      // Step 2: Decompile bytecode if available
      let decompiledCode = null;
      if (contractCode || transactionData.to) {
        decompiledCode = await this.decompileBytecode(contractCode, transactionData.to);
      }
      
      // Step 3: Generate semantic explanation
      const semanticExplanation = await this.generateSemanticExplanation(
        transactionData, 
        transactionIntent, 
        decompiledCode
      );
      
      // Step 4: Assess security implications
      const securityAssessment = await this.assessSecurityImplications(
        transactionData, 
        semanticExplanation,
        decompiledCode
      );
      
      // Step 5: Generate user-friendly warnings
      const userWarnings = this.generateUserWarnings(securityAssessment, semanticExplanation);
      
      const processingTime = Date.now() - startTime;
      
      return {
        transactionHash: transactionData.hash || transactionData.txHash,
        timestamp: new Date().toISOString(),
        processingTime: `${processingTime}ms`,
        
        // Core semantic analysis
        transactionIntent,
        semanticExplanation,
        decompiledCode,
        
        // Security analysis
        securityAssessment,
        userWarnings,
        
        // Risk metrics
        riskScore: securityAssessment.riskScore,
        riskLevel: securityAssessment.riskLevel,
        confidenceScore: semanticExplanation.confidence,
        
        // Technical details
        technicalAnalysis: {
          gasUsed: transactionData.gasUsed || transactionData.gas,
          gasPrice: transactionData.gasPrice,
          value: transactionData.value,
          functionCalled: transactionIntent.functionName,
          parametersDecoded: transactionIntent.decodedParameters
        }
      };
      
    } catch (error) {
      console.error('🚨 Semantic decoding error:', error);
      return this.getFallbackDecoding(transactionData);
    }
  }

  /**
   * Extract the intent of what this transaction is trying to do
   */
  async extractTransactionIntent(transactionData) {
    try {
      const inputData = transactionData.input || transactionData.data || '0x';
      
      // Basic transaction analysis
      const intent = {
        type: 'unknown',
        functionName: null,
        decodedParameters: [],
        estimatedPurpose: 'Unknown transaction',
        riskIndicators: []
      };
      
      // Simple ETH transfer
      if (inputData === '0x' || inputData === '0x0') {
        intent.type = 'eth_transfer';
        intent.functionName = 'transfer';
        intent.estimatedPurpose = `Transfer ${this.formatEthValue(transactionData.value)} ETH`;
        return intent;
      }
      
      // Contract interaction
      if (inputData.length >= 10) {
        const functionSelector = inputData.slice(0, 10);
        intent.functionSelector = functionSelector;
        
        // Common function signatures
        const knownFunctions = {
          '0xa9059cbb': { name: 'transfer', purpose: 'Token Transfer', risk: 'low' },
          '0x23b872dd': { name: 'transferFrom', purpose: 'Token Transfer (Approved)', risk: 'medium' },
          '0x095ea7b3': { name: 'approve', purpose: 'Token Approval', risk: 'high' },
          '0x791ac947': { name: 'swapExactTokensForTokens', purpose: 'DEX Token Swap', risk: 'medium' },
          '0x38ed1739': { name: 'swapExactTokensForTokens', purpose: 'DEX Token Swap', risk: 'medium' },
          '0xe8e33700': { name: 'addLiquidity', purpose: 'Add Liquidity to Pool', risk: 'medium' },
          '0xbaa2abde': { name: 'removeLiquidity', purpose: 'Remove Liquidity from Pool', risk: 'medium' },
          '0x8803dbee': { name: 'withdrawAll', purpose: 'Withdraw All Funds', risk: 'critical' },
          '0x2e1a7d4d': { name: 'withdraw', purpose: 'Withdraw Funds', risk: 'high' },
          '0xd0e30db0': { name: 'deposit', purpose: 'Deposit Funds', risk: 'low' },
          '0xa0712d68': { name: 'mint', purpose: 'Mint New Tokens', risk: 'high' },
          '0x42966c68': { name: 'burn', purpose: 'Burn Tokens', risk: 'medium' }
        };
        
        const knownFunction = knownFunctions[functionSelector];
        if (knownFunction) {
          intent.type = 'contract_interaction';
          intent.functionName = knownFunction.name;
          intent.estimatedPurpose = knownFunction.purpose;
          intent.riskIndicators.push({
            type: 'function_risk',
            level: knownFunction.risk,
            description: `Calling ${knownFunction.name} function`
          });
        } else {
          intent.type = 'unknown_contract_interaction';
          intent.functionName = 'unknown';
          intent.estimatedPurpose = 'Unknown contract interaction';
          intent.riskIndicators.push({
            type: 'unknown_function',
            level: 'high',
            description: 'Calling unknown contract function'
          });
        }
        
        // Try to decode parameters if we have ABI patterns
        intent.decodedParameters = await this.decodeParameters(inputData, intent.functionName);
      }
      
      return intent;
      
    } catch (error) {
      console.error('Intent extraction error:', error);
      return {
        type: 'error',
        functionName: null,
        decodedParameters: [],
        estimatedPurpose: 'Failed to analyze transaction intent',
        riskIndicators: [{
          type: 'analysis_error',
          level: 'medium',
          description: 'Could not determine transaction intent'
        }]
      };
    }
  }

  /**
   * Decompile contract bytecode to understand what the contract does
   */
  async decompileBytecode(contractCode, contractAddress) {
    try {
      if (this.bytecodeCache.has(contractAddress)) {
        return this.bytecodeCache.get(contractAddress);
      }
      
      console.log('🔬 Decompiling contract bytecode...');
      
      // If we don't have the code, try to fetch it
      if (!contractCode && contractAddress) {
        try {
          // Try to get code from Somnia API or construct a provider
          contractCode = await this.fetchContractCode(contractAddress);
        } catch (error) {
          console.log('⚠️ Could not fetch contract code, using address analysis');
        }
      }
      
      if (!contractCode || contractCode === '0x') {
        return {
          success: false,
          error: 'No contract code available',
          pseudoCode: 'Contract code not available for analysis',
          functions: [],
          riskPatterns: []
        };
      }
      
      // Analyze bytecode patterns
      const analysis = {
        success: true,
        contractAddress,
        codeLength: contractCode.length,
        pseudoCode: '',
        functions: [],
        riskPatterns: [],
        contractType: 'unknown'
      };
      
      // Pattern-based decompilation
      analysis.riskPatterns = this.analyzeBytecodePatterns(contractCode);
      analysis.functions = this.extractFunctionSignatures(contractCode);
      analysis.contractType = this.inferContractType(contractCode, analysis.functions);
      analysis.pseudoCode = this.generatePseudoCode(analysis);
      
      // AI-enhanced decompilation if available
      if (this.initialized && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo-key-for-testing') {
        try {
          const aiDecompilation = await this.aiEnhancedDecompilation(contractCode, analysis);
          analysis.aiEnhancedPseudoCode = aiDecompilation.pseudoCode;
          analysis.aiInsights = aiDecompilation.insights;
        } catch (error) {
          console.log('⚠️ AI decompilation failed, using pattern-based analysis');
        }
      }
      
      this.bytecodeCache.set(contractAddress, analysis);
      return analysis;
      
    } catch (error) {
      console.error('Bytecode decompilation error:', error);
      return {
        success: false,
        error: error.message,
        pseudoCode: 'Decompilation failed',
        functions: [],
        riskPatterns: []
      };
    }
  }

  /**
   * Generate human-readable explanation of what the transaction does
   */
  async generateSemanticExplanation(transactionData, transactionIntent, decompiledCode) {
    try {
      console.log('📝 Generating semantic explanation...');
      
      const cacheKey = `${transactionData.hash}_semantic`;
      if (this.semanticCache.has(cacheKey)) {
        return this.semanticCache.get(cacheKey);
      }
      
      // Base explanation structure
      const explanation = {
        humanReadable: '',
        technicalSummary: '',
        stepByStep: [],
        keyActions: [],
        potentialOutcomes: [],
        confidence: 0.8
      };
      
      // Generate based on transaction intent
      if (transactionIntent.type === 'eth_transfer') {
        explanation.humanReadable = `This transaction sends ${this.formatEthValue(transactionData.value)} ETH from ${this.formatAddress(transactionData.from)} to ${this.formatAddress(transactionData.to)}.`;
        explanation.technicalSummary = 'Simple ETH transfer transaction';
        explanation.stepByStep = [
          'User initiates ETH transfer',
          'Transaction is broadcast to network',
          'ETH balance is transferred between addresses'
        ];
        explanation.keyActions = ['ETH Transfer'];
        explanation.potentialOutcomes = ['Successful ETH transfer', 'Transaction failure due to insufficient gas or balance'];
        explanation.confidence = 0.95;
        
      } else if (transactionIntent.type === 'contract_interaction') {
        explanation.humanReadable = await this.generateContractInteractionExplanation(transactionData, transactionIntent, decompiledCode);
        explanation.technicalSummary = `Contract interaction calling ${transactionIntent.functionName} function`;
        explanation.stepByStep = await this.generateStepByStepExplanation(transactionIntent, decompiledCode);
        explanation.keyActions = this.extractKeyActions(transactionIntent, decompiledCode);
        explanation.potentialOutcomes = this.predictPotentialOutcomes(transactionIntent, decompiledCode);
        
      } else {
        explanation.humanReadable = 'This transaction interacts with a smart contract in an unknown way.';
        explanation.technicalSummary = 'Unknown contract interaction';
        explanation.stepByStep = ['Transaction calls unknown contract function'];
        explanation.keyActions = ['Unknown Action'];
        explanation.potentialOutcomes = ['Unknown outcome'];
        explanation.confidence = 0.3;
      }
      
      // AI enhancement if available
      if (this.initialized && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo-key-for-testing') {
        try {
          const aiExplanation = await this.aiEnhanceExplanation(explanation, transactionData, transactionIntent, decompiledCode);
          explanation.aiEnhancedExplanation = aiExplanation.enhanced;
          explanation.aiConfidence = aiExplanation.confidence;
          explanation.confidence = Math.max(explanation.confidence, aiExplanation.confidence);
        } catch (error) {
          console.log('⚠️ AI explanation enhancement failed');
        }
      }
      
      this.semanticCache.set(cacheKey, explanation);
      return explanation;
      
    } catch (error) {
      console.error('Semantic explanation error:', error);
      return {
        humanReadable: 'Unable to generate explanation for this transaction',
        technicalSummary: 'Analysis failed',
        stepByStep: ['Analysis error occurred'],
        keyActions: ['Unknown'],
        potentialOutcomes: ['Unknown'],
        confidence: 0.1
      };
    }
  }

  /**
   * Assess security implications and risks
   */
  async assessSecurityImplications(transactionData, semanticExplanation, decompiledCode) {
    try {
      console.log('🛡️ Assessing security implications...');
      
      let riskScore = 10; // Base risk
      const riskFactors = [];
      const securityWarnings = [];
      const recommendations = [];
      
      // Risk assessment based on transaction intent
      if (transactionData.value && parseInt(transactionData.value) > 0) {
        const ethValue = parseFloat(ethers.formatEther(transactionData.value));
        if (ethValue > 1) {
          riskScore += 20;
          riskFactors.push('high_value_transfer');
          securityWarnings.push(`High value transfer: ${ethValue.toFixed(2)} ETH`);
        }
      }
      
      // Contract interaction risks
      if (semanticExplanation.keyActions.includes('Token Approval')) {
        riskScore += 30;
        riskFactors.push('token_approval');
        securityWarnings.push('Token approval detected - this gives the contract permission to spend your tokens');
        recommendations.push('Only approve tokens for trusted contracts');
      }
      
      if (semanticExplanation.keyActions.includes('Withdraw All Funds')) {
        riskScore += 50;
        riskFactors.push('withdraw_all');
        securityWarnings.push('WARNING: This transaction attempts to withdraw all funds');
        recommendations.push('Verify this is intentional and the contract is trusted');
      }
      
      // Decompiled code risks
      if (decompiledCode && decompiledCode.riskPatterns) {
        decompiledCode.riskPatterns.forEach(pattern => {
          riskScore += pattern.riskWeight;
          riskFactors.push(pattern.type);
          securityWarnings.push(pattern.description);
        });
      }
      
      // Gas analysis
      const gasUsed = parseInt(transactionData.gasUsed || transactionData.gas || 0);
      if (gasUsed > 500000) {
        riskScore += 10;
        riskFactors.push('high_gas_usage');
        securityWarnings.push('High gas usage detected - complex contract interaction');
      }
      
      // Unknown function calls
      if (semanticExplanation.keyActions.includes('Unknown Action')) {
        riskScore += 40;
        riskFactors.push('unknown_function');
        securityWarnings.push('WARNING: Unknown function call detected');
        recommendations.push('Exercise extreme caution with unknown contract functions');
      }
      
      const riskLevel = this.calculateRiskLevel(riskScore);
      
      return {
        riskScore: Math.min(riskScore, 100),
        riskLevel,
        riskFactors,
        securityWarnings,
        recommendations,
        threatCategories: this.categorizeThreat(riskFactors),
        mitigationStrategies: this.generateMitigationStrategies(riskFactors)
      };
      
    } catch (error) {
      console.error('Security assessment error:', error);
      return {
        riskScore: 50,
        riskLevel: 'MEDIUM',
        riskFactors: ['analysis_error'],
        securityWarnings: ['Security analysis failed'],
        recommendations: ['Manual review required'],
        threatCategories: ['unknown'],
        mitigationStrategies: ['Proceed with caution']
      };
    }
  }

  /**
   * Generate user-friendly warnings
   */
  generateUserWarnings(securityAssessment, semanticExplanation) {
    const warnings = {
      severity: securityAssessment.riskLevel,
      primaryWarning: '',
      detailedWarnings: [],
      actionRequired: false,
      userFriendlyAdvice: []
    };
    
    // Generate primary warning based on risk level
    switch (securityAssessment.riskLevel) {
      case 'CRITICAL':
        warnings.primaryWarning = '🚨 CRITICAL RISK DETECTED - DO NOT PROCEED';
        warnings.actionRequired = true;
        warnings.userFriendlyAdvice.push('This transaction has been flagged as extremely dangerous');
        break;
      case 'HIGH':
        warnings.primaryWarning = '⚠️ HIGH RISK - Proceed with extreme caution';
        warnings.actionRequired = true;
        warnings.userFriendlyAdvice.push('This transaction could result in significant loss of funds');
        break;
      case 'MEDIUM':
        warnings.primaryWarning = '⚠️ MEDIUM RISK - Review carefully before proceeding';
        warnings.userFriendlyAdvice.push('This transaction has some risk factors to consider');
        break;
      default:
        warnings.primaryWarning = '✅ LOW RISK - Transaction appears safe';
        warnings.userFriendlyAdvice.push('This transaction appears to be standard and safe');
    }
    
    // Add specific warning details
    warnings.detailedWarnings = securityAssessment.securityWarnings.map(warning => ({
      message: warning,
      severity: this.getWarningSeverity(warning)
    }));
    
    // Add user-friendly advice
    warnings.userFriendlyAdvice = [
      ...warnings.userFriendlyAdvice,
      ...securityAssessment.recommendations.map(rec => `💡 ${rec}`)
    ];
    
    return warnings;
  }

  // Helper methods
  
  formatEthValue(value) {
    if (!value || value === '0') return '0';
    try {
      return parseFloat(ethers.formatEther(value)).toFixed(4);
    } catch {
      return 'unknown';
    }
  }
  
  formatAddress(address) {
    if (!address) return 'unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  
  calculateRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }
  
  getWarningSeverity(warning) {
    if (warning.includes('WARNING') || warning.includes('CRITICAL')) return 'high';
    if (warning.includes('High') || warning.includes('dangerous')) return 'medium';
    return 'low';
  }

  // Additional helper methods for comprehensive analysis...
  
  async decodeParameters(inputData, functionName) {
    // Simplified parameter decoding - in a real implementation, this would use ABI
    const parameters = [];
    
    if (inputData.length > 10) {
      const paramData = inputData.slice(10); // Remove function selector
      // Basic parameter extraction (simplified)
      if (paramData.length >= 64) {
        parameters.push({
          name: 'param1',
          type: 'address/uint256',
          value: `0x${paramData.slice(24, 64)}` // Simplified extraction
        });
      }
    }
    
    return parameters;
  }
  
  analyzeBytecodePatterns(contractCode) {
    const patterns = [];
    
    // Common risk patterns in bytecode
    const riskChecks = [
      { pattern: /selfdestruct/i, type: 'selfdestruct', riskWeight: 30, description: 'Contract can self-destruct' },
      { pattern: /delegatecall/i, type: 'delegatecall', riskWeight: 20, description: 'Uses delegatecall (proxy risk)' },
      { pattern: /onlyOwner/i, type: 'centralized', riskWeight: 15, description: 'Centralized owner control' },
      { pattern: /withdraw.*all/i, type: 'withdraw_all', riskWeight: 25, description: 'Can withdraw all funds' }
    ];
    
    riskChecks.forEach(check => {
      if (check.pattern.test(contractCode)) {
        patterns.push(check);
      }
    });
    
    return patterns;
  }
  
  extractFunctionSignatures(contractCode) {
    // Simplified function signature extraction
    const functions = [];
    const functionPattern = /function\s+(\w+)\s*\(/g;
    let match;
    
    while ((match = functionPattern.exec(contractCode)) !== null) {
      functions.push({
        name: match[1],
        signature: match[0]
      });
    }
    
    return functions;
  }
  
  inferContractType(contractCode, functions) {
    const functionNames = functions.map(f => f.name.toLowerCase());
    
    if (functionNames.includes('transfer') && functionNames.includes('approve')) {
      return 'ERC20_token';
    }
    if (functionNames.includes('safetransfer') || functionNames.includes('tokenuri')) {
      return 'ERC721_nft';
    }
    if (functionNames.includes('swap') || functionNames.includes('addliquidity')) {
      return 'dex_contract';
    }
    
    return 'unknown';
  }
  
  generatePseudoCode(analysis) {
    let pseudoCode = `// Contract Type: ${analysis.contractType}\n`;
    pseudoCode += `// Risk Patterns Found: ${analysis.riskPatterns.length}\n\n`;
    
    if (analysis.functions.length > 0) {
      pseudoCode += 'Available Functions:\n';
      analysis.functions.forEach(func => {
        pseudoCode += `  - ${func.name}()\n`;
      });
    }
    
    if (analysis.riskPatterns.length > 0) {
      pseudoCode += '\nSecurity Concerns:\n';
      analysis.riskPatterns.forEach(pattern => {
        pseudoCode += `  ⚠️ ${pattern.description}\n`;
      });
    }
    
    return pseudoCode;
  }
  
  async generateContractInteractionExplanation(transactionData, intent, decompiledCode) {
    const functionName = intent.functionName || 'unknown';
    const contractAddress = this.formatAddress(transactionData.to);
    
    let explanation = `This transaction calls the "${functionName}" function on contract ${contractAddress}. `;
    
    switch (intent.estimatedPurpose) {
      case 'Token Transfer':
        explanation += 'This will transfer tokens between addresses.';
        break;
      case 'Token Approval':
        explanation += 'This will give the contract permission to spend your tokens.';
        break;
      case 'DEX Token Swap':
        explanation += 'This will exchange one token for another on a decentralized exchange.';
        break;
      case 'Withdraw Funds':
        explanation += 'This will withdraw funds from the contract.';
        break;
      default:
        explanation += `The purpose appears to be: ${intent.estimatedPurpose}.`;
    }
    
    return explanation;
  }
  
  async generateStepByStepExplanation(intent, decompiledCode) {
    const steps = [];
    
    steps.push('1. Transaction is submitted to the blockchain');
    steps.push(`2. Contract function "${intent.functionName}" is called`);
    
    if (intent.estimatedPurpose.includes('Transfer')) {
      steps.push('3. Token balances are updated');
      steps.push('4. Transfer event is emitted');
    } else if (intent.estimatedPurpose.includes('Approval')) {
      steps.push('3. Approval mapping is updated');
      steps.push('4. Approval event is emitted');
    } else {
      steps.push('3. Contract logic is executed');
      steps.push('4. State changes are applied');
    }
    
    steps.push('5. Transaction is confirmed on blockchain');
    
    return steps;
  }
  
  extractKeyActions(intent, decompiledCode) {
    const actions = [intent.estimatedPurpose];
    
    if (decompiledCode && decompiledCode.riskPatterns) {
      decompiledCode.riskPatterns.forEach(pattern => {
        if (pattern.type === 'withdraw_all') {
          actions.push('Withdraw All Funds');
        }
      });
    }
    
    return actions;
  }
  
  predictPotentialOutcomes(intent, decompiledCode) {
    const outcomes = ['Transaction succeeds', 'Transaction fails due to gas or revert'];
    
    if (intent.riskIndicators.some(r => r.level === 'critical')) {
      outcomes.push('Potential total loss of funds');
    }
    
    return outcomes;
  }
  
  categorizeThreat(riskFactors) {
    const categories = [];
    
    if (riskFactors.includes('token_approval')) categories.push('approval_risk');
    if (riskFactors.includes('high_value_transfer')) categories.push('financial_risk');
    if (riskFactors.includes('unknown_function')) categories.push('unknown_risk');
    if (riskFactors.includes('withdraw_all')) categories.push('drain_risk');
    
    return categories.length > 0 ? categories : ['general_risk'];
  }
  
  generateMitigationStrategies(riskFactors) {
    const strategies = [];
    
    if (riskFactors.includes('token_approval')) {
      strategies.push('Consider approving only the minimum necessary amount');
    }
    if (riskFactors.includes('high_value_transfer')) {
      strategies.push('Double-check recipient address and amount');
    }
    if (riskFactors.includes('unknown_function')) {
      strategies.push('Research the contract thoroughly before proceeding');
    }
    
    return strategies.length > 0 ? strategies : ['Proceed with caution and do your own research'];
  }
  
  async fetchContractCode(contractAddress) {
    // Try to fetch from various sources
    try {
      // This would integrate with Somnia or other APIs
      console.log(`Attempting to fetch code for ${contractAddress}`);
      return null; // Placeholder - would implement actual fetching
    } catch (error) {
      throw new Error('Contract code not available');
    }
  }
  
  async aiEnhancedDecompilation(contractCode, analysis) {
    // AI-enhanced decompilation using GPT
    const prompt = `Analyze this smart contract bytecode and provide insights:
    
Contract Type: ${analysis.contractType}
Code Length: ${analysis.codeLength}
Functions Found: ${analysis.functions.map(f => f.name).join(', ')}

Please provide:
1. Enhanced pseudocode explanation
2. Security insights
3. Potential vulnerabilities

Keep response under 500 tokens.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an expert smart contract security auditor." },
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.1
      });
      
      return {
        pseudoCode: response.choices[0].message.content,
        insights: ['AI-enhanced analysis provided']
      };
    } catch (error) {
      throw new Error('AI decompilation failed');
    }
  }
  
  async aiEnhanceExplanation(explanation, transactionData, intent, decompiledCode) {
    const prompt = `Explain this blockchain transaction in simple terms:
    
Function: ${intent.functionName}
Purpose: ${intent.estimatedPurpose}
Current explanation: ${explanation.humanReadable}

Make it more user-friendly and highlight any risks. Keep under 200 words.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a blockchain educator explaining transactions to non-technical users." },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.2
      });
      
      return {
        enhanced: response.choices[0].message.content,
        confidence: 0.9
      };
    } catch (error) {
      throw new Error('AI explanation enhancement failed');
    }
  }
  
  getFallbackDecoding(transactionData) {
    return {
      transactionHash: transactionData.hash || transactionData.txHash,
      timestamp: new Date().toISOString(),
      processingTime: '0ms',
      
      transactionIntent: {
        type: 'unknown',
        functionName: null,
        estimatedPurpose: 'Unable to decode transaction',
        riskIndicators: []
      },
      
      semanticExplanation: {
        humanReadable: 'This transaction could not be fully analyzed',
        technicalSummary: 'Analysis failed',
        stepByStep: ['Manual review required'],
        confidence: 0.1
      },
      
      securityAssessment: {
        riskScore: 50,
        riskLevel: 'MEDIUM',
        riskFactors: ['analysis_failure'],
        securityWarnings: ['Unable to perform complete security analysis']
      },
      
      userWarnings: {
        severity: 'MEDIUM',
        primaryWarning: '⚠️ Unable to analyze transaction - proceed with caution',
        actionRequired: true,
        userFriendlyAdvice: ['Manual review recommended before proceeding']
      }
    };
  }
}

module.exports = new SemanticTransactionDecoder();
