const axios = require('axios');
const ethers = require('ethers');
const config = require('../config');

class AdvancedThreatMonitor {
  constructor() {
    this.initialized = false;
    this.threatPatterns = new Map();
    this.suspiciousAddresses = new Set();
    this.alertRules = [];
    this.threatIntelligence = new Map();
    this.transactionPatterns = new Map();
    this.falsePositiveFilters = [];
  }

  async initialize() {
    try {
      console.log('🔍 Initializing Advanced Threat Monitor...');
      
      // Initialize threat detection patterns
      await this.loadThreatPatterns();
      
      // Initialize external threat intelligence feeds
      await this.initializeThreatIntelligence();
      
      // Initialize false positive reduction algorithms
      this.initializeFalsePositiveFilters();
      
      // Initialize alert rules
      this.initializeAlertRules();
      
      this.initialized = true;
      console.log('✅ Advanced Threat Monitor ready with SecureMon algorithms!');
      
    } catch (error) {
      console.error('❌ Advanced Threat Monitor initialization failed:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Main threat analysis function - Enhanced with SecureMon algorithms
   */
  async analyzeThreat(transactionData, semanticAnalysis = null) {
    try {
      if (!this.initialized) {
        return this.getFallbackThreatAnalysis();
      }

      console.log(`🔍 Running advanced threat analysis for tx: ${transactionData.hash?.substring(0, 10)}...`);

      const threatAnalysis = {
        threatLevel: 'LOW',
        threatScore: 0,
        detectedPatterns: [],
        externalThreatIntel: {},
        falsePositiveReduction: {},
        alertTriggers: [],
        riskFactors: [],
        mitigationRecommendations: [],
        confidence: 0.8
      };

      // 1. Pattern Recognition Analysis (SecureMon Algorithm)
      const patternAnalysis = await this.analyzeTransactionPatterns(transactionData);
      threatAnalysis.detectedPatterns = patternAnalysis.patterns;
      threatAnalysis.threatScore += patternAnalysis.score;

      // 2. External Threat Intelligence (Forta, Airstack integration)
      const threatIntel = await this.checkExternalThreatIntelligence(transactionData);
      threatAnalysis.externalThreatIntel = threatIntel;
      threatAnalysis.threatScore += threatIntel.score;

      // 3. Address Reputation Analysis
      const addressAnalysis = await this.analyzeAddressReputation(transactionData);
      threatAnalysis.riskFactors.push(...addressAnalysis.riskFactors);
      threatAnalysis.threatScore += addressAnalysis.score;

      // 4. Function Call Analysis (SecureMon Pattern)
      const functionAnalysis = this.analyzeFunctionCalls(transactionData, semanticAnalysis);
      threatAnalysis.detectedPatterns.push(...functionAnalysis.patterns);
      threatAnalysis.threatScore += functionAnalysis.score;

      // 5. Value and Gas Analysis
      const valueAnalysis = this.analyzeValuePatterns(transactionData);
      threatAnalysis.riskFactors.push(...valueAnalysis.riskFactors);
      threatAnalysis.threatScore += valueAnalysis.score;

      // 6. False Positive Reduction (SecureMon Algorithm)
      const fpReduction = this.applyFalsePositiveReduction(threatAnalysis, transactionData);
      threatAnalysis.falsePositiveReduction = fpReduction;
      threatAnalysis.threatScore = Math.max(0, threatAnalysis.threatScore - fpReduction.reductionAmount);

      // 7. Alert Rule Evaluation
      const alertEvaluation = this.evaluateAlertRules(threatAnalysis, transactionData);
      threatAnalysis.alertTriggers = alertEvaluation.triggers;

      // 8. Calculate final threat level
      threatAnalysis.threatLevel = this.calculateThreatLevel(threatAnalysis.threatScore);
      threatAnalysis.mitigationRecommendations = this.generateMitigationRecommendations(threatAnalysis);

      console.log(`✅ Advanced threat analysis completed: ${threatAnalysis.threatLevel} (Score: ${threatAnalysis.threatScore})`);
      
      return threatAnalysis;

    } catch (error) {
      console.error('🚨 Advanced threat analysis error:', error);
      return this.getFallbackThreatAnalysis();
    }
  }

  /**
   * Pattern Recognition Analysis - Based on SecureMon algorithms
   */
  async analyzeTransactionPatterns(transactionData) {
    const patterns = [];
    let score = 0;

    // MEV Bot Detection Pattern
    if (this.detectMEVBotPattern(transactionData)) {
      patterns.push({
        type: 'mev_bot_activity',
        severity: 'MEDIUM',
        description: 'Transaction exhibits MEV bot characteristics',
        confidence: 0.75
      });
      score += 15;
    }

    // Flash Loan Attack Pattern
    if (this.detectFlashLoanPattern(transactionData)) {
      patterns.push({
        type: 'flash_loan_attack',
        severity: 'HIGH',
        description: 'Potential flash loan exploit detected',
        confidence: 0.85
      });
      score += 35;
    }

    // Sandwich Attack Pattern
    if (this.detectSandwichAttack(transactionData)) {
      patterns.push({
        type: 'sandwich_attack',
        severity: 'HIGH',
        description: 'Sandwich attack pattern detected',
        confidence: 0.80
      });
      score += 30;
    }

    // Rug Pull Pattern
    if (this.detectRugPullPattern(transactionData)) {
      patterns.push({
        type: 'rug_pull_attempt',
        severity: 'CRITICAL',
        description: 'Potential rug pull operation detected',
        confidence: 0.90
      });
      score += 50;
    }

    // Phishing Pattern
    if (this.detectPhishingPattern(transactionData)) {
      patterns.push({
        type: 'phishing_attempt',
        severity: 'HIGH',
        description: 'Phishing transaction pattern detected',
        confidence: 0.70
      });
      score += 25;
    }

    return { patterns, score };
  }

  /**
   * External Threat Intelligence - Forta, Airstack integration
   */
  async checkExternalThreatIntelligence(transactionData) {
    const threatIntel = {
      forta: { alerts: [], riskScore: 0 },
      airstack: { identity: null, reputation: 'unknown' },
      scamDetector: { isScam: false, confidence: 0 },
      score: 0
    };

    try {
      // Forta Attack Detector Feed (from SecureMon)
      const fortaAlerts = await this.checkFortaFeed(transactionData.to);
      if (fortaAlerts.length > 0) {
        threatIntel.forta.alerts = fortaAlerts;
        threatIntel.forta.riskScore = fortaAlerts.length * 10;
        threatIntel.score += threatIntel.forta.riskScore;
      }

      // Airstack Identity Check (from SecureMon)
      const airstackData = await this.checkAirstackIdentity(transactionData.from);
      if (airstackData && airstackData.identity) {
        threatIntel.airstack = airstackData;
        // Verified identity reduces risk
        threatIntel.score -= 5;
      }

      // Additional threat intel sources
      const scamCheck = await this.checkScamDatabase(transactionData.to);
      if (scamCheck.isScam) {
        threatIntel.scamDetector = scamCheck;
        threatIntel.score += 40;
      }

    } catch (error) {
      console.log(`⚠️ Threat intelligence check failed: ${error.message}`);
    }

    return threatIntel;
  }

  /**
   * Address Reputation Analysis
   */
  async analyzeAddressReputation(transactionData) {
    const riskFactors = [];
    let score = 0;

    // Check if address is in our suspicious list
    if (this.suspiciousAddresses.has(transactionData.from)) {
      riskFactors.push('known_suspicious_sender');
      score += 30;
    }

    if (this.suspiciousAddresses.has(transactionData.to)) {
      riskFactors.push('known_suspicious_recipient');
      score += 35;
    }

    // New address analysis
    if (this.isNewAddress(transactionData.from)) {
      riskFactors.push('new_sender_address');
      score += 5;
    }

    // High-frequency address (potential bot)
    if (this.isHighFrequencyAddress(transactionData.from)) {
      riskFactors.push('high_frequency_sender');
      score += 10;
    }

    // Contract analysis
    if (await this.isContract(transactionData.to)) {
      const contractAge = await this.getContractAge(transactionData.to);
      if (contractAge < 7) { // Less than 7 days old
        riskFactors.push('new_contract_interaction');
        score += 15;
      }
    }

    return { riskFactors, score };
  }

  /**
   * Function Call Analysis - SecureMon pattern
   */
  analyzeFunctionCalls(transactionData, semanticAnalysis) {
    const patterns = [];
    let score = 0;

    if (!semanticAnalysis) return { patterns, score };

    const functionName = semanticAnalysis.transactionIntent?.functionName;
    
    // Dangerous function detection
    const dangerousFunctions = [
      'transfer', 'transferFrom', 'approve', 'swapExactTokensForTokens',
      'removeLiquidity', 'withdraw', 'emergencyWithdraw'
    ];

    if (functionName && dangerousFunctions.includes(functionName)) {
      patterns.push({
        type: 'dangerous_function_call',
        severity: 'MEDIUM',
        description: `Calling potentially risky function: ${functionName}`,
        confidence: 0.60
      });
      score += 10;
    }

    // Approval analysis
    if (functionName === 'approve') {
      patterns.push({
        type: 'token_approval',
        severity: 'HIGH',
        description: 'Token approval detected - high risk operation',
        confidence: 0.85
      });
      score += 25;
    }

    return { patterns, score };
  }

  /**
   * Value and Gas Analysis
   */
  analyzeValuePatterns(transactionData) {
    const riskFactors = [];
    let score = 0;

    try {
      const value = parseFloat(ethers.formatEther(transactionData.value || '0'));
      const gasPrice = parseInt(transactionData.gasPrice || '0', 16);
      const gasUsed = parseInt(transactionData.gasUsed || transactionData.gas || '0', 16);

      // High value transaction
      if (value > 10) {
        riskFactors.push('high_value_transaction');
        score += 15;
      }

      // Extremely high value (potential whale or institution)
      if (value > 100) {
        riskFactors.push('extremely_high_value');
        score += 25;
      }

      // Unusual gas price (potential priority manipulation)
      if (gasPrice > 50000000000) { // > 50 gwei
        riskFactors.push('high_gas_price');
        score += 5;
      }

      // Complex transaction (high gas usage)
      if (gasUsed > 500000) {
        riskFactors.push('complex_transaction');
        score += 5;
      }

      // Zero value transactions can be suspicious
      if (value === 0 && transactionData.input && transactionData.input !== '0x') {
        riskFactors.push('zero_value_contract_call');
        score += 3;
      }

    } catch (error) {
      console.log(`⚠️ Value analysis error: ${error.message}`);
    }

    return { riskFactors, score };
  }

  /**
   * False Positive Reduction - SecureMon Algorithm
   */
  applyFalsePositiveReduction(threatAnalysis, transactionData) {
    const reduction = {
      applied: [],
      reductionAmount: 0,
      confidence: 0.8
    };

    // Known good addresses reduction
    if (this.isKnownGoodAddress(transactionData.to)) {
      reduction.applied.push('known_good_recipient');
      reduction.reductionAmount += 15;
    }

    // Standard DeFi operations reduction
    if (this.isStandardDeFiOperation(transactionData)) {
      reduction.applied.push('standard_defi_operation');
      reduction.reductionAmount += 10;
    }

    // Low risk time patterns
    if (this.isLowRiskTimePattern()) {
      reduction.applied.push('low_risk_time_pattern');
      reduction.reductionAmount += 5;
    }

    // Historical false positive learning
    if (this.hasHistoricalFalsePositive(threatAnalysis.detectedPatterns)) {
      reduction.applied.push('historical_false_positive');
      reduction.reductionAmount += 8;
    }

    return reduction;
  }

  /**
   * Alert Rule Evaluation
   */
  evaluateAlertRules(threatAnalysis, transactionData) {
    const triggers = [];

    for (const rule of this.alertRules) {
      if (this.evaluateCondition(rule.condition, threatAnalysis, transactionData)) {
        triggers.push({
          ruleId: rule.id,
          name: rule.name,
          severity: rule.severity,
          message: rule.message,
          actions: rule.actions
        });
      }
    }

    return { triggers };
  }

  // Pattern Detection Methods

  detectMEVBotPattern(transactionData) {
    // MEV bots typically have high gas prices and specific function calls
    const gasPrice = parseInt(transactionData.gasPrice || '0', 16);
    return gasPrice > 100000000000; // > 100 gwei
  }

  detectFlashLoanPattern(transactionData) {
    // Flash loans typically have large amounts and complex call data
    const value = parseFloat(ethers.formatEther(transactionData.value || '0'));
    const hasComplexCallData = transactionData.input && transactionData.input.length > 200;
    return value > 50 && hasComplexCallData;
  }

  detectSandwichAttack(transactionData) {
    // Detect based on transaction timing and value patterns
    // This is a simplified check - real implementation would be more sophisticated
    return this.transactionPatterns.has(transactionData.from) && 
           this.transactionPatterns.get(transactionData.from).count > 3;
  }

  detectRugPullPattern(transactionData) {
    // Detect potential rug pulls based on large withdrawals from liquidity pools
    const value = parseFloat(ethers.formatEther(transactionData.value || '0'));
    const suspiciousRecipient = this.suspiciousAddresses.has(transactionData.to);
    return value > 20 && suspiciousRecipient;
  }

  detectPhishingPattern(transactionData) {
    // Detect phishing based on address similarity to known contracts
    return this.isSimilarToKnownContract(transactionData.to);
  }

  // Threat Intelligence Methods

  async checkFortaFeed(address) {
    try {
      // Simplified Forta check (based on SecureMon implementation)
      const response = await axios.post('https://explorer-api.forta.network/graphql', {
        query: `query RetrieveAlerts($getListInput: GetAlertsInput) {
          getList(input: $getListInput) {
            alerts {
              hash
              description
              severity
              name
            }
          }
        }`,
        variables: {
          getListInput: {
            addresses: [address],
            limit: 5
          }
        }
      }, { timeout: 3000 });

      return response.data?.data?.getList?.alerts || [];
    } catch (error) {
      console.log(`⚠️ Forta check failed: ${error.message}`);
      return [];
    }
  }

  async checkAirstackIdentity(address) {
    try {
      // Simplified Airstack check (based on SecureMon implementation)
      if (!process.env.AIRSTACK_API_KEY) return null;

      const response = await axios.post('https://api.airstack.xyz/gql', {
        query: `query MyQuery {
          Wallet(input: {identity: "${address}", blockchain: ethereum}) {
            identity
            socials {
              dappName
              profileName
            }
          }
        }`
      }, {
        headers: {
          'authorization': process.env.AIRSTACK_API_KEY,
          'content-type': 'application/json'
        },
        timeout: 3000
      });

      return response.data?.data?.Wallet || null;
    } catch (error) {
      console.log(`⚠️ Airstack check failed: ${error.message}`);
      return null;
    }
  }

  async checkScamDatabase(address) {
    // Simplified scam database check
    const knownScamAddresses = [
      '0x0000000000000000000000000000000000000000',
      // Add more known scam addresses
    ];

    return {
      isScam: knownScamAddresses.includes(address.toLowerCase()),
      confidence: 0.95
    };
  }

  // Helper Methods

  calculateThreatLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'MINIMAL';
  }

  generateMitigationRecommendations(threatAnalysis) {
    const recommendations = [];

    if (threatAnalysis.threatLevel === 'CRITICAL') {
      recommendations.push('🚨 BLOCK TRANSACTION IMMEDIATELY');
      recommendations.push('🔒 Freeze associated accounts');
      recommendations.push('📞 Contact security team');
    } else if (threatAnalysis.threatLevel === 'HIGH') {
      recommendations.push('⚠️ Flag for manual review');
      recommendations.push('🔍 Increase monitoring frequency');
      recommendations.push('📝 Document threat patterns');
    } else if (threatAnalysis.threatLevel === 'MEDIUM') {
      recommendations.push('👁️ Monitor closely');
      recommendations.push('📊 Track pattern development');
    }

    return recommendations;
  }

  // Initialization Methods

  async loadThreatPatterns() {
    // Load known threat patterns
    this.threatPatterns.set('rug_pull', {
      indicators: ['large_withdrawal', 'liquidity_removal', 'owner_exit'],
      severity: 'CRITICAL'
    });

    this.threatPatterns.set('flash_loan_attack', {
      indicators: ['large_loan', 'arbitrage', 'price_manipulation'],
      severity: 'HIGH'
    });

    console.log(`📊 Loaded ${this.threatPatterns.size} threat patterns`);
  }

  async initializeThreatIntelligence() {
    // Initialize threat intelligence feeds
    console.log('🌐 Initializing threat intelligence feeds...');
    
    // Load suspicious addresses
    this.suspiciousAddresses.add('0x0000000000000000000000000000000000000000');
    
    console.log(`🚫 Loaded ${this.suspiciousAddresses.size} suspicious addresses`);
  }

  initializeFalsePositiveFilters() {
    this.falsePositiveFilters = [
      {
        name: 'known_good_addresses',
        addresses: [
          '0xA0b86a33E6441A30B78Db73d04Bdf70a52CdEd22', // Example good address
        ]
      },
      {
        name: 'standard_defi_operations',
        functions: ['transfer', 'approve', 'swap']
      }
    ];

    console.log(`🛡️ Initialized ${this.falsePositiveFilters.length} false positive filters`);
  }

  initializeAlertRules() {
    this.alertRules = [
      {
        id: 'high_value_alert',
        name: 'High Value Transaction Alert',
        condition: 'threatScore > 50',
        severity: 'HIGH',
        message: 'High-risk transaction detected',
        actions: ['notify', 'log']
      },
      {
        id: 'critical_threat_alert',
        name: 'Critical Threat Alert',
        condition: 'threatLevel === "CRITICAL"',
        severity: 'CRITICAL',
        message: 'Critical threat detected - immediate action required',
        actions: ['block', 'notify', 'escalate']
      }
    ];

    console.log(`⚡ Initialized ${this.alertRules.size} alert rules`);
  }

  // Utility Methods

  isNewAddress(address) {
    // Simplified new address check
    return !this.transactionPatterns.has(address);
  }

  isHighFrequencyAddress(address) {
    const pattern = this.transactionPatterns.get(address);
    return pattern && pattern.count > 10;
  }

  async isContract(address) {
    // Simplified contract check
    return address && address.length === 42 && !address.endsWith('000');
  }

  async getContractAge(address) {
    // Simplified contract age check
    return 30; // Default to 30 days
  }

  isKnownGoodAddress(address) {
    const goodAddresses = this.falsePositiveFilters.find(f => f.name === 'known_good_addresses');
    return goodAddresses && goodAddresses.addresses.includes(address);
  }

  isStandardDeFiOperation(transactionData) {
    // Simplified DeFi operation check
    return transactionData.input && transactionData.input.includes('transfer');
  }

  isLowRiskTimePattern() {
    // Lower risk during normal business hours
    const hour = new Date().getHours();
    return hour >= 9 && hour <= 17;
  }

  hasHistoricalFalsePositive(patterns) {
    // Simplified historical check
    return patterns.some(p => p.type === 'mev_bot_activity');
  }

  isSimilarToKnownContract(address) {
    // Simplified similarity check
    return false;
  }

  evaluateCondition(condition, threatAnalysis, transactionData) {
    try {
      // Simplified condition evaluation (SecureMon uses simple_eval)
      if (condition.includes('threatScore')) {
        const threshold = parseInt(condition.match(/\d+/)[0]);
        return threatAnalysis.threatScore > threshold;
      }
      if (condition.includes('threatLevel')) {
        const level = condition.match(/"([^"]+)"/)[1];
        return threatAnalysis.threatLevel === level;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  getFallbackThreatAnalysis() {
    return {
      threatLevel: 'UNKNOWN',
      threatScore: 25,
      detectedPatterns: [],
      externalThreatIntel: {},
      falsePositiveReduction: {},
      alertTriggers: [],
      riskFactors: ['analysis_unavailable'],
      mitigationRecommendations: ['Manual review recommended'],
      confidence: 0.3
    };
  }
}

module.exports = new AdvancedThreatMonitor();
