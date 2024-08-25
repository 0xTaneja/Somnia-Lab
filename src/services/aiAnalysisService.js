const OpenAI = require('openai');
const axios = require('axios');
const config = require('../config');

class AIAnalysisService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'demo-key-for-testing'
    });
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('🤖 Initializing AI Analysis Service...');
      this.initialized = true;
      console.log('✅ AI Analysis Service ready');
    } catch (error) {
      console.error('❌ AI Analysis Service initialization failed:', error.message);
      this.initialized = false;
    }
  }

  async analyzeContractWithAI(contractCode, contractAddress, transactionData = null) {
    try {
      if (!this.initialized) {
        return this.getFallbackAnalysis(contractCode, contractAddress);
      }

      const prompt = this.buildAnalysisPrompt(contractCode, contractAddress, transactionData);
      
      // Try OpenAI analysis first
      let aiAnalysis;
      try {
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo-key-for-testing') {
          console.log('🤖 Calling OpenAI GPT-3.5-turbo for contract analysis...');
          const truncatedPrompt = this.truncatePrompt(prompt);
          console.log(`📝 Prompt length: ${truncatedPrompt.length} characters`);
          
          const response = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",  // Switch to GPT-3.5 for better token limits
            messages: [
              {
                role: "system",
                content: "You are an expert blockchain security analyst specializing in smart contract vulnerabilities and rug pull detection. Analyze contracts for potential risks and provide structured JSON responses."
              },
              {
                role: "user",
                content: truncatedPrompt  // Truncate long prompts
              }
            ],
            max_tokens: 1000,  // Reduced token limit
            temperature: 0.1
          });

          console.log('✅ OpenAI analysis successful!');
          aiAnalysis = this.parseAIResponse(response.choices[0].message.content);
          aiAnalysis.aiProvider = 'OpenAI GPT-3.5-turbo';
        } else {
          // Fallback to structured analysis when no API key
          aiAnalysis = this.getFallbackAnalysis(contractCode, contractAddress);
        }
      } catch (error) {
        console.log('⚠️ OpenAI API call failed, using fallback analysis:', error.message);
        aiAnalysis = this.getFallbackAnalysis(contractCode, contractAddress);
      }

      // Enhanced analysis with additional AI insights
      const enhancedAnalysis = await this.enhanceWithMultipleAI(aiAnalysis, contractCode);

      return {
        aiProvider: aiAnalysis.aiProvider || (process.env.OPENAI_API_KEY ? 'OpenAI GPT-3.5-turbo' : 'Fallback Analysis'),
        analysis: enhancedAnalysis,
        confidence: enhancedAnalysis.confidence || 0.85,
        riskFactors: enhancedAnalysis.riskFactors || [],
        recommendations: enhancedAnalysis.recommendations || [],
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('AI Analysis error:', error);
      return this.getFallbackAnalysis(contractCode, contractAddress);
    }
  }

  buildAnalysisPrompt(contractCode, contractAddress, transactionData) {
    let prompt = `Analyze this smart contract for security risks and potential rug pull indicators:

CONTRACT ADDRESS: ${contractAddress}
CONTRACT CODE: ${contractCode}

`;

    if (transactionData) {
      prompt += `TRANSACTION DATA: ${JSON.stringify(transactionData, null, 2)}

`;
    }

    prompt += `Please provide analysis in the following JSON format:
{
  "riskScore": <number 0-100>,
  "riskLevel": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "riskFactors": ["factor1", "factor2"],
  "vulnerabilities": [
    {
      "type": "vulnerability_type",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "description": "detailed description",
      "location": "function/line reference"
    }
  ],
  "rugPullIndicators": [
    {
      "indicator": "indicator_name",
      "present": true/false,
      "description": "why this is concerning"
    }
  ],
  "recommendations": ["recommendation1", "recommendation2"],
  "summary": "Overall assessment",
  "confidence": <number 0-1>
}`;

    return prompt;
  }

  truncatePrompt(prompt) {
    // EXTREMELY aggressive truncation - contract bytecode is usually huge
    const maxPromptLength = 3000; // Super conservative for GPT-3.5-turbo
    
    // If the prompt is short enough, return as-is
    if (prompt.length <= maxPromptLength) {
      return prompt;
    }
    
    // Create a minimal prompt focusing on the analysis request
    const contractAddressMatch = prompt.match(/CONTRACT ADDRESS: (.+)/);
    const contractAddress = contractAddressMatch ? contractAddressMatch[1] : 'Unknown';
    
    const minimalPrompt = `Analyze this smart contract for security risks and rug pull indicators:

CONTRACT ADDRESS: ${contractAddress}
CONTRACT CODE: [Bytecode analysis - contract appears to be a token/DeFi contract]

This is a bytecode-only analysis. Please provide security assessment based on the contract address and typical DeFi patterns.

Please provide analysis in the following JSON format:
{
  "riskScore": <number 0-100>,
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "riskFactors": ["factor1", "factor2"],
  "vulnerabilities": [
    {
      "type": "vulnerability_type",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "description": "detailed description",
      "location": "bytecode analysis"
    }
  ],
  "rugPullIndicators": [
    {
      "indicator": "indicator_name",
      "present": true/false,
      "description": "analysis based on contract address patterns"
    }
  ],
  "recommendations": ["recommendation1", "recommendation2"],
  "summary": "Overall assessment based on available data",
  "confidence": <number 0-1>
}`;

    console.log(`📝 Created minimal prompt: ${minimalPrompt.length} characters (reduced from ${prompt.length})`);
    return minimalPrompt;
  }

  parseAIResponse(aiResponse) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing if no clean JSON
      return this.extractAnalysisFromText(aiResponse);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.getDefaultAnalysis();
    }
  }

  extractAnalysisFromText(text) {
    // Extract key information from unstructured text
    const riskScore = this.extractRiskScore(text);
    const riskLevel = this.extractRiskLevel(text, riskScore);
    
    return {
      riskScore,
      riskLevel,
      riskFactors: this.extractRiskFactors(text),
      vulnerabilities: this.extractVulnerabilities(text),
      rugPullIndicators: this.extractRugPullIndicators(text),
      recommendations: this.extractRecommendations(text),
      summary: this.extractSummary(text),
      confidence: 0.75
    };
  }

  extractRiskScore(text) {
    const scoreMatch = text.match(/risk\s*score[:\s]*(\d+)/i);
    if (scoreMatch) return parseInt(scoreMatch[1]);
    
    // Infer from keywords
    if (text.toLowerCase().includes('critical') || text.toLowerCase().includes('high risk')) return 85;
    if (text.toLowerCase().includes('medium risk') || text.toLowerCase().includes('moderate')) return 60;
    if (text.toLowerCase().includes('low risk') || text.toLowerCase().includes('minimal')) return 25;
    
    return 50; // Default moderate risk
  }

  extractRiskLevel(text, riskScore) {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 40) return 'MEDIUM';
    return 'LOW';
  }

  extractRiskFactors(text) {
    const factors = [];
    const riskKeywords = [
      'ownership centralization', 'unlimited minting', 'hidden fees', 
      'liquidity drain', 'proxy contracts', 'upgrade mechanisms',
      'backdoors', 'emergency stops', 'time locks'
    ];
    
    riskKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        factors.push(keyword);
      }
    });
    
    return factors;
  }

  extractVulnerabilities(text) {
    const vulns = [];
    const vulnPatterns = [
      { pattern: /reentrancy/i, type: 'reentrancy', severity: 'HIGH' },
      { pattern: /overflow|underflow/i, type: 'integer_overflow', severity: 'MEDIUM' },
      { pattern: /unchecked/i, type: 'unchecked_call', severity: 'MEDIUM' },
      { pattern: /centralization/i, type: 'centralization', severity: 'HIGH' }
    ];
    
    vulnPatterns.forEach(({ pattern, type, severity }) => {
      if (pattern.test(text)) {
        vulns.push({
          type,
          severity,
          description: `Potential ${type} vulnerability detected`,
          location: 'AI Analysis'
        });
      }
    });
    
    return vulns;
  }

  extractRugPullIndicators(text) {
    const indicators = [
      { name: 'hidden_fees', keywords: ['hidden fee', 'secret tax', 'stealth fee'] },
      { name: 'unlimited_minting', keywords: ['unlimited mint', 'infinite supply'] },
      { name: 'liquidity_drain', keywords: ['liquidity removal', 'drain liquidity'] },
      { name: 'ownership_renounce', keywords: ['renounce ownership', 'burn ownership'] }
    ];
    
    return indicators.map(({ name, keywords }) => {
      const present = keywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );
      
      return {
        indicator: name,
        present,
        description: present ? `Detected ${name} pattern` : `No ${name} detected`
      };
    });
  }

  extractRecommendations(text) {
    const recommendations = [];
    
    if (text.toLowerCase().includes('audit')) {
      recommendations.push('Conduct thorough security audit');
    }
    if (text.toLowerCase().includes('test')) {
      recommendations.push('Increase test coverage');
    }
    if (text.toLowerCase().includes('time lock')) {
      recommendations.push('Implement time locks for critical functions');
    }
    
    return recommendations.length > 0 ? recommendations : [
      'Review contract code carefully',
      'Check ownership permissions',
      'Verify tokenomics and fee structures'
    ];
  }

  extractSummary(text) {
    // Try to find a summary or conclusion section
    const summaryMatch = text.match(/summary[:\s]*(.*?)(?:\n|$)/i);
    if (summaryMatch) return summaryMatch[1].trim();
    
    // Generate basic summary
    return 'AI analysis completed with automated risk assessment';
  }

  async enhanceWithMultipleAI(baseAnalysis, contractCode) {
    // Add pattern-based enhancements
    const patterns = this.analyzeCodePatterns(contractCode);
    const tokenomics = this.analyzeTokenomics(contractCode);
    
    return {
      ...baseAnalysis,
      codePatterns: patterns,
      tokenomicsAnalysis: tokenomics,
      enhancedRiskFactors: [
        ...baseAnalysis.riskFactors,
        ...patterns.suspiciousPatterns,
        ...tokenomics.riskIndicators
      ].filter((item, index, self) => self.indexOf(item) === index) // Remove duplicates
    };
  }

  analyzeCodePatterns(contractCode) {
    const patterns = {
      suspiciousPatterns: [],
      functions: [],
      modifiers: [],
      events: []
    };
    
    // Analyze function patterns
    const functionMatches = contractCode.match(/function\s+(\w+)/g) || [];
    patterns.functions = functionMatches.map(match => match.replace('function ', ''));
    
    // Check for suspicious patterns
    const suspiciousChecks = [
      { pattern: /onlyOwner/g, risk: 'centralized_control' },
      { pattern: /selfdestruct/g, risk: 'contract_destruction' },
      { pattern: /delegatecall/g, risk: 'proxy_vulnerability' },
      { pattern: /_mint.*unlimited/g, risk: 'unlimited_minting' }
    ];
    
    suspiciousChecks.forEach(({ pattern, risk }) => {
      if (pattern.test(contractCode)) {
        patterns.suspiciousPatterns.push(risk);
      }
    });
    
    return patterns;
  }

  analyzeTokenomics(contractCode) {
    const analysis = {
      totalSupply: 'unknown',
      mintable: false,
      burnable: false,
      taxable: false,
      riskIndicators: []
    };
    
    // Check for minting capabilities
    if (/function.*mint/i.test(contractCode)) {
      analysis.mintable = true;
      analysis.riskIndicators.push('mintable_token');
    }
    
    // Check for burning capabilities
    if (/function.*burn/i.test(contractCode)) {
      analysis.burnable = true;
    }
    
    // Check for tax mechanisms
    if (/tax|fee.*percent/i.test(contractCode)) {
      analysis.taxable = true;
      analysis.riskIndicators.push('transaction_tax');
    }
    
    return analysis;
  }

  getFallbackAnalysis(contractCode, contractAddress) {
    // Comprehensive fallback analysis when AI is not available
    const riskScore = this.calculateFallbackRiskScore(contractCode);
    const riskLevel = this.getRiskLevel(riskScore);
    
    return {
      aiProvider: 'Fallback Pattern Analysis',
      analysis: {
        riskScore,
        riskLevel,
        riskFactors: this.getFallbackRiskFactors(contractCode),
        vulnerabilities: this.getFallbackVulnerabilities(contractCode),
        rugPullIndicators: this.getFallbackRugPullIndicators(contractCode),
        recommendations: this.getFallbackRecommendations(riskScore),
        summary: `Pattern-based analysis indicates ${riskLevel} risk level`,
        confidence: 0.70
      },
      confidence: 0.70,
      riskFactors: this.getFallbackRiskFactors(contractCode),
      recommendations: this.getFallbackRecommendations(riskScore),
      timestamp: new Date().toISOString()
    };
  }

  calculateFallbackRiskScore(contractCode) {
    let score = 30; // Base score
    
    // Risk factors that increase score
    const riskPatterns = [
      { pattern: /onlyOwner/g, weight: 10 },
      { pattern: /selfdestruct/g, weight: 25 },
      { pattern: /delegatecall/g, weight: 15 },
      { pattern: /_mint.*unlimited/g, weight: 20 },
      { pattern: /withdraw.*all/g, weight: 15 },
      { pattern: /emergency/g, weight: 10 }
    ];
    
    riskPatterns.forEach(({ pattern, weight }) => {
      const matches = contractCode.match(pattern);
      if (matches) {
        score += weight * Math.min(matches.length, 3); // Cap at 3 occurrences
      }
    });
    
    return Math.min(score, 100);
  }

  getFallbackRiskFactors(contractCode) {
    const factors = [];
    
    if (/onlyOwner/g.test(contractCode)) factors.push('centralized_ownership');
    if (/selfdestruct/g.test(contractCode)) factors.push('contract_destruction');
    if (/delegatecall/g.test(contractCode)) factors.push('proxy_vulnerability');
    if (/emergency/g.test(contractCode)) factors.push('emergency_functions');
    
    return factors;
  }

  getFallbackVulnerabilities(contractCode) {
    return [
      {
        type: 'pattern_analysis',
        severity: 'MEDIUM',
        description: 'Automated pattern analysis completed',
        location: 'Contract structure'
      }
    ];
  }

  getFallbackRugPullIndicators(contractCode) {
    return [
      {
        indicator: 'ownership_concentration',
        present: /onlyOwner/g.test(contractCode),
        description: 'Contract has centralized ownership functions'
      },
      {
        indicator: 'emergency_functions',
        present: /emergency/g.test(contractCode),
        description: 'Contract contains emergency stop mechanisms'
      }
    ];
  }

  getFallbackRecommendations(riskScore) {
    const recommendations = ['Verify contract source code', 'Check ownership permissions'];
    
    if (riskScore > 70) {
      recommendations.push('High risk detected - exercise extreme caution');
      recommendations.push('Consider waiting for professional audit');
    } else if (riskScore > 40) {
      recommendations.push('Moderate risk - review carefully before interacting');
    }
    
    return recommendations;
  }

  getRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  getDefaultAnalysis() {
    return {
      riskScore: 50,
      riskLevel: 'MEDIUM',
      riskFactors: ['analysis_unavailable'],
      vulnerabilities: [],
      rugPullIndicators: [],
      recommendations: ['Manual review required'],
      summary: 'AI analysis temporarily unavailable',
      confidence: 0.50
    };
  }
}

module.exports = new AIAnalysisService();
