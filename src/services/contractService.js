const { ethers } = require('ethers');
const config = require('../config');

// Contract ABIs (simplified for key functions)
const REGISTRY_ABI = [
  "function submitAnalysis(address _contractAddress, uint8 _riskScore, uint8 _riskLevel, string memory _ipfsHash, uint256 _confidence) external",
  "function getLatestAnalysis(address _contractAddress) external view returns (tuple(uint256 id, address contractAddress, uint8 riskScore, uint8 riskLevel, uint256 timestamp, address analyzer, string ipfsHash, bool verified, uint256 confidence))",
  "function getCurrentRiskLevel(address _contractAddress) external view returns (uint8)",
  "function hasRecentAnalysis(address _contractAddress) external view returns (bool)",
  "function getContractStats(address _contractAddress) external view returns (uint256, uint256, uint256)",
  "function authorizeAnalyzer(address _analyzer) external",
  "function verifyAnalysis(uint256 _analysisId) external",
  "event AnalysisSubmitted(uint256 indexed analysisId, address indexed contractAddress, uint8 riskScore, uint8 riskLevel, address indexed analyzer)"
];

const COMMUNITY_ABI = [
  "function reportThreat(address _targetContract, uint8 _threatType, string memory _description, string memory _evidenceHash, uint256 _severity) external",
  "function confirmReport(uint256 _reportId) external",
  "function disputeReport(uint256 _reportId) external",
  "function getContractThreatLevel(address _contract) external view returns (uint256)",
  "function hasActiveThreat(address _contract) external view returns (bool)",
  "function getContractReports(address _contract) external view returns (uint256[])",
  "event ThreatReported(uint256 indexed reportId, address indexed reporter, address indexed targetContract, uint8 threatType, uint256 severity)"
];

const REPUTATION_ABI = [
  "function updateReputationScore(address _contractAddress, string memory _reason) external",
  "function getReputationScore(address _contractAddress) external view returns (tuple(uint256 overallScore, uint256 securityScore, uint256 communityScore, uint256 stabilityScore, uint256 transparencyScore, uint256 lastUpdated, bool isActive, uint256 totalInteractions))",
  "function getReputationPercentage(address _contractAddress) external view returns (uint256)",
  "function getReputationCategory(address _contractAddress) external view returns (string)",
  "function verifyContract(address _contractAddress) external",
  "function setContractDeploymentTime(address _contractAddress, uint256 _deploymentTime) external",
  "event ReputationUpdated(address indexed contractAddress, uint256 oldScore, uint256 newScore, string reason)"
];

const ALERT_ABI = [
  "function createAlert(uint8 _alertType, uint8 _severity, address _targetContract, string memory _title, string memory _description, string memory _actionRequired, bytes memory _alertData, bool _broadcastGlobally, uint256 _expiryDuration) external",
  "function subscribeToAlerts(uint8[] memory _alertTypes, uint8 _minSeverity, address[] memory _watchedContracts, bool _globalAlerts) external",
  "function acknowledgeAlert(uint256 _alertId) external",
  "function resolveAlert(uint256 _alertId) external",
  "function getContractAlerts(address _contract, bool _onlyActive) external view returns (uint256[])",
  "function hasCriticalAlerts(address _contract) external view returns (bool)",
  "function getContractAlertStats(address _contract) external view returns (uint256, uint256, uint256, uint256)",
  "event AlertCreated(uint256 indexed alertId, uint8 indexed alertType, uint8 indexed severity, address targetContract, address reporter)"
];

