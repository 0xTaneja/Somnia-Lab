/**
 * Risk Scoring System
 * Converts analysis results into numerical risk scores (1-10 scale)
 */

const RISK_WEIGHTS = {
  // Critical severity factors (7-10 points each)
  'OWNERSHIP_TRANSFER': 8,
  'DRAIN_PATTERN': 10,
  'LIQUIDITY_REMOVAL': 9,
  'HONEYPOT_INDICATORS': 9,

  // High severity factors (5-7 points each)
  'UNLIMITED_APPROVAL': 6,
  'PERMIT_EXPLOIT': 7,
  'PRIVILEGE_ESCALATION': 6,
  'TRADING_RESTRICTIONS': 5,

  // Medium severity factors (3-5 points each)
  'SUSPICIOUS_APPROVAL': 4,
  'UNEXPECTED_TRANSFER': 4,
  'POOL_MANIPULATION': 5,

  // Low severity factors (1-3 points each)
  'OWNERSHIP_RENOUNCE': 2, // Can be good or bad depending on context
  'ANALYSIS_ERROR': 3
};

const PATTERN_MULTIPLIERS = {
  // Multiple risk factors increase severity
  'multiple_ownership_issues': 1.5,
  'multiple_transfer_issues': 1.3,
  'multiple_approval_issues': 1.4,
  'combined_liquidity_ownership': 1.8
};

function getRiskScore(analysis) {
  if (!analysis || !analysis.riskFactors) {
    return 1; // Default low risk if no analysis
  }

  let baseScore = 0;
  let maxScore = 0;
  const factorCounts = {};

  // Calculate base score from individual risk factors
  analysis.riskFactors.forEach(factor => {
    const weight = RISK_WEIGHTS[factor] || 1;
    baseScore += weight;
    maxScore = Math.max(maxScore, weight);
    
    // Count factor types for pattern detection
    const category = getFactorCategory(factor);
    factorCounts[category] = (factorCounts[category] || 0) + 1;
  });

  // Apply pattern multipliers
  let multiplier = 1.0;
  
  // Check for multiple issues in same category
  if (factorCounts.ownership >= 2) {
    multiplier *= PATTERN_MULTIPLIERS.multiple_ownership_issues;
  }
  if (factorCounts.transfer >= 2) {
    multiplier *= PATTERN_MULTIPLIERS.multiple_transfer_issues;
  }
  if (factorCounts.approval >= 2) {
    multiplier *= PATTERN_MULTIPLIERS.multiple_approval_issues;
  }
  
  // Check for dangerous combinations
  if (factorCounts.ownership >= 1 && factorCounts.liquidity >= 1) {
    multiplier *= PATTERN_MULTIPLIERS.combined_liquidity_ownership;
  }

  // Calculate final score
  let finalScore = baseScore * multiplier;
  
  // Ensure we don't exceed maximum if only low-risk factors
  if (maxScore <= 3 && finalScore > 4) {
    finalScore = Math.min(finalScore, 4);
  }

  // Cap at 10 and ensure minimum of 1
  finalScore = Math.max(1, Math.min(10, Math.round(finalScore)));

  return finalScore;
}

function getFactorCategory(factor) {
  const ownershipFactors = ['OWNERSHIP_TRANSFER', 'OWNERSHIP_RENOUNCE', 'PRIVILEGE_ESCALATION'];
  const approvalFactors = ['UNLIMITED_APPROVAL', 'SUSPICIOUS_APPROVAL', 'PERMIT_EXPLOIT'];
  const transferFactors = ['UNEXPECTED_TRANSFER', 'DRAIN_PATTERN'];
  const liquidityFactors = ['LIQUIDITY_REMOVAL', 'POOL_MANIPULATION'];
  
  if (ownershipFactors.includes(factor)) return 'ownership';
  if (approvalFactors.includes(factor)) return 'approval';
  if (transferFactors.includes(factor)) return 'transfer';
  if (liquidityFactors.includes(factor)) return 'liquidity';
  
  return 'other';
}

function getRiskLevel(score) {
  if (score <= 2) return 'Very Low';
  if (score <= 3) return 'Low';
  if (score <= 4) return 'Low-Medium';
  if (score <= 5) return 'Medium';
  if (score <= 6) return 'Medium-High';
  if (score <= 7) return 'High';
  if (score <= 8) return 'Very High';
  if (score <= 9) return 'Critical';
  return 'Maximum Risk';
}

