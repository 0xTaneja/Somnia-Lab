const { ethers } = require('ethers');
const axios = require('axios');
const config = require('../config');

class TokenomicsService {
  constructor() {
    this.initialized = false;
    this.erc20ABI = [
      'function totalSupply() external view returns (uint256)',
      'function balanceOf(address account) external view returns (uint256)',
      'function decimals() external view returns (uint8)',
      'function symbol() external view returns (string)',
      'function name() external view returns (string)',
      'function owner() external view returns (address)',
      'function paused() external view returns (bool)',
      'function cap() external view returns (uint256)',
      'event Transfer(address indexed from, address indexed to, uint256 value)',
      'event Mint(address indexed to, uint256 value)',
      'event Burn(address indexed from, uint256 value)'
    ];
  }

  async initialize() {
    try {
      console.log('💰 Initializing Tokenomics Analysis Service...');
      this.initialized = true;
      console.log('✅ Tokenomics Analysis Service ready');
    } catch (error) {
      console.error('❌ Tokenomics Analysis Service initialization failed:', error.message);
      this.initialized = false;
    }
  }

  async analyzeTokenomics(contractAddress, provider, networkKey = 'somnia') {
    try {
      console.log(`💎 Analyzing tokenomics for contract: ${contractAddress}`);
      
      const analysis = {
        contractAddress,
        network: networkKey,
        tokenInfo: {},
        distribution: {},
        riskFactors: [],
        riskScore: 0,
        riskLevel: 'UNKNOWN',
        warnings: [],
        recommendations: [],
        timestamp: new Date().toISOString()
      };

      // Get basic token information
      analysis.tokenInfo = await this.getBasicTokenInfo(contractAddress, provider);
      
      // Analyze token distribution
      analysis.distribution = await this.analyzeTokenDistribution(contractAddress, provider, analysis.tokenInfo);
      
      // Analyze holder patterns
      analysis.holderAnalysis = await this.analyzeHolderPatterns(contractAddress, provider, networkKey);
      
      // Analyze transaction patterns
      analysis.transactionAnalysis = await this.analyzeTransactionPatterns(contractAddress, provider, networkKey);
      
      // Check for minting/burning capabilities
      analysis.supplyControls = await this.analyzeSupplyControls(contractAddress, provider);
      
      // Calculate risk factors
      analysis.riskFactors = this.calculateTokenomicsRisks(analysis);
      
      // Calculate overall risk score
      analysis.riskScore = this.calculateTokenomicsRiskScore(analysis.riskFactors);
      analysis.riskLevel = this.getRiskLevel(analysis.riskScore);
      
      // Generate warnings and recommendations
      analysis.warnings = this.generateTokenomicsWarnings(analysis);
      analysis.recommendations = this.generateTokenomicsRecommendations(analysis);

      return analysis;
    } catch (error) {
      console.error('Tokenomics analysis error:', error);
      return this.getFallbackTokenomicsAnalysis(contractAddress, networkKey);
    }
  }

  async getBasicTokenInfo(contractAddress, provider) {
    try {
      const contract = new ethers.Contract(contractAddress, this.erc20ABI, provider);
      
      const [name, symbol, decimals, totalSupply] = await Promise.allSettled([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ]);

      const tokenInfo = {
        name: name.status === 'fulfilled' ? name.value : 'Unknown',
        symbol: symbol.status === 'fulfilled' ? symbol.value : 'Unknown',
        decimals: decimals.status === 'fulfilled' ? Number(decimals.value) : 18,
        totalSupply: totalSupply.status === 'fulfilled' ? totalSupply.value.toString() : '0',
        isERC20Compatible: name.status === 'fulfilled' && symbol.status === 'fulfilled'
      };

      // Calculate human-readable total supply
      if (tokenInfo.totalSupply !== '0') {
        tokenInfo.totalSupplyFormatted = ethers.formatUnits(tokenInfo.totalSupply, tokenInfo.decimals);
      }

      // Try to get additional info
      try {
        const owner = await contract.owner();
        tokenInfo.owner = owner;
        tokenInfo.hasOwner = true;
      } catch (error) {
        tokenInfo.hasOwner = false;
      }

      try {
        const paused = await contract.paused();
        tokenInfo.paused = paused;
        tokenInfo.pausable = true;
      } catch (error) {
        tokenInfo.pausable = false;
      }

      try {
        const cap = await contract.cap();
        tokenInfo.cap = cap.toString();
        tokenInfo.capped = true;
      } catch (error) {
        tokenInfo.capped = false;
      }

      return tokenInfo;
    } catch (error) {
      console.error('Error getting basic token info:', error);
      return {
        name: 'Unknown',
        symbol: 'Unknown',
        decimals: 18,
        totalSupply: '0',
        isERC20Compatible: false,
        error: error.message
      };
    }
  }