class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.contractAddresses = {};
    this.initialized = false;
    this.isReadOnly = true; // Default to read-only mode
  }

  async initialize(contractAddresses = null, privateKey = null) {
    try {
      console.log('🔗 Initializing Contract Service...');
      
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(config.SOMNIA_RPC_URL);
      
      // Initialize signer if private key provided
      if (privateKey) {
        this.signer = new ethers.Wallet(privateKey, this.provider);
        this.isReadOnly = false;
        console.log(`🔐 Signer initialized: ${this.signer.address}`);
      } else {
        console.log('👀 Running in read-only mode (no private key provided)');
      }
      
      // Load contract addresses
      if (contractAddresses) {
        this.contractAddresses = contractAddresses;
      } else {
        // Try to load from deployment file
        this.contractAddresses = await this.loadLatestDeployment();
      }
      
      if (!this.contractAddresses || Object.keys(this.contractAddresses).length === 0) {
        console.log('⚠️ No contract addresses provided - contracts not available');
        this.initialized = true;
        return;
      }
      
      // Initialize contract instances
      await this.initializeContracts();
      
      this.initialized = true;
      console.log('✅ Contract Service initialized');
      
    } catch (error) {
      console.error('❌ Contract Service initialization failed:', error.message);
      this.initialized = false;
    }
  }

  async loadLatestDeployment() {
    try {
      const fs = require('fs');
      const path = require('path');
      const deploymentFile = path.join(__dirname, '../../contracts/deployments/latest-50312.json');
      
      if (fs.existsSync(deploymentFile)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
        console.log('📄 Loaded contract addresses from deployment file');
        return deployment.contracts;
      }
    } catch (error) {
      console.log('⚠️ Could not load deployment file:', error.message);
    }
    
    return null;
  }

  async initializeContracts() {
    try {
      const connectionProvider = this.signer || this.provider;
      
      // Initialize RugDetectionRegistry
      if (this.contractAddresses.rugDetectionRegistry) {
        this.contracts.registry = new ethers.Contract(
          this.contractAddresses.rugDetectionRegistry,
          REGISTRY_ABI,
          connectionProvider
        );
        console.log(`✅ RugDetectionRegistry connected: ${this.contractAddresses.rugDetectionRegistry}`);
      }
      
      // Initialize CommunityReporting
      if (this.contractAddresses.communityReporting) {
        this.contracts.community = new ethers.Contract(
          this.contractAddresses.communityReporting,
          COMMUNITY_ABI,
          connectionProvider
        );
        console.log(`✅ CommunityReporting connected: ${this.contractAddresses.communityReporting}`);
      }
      
      // Initialize ReputationScoring
      if (this.contractAddresses.reputationScoring) {
        this.contracts.reputation = new ethers.Contract(
          this.contractAddresses.reputationScoring,
          REPUTATION_ABI,
          connectionProvider
        );
        console.log(`✅ ReputationScoring connected: ${this.contractAddresses.reputationScoring}`);
      }
      
      // Initialize AlertManager
      if (this.contractAddresses.alertManager) {
        this.contracts.alerts = new ethers.Contract(
          this.contractAddresses.alertManager,
          ALERT_ABI,
          connectionProvider
        );
        console.log(`✅ AlertManager connected: ${this.contractAddresses.alertManager}`);
      }
      
    } catch (error) {
      throw new Error(`Contract initialization failed: ${error.message}`);
    }
  }

  // Analysis Registry Functions
  async submitAnalysisToChain(contractAddress, riskScore, riskLevel, ipfsHash, confidence) {
    if (!this.contracts.registry || this.isReadOnly) {
      console.log('⚠️ Registry contract not available or read-only mode');
      return null;
    }

    try {
      const tx = await this.contracts.registry.submitAnalysis(
        contractAddress,
        riskScore,
        riskLevel,
        ipfsHash,
        confidence
      );
      
      const receipt = await tx.wait();
      console.log(`📊 Analysis submitted to chain: ${receipt.hash}`);
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Failed to submit analysis to chain:', error);
      throw error;
    }
  }

  async getLatestAnalysisFromChain(contractAddress) {
    if (!this.contracts.registry) {
      return null;
    }

    try {
      const analysis = await this.contracts.registry.getLatestAnalysis(contractAddress);
      
      return {
        id: analysis.id.toString(),
        contractAddress: analysis.contractAddress,
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        timestamp: Number(analysis.timestamp) * 1000, // Convert to milliseconds
        analyzer: analysis.analyzer,
        ipfsHash: analysis.ipfsHash,
        verified: analysis.verified,
        confidence: analysis.confidence.toString()
      };
    } catch (error) {
      console.log(`No on-chain analysis found for ${contractAddress}`);
      return null;
    }
  }

  async getCurrentRiskLevelFromChain(contractAddress) {
    if (!this.contracts.registry) {
      return null;
    }

    try {
      const riskLevel = await this.contracts.registry.getCurrentRiskLevel(contractAddress);
      return Number(riskLevel);
    } catch (error) {
      return null;
    }
  }

  // Community Reporting Functions
  async reportThreatToChain(targetContract, threatType, description, evidenceHash, severity) {
    if (!this.contracts.community || this.isReadOnly) {
      console.log('⚠️ Community contract not available or read-only mode');
      return null;
    }

    try {
      const tx = await this.contracts.community.reportThreat(
        targetContract,
        threatType,
        description,
        evidenceHash,
        severity
      );
      
      const receipt = await tx.wait();
      console.log(`👥 Threat reported to chain: ${receipt.hash}`);
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Failed to report threat to chain:', error);
      throw error;
    }
  }

  async getContractThreatLevelFromChain(contractAddress) {
    if (!this.contracts.community) {
      return 0;
    }

    try {
      const threatLevel = await this.contracts.community.getContractThreatLevel(contractAddress);
      return Number(threatLevel);
    } catch (error) {
      return 0;
    }
  }

  async hasActiveThreatFromChain(contractAddress) {
    if (!this.contracts.community) {
      return false;
    }

    try {
      return await this.contracts.community.hasActiveThreat(contractAddress);
    } catch (error) {
      return false;
    }
  }

  // Reputation Functions
  async updateReputationScoreOnChain(contractAddress, reason) {
    if (!this.contracts.reputation || this.isReadOnly) {
      console.log('⚠️ Reputation contract not available or read-only mode');
      return null;
    }

    try {
      const tx = await this.contracts.reputation.updateReputationScore(contractAddress, reason);
      const receipt = await tx.wait();
      
      console.log(`🏆 Reputation updated on chain: ${receipt.hash}`);
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Failed to update reputation on chain:', error);
      throw error;
    }
  }

  async getReputationScoreFromChain(contractAddress) {
    if (!this.contracts.reputation) {
      return null;
    }

    try {
      const reputation = await this.contracts.reputation.getReputationScore(contractAddress);
      
      return {
        overallScore: reputation.overallScore.toString(),
        securityScore: reputation.securityScore.toString(),
        communityScore: reputation.communityScore.toString(),
        stabilityScore: reputation.stabilityScore.toString(),
        transparencyScore: reputation.transparencyScore.toString(),
        lastUpdated: Number(reputation.lastUpdated) * 1000,
        isActive: reputation.isActive,
        totalInteractions: reputation.totalInteractions.toString()
      };
    } catch (error) {
      return null;
    }
  }

  async getReputationPercentageFromChain(contractAddress) {
    if (!this.contracts.reputation) {
      return 0;
    }

    try {
      const percentage = await this.contracts.reputation.getReputationPercentage(contractAddress);
      return Number(percentage);
    } catch (error) {
      return 0;
    }
  }

  async getReputationCategoryFromChain(contractAddress) {
    if (!this.contracts.reputation) {
      return 'UNKNOWN';
    }

    try {
      return await this.contracts.reputation.getReputationCategory(contractAddress);
    } catch (error) {
      return 'UNKNOWN';
    }
  }

  // Alert Functions
  async createAlertOnChain(alertType, severity, targetContract, title, description, actionRequired, broadcastGlobally = false, expiryDuration = 0) {
    if (!this.contracts.alerts || this.isReadOnly) {
      console.log('⚠️ Alert contract not available or read-only mode');
      return null;
    }

    try {
      const tx = await this.contracts.alerts.createAlert(
        alertType,
        severity,
        targetContract,
        title,
        description,
        actionRequired,
        '0x', // Empty alert data
        broadcastGlobally,
        expiryDuration
      );
      
      const receipt = await tx.wait();
      console.log(`🚨 Alert created on chain: ${receipt.hash}`);
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Failed to create alert on chain:', error);
      throw error;
    }
  }

  async hasCriticalAlertsFromChain(contractAddress) {
    if (!this.contracts.alerts) {
      return false;
    }

    try {
      return await this.contracts.alerts.hasCriticalAlerts(contractAddress);
    } catch (error) {
      return false;
    }
  }

  async getContractAlertStatsFromChain(contractAddress) {
    if (!this.contracts.alerts) {
      return { totalAlerts: 0, activeAlerts: 0, criticalAlerts: 0, lastAlertTime: 0 };
    }

    try {
      const stats = await this.contracts.alerts.getContractAlertStats(contractAddress);
      
      return {
        totalAlerts: Number(stats[0]),
        activeAlerts: Number(stats[1]),
        criticalAlerts: Number(stats[2]),
        lastAlertTime: Number(stats[3]) * 1000
      };
    } catch (error) {
      return { totalAlerts: 0, activeAlerts: 0, criticalAlerts: 0, lastAlertTime: 0 };
    }
  }

  // Utility Functions
  async getNetworkInfo() {
    if (!this.provider) {
      return null;
    }

    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        chainId: network.chainId.toString(),
        name: network.name,
        blockNumber,
        contractsAvailable: Object.keys(this.contracts).length > 0,
        contractAddresses: this.contractAddresses,
        readOnlyMode: this.isReadOnly
      };
    } catch (error) {
      return null;
    }
  }

  async estimateGasForAnalysisSubmission(contractAddress, riskScore, riskLevel, ipfsHash, confidence) {
    if (!this.contracts.registry) {
      return null;
    }

    try {
      const gasEstimate = await this.contracts.registry.submitAnalysis.estimateGas(
        contractAddress,
        riskScore,
        riskLevel,
        ipfsHash,
        confidence
      );
      
      return {
        gasLimit: gasEstimate.toString(),
        estimatedCostGwei: '6', // Somnia gas price
        estimatedCostEth: ethers.formatEther(gasEstimate * ethers.parseUnits('6', 'gwei'))
      };
    } catch (error) {
      return null;
    }
  }

  // Enhanced analysis function that combines on-chain and off-chain data
  async getEnhancedContractAnalysis(contractAddress) {
    if (!this.initialized) {
      return { onChainDataAvailable: false };
    }

    try {
      const [
        latestAnalysis,
        riskLevel,
        threatLevel,
        hasThreats,
        reputationScore,
        reputationPercentage,
        reputationCategory,
        hasCriticalAlerts,
        alertStats
      ] = await Promise.allSettled([
        this.getLatestAnalysisFromChain(contractAddress),
        this.getCurrentRiskLevelFromChain(contractAddress),
        this.getContractThreatLevelFromChain(contractAddress),
        this.hasActiveThreatFromChain(contractAddress),
        this.getReputationScoreFromChain(contractAddress),
        this.getReputationPercentageFromChain(contractAddress),
        this.getReputationCategoryFromChain(contractAddress),
        this.hasCriticalAlertsFromChain(contractAddress),
        this.getContractAlertStatsFromChain(contractAddress)
      ]);

      return {
        onChainDataAvailable: true,
        contractAddress,
        latestAnalysis: latestAnalysis.status === 'fulfilled' ? latestAnalysis.value : null,
        currentRiskLevel: riskLevel.status === 'fulfilled' ? riskLevel.value : null,
        communityThreatLevel: threatLevel.status === 'fulfilled' ? threatLevel.value : 0,
        hasActiveThreats: hasThreats.status === 'fulfilled' ? hasThreats.value : false,
        reputationScore: reputationScore.status === 'fulfilled' ? reputationScore.value : null,
        reputationPercentage: reputationPercentage.status === 'fulfilled' ? reputationPercentage.value : 0,
        reputationCategory: reputationCategory.status === 'fulfilled' ? reputationCategory.value : 'UNKNOWN',
        hasCriticalAlerts: hasCriticalAlerts.status === 'fulfilled' ? hasCriticalAlerts.value : false,
        alertStats: alertStats.status === 'fulfilled' ? alertStats.value : null,
        timestamp: new Date().toISOString(),
        networkInfo: await this.getNetworkInfo()
      };
    } catch (error) {
      console.error('Error getting enhanced contract analysis:', error);
      return { 
        onChainDataAvailable: false, 
        error: error.message,
        contractAddress 
      };
    }
  }

  isAvailable() {
    return this.initialized && Object.keys(this.contracts).length > 0;
  }

  getContractAddresses() {
    return this.contractAddresses;
  }

  getAvailableContracts() {
    return Object.keys(this.contracts);
  }
}

module.exports = new ContractService();
