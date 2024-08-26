// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CommunityReporting
 * @dev Decentralized community reporting system for suspicious contracts and rug pulls
 * @notice Allows users to report threats and build community-driven threat intelligence
 */
contract CommunityReporting is Ownable, ReentrancyGuard {
    uint256 private _reportCounter;
    
    // Report types
    enum ThreatType { 
        RUG_PULL, 
        HONEYPOT, 
        FAKE_TOKEN, 
        PUMP_DUMP, 
        PHISHING, 
        MALICIOUS_CONTRACT,
        SUSPICIOUS_ACTIVITY,
        OTHER 
    }
    
    // Report status
    enum ReportStatus { 
        PENDING,     // Newly submitted
        VERIFIED,    // Verified by community/moderators
        DISPUTED,    // Community disputes the report
        RESOLVED,    // Issue has been resolved
        FALSE_POSITIVE // Determined to be false alarm
    }
    
    // Report structure
    struct ThreatReport {
        uint256 id;
        address reporter;
        address targetContract;
        ThreatType threatType;
        ReportStatus status;
        string description;
        string evidenceHash;    // IPFS hash of evidence
        uint256 timestamp;
        uint256 confirmations;  // Number of users who confirmed
        uint256 disputes;       // Number of users who disputed
        uint256 severity;       // 1-10 scale
        bool resolved;
        address[] confirmers;
        address[] disputers;
    }
    
    // Mappings
    mapping(uint256 => ThreatReport) public reports;
    mapping(address => uint256[]) public contractReports;   // Contract -> Report IDs
    mapping(address => uint256[]) public userReports;       // User -> Report IDs
    mapping(address => mapping(uint256 => bool)) public hasConfirmed; // User -> Report ID -> Confirmed
    mapping(address => mapping(uint256 => bool)) public hasDisputed;  // User -> Report ID -> Disputed
    mapping(address => bool) public moderators;
    mapping(address => uint256) public userReputation;     // Reporter reputation score
    
    // Constants
    uint256 public constant MIN_CONFIRMATIONS = 3;         // Minimum confirmations to verify
    uint256 public constant REPUTATION_BOOST = 10;         // Points for verified reports
    uint256 public constant REPUTATION_PENALTY = 5;        // Points lost for false reports
    uint256 public constant MAX_SEVERITY = 10;             // Maximum severity level
    
    // Events
    event ThreatReported(
        uint256 indexed reportId,
        address indexed reporter,
        address indexed targetContract,
        ThreatType threatType,
        uint256 severity
    );
    
    event ReportConfirmed(uint256 indexed reportId, address indexed confirmer);
    event ReportDisputed(uint256 indexed reportId, address indexed disputer);
    event ReportStatusChanged(uint256 indexed reportId, ReportStatus oldStatus, ReportStatus newStatus);
    event ModeratorAdded(address indexed moderator);
    event ModeratorRemoved(address indexed moderator);
    event ReputationUpdated(address indexed user, uint256 oldReputation, uint256 newReputation);
    
    // Modifiers
    modifier onlyModerator() {
        require(moderators[msg.sender] || msg.sender == owner(), "Not a moderator");
        _;
    }
    
    modifier validReport(uint256 _reportId) {
        require(_reportId <= _reportCounter && _reportId > 0, "Invalid report ID");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        moderators[msg.sender] = true; // Owner is automatically a moderator
        userReputation[msg.sender] = 100; // Initial reputation for owner
    }
    
    /**
     * @dev Submit a new threat report
     * @param _targetContract Address of the suspicious contract
     * @param _threatType Type of threat being reported
     * @param _description Human-readable description of the threat
     * @param _evidenceHash IPFS hash containing evidence (screenshots, transactions, etc.)
     * @param _severity Severity level from 1-10
     */
    function reportThreat(
        address _targetContract,
        ThreatType _threatType,
        string memory _description,
        string memory _evidenceHash,
        uint256 _severity
    ) external nonReentrant {
        require(_targetContract != address(0), "Invalid contract address");
        require(bytes(_description).length > 0, "Description required");
        require(_severity >= 1 && _severity <= MAX_SEVERITY, "Invalid severity level");
        
        _reportCounter++;
        uint256 reportId = _reportCounter;
        
        ThreatReport storage newReport = reports[reportId];
        newReport.id = reportId;
        newReport.reporter = msg.sender;
        newReport.targetContract = _targetContract;
        newReport.threatType = _threatType;
        newReport.status = ReportStatus.PENDING;
        newReport.description = _description;
        newReport.evidenceHash = _evidenceHash;
        newReport.timestamp = block.timestamp;
        newReport.severity = _severity;
        newReport.resolved = false;
        
        contractReports[_targetContract].push(reportId);
        userReports[msg.sender].push(reportId);
        
        emit ThreatReported(reportId, msg.sender, _targetContract, _threatType, _severity);
    }
    
    /**
     * @dev Confirm a threat report (support the report)
     * @param _reportId ID of the report to confirm
     */
    function confirmReport(uint256 _reportId) external validReport(_reportId) {
        require(!hasConfirmed[msg.sender][_reportId], "Already confirmed");
        require(!hasDisputed[msg.sender][_reportId], "Cannot confirm disputed report");
        require(reports[_reportId].reporter != msg.sender, "Cannot confirm own report");
        require(reports[_reportId].status == ReportStatus.PENDING, "Report not pending");
        
        hasConfirmed[msg.sender][_reportId] = true;
        reports[_reportId].confirmations++;
        reports[_reportId].confirmers.push(msg.sender);
        
        emit ReportConfirmed(_reportId, msg.sender);
        
        // Auto-verify if enough confirmations
        if (reports[_reportId].confirmations >= MIN_CONFIRMATIONS && 
            reports[_reportId].confirmations > reports[_reportId].disputes) {
            _updateReportStatus(_reportId, ReportStatus.VERIFIED);
            _updateReputationForVerifiedReport(_reportId);
        }
    }
    
    /**
     * @dev Dispute a threat report (claim it's false)
     * @param _reportId ID of the report to dispute
     */
    function disputeReport(uint256 _reportId) external validReport(_reportId) {
        require(!hasDisputed[msg.sender][_reportId], "Already disputed");
        require(!hasConfirmed[msg.sender][_reportId], "Cannot dispute confirmed report");
        require(reports[_reportId].reporter != msg.sender, "Cannot dispute own report");
        require(reports[_reportId].status == ReportStatus.PENDING, "Report not pending");
        
        hasDisputed[msg.sender][_reportId] = true;
        reports[_reportId].disputes++;
        reports[_reportId].disputers.push(msg.sender);
        
        emit ReportDisputed(_reportId, msg.sender);
        
        // Mark as disputed if more disputes than confirmations
        if (reports[_reportId].disputes > reports[_reportId].confirmations && 
            reports[_reportId].disputes >= MIN_CONFIRMATIONS) {
            _updateReportStatus(_reportId, ReportStatus.DISPUTED);
        }
    }
    
    /**
     * @dev Moderator function to manually update report status
     * @param _reportId ID of the report
     * @param _newStatus New status for the report
     */
    function updateReportStatus(uint256 _reportId, ReportStatus _newStatus) 
        external onlyModerator validReport(_reportId) {
        ReportStatus oldStatus = reports[_reportId].status;
        _updateReportStatus(_reportId, _newStatus);
        
        // Handle reputation changes for status updates
        if (_newStatus == ReportStatus.VERIFIED && oldStatus != ReportStatus.VERIFIED) {
            _updateReputationForVerifiedReport(_reportId);
        } else if (_newStatus == ReportStatus.FALSE_POSITIVE && oldStatus != ReportStatus.FALSE_POSITIVE) {
            _updateReputationForFalseReport(_reportId);
        }
    }
    
    /**
     * @dev Mark a report as resolved
     * @param _reportId ID of the report to resolve
     */
    function resolveReport(uint256 _reportId) external onlyModerator validReport(_reportId) {
        require(reports[_reportId].status == ReportStatus.VERIFIED, "Report must be verified first");
        
        reports[_reportId].resolved = true;
        _updateReportStatus(_reportId, ReportStatus.RESOLVED);
    }
    
    /**
     * @dev Get all reports for a specific contract
     * @param _contract Address of the contract
     * @return uint256[] Array of report IDs
     */
    function getContractReports(address _contract) external view returns (uint256[] memory) {
        return contractReports[_contract];
    }
    
    /**
     * @dev Get all reports submitted by a user
     * @param _user Address of the user
     * @return uint256[] Array of report IDs
     */
    function getUserReports(address _user) external view returns (uint256[] memory) {
        return userReports[_user];
    }
    
    /**
     * @dev Get detailed information about a report
     * @param _reportId ID of the report
     * @return ThreatReport Report details
     */
    function getReport(uint256 _reportId) external view validReport(_reportId) returns (ThreatReport memory) {
        return reports[_reportId];
    }
    
    /**
     * @dev Get threat level for a contract based on community reports
     * @param _contract Address of the contract
     * @return uint256 Threat level (0-100 scale)
     */
    function getContractThreatLevel(address _contract) external view returns (uint256) {
        uint256[] memory reportIds = contractReports[_contract];
        if (reportIds.length == 0) return 0;
        
        uint256 totalThreatScore = 0;
        uint256 verifiedReports = 0;
        
        for (uint256 i = 0; i < reportIds.length; i++) {
            ThreatReport memory report = reports[reportIds[i]];
            if (report.status == ReportStatus.VERIFIED && !report.resolved) {
                totalThreatScore += report.severity * 10; // Scale severity to 0-100
                verifiedReports++;
            }
        }
        
        if (verifiedReports == 0) return 0;
        
        // Average threat score, capped at 100
        uint256 averageThreat = totalThreatScore / verifiedReports;
        return averageThreat > 100 ? 100 : averageThreat;
    }
    
    /**
     * @dev Check if a contract has any unresolved verified threats
     * @param _contract Address of the contract
     * @return bool True if contract has active threats
     */
    function hasActiveThreat(address _contract) external view returns (bool) {
        uint256[] memory reportIds = contractReports[_contract];
        
        for (uint256 i = 0; i < reportIds.length; i++) {
            ThreatReport memory report = reports[reportIds[i]];
            if (report.status == ReportStatus.VERIFIED && !report.resolved) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Get contract threat statistics
     * @param _contract Address of the contract
     * @return totalReports Total number of reports
     * @return verifiedReports Number of verified reports
     * @return resolvedReports Number of resolved reports
     * @return averageSeverity Average severity of verified reports
     */
    function getContractThreatStats(address _contract) external view returns (
        uint256 totalReports,
        uint256 verifiedReports,
        uint256 resolvedReports,
        uint256 averageSeverity
    ) {
        uint256[] memory reportIds = contractReports[_contract];
        totalReports = reportIds.length;
        
        if (totalReports == 0) return (0, 0, 0, 0);
        
        uint256 totalSeverity = 0;
        
        for (uint256 i = 0; i < reportIds.length; i++) {
            ThreatReport memory report = reports[reportIds[i]];
            
            if (report.status == ReportStatus.VERIFIED) {
                verifiedReports++;
                totalSeverity += report.severity;
                
                if (report.resolved) {
                    resolvedReports++;
                }
            }
        }
        
        averageSeverity = verifiedReports > 0 ? totalSeverity / verifiedReports : 0;
    }
    
    /**
     * @dev Add a new moderator
     * @param _moderator Address to add as moderator
     */
    function addModerator(address _moderator) external onlyOwner {
        require(_moderator != address(0), "Invalid moderator address");
        require(!moderators[_moderator], "Already a moderator");
        
        moderators[_moderator] = true;
        userReputation[_moderator] = 100; // Give moderators initial reputation
        
        emit ModeratorAdded(_moderator);
    }
    
    /**
     * @dev Remove a moderator
     * @param _moderator Address to remove from moderators
     */
    function removeModerator(address _moderator) external onlyOwner {
        require(moderators[_moderator], "Not a moderator");
        require(_moderator != owner(), "Cannot remove owner");
        
        moderators[_moderator] = false;
        emit ModeratorRemoved(_moderator);
    }
    
    /**
     * @dev Get total number of reports in the system
     * @return uint256 Total report count
     */
    function getTotalReportsCount() external view returns (uint256) {
        return _reportCounter;
    }
    
    // Internal functions
    function _updateReportStatus(uint256 _reportId, ReportStatus _newStatus) internal {
        ReportStatus oldStatus = reports[_reportId].status;
        reports[_reportId].status = _newStatus;
        emit ReportStatusChanged(_reportId, oldStatus, _newStatus);
    }
    
    function _updateReputationForVerifiedReport(uint256 _reportId) internal {
        address reporter = reports[_reportId].reporter;
        uint256 oldReputation = userReputation[reporter];
        userReputation[reporter] += REPUTATION_BOOST;
        
        emit ReputationUpdated(reporter, oldReputation, userReputation[reporter]);
        
        // Also reward confirmers with smaller reputation boost
        for (uint256 i = 0; i < reports[_reportId].confirmers.length; i++) {
            address confirmer = reports[_reportId].confirmers[i];
            uint256 oldConf = userReputation[confirmer];
            userReputation[confirmer] += REPUTATION_BOOST / 2;
            emit ReputationUpdated(confirmer, oldConf, userReputation[confirmer]);
        }
    }
    
    function _updateReputationForFalseReport(uint256 _reportId) internal {
        address reporter = reports[_reportId].reporter;
        uint256 oldReputation = userReputation[reporter];
        
        if (userReputation[reporter] >= REPUTATION_PENALTY) {
            userReputation[reporter] -= REPUTATION_PENALTY;
        } else {
            userReputation[reporter] = 0;
        }
        
        emit ReputationUpdated(reporter, oldReputation, userReputation[reporter]);
    }
}
