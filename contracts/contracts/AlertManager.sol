// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AlertManager
 * @dev Decentralized alert management system for real-time security notifications
 * @notice Manages security alerts, subscriptions, and automated notifications
 */
contract AlertManager is Ownable, ReentrancyGuard {
    uint256 private _alertCounter;
    
    // Alert types
    enum AlertType {
        RISK_SCORE_CHANGE,
        NEW_THREAT_REPORT,
        RUG_PULL_DETECTED,
        HONEYPOT_WARNING,
        WHALE_MOVEMENT,
        SUSPICIOUS_ACTIVITY,
        CONTRACT_PAUSED,
        LIQUIDITY_REMOVED,
        PRICE_MANIPULATION,
        SOCIAL_SENTIMENT_ALERT
    }
    
    // Alert severity levels
    enum AlertSeverity {
        INFO,       // 0 - Informational
        LOW,        // 1 - Low priority
        MEDIUM,     // 2 - Medium priority
        HIGH,       // 3 - High priority
        CRITICAL    // 4 - Critical, immediate action required
    }
    
    // Alert status
    enum AlertStatus {
        ACTIVE,     // Alert is active
        RESOLVED,   // Alert has been resolved
        DISMISSED,  // Alert was dismissed by user
        EXPIRED     // Alert has expired
    }
    
    // Alert structure
    struct SecurityAlert {
        uint256 id;
        AlertType alertType;
        AlertSeverity severity;
        AlertStatus status;
        address targetContract;
        address reporter;       // Who reported/triggered the alert
        string title;
        string description;
        string actionRequired;  // Recommended action for users
        uint256 timestamp;
        uint256 expiresAt;     // When alert expires (0 = never)
        bytes alertData;       // Additional alert-specific data
        bool broadcastGlobally; // Whether to broadcast to all subscribers
        uint256 affectedUsers; // Number of users affected/notified
    }
    
    // Subscription structure
    struct AlertSubscription {
        address subscriber;
        AlertType[] alertTypes;     // Types of alerts to receive
        AlertSeverity minSeverity;  // Minimum severity to receive
        address[] watchedContracts; // Specific contracts to monitor
        bool globalAlerts;          // Receive global alerts
        bool isActive;
        uint256 createdAt;
        uint256 lastAlertReceived;
    }
    
    // Mappings
    mapping(uint256 => SecurityAlert) public alerts;
    mapping(address => AlertSubscription) public subscriptions;
    mapping(address => uint256[]) public userAlerts;        // User -> Alert IDs received
    mapping(address => uint256[]) public contractAlerts;    // Contract -> Alert IDs
    mapping(AlertType => uint256) public alertTypeCount;   // Count by type
    mapping(address => bool) public alertReporters;        // Authorized alert reporters
    mapping(uint256 => mapping(address => bool)) public alertAcknowledged; // Alert ID -> User -> Acknowledged
    
    // Alert thresholds and limits
    uint256 public constant MAX_ALERTS_PER_CONTRACT_PER_DAY = 10;
    uint256 public constant MAX_SUBSCRIPTION_CONTRACTS = 50;
    uint256 public constant DEFAULT_ALERT_EXPIRY = 86400 * 7; // 7 days
    
    // Events
    event AlertCreated(
        uint256 indexed alertId,
        AlertType indexed alertType,
        AlertSeverity indexed severity,
        address targetContract,
        address reporter
    );
    
    event AlertResolved(uint256 indexed alertId, address indexed resolver);
    event AlertDismissed(uint256 indexed alertId, address indexed user);
    event AlertExpired(uint256 indexed alertId);
    event UserSubscribed(address indexed user, AlertType[] alertTypes);
    event UserUnsubscribed(address indexed user);
    event AlertBroadcast(uint256 indexed alertId, uint256 subscribersNotified);
    event AlertAcknowledged(uint256 indexed alertId, address indexed user);
    event ReporterAuthorized(address indexed reporter);
    event ReporterRevoked(address indexed reporter);
    
    // Modifiers
    modifier onlyAuthorizedReporter() {
        require(alertReporters[msg.sender] || msg.sender == owner(), "Not authorized reporter");
        _;
    }
    
    modifier validAlert(uint256 _alertId) {
        require(_alertId <= _alertCounter && _alertId > 0, "Invalid alert ID");
        _;
    }
    
    modifier activeSubscriber() {
        require(subscriptions[msg.sender].isActive, "No active subscription");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        alertReporters[msg.sender] = true; // Owner is automatically authorized
    }
    
    /**
     * @dev Create a new security alert
     * @param _alertType Type of the alert
     * @param _severity Severity level of the alert
     * @param _targetContract Contract address the alert is about
     * @param _title Short title for the alert
     * @param _description Detailed description of the alert
     * @param _actionRequired Recommended action for users
     * @param _alertData Additional alert-specific data
     * @param _broadcastGlobally Whether to broadcast to all subscribers
     * @param _expiryDuration How long the alert stays active (0 = never expires)
     */
    function createAlert(
        AlertType _alertType,
        AlertSeverity _severity,
        address _targetContract,
        string memory _title,
        string memory _description,
        string memory _actionRequired,
        bytes memory _alertData,
        bool _broadcastGlobally,
        uint256 _expiryDuration
    ) external onlyAuthorizedReporter nonReentrant {
        require(_targetContract != address(0), "Invalid contract address");
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_description).length > 0, "Description required");
        
        // Check rate limiting
        require(_checkRateLimit(_targetContract), "Rate limit exceeded for contract");
        
        _alertCounter++;
        uint256 alertId = _alertCounter;
        
        uint256 expiresAt = 0;
        if (_expiryDuration > 0) {
            expiresAt = block.timestamp + _expiryDuration;
        }
        
        SecurityAlert storage newAlert = alerts[alertId];
        newAlert.id = alertId;
        newAlert.alertType = _alertType;
        newAlert.severity = _severity;
        newAlert.status = AlertStatus.ACTIVE;
        newAlert.targetContract = _targetContract;
        newAlert.reporter = msg.sender;
        newAlert.title = _title;
        newAlert.description = _description;
        newAlert.actionRequired = _actionRequired;
        newAlert.timestamp = block.timestamp;
        newAlert.expiresAt = expiresAt;
        newAlert.alertData = _alertData;
        newAlert.broadcastGlobally = _broadcastGlobally;
        
        contractAlerts[_targetContract].push(alertId);
        alertTypeCount[_alertType]++;
        
        emit AlertCreated(alertId, _alertType, _severity, _targetContract, msg.sender);
        
        // Broadcast to subscribers
        uint256 notifiedUsers = _broadcastAlert(alertId);
        alerts[alertId].affectedUsers = notifiedUsers;
        
        if (_broadcastGlobally) {
            emit AlertBroadcast(alertId, notifiedUsers);
        }
    }
    
    /**
     * @dev Subscribe to alerts
     * @param _alertTypes Types of alerts to receive
     * @param _minSeverity Minimum severity level
     * @param _watchedContracts Specific contracts to monitor
     * @param _globalAlerts Whether to receive global alerts
     */
    function subscribeToAlerts(
        AlertType[] memory _alertTypes,
        AlertSeverity _minSeverity,
        address[] memory _watchedContracts,
        bool _globalAlerts
    ) external {
        require(_alertTypes.length > 0, "Must specify alert types");
        require(_watchedContracts.length <= MAX_SUBSCRIPTION_CONTRACTS, "Too many contracts");
        
        AlertSubscription storage subscription = subscriptions[msg.sender];
        subscription.subscriber = msg.sender;
        subscription.alertTypes = _alertTypes;
        subscription.minSeverity = _minSeverity;
        subscription.watchedContracts = _watchedContracts;
        subscription.globalAlerts = _globalAlerts;
        subscription.isActive = true;
        subscription.createdAt = block.timestamp;
        
        emit UserSubscribed(msg.sender, _alertTypes);
    }
    
    /**
     * @dev Unsubscribe from alerts
     */
    function unsubscribeFromAlerts() external activeSubscriber {
        subscriptions[msg.sender].isActive = false;
        emit UserUnsubscribed(msg.sender);
    }
    
    /**
     * @dev Acknowledge an alert (mark as seen)
     * @param _alertId ID of the alert to acknowledge
     */
    function acknowledgeAlert(uint256 _alertId) external validAlert(_alertId) {
        require(!alertAcknowledged[_alertId][msg.sender], "Already acknowledged");
        
        alertAcknowledged[_alertId][msg.sender] = true;
        emit AlertAcknowledged(_alertId, msg.sender);
    }
    
    /**
     * @dev Dismiss an alert for a specific user
     * @param _alertId ID of the alert to dismiss
     */
    function dismissAlert(uint256 _alertId) external validAlert(_alertId) {
        require(alertAcknowledged[_alertId][msg.sender], "Must acknowledge first");
        
        // Add to user's dismissed alerts (implementation depends on requirements)
        emit AlertDismissed(_alertId, msg.sender);
    }
    
    /**
     * @dev Resolve an alert (only by authorized reporters)
     * @param _alertId ID of the alert to resolve
     */
    function resolveAlert(uint256 _alertId) external onlyAuthorizedReporter validAlert(_alertId) {
        require(alerts[_alertId].status == AlertStatus.ACTIVE, "Alert not active");
        
        alerts[_alertId].status = AlertStatus.RESOLVED;
        emit AlertResolved(_alertId, msg.sender);
    }
    
    /**
     * @dev Get alerts for a specific contract
     * @param _contract Contract address
     * @param _onlyActive Whether to return only active alerts
     * @return uint256[] Array of alert IDs
     */
    function getContractAlerts(address _contract, bool _onlyActive) external view returns (uint256[] memory) {
        uint256[] memory allAlerts = contractAlerts[_contract];
        
        if (!_onlyActive) {
            return allAlerts;
        }
        
        // Count active alerts first
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allAlerts.length; i++) {
            if (alerts[allAlerts[i]].status == AlertStatus.ACTIVE) {
                activeCount++;
            }
        }
        
        // Create array with only active alerts
        uint256[] memory activeAlerts = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allAlerts.length; i++) {
            if (alerts[allAlerts[i]].status == AlertStatus.ACTIVE) {
                activeAlerts[index] = allAlerts[i];
                index++;
            }
        }
        
        return activeAlerts;
    }
    
    /**
     * @dev Get user's received alerts
     * @param _user User address
     * @return uint256[] Array of alert IDs
     */
    function getUserAlerts(address _user) external view returns (uint256[] memory) {
        return userAlerts[_user];
    }
    
    /**
     * @dev Get alert details
     * @param _alertId Alert ID
     * @return SecurityAlert Alert details
     */
    function getAlert(uint256 _alertId) external view validAlert(_alertId) returns (SecurityAlert memory) {
        return alerts[_alertId];
    }
    
    /**
     * @dev Get user's subscription details
     * @param _user User address
     * @return AlertSubscription Subscription details
     */
    function getSubscription(address _user) external view returns (AlertSubscription memory) {
        return subscriptions[_user];
    }
    
    /**
     * @dev Check if a contract has active critical alerts
     * @param _contract Contract address
     * @return bool True if has critical alerts
     */
    function hasCriticalAlerts(address _contract) external view returns (bool) {
        uint256[] memory contractAlertIds = contractAlerts[_contract];
        
        for (uint256 i = 0; i < contractAlertIds.length; i++) {
            SecurityAlert memory alert = alerts[contractAlertIds[i]];
            if (alert.status == AlertStatus.ACTIVE && 
                alert.severity == AlertSeverity.CRITICAL &&
                (alert.expiresAt == 0 || alert.expiresAt > block.timestamp)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Get alert statistics for a contract
     * @param _contract Contract address
     * @return totalAlerts Total number of alerts
     * @return activeAlerts Number of active alerts
     * @return criticalAlerts Number of critical alerts
     * @return lastAlertTime Timestamp of last alert
     */
    function getContractAlertStats(address _contract) external view returns (
        uint256 totalAlerts,
        uint256 activeAlerts,
        uint256 criticalAlerts,
        uint256 lastAlertTime
    ) {
        uint256[] memory contractAlertIds = contractAlerts[_contract];
        totalAlerts = contractAlertIds.length;
        
        for (uint256 i = 0; i < contractAlertIds.length; i++) {
            SecurityAlert memory alert = alerts[contractAlertIds[i]];
            
            if (alert.status == AlertStatus.ACTIVE) {
                activeAlerts++;
                
                if (alert.severity == AlertSeverity.CRITICAL) {
                    criticalAlerts++;
                }
            }
            
            if (alert.timestamp > lastAlertTime) {
                lastAlertTime = alert.timestamp;
            }
        }
    }
    
    /**
     * @dev Bulk create alerts for multiple contracts
     * @param _contracts Array of contract addresses
     * @param _alertType Type of alert for all contracts
     * @param _severity Severity level
     * @param _title Alert title
     * @param _description Alert description
     */
    function bulkCreateAlerts(
        address[] memory _contracts,
        AlertType _alertType,
        AlertSeverity _severity,
        string memory _title,
        string memory _description
    ) external onlyAuthorizedReporter {
        for (uint256 i = 0; i < _contracts.length; i++) {
            this.createAlert(
                _alertType,
                _severity,
                _contracts[i],
                _title,
                _description,
                "Review contract immediately",
                "",
                false,
                DEFAULT_ALERT_EXPIRY
            );
        }
    }
    
    /**
     * @dev Expire old alerts (maintenance function)
     * @param _batchSize Number of alerts to process in one call
     */
    function expireOldAlerts(uint256 _batchSize) external {
        uint256 totalAlerts = _alertCounter;
        uint256 processed = 0;
        
        for (uint256 i = 1; i <= totalAlerts && processed < _batchSize; i++) {
            SecurityAlert storage alert = alerts[i];
            
            if (alert.status == AlertStatus.ACTIVE && 
                alert.expiresAt > 0 && 
                alert.expiresAt <= block.timestamp) {
                
                alert.status = AlertStatus.EXPIRED;
                emit AlertExpired(i);
                processed++;
            }
        }
    }
    
    /**
     * @dev Authorize new alert reporter
     * @param _reporter Address to authorize
     */
    function authorizeReporter(address _reporter) external onlyOwner {
        require(_reporter != address(0), "Invalid reporter address");
        require(!alertReporters[_reporter], "Already authorized");
        
        alertReporters[_reporter] = true;
        emit ReporterAuthorized(_reporter);
    }
    
    /**
     * @dev Revoke reporter authorization
     * @param _reporter Address to revoke
     */
    function revokeReporter(address _reporter) external onlyOwner {
        require(alertReporters[_reporter], "Not authorized");
        require(_reporter != owner(), "Cannot revoke owner");
        
        alertReporters[_reporter] = false;
        emit ReporterRevoked(_reporter);
    }
    
    /**
     * @dev Get total number of alerts
     * @return uint256 Total alert count
     */
    function getTotalAlertsCount() external view returns (uint256) {
        return _alertCounter;
    }
    
    // Internal functions
    function _broadcastAlert(uint256 _alertId) internal returns (uint256) {
        SecurityAlert memory alert = alerts[_alertId];
        uint256 notifiedUsers = 0;
        
        // This would typically iterate through all subscribers
        // For gas efficiency, in a real implementation, this might be done off-chain
        // or through a different mechanism
        
        return notifiedUsers;
    }
    
    function _checkRateLimit(address _contract) internal view returns (bool) {
        uint256[] memory contractAlertIds = contractAlerts[_contract];
        uint256 recentAlerts = 0;
        uint256 dayAgo = block.timestamp - 86400;
        
        for (uint256 i = 0; i < contractAlertIds.length; i++) {
            if (alerts[contractAlertIds[i]].timestamp > dayAgo) {
                recentAlerts++;
            }
        }
        
        return recentAlerts < MAX_ALERTS_PER_CONTRACT_PER_DAY;
    }
    
    function _isSubscriberInterestedInAlert(address _subscriber, uint256 _alertId) internal view returns (bool) {
        AlertSubscription memory subscription = subscriptions[_subscriber];
        SecurityAlert memory alert = alerts[_alertId];
        
        if (!subscription.isActive) return false;
        
        // Check severity requirement
        if (alert.severity < subscription.minSeverity) return false;
        
        // Check if interested in this alert type
        bool typeMatch = false;
        for (uint256 i = 0; i < subscription.alertTypes.length; i++) {
            if (subscription.alertTypes[i] == alert.alertType) {
                typeMatch = true;
                break;
            }
        }
        
        if (!typeMatch && !subscription.globalAlerts) return false;
        
        // Check if watching this specific contract
        if (subscription.watchedContracts.length > 0) {
            bool contractMatch = false;
            for (uint256 i = 0; i < subscription.watchedContracts.length; i++) {
                if (subscription.watchedContracts[i] == alert.targetContract) {
                    contractMatch = true;
                    break;
                }
            }
            
            if (!contractMatch && !subscription.globalAlerts) return false;
        }
        
        return true;
    }
}