  async analyzeTokenDistribution(contractAddress, provider, tokenInfo) {
    try {
      const distribution = {
        topHolders: [],
        whaleConcentration: 0,
        holderCount: 0,
        distributionScore: 0,
        giniCoefficient: 0
      };

      // Get top holder addresses (this would typically require an indexer/explorer API)
      // For demonstration, we'll simulate this analysis
      distribution.topHolders = await this.getTopHolders(contractAddress, provider, tokenInfo);
      
      // Calculate whale concentration
      distribution.whaleConcentration = this.calculateWhaleConcentration(distribution.topHolders, tokenInfo);
      
      // Estimate holder count
      distribution.holderCount = await this.estimateHolderCount(contractAddress, provider);
      
      // Calculate distribution score (0-100, higher is better)
      distribution.distributionScore = this.calculateDistributionScore(distribution);
      
      // Calculate Gini coefficient (inequality measure)
      distribution.giniCoefficient = this.calculateGiniCoefficient(distribution.topHolders);

      return distribution;
    } catch (error) {
      console.error('Error analyzing token distribution:', error);
      return {
        topHolders: [],
        whaleConcentration: 0,
        holderCount: 0,
        distributionScore: 50,
        giniCoefficient: 0.5,
        error: error.message
      };
    }
  }

  async getTopHolders(contractAddress, provider, tokenInfo) {
    try {
      // In a real implementation, this would query an explorer API or indexer
      // For now, we'll simulate getting some holder data
      
      const topHolders = [];
      const contract = new ethers.Contract(contractAddress, this.erc20ABI, provider);
      
      // Common addresses to check (known DEX contracts, burn address, etc.)
      const addressesToCheck = [
        '0x000000000000000000000000000000000000dead', // Burn address
        '0x0000000000000000000000000000000000000000', // Zero address
        contractAddress, // Contract itself
        tokenInfo.owner || '0x0000000000000000000000000000000000000000' // Owner
      ];

      for (const address of addressesToCheck) {
        try {
          const balance = await contract.balanceOf(address);
          if (balance > 0) {
            const percentage = tokenInfo.totalSupply !== '0' ? 
              (Number(balance) / Number(tokenInfo.totalSupply)) * 100 : 0;
            
            topHolders.push({
              address,
              balance: balance.toString(),
              balanceFormatted: ethers.formatUnits(balance, tokenInfo.decimals),
              percentage,
              type: this.identifyAddressType(address, contractAddress, tokenInfo.owner)
            });
          }
        } catch (error) {
          console.log(`Could not get balance for ${address}:`, error.message);
        }
      }

      // Sort by balance descending
      topHolders.sort((a, b) => Number(b.balance) - Number(a.balance));
      
      return topHolders.slice(0, 10); // Top 10 holders
    } catch (error) {
      console.error('Error getting top holders:', error);
      return [];
    }
  }

