# 🧪 Somnia Lab

**AI-powered security research platform for the Somnia blockchain ecosystem**

> *The first comprehensive security operating system that prevents users from getting scammed BEFORE they sign malicious transactions*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Somnia](https://img.shields.io/badge/Blockchain-Somnia-blue.svg)](https://somnia.network/)
[![AI](https://img.shields.io/badge/AI-GPT--4-purple.svg)](https://openai.com/)

## 📺 **Demo & Resources**

- 🎥 **Demo Video**: [Watch Live Demo on Loom](https://www.loom.com/share/4021883c9fda4638950d82d0b40ee60b?sid=306d6e3e-e630-4cce-ab1c-35e47d10e099)
- 📊 **Pitch Deck**: [Somnia Pitch Deck](https://www.notion.so/Somnia-Lab-2730555c4ba280228860da357b6ef518?source=copy_link)
- 📂 **GitHub Repository**: [Somnia Lab](https://github.com/0xTaneja/Somnia-Lab)
- 🌐 **Live Platform**: [Demo Available](http://localhost:3000)

---

## 🚨 **The Problem We Solve**

**DeFi users lose billions every year to preventable attacks:**

- 💸 **$2.2 billion stolen in 2024** through DeFi exploits and rug pulls
- 🤷‍♂️ **Users sign blind** - Can't understand what transactions actually do  
- ⏰ **No real-time protection** - Current tools analyze AFTER damage is done
- 😰 **Even crypto experts get rugged** - Sophisticated scams fool experienced users
- 🔍 **Security gap** - No AI-powered analysis at the moment of signing

**Result:** Fear prevents mainstream DeFi adoption. Users need protection BEFORE they sign malicious transactions.

---

## 🛡️ **Our Solution: AI-Powered Security Operating System**

**Somnia Lab** provides comprehensive, real-time protection across the entire DeFi ecosystem using GPT-4 and 10,000+ audit dataset.

### **🧠 Core Innovation**
- **AI-First Architecture** - GPT-4 powered real-time threat analysis
- **Proactive Protection** - Analysis BEFORE transaction execution  
- **Somnia Native** - Built for sub-second finality and unique capabilities
- **Comprehensive Coverage** - From wallets to smart contracts to dApps
- **Beautiful UX** - Security tools people actually want to use

---

## 🏗️ **Platform Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                      SOMNIA LAB ECOSYSTEM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐   │
│  │   Security    │────│   AI Tools    │────│   MetaMask    │   │
│  │   Dashboard   │    │   Platform    │    │     Snap      │   │
│  │               │    │   (GPT-4)     │    │   (Real-time  │   │
│  └───────────────┘    └───────────────┘    │   Protection) │   │
│           │                     │          └───────────────┘   │
│           ▼                     ▼                     │        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │        REST API & AI Analysis Engine (GPT-4)          │   │
│  │         Express.js + Socket.io + OpenAI              │   │
│  └─────────────────────────────────────────────────────────┘   │
│           │                     │                     │        │
│           ▼                     ▼                     ▼        │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐   │
│  │   Security    │    │   Smart       │    │   Community   │   │
│  │   Analysis    │    │   Contracts   │    │   Reporting   │   │
│  │   (10K+ Audits)   │   (Somnia)    │    │   & Alerts    │   │
│  └───────────────┘    └───────────────┘    └───────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 **Complete Platform Features**

### **1. 🦊 MetaMask Snap Integration**
- **Real-time Protection** - Security warnings directly in MetaMask wallet
- **AI-Powered Analysis** - GPT-4 analyzes every transaction before signing
- **Beautiful UI** - Clear, actionable security alerts with risk scores
- **Somnia Optimized** - Sub-second analysis leveraging network speed

### **2. 🧠 AI Security Research Platform**
- **GPT-4 Integration** - Advanced AI trained on 10,000+ security audits
- **Smart Contract Generator** - AI-assisted secure contract creation
- **Vulnerability Scanner** - Automated code analysis and threat detection
- **Interactive AI Chat** - Security research assistant for developers

### **3. 📊 Security Dashboard & Analytics**
- **Real-time Monitoring** - Live threat detection across Somnia ecosystem
- **Risk Analytics** - Comprehensive security metrics and insights  
- **Community Reports** - Crowdsourced threat intelligence
- **Custom Alerts** - Multi-channel notifications (Telegram, Discord, Email)

### **4. ⛓️ On-chain Security Infrastructure**
- **Audit Trail Contracts** - Immutable security records on Somnia
- **Reputation System** - Community-driven protocol scoring
- **Alert Management** - Decentralized notification system
- **Cross-chain Support** - Multi-network security analysis

### **5. 🔧 Developer Security Toolkit**
- **Security API** - Easy integration for wallets and dApps
- **Threat Intelligence** - Real-time security data feeds
- **Pattern Recognition** - Identifies 10+ attack vectors automatically
- **Documentation** - Comprehensive security best practices

---

## 🛠️ **Installation & Setup**

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Access to Somnia Testnet
- MetaMask Flask (for Snap development)

### **Quick Start**

```bash
# Clone the repository
git clone https://github.com/0xTaneja/Somnia-Lab.git
cd Somnia-Lab

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configurations

# Start the backend API
npm start

# Start the frontend (in another terminal)
cd frontend/rug
npm install
npm run dev

# Start MetaMask Snap development (in another terminal)  
cd metamask-snap/somnia-security-snap
yarn install
yarn workspace @rug-detection-api/somnia-security-snap serve
```

### **Environment Variables**

```bash
# API Configuration
PORT=5000
NODE_ENV=development

# AI Services
OPENAI_API_KEY=your_openai_api_key_here

# Blockchain Configuration
SOMNIA_RPC_URL=https://dream-rpc.somnia.network/
PRIVATE_KEY=your_private_key_for_deployment

# Social Media APIs (Optional)
TWITTER_BEARER_TOKEN=your_twitter_token
TELEGRAM_BOT_TOKEN=your_telegram_token

# Rate Limiting
API_RATE_LIMIT=100
```

---

## 🌐 **API Reference**

### **Core Analysis Endpoints**

#### **POST** `/api/analyze-transaction`
Comprehensive transaction security analysis

```javascript
{
  "transactionData": {
    "to": "0x1234567890123456789012345678901234567890",
    "data": "0x095ea7b3...",
    "value": "0"
  },
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "includeAI": true,
  "includeSocial": true
}
```

#### **POST** `/api/assess-contract`
Full contract security assessment

```javascript
{
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "includeAI": true,
  "includeSocial": true,
  "includeTokenomics": true,
  "includeCrossChain": false
}
```

### **AI-Powered Endpoints**

#### **POST** `/api/ai-generate-contract`
Generate secure smart contracts with AI

```javascript
{
  "requirements": {
    "contractType": "ERC20",
    "features": ["mintable", "burnable"],
    "securityLevel": "high",
    "description": "A secure token contract with advanced features"
  }
}
```

#### **POST** `/api/ai-scan-vulnerabilities`
Deep AI vulnerability analysis

```javascript
{
  "contractCode": "pragma solidity ^0.8.0; contract MyContract {...}",
  "contractAddress": "0x1234567890123456789012345678901234567890"
}
```

#### **POST** `/api/ai-chat`
Interactive AI security assistant

```javascript
{
  "message": "How can I make my smart contract more secure?",
  "context": {
    "contractType": "DeFi",
    "securityConcerns": ["reentrancy", "overflow"]
  }
}
```

### **Advanced Analysis Endpoints**

#### **POST** `/api/semantic-decode`
Human-readable transaction explanation

#### **POST** `/api/threat-analysis`
Real-time threat pattern detection

#### **POST** `/api/cross-chain-analysis`
Multi-network security assessment

#### **POST** `/api/social-analysis`
Social media sentiment analysis

#### **POST** `/api/tokenomics-analysis`
Token economics security evaluation

### **On-Chain Integration**

#### **POST** `/api/submit-to-chain`
Submit analysis results to blockchain

#### **POST** `/api/report-threat-on-chain`
Report threats to community contracts

---

## 📱 **Frontend Applications**

### **Security Dashboard** (`localhost:3000`)
- Real-time threat monitoring
- Transaction analysis interface
- Security metrics and analytics
- Community threat intelligence

### **AI Tools Platform** (`localhost:3000/ai-tools`)
- Smart contract generator
- Vulnerability scanner
- Interactive AI chat
- Audit dataset search

### **MetaMask Snap** (`localhost:3000/snap`)
- Snap installation and management
- Real-time protection demo
- Usage instructions and guides

### **Transaction Analyzer** (`localhost:3000/analyzer`)
- Manual transaction analysis
- Risk assessment tools
- Detailed security reports

### **Threat Monitor** (`localhost:3000/threat-monitor`)
- Advanced threat detection
- Real-time security alerts
- Pattern recognition dashboard

---

## ⛓️ **Smart Contracts (Somnia Network)**

### **Deployed Contracts**

| Contract | Address | Purpose |
|----------|---------|---------|
| **Rug Detection Registry** | `0x1d9553548F0950ae9c959c16eb11f477ce485888` | Main analysis storage and audit trail |
| **Community Reporting** | `0x208324cA03754b2bc71b3Ff1f1967C2EbFc024D3` | Decentralized threat reporting system |
| **Reputation Scoring** | *Coming Soon* | Contract reputation tracking |
| **Alert Manager** | *Coming Soon* | Security alert management |

### **Key Contract Functions**

#### **Rug Detection Registry**
```solidity
// Submit security analysis
function submitAnalysis(
    address contractAddress,
    uint256 riskScore,
    uint8 riskLevel,
    string memory analysisHash,
    uint256 confidence
) external;

// Get latest analysis
function getLatestAnalysis(address contractAddress) 
    external view returns (Analysis memory);
```

#### **Community Reporting**
```solidity
// Report threat
function reportThreat(
    address contractAddress,
    string memory threatType,
    string memory description,
    uint8 severity
) external;

// Verify threat report
function verifyThreat(uint256 reportId, bool isValid) external;
```

---

## 🔧 **Services & Architecture**

### **Backend Services**

| Service | Purpose | Status |
|---------|---------|---------|
| `aiAnalysisService` | GPT-4 contract analysis | ✅ Active |
| `aiContractTools` | Contract generation & scanning | ✅ Active |
| `advancedThreatMonitor` | Real-time threat detection | ✅ Active |
| `semanticTransactionDecoder` | Human-readable explanations | ✅ Active |
| `somniaMonitorService` | Network monitoring | ✅ Active |
| `somniaService` | Blockchain integration | ✅ Active |
| `socialAnalysisService` | Social media analysis | ✅ Active |
| `crossChainService` | Multi-chain analysis | ✅ Active |
| `tokenomicsService` | Token economics analysis | ✅ Active |
| `websocketService` | Real-time data streaming | ✅ Active |
| `telegramBot` | Alert notifications | ✅ Active |
| `contractService` | Smart contract interactions | ✅ Active |

### **Security Features**

- **Rate Limiting** - 100 requests per 15 minutes per IP
- **CORS Protection** - Configurable cross-origin policies  
- **Helmet Security** - HTTP security headers
- **Compression** - Gzip compression for performance
- **Input Validation** - Comprehensive data validation
- **Error Handling** - Secure error responses

---

## 🧪 **Testing & Demo**

### **Test Transactions**

#### **High-Risk Scam (Unlimited Approval)**
```json
{
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "transactionData": {
    "data": "0x095ea7b3000000000000000000000000spender123456789012345678901234567890123456ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    "value": "0",
    "to": "0x1234567890123456789012345678901234567890",
    "from": "0xvictim1234567890123456789012345678901234567890"
  }
}
```
**Expected**: Risk Score 90+ (CRITICAL) - "Unlimited token approval detected!"

#### **Safe Transaction (Normal Transfer)**
```json
{
  "contractAddress": "0xtoken1234567890123456789012345678901234567890", 
  "transactionData": {
    "data": "0xa9059cbb000000000000000000000000friend1234567890123456789012345678901234567890000000000000000000000000000000000000000000000056bc75e2d630eb9800",
    "value": "0",
    "to": "0xtoken1234567890123456789012345678901234567890",
    "from": "0xuser1234567890123456789012345678901234567890"
  }
}
```
**Expected**: Risk Score 15-25 (LOW) - "Normal token transfer"

---

## 🎯 **Risk Scoring System**

| Score | Risk Level | Description | Actions |
|-------|------------|-------------|---------|
| 0-20  | **LOW** 🟢 | Safe transaction | Proceed with confidence |
| 21-40 | **MEDIUM** 🟡 | Some risk indicators | Review carefully |
| 41-60 | **HIGH** 🟠 | Multiple risk factors | Exercise caution |
| 61-80 | **CRITICAL** 🔴 | Serious threats detected | Strongly consider canceling |
| 81-100| **EXTREME** ⚫ | Highly malicious | DO NOT SIGN |

### **Detected Threat Patterns**

#### **Critical Threats (80-100 points)**
- **Ownership Transfer** - Contract ownership being transferred
- **Drain Pattern** - Wallet draining patterns detected  
- **Liquidity Removal** - Liquidity being removed from pools
- **Honeypot Indicators** - Contract designed to trap funds

#### **High Threats (60-80 points)**  
- **Unlimited Approval** - Max uint256 token approvals
- **Permit Exploit** - Potential permit signature exploitation
- **Privilege Escalation** - Admin privileges being modified
- **Flash Loan Attack** - Complex flash loan exploitation

#### **Medium Threats (40-60 points)**
- **Suspicious Approval** - Approval to potentially malicious address
- **Unexpected Transfer** - Unusual token movement patterns
- **Pool Manipulation** - Potential AMM pool manipulation
- **High Gas Consumption** - Unusually expensive operations

---

## 🌟 **Key Innovations**

### **🎯 Technical Breakthroughs**
1. **First AI-Native Security Platform** - GPT-4 for real-time threat analysis
2. **Proactive vs Reactive** - Protection BEFORE damage, not after
3. **Somnia Optimization** - Leverages sub-second finality for instant protection  
4. **MetaMask Integration** - Security where users actually are
5. **Comprehensive Dataset** - 10,000+ audits training AI accuracy

### **🏆 Competitive Advantages**
| Traditional Security | Somnia Lab |
|---------------------|------------|
| Post-attack analysis | Pre-transaction protection |
| Manual threat detection | AI-powered automation |
| Fragmented tools | Unified security platform |
| Complex UX | Beautiful, intuitive design |
| Generic solutions | Somnia-native optimization |

---

## 📊 **Usage Examples**

### **Browser Extension Integration**
```javascript
import { SomniaLabAPI } from 'somnia-lab-sdk';

const api = new SomniaLabAPI('your-api-key');

// Analyze transaction before signing
const analysis = await api.analyzeTransaction({
  transactionData: txData,
  contractAddress: contractAddr
});

if (analysis.riskScore > 60) {
  alert('⚠️ High risk transaction detected!');
  showWarning(analysis.threats);
}
```

### **Wallet Integration**
```javascript
// Pre-transaction risk check
async function checkTransactionSafety(tx) {
  const response = await fetch('/api/analyze-transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionData: tx,
      contractAddress: tx.to,
      includeAI: true
    })
  });
  
  const result = await response.json();
  return {
    safe: result.riskScore <= 40,
    warnings: result.recommendations,
    riskLevel: result.analysis.riskLevel
  };
}
```

### **DApp Security Integration**
```javascript
// Real-time contract monitoring
const monitor = new SomniaLabMonitor();

monitor.watchContract('0x1234...', {
  onThreatDetected: (threat) => {
    console.log('Threat detected:', threat);
    notifyUsers(threat);
  },
  riskThreshold: 70
});
```

---

## 🛣️ **Roadmap**

### **Phase 1: Foundation ✅ COMPLETED**
- [x] **Core Security Engine** - Multi-pattern threat detection
- [x] **AI Integration** - GPT-4 powered analysis with 10,000+ audit dataset
- [x] **Somnia Integration** - Real-time blockchain monitoring and simulation
- [x] **Basic Frontend** - Security dashboard and transaction analyzer
- [x] **REST API** - Comprehensive developer endpoints

### **Phase 2: Advanced Platform ✅ COMPLETED**
- [x] **AI Contract Tools** - Smart contract generator and vulnerability scanner
- [x] **MetaMask Snap** - Real-time transaction protection in wallet
- [x] **Advanced Threat Monitor** - Sophisticated pattern recognition
- [x] **Social Analysis** - Twitter/Discord sentiment integration
- [x] **WebSocket Integration** - Real-time data streaming
- [x] **Telegram Bot** - Automated security alerts
- [x] **On-chain Infrastructure** - Smart contracts deployed on Somnia

### **Phase 3: Ecosystem Expansion 🔄 IN PROGRESS**
- [ ] **API LAUNCH** - Launching API 
- [ ] **Releasing Product** - Releasing Product in September 
- [ ] **DeFi Protocol Integrations** - Direct partnerships with major protocols

### **Phase 4: Security Innovation 📅 Q2-Q4 2025**
- [ ] **Advanced AI Models** - Custom security-focused language models
- [ ] **Automated Incident Response** - AI-driven security orchestration
- [ ] **Predictive Threat Modeling** - Proactive vulnerability discovery
- [ ] **Security-as-a-Service** - White-label platform licensing

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 **Links & Resources**

- 🌐 **Live Platform**: [Coming Soon]
- 📂 **GitHub**: https://github.com/0xTaneja/Somnia-Lab
- 📚 **Documentation**: [API Docs](docs/)
- 🦊 **MetaMask Snap**: [Installation Guide](metamask-snap/)
- 💬 **Community**: [Discord](https://discord.gg/somnia-lab)
- 🐦 **Twitter**: [@SomniaLab](https://twitter.com/somnialab)

---

## 🎯 **The Future of DeFi Security**

**Somnia Lab isn't just another security tool - we're building the security operating system that will enable the next billion users to safely enter DeFi.**

**With AI-powered real-time protection, beautiful UX, and Somnia-native optimization, we're solving the $2.2B DeFi security crisis one transaction at a time.**

**Join us in making DeFi safe for everyone.** 🛡️

---

*Built with ❤️ for the Somnia ecosystem and the future of decentralized finance.*

