/**
 * Comprehensive Scam Pattern Test Cases
 * Real-world examples of malicious transaction patterns
 */

const testCases = {
  // High-risk patterns
  unlimitedApproval: {
    name: 'Unlimited Token Approval Scam',
    contractAddress: '0x1234567890123456789012345678901234567890',
    transactionData: {
      data: '0x095ea7b3000000000000000000000000maliciousaddress123456789012345678901234567890ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      from: '0xvictim1234567890123456789012345678901234567890',
      to: '0x1234567890123456789012345678901234567890',
      value: '0x0'
    },
    expectedRisk: 'critical',
    description: 'Victim approves unlimited tokens to malicious spender'
  },

  ownershipTransfer: {
    name: 'Malicious Ownership Transfer',
    contractAddress: '0xcontract123456789012345678901234567890123456',
    transactionData: {
      data: '0xf2fde38b000000000000000000000000attacker123456789012345678901234567890123456',
      from: '0xowner123456789012345678901234567890123456789',
      to: '0xcontract123456789012345678901234567890123456',
      value: '0x0'
    },
    expectedRisk: 'critical',
    description: 'Contract owner being transferred to attacker'
  },

  permitExploit: {
    name: 'Permit Signature Exploit',
    contractAddress: '0xtoken1234567890123456789012345678901234567890',
    transactionData: {
      data: '0xd505accf000000000000000000000000victim123456789012345678901234567890123456789000000000000000000000000attacker123456789012345678901234567890123456ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000065f3b4301b000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111122222222222222222222222222222222222222222222222222222222222222222',
      from: '0xattacker123456789012345678901234567890123456',
      to: '0xtoken1234567890123456789012345678901234567890',
      value: '0x0'
    },
    expectedRisk: 'critical',
    description: 'Malicious permit with unlimited approval and forged signature'
  },

  nftApprovalForAll: {
    name: 'NFT Approve All Scam',
    contractAddress: '0xnft12345678901234567890123456789012345678901',
    transactionData: {
      data: '0xa22cb465000000000000000000000000maliciousnft12345678901234567890123456780000000000000000000000000000000000000000000000000000000000000001',
      from: '0xvictim1234567890123456789012345678901234567890',
      to: '0xnft12345678901234567890123456789012345678901',
      value: '0x0'
    },
    expectedRisk: 'critical',
    description: 'Victim approves all NFTs to malicious operator'
  },

  liquidityDrain: {
    name: 'Liquidity Pool Drain',
    contractAddress: '0xpool1234567890123456789012345678901234567890',
    transactionData: {
      data: '0xbaa2abde000000000000000000000000tokenA123456789012345678901234567890123456000000000000000000000000tokenB1234567890123456789012345678901234560000000000000000000000000000000000000000000000056bc75e2d630eb98000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000malicioususer123456789012345678901230000000000000000000000000000000000000000000000000000000065f3b430',
      from: '0xmalicioususer123456789012345678901234567890',
      to: '0xpool1234567890123456789012345678901234567890',
      value: '0x0'
    },
    expectedRisk: 'high',
    description: 'Unauthorized liquidity removal from DEX pool'
  },

  proxyUpgrade: {
    name: 'Malicious Proxy Upgrade',
    contractAddress: '0xproxy123456789012345678901234567890123456789',
    transactionData: {
      data: '0x3659cfe6000000000000000000000000malicious123456789012345678901234567890123456',
      from: '0xowner123456789012345678901234567890123456789',
      to: '0xproxy123456789012345678901234567890123456789',
      value: '0x0'
    },
    expectedRisk: 'critical',
    description: 'Proxy being upgraded to malicious implementation'
  },

  // Medium-risk patterns
  suspiciousTransfer: {
    name: 'Suspicious Large Transfer',
    contractAddress: '0xtoken1234567890123456789012345678901234567890',
    transactionData: {
      data: '0xa9059cbb000000000000000000000000unknown123456789012345678901234567890123456000000000000000000000000000000000000000000000d3c21bcecceda1000000',
      from: '0xuser1234567890123456789012345678901234567890',
      to: '0xtoken1234567890123456789012345678901234567890',
      value: '0x0'
    },
    expectedRisk: 'medium',
    description: 'Large token transfer to unknown address'
  },

  flashloan: {
    name: 'Flash Loan Execution',
    contractAddress: '0xlender123456789012345678901234567890123456789',
    transactionData: {
      data: '0x5cffe9de000000000000000000000000borrower12345678901234567890123456789012345000000000000000000000000asset123456789012345678901234567890123456000000000000000000000000000000000000000000000000d3c21bcecceda100000000000000000000000000000000000000000000000000000000000000000080',
      from: '0xborrower123456789012345678901234567890123456',
      to: '0xlender123456789012345678901234567890123456789',
      value: '0x0'
    },
    expectedRisk: 'high',
    description: 'Flash loan often used in complex exploits'
  },

  // Low-risk patterns (for comparison)
  normalTransfer: {
    name: 'Normal Token Transfer',
    contractAddress: '0xtoken1234567890123456789012345678901234567890',
    transactionData: {
      data: '0xa9059cbb000000000000000000000000friend1234567890123456789012345678901234567890000000000000000000000000000000000000000000000056bc75e2d630eb9800',
      from: '0xuser1234567890123456789012345678901234567890',
      to: '0xtoken1234567890123456789012345678901234567890',
      value: '0x0'
    },
    expectedRisk: 'low',
    description: 'Standard token transfer to known address'
  },

  limitedApproval: {
    name: 'Limited Token Approval',
    contractAddress: '0xtoken1234567890123456789012345678901234567890',
    transactionData: {
      data: '0x095ea7b3000000000000000000000000dexrouter12345678901234567890123456789012340000000000000000000000000000000000000000000000056bc75e2d630eb9800',
      from: '0xuser1234567890123456789012345678901234567890',
      to: '0xtoken1234567890123456789012345678901234567890',
      value: '0x0'
    },
    expectedRisk: 'low',
    description: 'Limited approval to trusted DEX router'
  },

  dexSwap: {
    name: 'DEX Token Swap',
    contractAddress: '0xrouter123456789012345678901234567890123456789',
    transactionData: {
      data: '0x38ed1739000000000000000000000000000000000000000000000000d3c21bcecceda1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000user1234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000065f3b4300000000000000000000000000000000000000000000000000000000000000002000000000000000000000000tokenA123456789012345678901234567890123456000000000000000000000000tokenB123456789012345678901234567890123456',
      from: '0xuser1234567890123456789012345678901234567890',
      to: '0xrouter123456789012345678901234567890123456789',
      value: '0x0'
    },
    expectedRisk: 'low',
    description: 'Standard DEX token swap operation'
  }
};

