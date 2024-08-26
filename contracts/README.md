# 🔒 Ultimate DeFi Security Platform - Smart Contracts

## 🚀 Overview

The Ultimate DeFi Security Platform includes a comprehensive suite of smart contracts deployed on the Somnia Network, providing **immutable audit trails**, **decentralized threat intelligence**, **reputation scoring**, and **real-time security alerts**.

## 📊 Contract Architecture

### 🏗️ **Core Contracts**

1. **[RugDetectionRegistry.sol](#rugdetectionregistry)** - Main analysis storage and audit trail
2. **[CommunityReporting.sol](#communityreporting)** - Decentralized threat reporting system  
3. **[ReputationScoring.sol](#reputationscoring)** - Contract reputation tracking
4. **[AlertManager.sol](#alertmanager)** - Security alert management

---

## 📊 RugDetectionRegistry

**Address:** `{Will be filled after deployment}`

### 🎯 Purpose
Stores immutable analysis results on-chain, providing transparent audit trails for all security assessments.

### 🔧 Key Functions

#### **Analysis Management**
- `submitAnalysis()` - Submit new analysis results
- `verifyAnalysis()` - Verify analysis by authorized analyzers
- `getLatestAnalysis()` - Get most recent analysis for a contract
- `getContractStats()` - Get statistics for a contract

#### **Authorization**
- `authorizeAnalyzer()` - Add authorized analyzer
- `revokeAnalyzer()` - Remove analyzer authorization

### 📈 Events
- `AnalysisSubmitted` - New analysis added
- `AnalysisVerified` - Analysis verified by community
- `RiskLevelUpdated` - Risk level changed

### 🔍 Example Usage
```javascript
// Submit analysis to registry
await registry.submitAnalysis(
  contractAddress,
  75,                    // Risk score (0-100)
  2,                     // Risk level (HIGH)
  "ipfs://analysis123",  // IPFS hash of detailed data
  85                     // Confidence level
);

// Get latest analysis
const analysis = await registry.getLatestAnalysis(contractAddress);
console.log(`Risk Score: ${analysis.riskScore}`);
```

---

## 👥 CommunityReporting

**Address:** `{Will be filled after deployment}`

### 🎯 Purpose
Enables decentralized community reporting of threats, creating crowd-sourced threat intelligence.

### 🔧 Key Functions

#### **Threat Reporting**
- `reportThreat()` - Report suspicious contract
- `confirmReport()` - Confirm existing report
- `disputeReport()` - Dispute false report
- `resolveReport()` - Mark report as resolved

#### **Data Retrieval**
- `getContractThreatLevel()` - Get threat level (0-100)
- `hasActiveThreat()` - Check for active threats
- `getContractReports()` - Get all reports for contract

### 🏆 Reputation System
- Users earn reputation for verified reports
- False reports result in reputation penalties
- Moderators can override community decisions

### 📈 Events
- `ThreatReported` - New threat reported
- `ReportConfirmed` - Report confirmed by community
- `ReportStatusChanged` - Report status updated

### 🔍 Example Usage
```javascript
// Report a rug pull
await community.reportThreat(
  contractAddress,
  0,                           // RUG_PULL
  "Contract drained liquidity", 
  "ipfs://evidence123",
  8                            // Severity (1-10)
);

// Check threat level
const threatLevel = await community.getContractThreatLevel(contractAddress);
if (threatLevel > 70) {
  console.log("⚠️ HIGH THREAT DETECTED");
}
```

---

## 🏆 ReputationScoring

**Address:** `{Will be filled after deployment}`

### 🎯 Purpose
Provides decentralized reputation scoring for smart contracts based on multiple data sources.

### 🔧 Key Functions

#### **Reputation Management**
- `updateReputationScore()` - Update contract reputation
- `getReputationScore()` - Get detailed reputation data
- `getReputationPercentage()` - Get simple 0-100 score
- `getReputationCategory()` - Get category (EXCELLENT/GOOD/FAIR/POOR/DANGEROUS)

#### **Contract Verification**
- `verifyContract()` - Mark contract as verified
- `setContractDeploymentTime()` - Set deployment time for stability calculation

### 📊 Scoring Algorithm
- **Security Score (40%)** - Based on analysis results
- **Community Score (30%)** - Based on community reports  
- **Stability Score (20%)** - Based on age and activity
- **Transparency Score (10%)** - Based on verification status

### 📈 Events
- `ReputationUpdated` - Score updated
- `ContractVerified` - Contract verified by trusted analyzer

### 🔍 Example Usage
```javascript
// Update reputation
await reputation.updateReputationScore(
  contractAddress,
  "Quarterly reputation update"
);

// Get reputation category
const category = await reputation.getReputationCategory(contractAddress);
console.log(`Reputation: ${category}`); // "EXCELLENT", "GOOD", etc.
```

---

## 🚨 AlertManager

**Address:** `{Will be filled after deployment}`

### 🎯 Purpose
Manages real-time security alerts and user subscriptions for decentralized notifications.

### 🔧 Key Functions

#### **Alert Management**
- `createAlert()` - Create new security alert
- `resolveAlert()` - Mark alert as resolved
- `subscribeToAlerts()` - Subscribe to alert types
- `acknowledgeAlert()` - Mark alert as seen

#### **Alert Queries**
- `getContractAlerts()` - Get alerts for contract
- `hasCriticalAlerts()` - Check for critical alerts
- `getContractAlertStats()` - Get alert statistics

### 🔔 Alert Types
- `RISK_SCORE_CHANGE` - Risk level changed
- `RUG_PULL_DETECTED` - Rug pull detected
- `HONEYPOT_WARNING` - Honeypot identified
- `WHALE_MOVEMENT` - Large holder activity
- `LIQUIDITY_REMOVED` - Liquidity drained

### 📈 Events
- `AlertCreated` - New alert created
- `AlertBroadcast` - Alert sent to subscribers
- `UserSubscribed` - User subscribed to alerts

### 🔍 Example Usage
```javascript
// Create critical alert
await alerts.createAlert(
  2,                          // RUG_PULL_DETECTED
  4,                          // CRITICAL severity
  contractAddress,
  "Rug Pull Detected",
  "Contract has drained liquidity",
  "DO NOT INTERACT - WITHDRAW IMMEDIATELY",
  "0x",                       // Additional data
  true,                       // Broadcast globally
  86400                       // Expires in 24 hours
);

// Subscribe to critical alerts
await alerts.subscribeToAlerts(
  [0, 1, 2],                  // Alert types
  3,                          // HIGH severity minimum
  [contractAddress],          // Watched contracts
  true                        // Receive global alerts
);
```

---

## 🚀 Deployment

### **Prerequisites**
```bash
npm install
```

### **Local Deployment**
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### **Somnia Testnet Deployment**
```bash
npx hardhat run scripts/deploy.js --network somnia
```

### **Contract Verification**
```bash
npx hardhat run scripts/verify.js --network somnia
```

---

## 🔗 Integration

### **API Integration**
The contracts are integrated with our API server through the `contractService.js`:

```javascript
// Submit analysis to blockchain
const result = await contractService.submitAnalysisToChain(
  contractAddress,
  riskScore,
  riskLevel,
  ipfsHash,
  confidence
);

// Get on-chain analysis
const onChainData = await contractService.getEnhancedContractAnalysis(contractAddress);
```

### **Frontend Integration**
Frontend applications can interact directly with contracts:

```javascript
// Connect to contract
const contract = new ethers.Contract(address, abi, signer);

// Get latest analysis
const analysis = await contract.getLatestAnalysis(contractAddress);
```

---

## 🔐 Security Features

### **Access Control**
- **Owner-only functions** for critical operations
- **Authorized analyzers** for analysis submission
- **Moderators** for community report management
- **Rate limiting** to prevent spam

### **Data Integrity**
- **Immutable storage** of analysis results
- **IPFS integration** for detailed data storage
- **Event logging** for transparency
- **Verification system** for community consensus

### **Economic Incentives**
- **Reputation system** rewards accurate reporting
- **Penalties** for false reports
- **Staking mechanisms** (future enhancement)

---

## 📊 Contract Interactions

### **Analysis Flow**
1. **Off-chain Analysis** → API performs comprehensive analysis
2. **IPFS Storage** → Detailed results stored on IPFS
3. **On-chain Submission** → Summary stored on blockchain
4. **Community Verification** → Other analyzers verify results
5. **Reputation Update** → Contract reputation recalculated

### **Threat Reporting Flow**
1. **Community Report** → User reports suspicious activity
2. **Community Validation** → Other users confirm/dispute
3. **Moderator Review** → Final verification if needed
4. **Alert Generation** → Automatic alerts for subscribers
5. **Resolution** → Threat resolved or marked false positive

---

## 🌐 Network Information

- **Network:** Somnia Testnet
- **Chain ID:** 50312
- **RPC URL:** https://dream-rpc.somnia.network/
- **Explorer:** https://shannon-explorer.somnia.network/
- **Gas Price:** ~6 gwei
- **Block Time:** Sub-second finality

---

## 📚 Resources

### **Documentation**
- [Somnia Network Docs](https://docs.somnia.network/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

### **Development**
- [Contract Source Code](./contracts/)
- [Deployment Scripts](./scripts/)
- [Test Cases](./test/)

### **API Integration**
- [Contract Service](../src/services/contractService.js)
- [API Endpoints](../src/api/server.js)

---

## 🎯 Future Enhancements

### **V2 Features**
- **Cross-chain bridges** for multi-network analysis
- **Staking mechanisms** for economic security
- **NFT badges** for verified contracts
- **Governance system** for parameter updates

### **Advanced Analytics**
- **ML-based scoring** improvements
- **Real-time monitoring** contracts
- **Predictive risk** modeling
- **DeFi protocol** specific analysis

---

## 📞 Support

For technical support or questions:
- **GitHub Issues:** [Create an issue](https://github.com/your-repo/issues)
- **Documentation:** [API Docs](../README.md)
- **Community:** [Discord/Telegram]

---

**🔒 Built for the Ultimate DeFi Security Platform**  
**⚡ Powered by Somnia Network's high-performance blockchain**
