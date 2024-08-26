// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IRugDetectionRegistry {
    function getCurrentRiskLevel(address _contractAddress) external view returns (uint8);
    function hasRecentAnalysis(address _contractAddress) external view returns (bool);
    function getContractStats(address _contractAddress) external view returns (uint256, uint256, uint256);
}

interface ICommunityReporting {
    function getContractThreatLevel(address _contract) external view returns (uint256);
    function hasActiveThreat(address _contract) external view returns (bool);
    function getContractThreatStats(address _contract) external view returns (uint256, uint256, uint256, uint256);
}

/**
 * @title ReputationScoring
 * @dev Decentralized reputation scoring system for smart contracts
 * @notice Aggregates data from multiple sources to provide comprehensive reputation scores
 */
contract ReputationScoring is Ownable, ReentrancyGuard {
    
    // Reputation score structure
    struct ReputationScore {
        uint256 overallScore;      // 0-1000 scale
        uint256 securityScore;     // Based on analysis results
        uint256 communityScore;    // Based on community reports
        uint256 stabilityScore;    // Based on time and activity
        uint256 transparencyScore; // Based on verification status
        uint256 lastUpdated;
        bool isActive;
        uint256 totalInteractions; // Number of times score was calculated
    }
    
    // Historical score tracking
    struct ScoreSnapshot {
        uint256 timestamp;
        uint256 score;
        string reason; // Reason for score change
    }
    
    // Scoring parameters
    struct ScoringParameters {
        uint256 securityWeight;     // Weight for security analysis
        uint256 communityWeight;    // Weight for community reports
        uint256 stabilityWeight;    // Weight for stability metrics
        uint256 transparencyWeight; // Weight for transparency
        uint256 maxScore;           // Maximum possible score
        uint256 decayFactor;        // Time-based score decay factor
    }
    
    // External contract interfaces
    IRugDetectionRegistry public rugDetectionRegistry;
    ICommunityReporting public communityReporting;
    
    // Mappings
    mapping(address => ReputationScore) public reputationScores;
    mapping(address => ScoreSnapshot[]) public scoreHistory;
    mapping(address => bool) public verifiedContracts;
    mapping(address => uint256) public contractDeploymentTime;
    mapping(address => bool) public trustedAnalyzers;
    
    // Scoring parameters
    ScoringParameters public scoringParams;
    
    // Constants
    uint256 public constant SCORE_PRECISION = 1000;  // Maximum score value
    uint256 public constant MIN_STABILITY_DAYS = 30; // Days needed for full stability score
    uint256 public constant DECAY_PERIOD = 86400 * 7; // 7 days decay period
    
    // Events
    event ReputationUpdated(
        address indexed contractAddress,
        uint256 oldScore,
        uint256 newScore,
        string reason
    );
    
    event ContractVerified(address indexed contractAddress, address indexed verifier);
    event ScoringParametersUpdated();
    event TrustedAnalyzerAdded(address indexed analyzer);
    event TrustedAnalyzerRemoved(address indexed analyzer);
    
    // Modifiers
    modifier onlyTrustedAnalyzer() {
        require(trustedAnalyzers[msg.sender] || msg.sender == owner(), "Not a trusted analyzer");
        _;
    }
    
    constructor(
        address _rugDetectionRegistry,
        address _communityReporting
    ) Ownable(msg.sender) {
        rugDetectionRegistry = IRugDetectionRegistry(_rugDetectionRegistry);
        communityReporting = ICommunityReporting(_communityReporting);
        
        // Initialize default scoring parameters
        scoringParams = ScoringParameters({
            securityWeight: 40,      // 40% weight for security
            communityWeight: 30,     // 30% weight for community
            stabilityWeight: 20,     // 20% weight for stability
            transparencyWeight: 10,  // 10% weight for transparency
            maxScore: SCORE_PRECISION,
            decayFactor: 5           // 5% decay per decay period
        });
        
        trustedAnalyzers[msg.sender] = true;
    }
    
    /**
     * @dev Calculate and update reputation score for a contract
     * @param _contractAddress Address of the contract to score
     * @param _reason Reason for the score update
     */
    function updateReputationScore(address _contractAddress, string memory _reason) 
        external onlyTrustedAnalyzer nonReentrant {
        require(_contractAddress != address(0), "Invalid contract address");
        
        uint256 oldScore = reputationScores[_contractAddress].overallScore;
        
        // Calculate new reputation score
        ReputationScore memory newScore = _calculateReputationScore(_contractAddress);
        
        // Store the updated score
        reputationScores[_contractAddress] = newScore;
        reputationScores[_contractAddress].lastUpdated = block.timestamp;
        reputationScores[_contractAddress].totalInteractions++;
        
        // Add to history
        scoreHistory[_contractAddress].push(ScoreSnapshot({
            timestamp: block.timestamp,
            score: newScore.overallScore,
            reason: _reason
        }));
        
        emit ReputationUpdated(_contractAddress, oldScore, newScore.overallScore, _reason);
    }
    
    /**
     * @dev Get current reputation score for a contract
     * @param _contractAddress Address of the contract
     * @return ReputationScore Current reputation data
     */
    function getReputationScore(address _contractAddress) external view returns (ReputationScore memory) {
        ReputationScore memory score = reputationScores[_contractAddress];
        
        // Apply time decay if needed
        if (score.lastUpdated > 0) {
            uint256 timeSinceUpdate = block.timestamp - score.lastUpdated;
            if (timeSinceUpdate > DECAY_PERIOD) {
                uint256 decayPeriods = timeSinceUpdate / DECAY_PERIOD;
                uint256 decayAmount = (score.overallScore * scoringParams.decayFactor * decayPeriods) / 100;
                
                if (score.overallScore > decayAmount) {
                    score.overallScore -= decayAmount;
                    score.securityScore = (score.securityScore * (100 - scoringParams.decayFactor)) / 100;
                    score.communityScore = (score.communityScore * (100 - scoringParams.decayFactor)) / 100;
                }
            }
        }
        
        return score;
    }
    
    /**
     * @dev Get reputation score as a simple 0-100 percentage
     * @param _contractAddress Address of the contract
     * @return uint256 Reputation score as percentage (0-100)
     */
    function getReputationPercentage(address _contractAddress) external view returns (uint256) {
        ReputationScore memory score = this.getReputationScore(_contractAddress);
        return (score.overallScore * 100) / SCORE_PRECISION;
    }
    
    /**
     * @dev Get reputation category (EXCELLENT, GOOD, FAIR, POOR, DANGEROUS)
     * @param _contractAddress Address of the contract
     * @return string Reputation category
     */
    function getReputationCategory(address _contractAddress) external view returns (string memory) {
        uint256 percentage = this.getReputationPercentage(_contractAddress);
        
        if (percentage >= 90) return "EXCELLENT";
        if (percentage >= 75) return "GOOD";
        if (percentage >= 50) return "FAIR";
        if (percentage >= 25) return "POOR";
        return "DANGEROUS";
    }
    
    /**
     * @dev Get score history for a contract
     * @param _contractAddress Address of the contract
     * @return ScoreSnapshot[] Array of historical scores
     */
    function getScoreHistory(address _contractAddress) external view returns (ScoreSnapshot[] memory) {
        return scoreHistory[_contractAddress];
    }
    
    /**
     * @dev Verify a contract (can boost reputation)
     * @param _contractAddress Address of the contract to verify
     */
    function verifyContract(address _contractAddress) external onlyTrustedAnalyzer {
        require(_contractAddress != address(0), "Invalid contract address");
        require(!verifiedContracts[_contractAddress], "Already verified");
        
        verifiedContracts[_contractAddress] = true;
        
        // Update reputation score with verification bonus
        this.updateReputationScore(_contractAddress, "Contract verified by trusted analyzer");
        
        emit ContractVerified(_contractAddress, msg.sender);
    }
    
    /**
     * @dev Set contract deployment time (for stability calculation)
     * @param _contractAddress Address of the contract
     * @param _deploymentTime Deployment timestamp
     */
    function setContractDeploymentTime(address _contractAddress, uint256 _deploymentTime) 
        external onlyTrustedAnalyzer {
        require(_contractAddress != address(0), "Invalid contract address");
        require(_deploymentTime <= block.timestamp, "Future deployment time");
        
        contractDeploymentTime[_contractAddress] = _deploymentTime;
    }
    
    /**
     * @dev Update scoring parameters (only owner)
     * @param _securityWeight Weight for security score
     * @param _communityWeight Weight for community score
     * @param _stabilityWeight Weight for stability score
     * @param _transparencyWeight Weight for transparency score
     * @param _decayFactor Decay factor percentage
     */
    function updateScoringParameters(
        uint256 _securityWeight,
        uint256 _communityWeight,
        uint256 _stabilityWeight,
        uint256 _transparencyWeight,
        uint256 _decayFactor
    ) external onlyOwner {
        require(_securityWeight + _communityWeight + _stabilityWeight + _transparencyWeight == 100,
                "Weights must sum to 100");
        require(_decayFactor <= 20, "Decay factor too high");
        
        scoringParams.securityWeight = _securityWeight;
        scoringParams.communityWeight = _communityWeight;
        scoringParams.stabilityWeight = _stabilityWeight;
        scoringParams.transparencyWeight = _transparencyWeight;
        scoringParams.decayFactor = _decayFactor;
        
        emit ScoringParametersUpdated();
    }
    
    /**
     * @dev Add trusted analyzer
     * @param _analyzer Address to add as trusted analyzer
     */
    function addTrustedAnalyzer(address _analyzer) external onlyOwner {
        require(_analyzer != address(0), "Invalid analyzer address");
        require(!trustedAnalyzers[_analyzer], "Already trusted");
        
        trustedAnalyzers[_analyzer] = true;
        emit TrustedAnalyzerAdded(_analyzer);
    }
    
    /**
     * @dev Remove trusted analyzer
     * @param _analyzer Address to remove from trusted analyzers
     */
    function removeTrustedAnalyzer(address _analyzer) external onlyOwner {
        require(trustedAnalyzers[_analyzer], "Not trusted");
        require(_analyzer != owner(), "Cannot remove owner");
        
        trustedAnalyzers[_analyzer] = false;
        emit TrustedAnalyzerRemoved(_analyzer);
    }
    
    /**
     * @dev Batch update reputation scores for multiple contracts
     * @param _contracts Array of contract addresses
     * @param _reason Reason for batch update
     */
    function batchUpdateScores(address[] memory _contracts, string memory _reason) 
        external onlyTrustedAnalyzer {
        for (uint256 i = 0; i < _contracts.length; i++) {
            this.updateReputationScore(_contracts[i], _reason);
        }
    }
    
    // Internal calculation functions
    function _calculateReputationScore(address _contractAddress) internal view returns (ReputationScore memory) {
        uint256 securityScore = _calculateSecurityScore(_contractAddress);
        uint256 communityScore = _calculateCommunityScore(_contractAddress);
        uint256 stabilityScore = _calculateStabilityScore(_contractAddress);
        uint256 transparencyScore = _calculateTransparencyScore(_contractAddress);
        
        // Calculate weighted overall score
        uint256 overallScore = (
            (securityScore * scoringParams.securityWeight) +
            (communityScore * scoringParams.communityWeight) +
            (stabilityScore * scoringParams.stabilityWeight) +
            (transparencyScore * scoringParams.transparencyWeight)
        ) / 100;
        
        return ReputationScore({
            overallScore: overallScore,
            securityScore: securityScore,
            communityScore: communityScore,
            stabilityScore: stabilityScore,
            transparencyScore: transparencyScore,
            lastUpdated: block.timestamp,
            isActive: true,
            totalInteractions: reputationScores[_contractAddress].totalInteractions
        });
    }
    
    function _calculateSecurityScore(address _contractAddress) internal view returns (uint256) {
        try rugDetectionRegistry.getCurrentRiskLevel(_contractAddress) returns (uint8 riskLevel) {
            // Convert risk level (0-3) to security score (1000-0)
            if (riskLevel == 0) return SCORE_PRECISION;         // LOW risk = perfect score
            if (riskLevel == 1) return (SCORE_PRECISION * 70) / 100;  // MEDIUM risk = 70%
            if (riskLevel == 2) return (SCORE_PRECISION * 30) / 100;  // HIGH risk = 30%
            return 0;                                           // CRITICAL risk = 0%
        } catch {
            return SCORE_PRECISION / 2; // Default to 50% if no analysis available
        }
    }
    
    function _calculateCommunityScore(address _contractAddress) internal view returns (uint256) {
        try communityReporting.getContractThreatLevel(_contractAddress) returns (uint256 threatLevel) {
            // Convert threat level (0-100) to community score (1000-0)
            if (threatLevel == 0) return SCORE_PRECISION;
            
            uint256 communityScore = SCORE_PRECISION - ((threatLevel * SCORE_PRECISION) / 100);
            return communityScore;
        } catch {
            return SCORE_PRECISION; // Default to perfect score if no community reports
        }
    }
    
    function _calculateStabilityScore(address _contractAddress) internal view returns (uint256) {
        uint256 deploymentTime = contractDeploymentTime[_contractAddress];
        if (deploymentTime == 0) return SCORE_PRECISION / 2; // Default if unknown
        
        uint256 age = block.timestamp - deploymentTime;
        uint256 ageInDays = age / 86400; // Convert to days
        
        if (ageInDays >= MIN_STABILITY_DAYS) {
            return SCORE_PRECISION; // Full score for mature contracts
        } else {
            // Linear increase based on age
            return (SCORE_PRECISION * ageInDays) / MIN_STABILITY_DAYS;
        }
    }
    
    function _calculateTransparencyScore(address _contractAddress) internal view returns (uint256) {
        uint256 score = SCORE_PRECISION / 2; // Base score 50%
        
        // Boost for verified contracts
        if (verifiedContracts[_contractAddress]) {
            score += SCORE_PRECISION / 4; // +25% for verification
        }
        
        // Boost for having recent analysis
        try rugDetectionRegistry.hasRecentAnalysis(_contractAddress) returns (bool hasRecent) {
            if (hasRecent) {
                score += SCORE_PRECISION / 4; // +25% for recent analysis
            }
        } catch {
            // No penalty for external call failure
        }
        
        return score > SCORE_PRECISION ? SCORE_PRECISION : score;
    }
    
    /**
     * @dev Emergency function to update external contract addresses
     * @param _rugDetectionRegistry New registry address
     * @param _communityReporting New community reporting address
     */
    function updateExternalContracts(
        address _rugDetectionRegistry,
        address _communityReporting
    ) external onlyOwner {
        require(_rugDetectionRegistry != address(0), "Invalid registry address");
        require(_communityReporting != address(0), "Invalid reporting address");
        
        rugDetectionRegistry = IRugDetectionRegistry(_rugDetectionRegistry);
        communityReporting = ICommunityReporting(_communityReporting);
    }
}
