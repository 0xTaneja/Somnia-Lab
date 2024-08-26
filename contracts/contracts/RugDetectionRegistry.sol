// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RugDetectionRegistry
 * @dev Main contract for storing and managing rug detection analysis results on-chain
 * @notice This contract provides immutable audit trails for all security analyses
 */
contract RugDetectionRegistry is Ownable, ReentrancyGuard {
    uint256 private _analysisCounter;
    
    // Analysis result structure
    struct AnalysisResult {
        uint256 id;
        address contractAddress;
        uint8 riskScore;        // 0-100
        uint8 riskLevel;        // 0=LOW, 1=MEDIUM, 2=HIGH, 3=CRITICAL
        uint256 timestamp;
        address analyzer;       // Address that submitted the analysis
        string ipfsHash;        // IPFS hash of detailed analysis data
        bool verified;          // Whether this analysis has been verified
        uint256 confidence;     // Confidence level 0-100
    }
    
    // Risk level enum for clarity
    enum RiskLevel { LOW, MEDIUM, HIGH, CRITICAL }
    
    // Mappings
    mapping(uint256 => AnalysisResult) public analyses;
    mapping(address => uint256[]) public contractAnalyses; // Contract -> Analysis IDs
    mapping(address => bool) public authorizedAnalyzers;
    mapping(address => uint256) public contractLatestAnalysis;
    
    // Events
    event AnalysisSubmitted(
        uint256 indexed analysisId,
        address indexed contractAddress,
        uint8 riskScore,
        uint8 riskLevel,
        address indexed analyzer
    );
    
    event AnalysisVerified(uint256 indexed analysisId, address indexed verifier);
    event AnalyzerAuthorized(address indexed analyzer);
    event AnalyzerRevoked(address indexed analyzer);
    event RiskLevelUpdated(address indexed contractAddress, uint8 oldLevel, uint8 newLevel);
    
    // Modifiers
    modifier onlyAuthorizedAnalyzer() {
        require(authorizedAnalyzers[msg.sender] || msg.sender == owner(), "Not authorized analyzer");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        authorizedAnalyzers[msg.sender] = true; // Owner is automatically authorized
    }
    
    /**
     * @dev Submit a new analysis result to the registry
     * @param _contractAddress Address of the analyzed contract
     * @param _riskScore Risk score from 0-100
     * @param _riskLevel Risk level (0=LOW, 1=MEDIUM, 2=HIGH, 3=CRITICAL)
     * @param _ipfsHash IPFS hash containing detailed analysis data
     * @param _confidence Confidence level of the analysis (0-100)
     */
    function submitAnalysis(
        address _contractAddress,
        uint8 _riskScore,
        uint8 _riskLevel,
        string memory _ipfsHash,
        uint256 _confidence
    ) external onlyAuthorizedAnalyzer nonReentrant {
        require(_contractAddress != address(0), "Invalid contract address");
        require(_riskScore <= 100, "Risk score must be <= 100");
        require(_riskLevel <= 3, "Invalid risk level");
        require(_confidence <= 100, "Confidence must be <= 100");
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");
        
        _analysisCounter++;
        uint256 analysisId = _analysisCounter;
        
        AnalysisResult memory newAnalysis = AnalysisResult({
            id: analysisId,
            contractAddress: _contractAddress,
            riskScore: _riskScore,
            riskLevel: _riskLevel,
            timestamp: block.timestamp,
            analyzer: msg.sender,
            ipfsHash: _ipfsHash,
            verified: false,
            confidence: _confidence
        });
        
        analyses[analysisId] = newAnalysis;
        contractAnalyses[_contractAddress].push(analysisId);
        
        // Update latest analysis for quick access
        uint256 previousLatest = contractLatestAnalysis[_contractAddress];
        contractLatestAnalysis[_contractAddress] = analysisId;
        
        emit AnalysisSubmitted(analysisId, _contractAddress, _riskScore, _riskLevel, msg.sender);
        
        // Emit risk level update if changed
        if (previousLatest > 0) {
            uint8 oldLevel = analyses[previousLatest].riskLevel;
            if (oldLevel != _riskLevel) {
                emit RiskLevelUpdated(_contractAddress, oldLevel, _riskLevel);
            }
        }
    }
    
    /**
     * @dev Verify an analysis result (can be called by other authorized analyzers)
     * @param _analysisId ID of the analysis to verify
     */
    function verifyAnalysis(uint256 _analysisId) external onlyAuthorizedAnalyzer {
        require(_analysisId <= _analysisCounter, "Analysis does not exist");
        require(!analyses[_analysisId].verified, "Already verified");
        require(analyses[_analysisId].analyzer != msg.sender, "Cannot verify own analysis");
        
        analyses[_analysisId].verified = true;
        emit AnalysisVerified(_analysisId, msg.sender);
    }
    
    /**
     * @dev Get the latest analysis for a contract
     * @param _contractAddress Address of the contract
     * @return AnalysisResult Latest analysis data
     */
    function getLatestAnalysis(address _contractAddress) external view returns (AnalysisResult memory) {
        uint256 latestId = contractLatestAnalysis[_contractAddress];
        require(latestId > 0, "No analysis found for contract");
        return analyses[latestId];
    }
    
    /**
     * @dev Get analysis by ID
     * @param _analysisId ID of the analysis
     * @return AnalysisResult Analysis data
     */
    function getAnalysis(uint256 _analysisId) external view returns (AnalysisResult memory) {
        require(_analysisId <= _analysisCounter, "Analysis does not exist");
        return analyses[_analysisId];
    }
    
    /**
     * @dev Get all analysis IDs for a contract
     * @param _contractAddress Address of the contract
     * @return uint256[] Array of analysis IDs
     */
    function getContractAnalyses(address _contractAddress) external view returns (uint256[] memory) {
        return contractAnalyses[_contractAddress];
    }
    
    /**
     * @dev Get current risk level for a contract
     * @param _contractAddress Address of the contract
     * @return uint8 Current risk level (0=LOW, 1=MEDIUM, 2=HIGH, 3=CRITICAL)
     */
    function getCurrentRiskLevel(address _contractAddress) external view returns (uint8) {
        uint256 latestId = contractLatestAnalysis[_contractAddress];
        if (latestId == 0) return 0; // Default to LOW if no analysis
        return analyses[latestId].riskLevel;
    }
    
    /**
     * @dev Check if a contract has been analyzed recently (within 24 hours)
     * @param _contractAddress Address of the contract
     * @return bool True if analyzed recently
     */
    function hasRecentAnalysis(address _contractAddress) external view returns (bool) {
        uint256 latestId = contractLatestAnalysis[_contractAddress];
        if (latestId == 0) return false;
        return (block.timestamp - analyses[latestId].timestamp) <= 86400; // 24 hours
    }
    
    /**
     * @dev Get analysis statistics for a contract
     * @param _contractAddress Address of the contract
     * @return totalAnalyses Total number of analyses
     * @return averageRiskScore Average risk score across all analyses
     * @return verifiedAnalyses Number of verified analyses
     */
    function getContractStats(address _contractAddress) external view returns (
        uint256 totalAnalyses,
        uint256 averageRiskScore,
        uint256 verifiedAnalyses
    ) {
        uint256[] memory analysisIds = contractAnalyses[_contractAddress];
        totalAnalyses = analysisIds.length;
        
        if (totalAnalyses == 0) return (0, 0, 0);
        
        uint256 totalScore = 0;
        verifiedAnalyses = 0;
        
        for (uint256 i = 0; i < totalAnalyses; i++) {
            AnalysisResult memory analysis = analyses[analysisIds[i]];
            totalScore += analysis.riskScore;
            if (analysis.verified) verifiedAnalyses++;
        }
        
        averageRiskScore = totalScore / totalAnalyses;
    }
    
    /**
     * @dev Authorize a new analyzer
     * @param _analyzer Address to authorize
     */
    function authorizeAnalyzer(address _analyzer) external onlyOwner {
        require(_analyzer != address(0), "Invalid analyzer address");
        require(!authorizedAnalyzers[_analyzer], "Already authorized");
        
        authorizedAnalyzers[_analyzer] = true;
        emit AnalyzerAuthorized(_analyzer);
    }
    
    /**
     * @dev Revoke analyzer authorization
     * @param _analyzer Address to revoke
     */
    function revokeAnalyzer(address _analyzer) external onlyOwner {
        require(authorizedAnalyzers[_analyzer], "Not authorized");
        require(_analyzer != owner(), "Cannot revoke owner");
        
        authorizedAnalyzers[_analyzer] = false;
        emit AnalyzerRevoked(_analyzer);
    }
    
    /**
     * @dev Get total number of analyses in the registry
     * @return uint256 Total analysis count
     */
    function getTotalAnalysesCount() external view returns (uint256) {
        return _analysisCounter;
    }
    
    /**
     * @dev Batch get multiple analyses
     * @param _analysisIds Array of analysis IDs to retrieve
     * @return AnalysisResult[] Array of analysis results
     */
    function batchGetAnalyses(uint256[] memory _analysisIds) external view returns (AnalysisResult[] memory) {
        AnalysisResult[] memory results = new AnalysisResult[](_analysisIds.length);
        
        for (uint256 i = 0; i < _analysisIds.length; i++) {
            require(_analysisIds[i] <= _analysisCounter, "Analysis does not exist");
            results[i] = analyses[_analysisIds[i]];
        }
        
        return results;
    }
    
    /**
     * @dev Emergency function to pause contract (inherited from Ownable)
     * @notice This is for emergency situations only
     */
    function emergencyPause() external onlyOwner {
        // Implementation for emergency pause if needed
        // For now, this is a placeholder for future emergency functionality
    }
}
