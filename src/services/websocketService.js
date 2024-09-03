const WebSocket = require('ws');
const http = require('http');
const config = require('../config');

class WebSocketService {
  constructor() {
    this.server = null;
    this.wss = null;
    this.clients = new Map();
    this.initialized = false;
    this.alertSubscriptions = new Map(); // Map of client ID to subscriptions
    this.broadcastQueue = [];
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesReceived: 0
    };
  }

  initialize(httpServer) {
    try {
      console.log('⚡ Initializing WebSocket Service...');
      this.server = httpServer;
      
      // Create WebSocket server
      this.wss = new WebSocket.Server({ 
        server: httpServer,
        path: '/ws',
        clientTracking: true 
      });

      this.wss.on('error', (error) => {
        console.error('🔴 WebSocket Server Error:', error);
      });

      this.wss.on('listening', () => {
        console.log('🎧 WebSocket Server is listening for connections on /ws');
      });

      this.setupWebSocketHandlers();
      this.startHeartbeat();
      
      this.initialized = true;
      console.log('✅ WebSocket Service ready on /ws');
    } catch (error) {
      console.error('❌ WebSocket Service initialization failed:', error.message);
      this.initialized = false;
    }
  }

  setupWebSocketHandlers() {
    this.wss.on('connection', (ws, request) => {
      console.log('🔌 New WebSocket connection attempt from:', request.socket.remoteAddress);
      const clientId = this.generateClientId();
      const clientInfo = {
        id: clientId,
        ws: ws,
        ip: request.socket.remoteAddress,
        userAgent: request.headers['user-agent'],
        connectedAt: new Date(),
        lastSeen: new Date(),
        subscriptions: new Set(),
        isAlive: true
      };

      this.clients.set(clientId, clientInfo);
      this.alertSubscriptions.set(clientId, new Set());
      this.stats.totalConnections++;
      this.stats.activeConnections++;

      console.log(`🔌 WebSocket client connected: ${clientId} (Total: ${this.stats.activeConnections})`);

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'welcome',
        clientId: clientId,
        timestamp: new Date().toISOString(),
        message: 'Connected to Rug Detection API WebSocket'
      });

      // Setup message handler
      ws.on('message', (message) => {
        this.handleClientMessage(clientId, message);
      });

      // Setup close handler
      ws.on('close', () => {
        this.handleClientDisconnect(clientId);
      });

      // Setup error handler
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error.message);
        this.handleClientDisconnect(clientId);
      });

      // Setup pong handler for heartbeat
      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.isAlive = true;
          client.lastSeen = new Date();
        }
      });
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket Server error:', error);
    });
  }

  handleClientMessage(clientId, message) {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      client.lastSeen = new Date();
      this.stats.messagesReceived++;

      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'subscribe':
          this.handleSubscription(clientId, data);
          break;
        case 'unsubscribe':
          this.handleUnsubscription(clientId, data);
          break;
        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() });
          break;
        case 'get_status':
          this.sendClientStatus(clientId);
          break;
        default:
          this.sendToClient(clientId, {
            type: 'error',
            message: `Unknown message type: ${data.type}`
          });
      }
    } catch (error) {
      console.error(`Error handling message from client ${clientId}:`, error.message);
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Invalid message format'
      });
    }
  }

  handleSubscription(clientId, data) {
    const client = this.clients.get(clientId);
    const subscriptions = this.alertSubscriptions.get(clientId);
    
    if (!client || !subscriptions) return;

    const { channel, contractAddress, riskLevel } = data;
    
    const subscription = {
      channel: channel || 'all',
      contractAddress: contractAddress || 'all',
      riskLevel: riskLevel || 'all',
      subscribedAt: new Date().toISOString()
    };

    const subKey = `${subscription.channel}:${subscription.contractAddress}:${subscription.riskLevel}`;
    subscriptions.add(subKey);
    client.subscriptions.add(subscription);

    console.log(`📡 Client ${clientId} subscribed to: ${subKey}`);

    this.sendToClient(clientId, {
      type: 'subscription_confirmed',
      subscription: subscription,
      totalSubscriptions: subscriptions.size
    });
  }

  handleUnsubscription(clientId, data) {
    const client = this.clients.get(clientId);
    const subscriptions = this.alertSubscriptions.get(clientId);
    
    if (!client || !subscriptions) return;

    const { channel, contractAddress, riskLevel } = data;
    const subKey = `${channel || 'all'}:${contractAddress || 'all'}:${riskLevel || 'all'}`;
    
    subscriptions.delete(subKey);
    
    // Remove from client subscriptions
    client.subscriptions = new Set([...client.subscriptions].filter(sub => {
      const key = `${sub.channel}:${sub.contractAddress}:${sub.riskLevel}`;
      return key !== subKey;
    }));

    console.log(`📡 Client ${clientId} unsubscribed from: ${subKey}`);

    this.sendToClient(clientId, {
      type: 'unsubscription_confirmed',
      unsubscribed: subKey,
      totalSubscriptions: subscriptions.size
    });
  }

  handleClientDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(`🔌 WebSocket client disconnected: ${clientId}`);
      this.clients.delete(clientId);
      this.alertSubscriptions.delete(clientId);
      this.stats.activeConnections--;
    }
  }

  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(data));
      this.stats.messagesSent++;
      return true;
    } catch (error) {
      console.error(`Error sending to client ${clientId}:`, error.message);
      this.handleClientDisconnect(clientId);
      return false;
    }
  }

  sendClientStatus(clientId) {
    const client = this.clients.get(clientId);
    const subscriptions = this.alertSubscriptions.get(clientId);
    
    if (!client) return;

    this.sendToClient(clientId, {
      type: 'status',
      clientInfo: {
        id: client.id,
        connectedAt: client.connectedAt,
        lastSeen: client.lastSeen,
        subscriptions: Array.from(client.subscriptions),
        totalSubscriptions: subscriptions ? subscriptions.size : 0
      },
      serverStats: this.getServerStats()
    });
  }

  // Alert broadcasting methods
  broadcastRiskAlert(alertData) {
    const alert = {
      type: 'risk_alert',
      alert: alertData,
      timestamp: new Date().toISOString()
    };

    this.broadcastToSubscribers(alert, 'risk_alerts', alertData.contractAddress, alertData.riskLevel);
  }

  broadcastContractAnalysis(analysisData) {
    const alert = {
      type: 'contract_analysis',
      analysis: analysisData,
      timestamp: new Date().toISOString()
    };

    this.broadcastToSubscribers(alert, 'contract_analysis', analysisData.contractAddress, 'all');
  }

  broadcastTransactionAlert(transactionData) {
    const alert = {
      type: 'transaction_alert',
      transaction: transactionData,
      timestamp: new Date().toISOString()
    };

    this.broadcastToSubscribers(alert, 'transaction_alerts', transactionData.contractAddress, transactionData.riskLevel);
  }

  broadcastSocialAlert(socialData) {
    const alert = {
      type: 'social_alert',
      social: socialData,
      timestamp: new Date().toISOString()
    };

    this.broadcastToSubscribers(alert, 'social_alerts', socialData.contractAddress, 'all');
  }

  broadcastNetworkAlert(networkData) {
    const alert = {
      type: 'network_alert',
      network: networkData,
      timestamp: new Date().toISOString()
    };

    this.broadcastToAll(alert);
  }

  broadcastToSubscribers(message, channel, contractAddress, riskLevel) {
    let sentCount = 0;

    this.alertSubscriptions.forEach((subscriptions, clientId) => {
      const client = this.clients.get(clientId);
      if (!client || client.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      // Check if client is subscribed to this alert
      const matchingSubscriptions = [...subscriptions].filter(subKey => {
        const [subChannel, subContract, subRisk] = subKey.split(':');
        
        const channelMatch = subChannel === 'all' || subChannel === channel;
        const contractMatch = subContract === 'all' || subContract === contractAddress;
        const riskMatch = subRisk === 'all' || subRisk === riskLevel;
        
        return channelMatch && contractMatch && riskMatch;
      });

      if (matchingSubscriptions.length > 0) {
        if (this.sendToClient(clientId, message)) {
          sentCount++;
        }
      }
    });

    if (sentCount > 0) {
      console.log(`📡 Broadcast sent to ${sentCount} clients: ${message.type}`);
    }

    return sentCount;
  }

  broadcastToAll(message) {
    let sentCount = 0;

    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        if (this.sendToClient(clientId, message)) {
          sentCount++;
        }
      }
    });

    console.log(`📡 Broadcast sent to ${sentCount} clients: ${message.type}`);
    return sentCount;
  }

  // Real-time monitoring methods
  monitorContract(contractAddress, options = {}) {
    const monitoring = {
      contractAddress,
      monitoringStarted: new Date().toISOString(),
      options: {
        checkInterval: options.checkInterval || 30000, // 30 seconds
        riskThreshold: options.riskThreshold || 'MEDIUM',
        socialMonitoring: options.socialMonitoring || false,
        priceMonitoring: options.priceMonitoring || false
      }
    };

    // This would set up real-time monitoring for the contract
    // For now, we'll simulate periodic checks
    setInterval(async () => {
      await this.checkContractForUpdates(contractAddress, monitoring.options);
    }, monitoring.options.checkInterval);

    console.log(`🔍 Started monitoring contract: ${contractAddress}`);
    
    this.broadcastToAll({
      type: 'monitoring_started',
      monitoring,
      timestamp: new Date().toISOString()
    });

    return monitoring;
  }

  async checkContractForUpdates(contractAddress, options) {
    try {
      // This would perform real checks for:
      // - New transactions
      // - Risk score changes
      // - Social sentiment changes
      // - Price movements
      
      // Simulate finding an update
      if (Math.random() > 0.95) { // 5% chance of update
        const alertData = {
          contractAddress,
          riskLevel: 'HIGH',
          alertType: 'risk_increase',
          message: 'Risk score increased due to suspicious activity',
          details: {
            previousRisk: 'MEDIUM',
            newRisk: 'HIGH',
            reason: 'Large wallet movements detected'
          }
        };

        this.broadcastRiskAlert(alertData);
      }
    } catch (error) {
      console.error(`Error checking contract updates for ${contractAddress}:`, error);
    }
  }

  startHeartbeat() {
    setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          console.log(`💔 Terminating dead connection: ${clientId}`);
          client.ws.terminate();
          this.handleClientDisconnect(clientId);
          return;
        }

        client.isAlive = false;
        try {
          client.ws.ping();
        } catch (error) {
          console.error(`Error pinging client ${clientId}:`, error.message);
          this.handleClientDisconnect(clientId);
        }
      });
    }, 30000); // 30 second heartbeat
  }

  generateClientId() {
    return 'client_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  getServerStats() {
    return {
      ...this.stats,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  getConnectedClients() {
    return Array.from(this.clients.entries()).map(([clientId, client]) => ({
      id: clientId,
      ip: client.ip,
      connectedAt: client.connectedAt,
      lastSeen: client.lastSeen,
      subscriptions: client.subscriptions.size,
      isAlive: client.isAlive
    }));
  }

  // Testing methods
  simulateAlert(type = 'risk_alert') {
    const testAlerts = {
      risk_alert: {
        contractAddress: '0x1234567890123456789012345678901234567890',
        riskLevel: 'HIGH',
        alertType: 'test_alert',
        message: 'This is a test risk alert',
        timestamp: new Date().toISOString()
      },
      social_alert: {
        contractAddress: '0x1234567890123456789012345678901234567890',
        platform: 'twitter',
        sentiment: 'negative',
        message: 'Negative social sentiment detected',
        timestamp: new Date().toISOString()
      }
    };

    const alert = testAlerts[type];
    if (alert) {
      if (type === 'risk_alert') {
        this.broadcastRiskAlert(alert);
      } else if (type === 'social_alert') {
        this.broadcastSocialAlert(alert);
      }
      return alert;
    }

    return null;
  }

  shutdown() {
    if (this.wss) {
      console.log('🔌 Shutting down WebSocket service...');
      this.wss.close();
      this.clients.clear();
      this.alertSubscriptions.clear();
      this.initialized = false;
    }
  }
}

module.exports = new WebSocketService();