// Test execution function
async function runScamPatternTests(analyzeFunction) {
  console.log('🧪 Running comprehensive scam pattern tests...\n');
  
  const results = [];
  
  for (const [key, testCase] of Object.entries(testCases)) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`Expected risk: ${testCase.expectedRisk}`);
    
    try {
      const result = await analyzeFunction(testCase.transactionData, testCase.contractAddress);
      
      const passed = evaluateTestResult(result, testCase);
      
      results.push({
        name: testCase.name,
        passed,
        expectedRisk: testCase.expectedRisk,
        actualScore: result.riskScore || 'N/A',
        riskFactors: result.analysis?.riskFactors || [],
        description: testCase.description
      });
      
      console.log(`✅ ${passed ? 'PASSED' : 'FAILED'} - Risk Score: ${result.riskScore || 'N/A'}`);
      if (result.analysis?.riskFactors?.length > 0) {
        console.log(`   Risk factors: ${result.analysis.riskFactors.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      results.push({
        name: testCase.name,
        passed: false,
        error: error.message,
        expectedRisk: testCase.expectedRisk
      });
    }
    
    console.log('---');
  }
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results Summary:`);
  console.log(`Passed: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  
  if (passed < total) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   • ${r.name}: Expected ${r.expectedRisk}, got score ${r.actualScore}`);
    });
  }
  
  return results;
}

function evaluateTestResult(result, testCase) {
  const riskScore = result.riskScore || 0;
  const expectedRisk = testCase.expectedRisk;
  
  // Define score ranges for risk levels
  const riskRanges = {
    low: [1, 3],
    medium: [4, 6], 
    high: [7, 8],
    critical: [9, 10]
  };
  
  const [minScore, maxScore] = riskRanges[expectedRisk] || [1, 10];
  
  return riskScore >= minScore && riskScore <= maxScore;
}

module.exports = {
  testCases,
  runScamPatternTests
};
