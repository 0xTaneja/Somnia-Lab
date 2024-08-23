# 🧪 Somnia Lab

**AI-powered security research platform for the Somnia blockchain**

Somnia Lab is a comprehensive security research platform that analyzes blockchain transactions in real-time to detect potential rug pulls, scams, and malicious patterns before they execute. Built specifically for the Somnia ecosystem with AI-powered analysis tools.

## 🚀 Features

- **Real-time Transaction Analysis**: Pre-simulate transactions to detect risks before execution
- **Multi-pattern Detection**: Identifies 10+ types of malicious patterns including:
  - Ownership transfers and privilege escalation
  - Unlimited token approvals
  - Permit signature exploits
  - Unexpected token transfers and wallet draining
  - Liquidity removal and pool manipulation
  - Honeypot indicators and trading restrictions

- **Risk Scoring System**: Numerical risk assessment (1-10 scale) with detailed explanations
- **REST API**: Easy integration with wallets, dApps, and security tools
- **Web Interface**: User-friendly frontend for manual transaction analysis
- **Somnia Optimized**: Leverages Somnia's sub-second finality for instant risk assessment

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │────│   REST API      │────│ Risk Analysis   │
│   (HTML/JS)     │    │   (Express)     │    │   Engine        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Somnia Testnet  │
                       │  (Simulation)   │
                       └─────────────────┘
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Access to Somnia Testnet

### Quick Start

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd rug-detection-api
npm install
```

2. **Configure environment:**
```bash
cp src/config.js.example src/config.js
# Update Somnia RPC URLs when available
```

3. **Start the server:**
```bash
npm start
```

4. **Access the interface:**
- Web UI: http://localhost:3000
- API Health: http://localhost:3000/health
- API Docs: http://localhost:3000/api/risk-levels

## 🔌 API Usage

### Analyze Transaction
```bash
POST /api/analyze-transaction
Content-Type: application/json

{
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "transactionData": {
    "data": "0xa9059cbb...",
    "value": "0",
    "to": "0x1234567890123456789012345678901234567890"
  }
}
```

### Response Format
```json
{
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "riskScore": 4,
  "analysis": {
    "riskFactors": ["UNEXPECTED_TRANSFER"],
    "patterns": ["Unexpected token transfers detected"],
    "details": {
      "ownership": {},
      "approvals": {},
      "transfers": {"unexpectedTransfer": true},
      "liquidity": {},
      "honeypot": {}
    }
  },
  "recommendations": [
    "Exercise caution",
    "Review contract details carefully",
    "Consider smaller amounts for testing"
  ],
  "timestamp": "2025-09-15T14:52:58.089Z"
}
```

## 🎯 Risk Scoring

| Score | Level | Description |
|-------|--------|-------------|
| 1-3   | Low Risk | Contract appears safe with standard patterns |
| 4-6   | Medium Risk | Some concerning factors detected |
| 7-10  | High Risk | Multiple serious risk indicators present |

## 🧪 Detected Patterns

### Critical Risks (7-10 points)
- **Ownership Transfer**: Contract ownership being transferred
- **Drain Pattern**: Wallet draining patterns detected  
- **Liquidity Removal**: Liquidity being removed from pools
- **Honeypot Indicators**: Contract designed to trap funds

### High Risks (5-7 points)
- **Unlimited Approval**: Max uint256 token approvals
- **Permit Exploit**: Potential permit signature exploitation
- **Privilege Escalation**: Admin privileges being modified

### Medium Risks (3-5 points)
- **Suspicious Approval**: Approval to potentially malicious address
- **Unexpected Transfer**: Unusual token movement patterns
- **Pool Manipulation**: Potential AMM pool manipulation

## 🔧 Integration Examples

### Browser Extension Integration
```javascript
// Check transaction before signing
const analysis = await fetch('/api/analyze-transaction', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contractAddress, transactionData })
});

const result = await analysis.json();
if (result.riskScore > 6) {
  alert('⚠️ High risk transaction detected!');
}
```

### Wallet Integration
```javascript
// Pre-transaction risk check
async function checkTransactionSafety(tx) {
  const response = await rugDetectionAPI.analyze(tx);
  return {
    safe: response.riskScore <= 3,
    warnings: response.recommendations,
    riskLevel: response.analysis.patterns
  };
}
```

## 🏆 Hackathon Submission

**Track**: Dev Tooling  
**Somnia Features**: Leverages sub-second finality for real-time transaction simulation  
**Target Users**: Wallet developers, dApp builders, end users  

### Deliverables
- ✅ Working API deployed on Somnia Testnet
- ✅ Web interface for demo
- ✅ REST API with comprehensive documentation
- ✅ Risk detection engine with 10+ patterns
- ✅ JavaScript SDK for integration
- ✅ Architecture diagram and technical specs

## 🛣️ Roadmap

### Phase 1 (Hackathon - Current)
- [x] Core risk detection patterns
- [x] REST API implementation  
- [x] Web frontend demo
- [x] Basic integration SDK

### Phase 2 (Post-Hackathon)
- [ ] Machine learning risk scoring
- [ ] Real-time wallet monitoring
- [ ] Telegram/Discord bot integration
- [ ] Multi-chain support
- [ ] Advanced honeypot detection

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/risk-levels  
- **Somnia Network**: https://somnia.network
- **Project Repository**: [GitHub Link]

---

**Built for Somnia DeFi Mini Hackathon 2025**  
*Securing the future of DeFi, one transaction at a time* 🛡️