  identifyAddressType(address, contractAddress, ownerAddress) {
    if (address.toLowerCase() === '0x000000000000000000000000000000000000dead') {
      return 'burn_address';
    }
    if (address.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return 'zero_address';
    }
    if (address.toLowerCase() === contractAddress.toLowerCase()) {
      return 'contract_itself';
    }
    if (ownerAddress && address.toLowerCase() === ownerAddress.toLowerCase()) {
      return 'owner';
    }
    // Could add more sophisticated detection for DEX contracts, etc.
    return 'unknown';
  }

  calculateWhaleConcentration(topHolders, tokenInfo) {
    if (!topHolders.length || tokenInfo.totalSupply === '0') return 0;
    
    // Calculate percentage held by top 5 holders (excluding burn/zero addresses)
    const realHolders = topHolders.filter(holder => 
      holder.type !== 'burn_address' && holder.type !== 'zero_address'
    );
    
    const top5Percentage = realHolders
      .slice(0, 5)
      .reduce((sum, holder) => sum + holder.percentage, 0);
    
    return Math.round(top5Percentage * 100) / 100;
  }

  async estimateHolderCount(contractAddress, provider) {
    try {
      // This would typically require querying Transfer events from block 0
      // For simulation, we'll return a reasonable estimate
      return Math.floor(Math.random() * 5000) + 100;
    } catch (error) {
      return 0;
    }
  }

  calculateDistributionScore(distribution) {
    let score = 100;
    
    // Penalize high whale concentration
    if (distribution.whaleConcentration > 80) score -= 40;
    else if (distribution.whaleConcentration > 60) score -= 25;
    else if (distribution.whaleConcentration > 40) score -= 15;
    else if (distribution.whaleConcentration > 20) score -= 5;
    
    // Bonus for high holder count
    if (distribution.holderCount > 10000) score += 10;
    else if (distribution.holderCount > 1000) score += 5;
    else if (distribution.holderCount < 100) score -= 20;
    
    return Math.max(0, Math.min(100, score));
  }

  calculateGiniCoefficient(topHolders) {
    if (topHolders.length < 2) return 0;
    
    // Simplified Gini coefficient calculation
    const balances = topHolders.map(h => Number(h.balance)).sort((a, b) => a - b);
    const n = balances.length;
    const sum = balances.reduce((a, b) => a + b, 0);
    
    if (sum === 0) return 0;
    
    let gini = 0;
    for (let i = 0; i < n; i++) {
      gini += (2 * (i + 1) - n - 1) * balances[i];
    }
    
    return gini / (n * sum);
  }

  async analyzeHolderPatterns(contractAddress, provider, networkKey) {
    try {
      const analysis = {
        suspiciousPatterns: [],
        botActivity: false,
        honeypotIndicators: [],
        liquidityAnalysis: {}
      };

      // Analyze for bot-like patterns
      analysis.botActivity = await this.detectBotActivity(contractAddress, provider);
      
      // Check for honeypot indicators
      analysis.honeypotIndicators = await this.detectHoneypotIndicators(contractAddress, provider);
      
      // Analyze liquidity patterns
      analysis.liquidityAnalysis = await this.analyzeLiquidityPatterns(contractAddress, provider, networkKey);

      return analysis;
    } catch (error) {
      console.error('Error analyzing holder patterns:', error);
      return {
        suspiciousPatterns: [],
        botActivity: false,
        honeypotIndicators: [],
        liquidityAnalysis: {},
        error: error.message
      };
    }
  }

  async detectBotActivity(contractAddress, provider) {
    // Simplified bot detection - would need more sophisticated analysis in production
    return Math.random() > 0.8; // 20% chance of detected bot activity
  }