function getRiskColor(score) {
  if (score <= 3) return '#22c55e'; // Green
  if (score <= 5) return '#eab308'; // Yellow
  if (score <= 7) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

function getDetailedRiskAssessment(analysis) {
  const score = getRiskScore(analysis);
  const level = getRiskLevel(score);
  const color = getRiskColor(score);
  
  const assessment = {
    score,
    level,
    color,
    summary: generateRiskSummary(analysis, score),
    recommendations: generateRecommendations(analysis, score),
    factorBreakdown: generateFactorBreakdown(analysis),
    confidence: calculateConfidence(analysis)
  };

  return assessment;
}

function generateRiskSummary(analysis, score) {
  const factorCount = analysis.riskFactors.length;
  const level = getRiskLevel(score);
  
  if (score <= 3) {
    return `Low risk detected. ${factorCount} minor issue${factorCount !== 1 ? 's' : ''} found.`;
  } else if (score <= 6) {
    return `Moderate risk detected. ${factorCount} concerning factor${factorCount !== 1 ? 's' : ''} identified.`;
  } else {
    return `High risk detected. ${factorCount} serious issue${factorCount !== 1 ? 's' : ''} found. Exercise extreme caution.`;
  }
}

function generateRecommendations(analysis, score) {
  const recommendations = [];
  
  if (score <= 3) {
    recommendations.push('Transaction appears relatively safe');
    recommendations.push('Review transaction details as normal precaution');
  } else if (score <= 6) {
    recommendations.push('Exercise increased caution');
    recommendations.push('Review all transaction details carefully');
    recommendations.push('Consider using smaller amounts for testing');
    if (analysis.riskFactors.includes('UNLIMITED_APPROVAL')) {
      recommendations.push('Consider setting limited approval amounts instead');
    }
  } else {
    recommendations.push('High risk - avoid this transaction');
    recommendations.push('Do not proceed without expert review');
    recommendations.push('Multiple serious risk factors detected');
    if (analysis.riskFactors.includes('DRAIN_PATTERN')) {
      recommendations.push('This transaction may drain your wallet');
    }
  }
  
  return recommendations;
}

function generateFactorBreakdown(analysis) {
  const breakdown = {};
  
  analysis.riskFactors.forEach(factor => {
    const weight = RISK_WEIGHTS[factor] || 1;
    const category = getFactorCategory(factor);
    
    if (!breakdown[category]) {
      breakdown[category] = {
        factors: [],
        totalWeight: 0,
        count: 0
      };
    }
    
    breakdown[category].factors.push({
      factor,
      weight,
      description: getFactorDescription(factor)
    });
    breakdown[category].totalWeight += weight;
    breakdown[category].count += 1;
  });
  
  return breakdown;
}

function getFactorDescription(factor) {
  const descriptions = {
    'OWNERSHIP_TRANSFER': 'Contract ownership is being transferred',
    'OWNERSHIP_RENOUNCE': 'Contract ownership is being renounced',
    'PRIVILEGE_ESCALATION': 'Admin privileges are being modified',
    'UNLIMITED_APPROVAL': 'Unlimited token approval detected',
    'SUSPICIOUS_APPROVAL': 'Approval to suspicious address',
    'PERMIT_EXPLOIT': 'Potential permit signature exploitation',
    'UNEXPECTED_TRANSFER': 'Unexpected token transfers',
    'DRAIN_PATTERN': 'Wallet draining pattern detected',
    'LIQUIDITY_REMOVAL': 'Liquidity being removed from pool',
    'POOL_MANIPULATION': 'Potential pool manipulation',
    'HONEYPOT_INDICATORS': 'Honeypot contract indicators',
    'TRADING_RESTRICTIONS': 'Trading restrictions detected',
    'ANALYSIS_ERROR': 'Error occurred during analysis'
  };
  
  return descriptions[factor] || 'Unknown risk factor';
}

function calculateConfidence(analysis) {
  // Confidence based on number of factors and analysis completeness
  const factorCount = analysis.riskFactors.length;
  const hasAnalysisError = analysis.riskFactors.includes('ANALYSIS_ERROR');
  
  if (hasAnalysisError) return 0.3;
  if (factorCount === 0) return 0.9; // High confidence in low risk
  if (factorCount <= 2) return 0.8;
  if (factorCount <= 4) return 0.85;
  return 0.9; // High confidence with many factors
}

module.exports = {
  getRiskScore,
  getRiskLevel,
  getRiskColor,
  getDetailedRiskAssessment,
  RISK_WEIGHTS
};