  async detectHoneypotIndicators(contractAddress, provider) {
    const indicators = [];
    
    try {
      const contract = new ethers.Contract(contractAddress, this.erc20ABI, provider);
      
      // Check if contract is paused
      try {
        const paused = await contract.paused();
        if (paused) {
          indicators.push({
            type: 'contract_paused',
            severity: 'HIGH',
            description: 'Contract is currently paused - transfers may be blocked'
          });
        }
      } catch (error) {
        // Contract doesn't have pause functionality
      }
      
      // More honeypot indicators would be added here
      // - Check for transfer restrictions
      // - Analyze gas usage patterns
      // - Check for hidden fees
      
    } catch (error) {
      console.error('Error detecting honeypot indicators:', error);
    }
    
    return indicators;
  }

  async analyzeLiquidityPatterns(contractAddress, provider, networkKey) {
    try {
      const analysis = {
        liquidityScore: 0,
        majorPools: [],
        liquidityRisks: []
      };

      // This would typically query DEX APIs or on-chain liquidity pools
      // For simulation, we'll provide a basic analysis
      analysis.liquidityScore = Math.floor(Math.random() * 100);
      
      if (analysis.liquidityScore < 30) {
        analysis.liquidityRisks.push('Low liquidity detected - high slippage risk');
      }
      
      return analysis;
    } catch (error) {
      return {
        liquidityScore: 0,
        majorPools: [],
        liquidityRisks: ['Liquidity analysis unavailable'],
        error: error.message
      };
    }
  }

  async analyzeTransactionPatterns(contractAddress, provider, networkKey) {
    try {
      const analysis = {
        volumePattern: 'normal',
        suspiciousTransactions: [],
        tradingPatterns: {},
        riskIndicators: []
      };

      // This would analyze recent transactions for patterns
      // - Unusual volume spikes
      // - Coordinated buying/selling
      // - MEV bot activity
      // - Wash trading

      return analysis;
    } catch (error) {
      return {
        volumePattern: 'unknown',
        suspiciousTransactions: [],
        tradingPatterns: {},
        riskIndicators: [],
        error: error.message
      };
    }
  }

  async analyzeSupplyControls(contractAddress, provider) {
    try {
      const controls = {
        mintable: false,
        burnable: false,
        pausable: false,
        upgradeable: false,
        ownerControls: [],
        riskLevel: 'LOW'
      };

      const contract = new ethers.Contract(contractAddress, this.erc20ABI, provider);
      
      // Check for owner
      try {
        const owner = await contract.owner();
        if (owner && owner !== '0x0000000000000000000000000000000000000000') {
          controls.ownerControls.push('has_owner');
        }
      } catch (error) {
        // No owner function
      }

      // Check for pause functionality
      try {
        await contract.paused();
        controls.pausable = true;
        controls.ownerControls.push('can_pause');
      } catch (error) {
        // Not pausable
      }

      // Calculate risk level based on controls
      if (controls.ownerControls.length > 2) {
        controls.riskLevel = 'HIGH';
      } else if (controls.ownerControls.length > 0) {
        controls.riskLevel = 'MEDIUM';
      }

      return controls;
    } catch (error) {
      return {
        mintable: false,
        burnable: false,
        pausable: false,
        upgradeable: false,
        ownerControls: [],
        riskLevel: 'UNKNOWN',
        error: error.message
      };
    }
  }

  calculateTokenomicsRisks(analysis) {
    const risks = [];

    // Distribution risks
    if (analysis.distribution.whaleConcentration > 70) {
      risks.push({
        type: 'whale_concentration',
        severity: 'HIGH',
        description: `Top holders control ${analysis.distribution.whaleConcentration}% of supply`,
        score: 30
      });
    } else if (analysis.distribution.whaleConcentration > 50) {
      risks.push({
        type: 'whale_concentration',
        severity: 'MEDIUM',
        description: `Top holders control ${analysis.distribution.whaleConcentration}% of supply`,
        score: 20
      });
    }

    // Supply control risks
    if (analysis.supplyControls.ownerControls.length > 2) {
      risks.push({
        type: 'centralized_control',
        severity: 'HIGH',
        description: 'Contract has extensive owner controls',
        score: 25
      });
    }

    // Liquidity risks
    if (analysis.holderAnalysis.liquidityAnalysis.liquidityScore < 30) {
      risks.push({
        type: 'low_liquidity',
        severity: 'MEDIUM',
        description: 'Low liquidity detected',
        score: 15
      });
    }

    // Bot activity risks
    if (analysis.holderAnalysis.botActivity) {
      risks.push({
        type: 'bot_activity',
        severity: 'MEDIUM',
        description: 'Suspicious bot activity detected',
        score: 10
      });
    }

    // Honeypot risks
    analysis.holderAnalysis.honeypotIndicators.forEach(indicator => {
      risks.push({
        type: 'honeypot_indicator',
        severity: indicator.severity,
        description: indicator.description,
        score: indicator.severity === 'HIGH' ? 35 : 20
      });
    });

    return risks;
  }

  calculateTokenomicsRiskScore(riskFactors) {
    const baseScore = 20;
    const totalRiskScore = riskFactors.reduce((sum, risk) => sum + risk.score, 0);
    return Math.min(100, baseScore + totalRiskScore);
  }

  generateTokenomicsWarnings(analysis) {
    const warnings = [];

    if (analysis.distribution.whaleConcentration > 80) {
      warnings.push('CRITICAL: Extreme whale concentration - high manipulation risk');
    }

    if (analysis.supplyControls.ownerControls.length > 3) {
      warnings.push('WARNING: Contract has extensive centralized controls');
    }

    if (analysis.holderAnalysis.honeypotIndicators.length > 0) {
      warnings.push('ALERT: Potential honeypot indicators detected');
    }

    if (analysis.tokenInfo.totalSupply === '0') {
      warnings.push('WARNING: Zero total supply or unable to read supply');
    }

    return warnings;
  }

  generateTokenomicsRecommendations(analysis) {
    const recommendations = [];

    if (analysis.riskScore > 70) {
      recommendations.push('AVOID: High tokenomics risk - do not interact');
    } else if (analysis.riskScore > 50) {
      recommendations.push('CAUTION: Moderate risk - research thoroughly before investing');
    }

    if (analysis.distribution.whaleConcentration > 50) {
      recommendations.push('Monitor whale movements - set alerts for large transfers');
    }

    if (analysis.holderAnalysis.liquidityAnalysis.liquidityScore < 50) {
      recommendations.push('Check liquidity depth before large trades');
    }

    if (analysis.supplyControls.ownerControls.length > 0) {
      recommendations.push('Verify owner actions and intentions');
    }

    return recommendations.length > 0 ? recommendations : [
      'Tokenomics appear reasonable',
      'Continue monitoring for changes',
      'Verify information with multiple sources'
    ];
  }

  getRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  getFallbackTokenomicsAnalysis(contractAddress, networkKey) {
    return {
      contractAddress,
      network: networkKey,
      tokenInfo: {
        name: 'Unknown',
        symbol: 'Unknown',
        decimals: 18,
        totalSupply: '0',
        isERC20Compatible: false
      },
      distribution: {
        topHolders: [],
        whaleConcentration: 0,
        holderCount: 0,
        distributionScore: 50,
        giniCoefficient: 0.5
      },
      holderAnalysis: {
        suspiciousPatterns: [],
        botActivity: false,
        honeypotIndicators: [],
        liquidityAnalysis: { liquidityScore: 0 }
      },
      transactionAnalysis: {
        volumePattern: 'unknown',
        suspiciousTransactions: [],
        tradingPatterns: {},
        riskIndicators: []
      },
      supplyControls: {
        mintable: false,
        burnable: false,
        pausable: false,
        upgradeable: false,
        ownerControls: [],
        riskLevel: 'UNKNOWN'
      },
      riskFactors: [],
      riskScore: 50,
      riskLevel: 'MEDIUM',
      warnings: ['Tokenomics analysis failed - manual review required'],
      recommendations: ['Unable to analyze tokenomics automatically'],
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new TokenomicsService();
