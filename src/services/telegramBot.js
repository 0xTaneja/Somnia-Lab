const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const config = require('../config');

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.initialized = false;
    this.subscribedUsers = new Map(); // userId -> user preferences
    this.alertQueue = [];
    this.commands = {
      '/start': this.handleStart.bind(this),
      '/help': this.handleHelp.bind(this),
      '/analyze': this.handleAnalyze.bind(this),
      '/monitor': this.handleMonitor.bind(this),
      '/unmonitor': this.handleUnmonitor.bind(this),
      '/alerts': this.handleAlerts.bind(this),
      '/status': this.handleStatus.bind(this),
      '/settings': this.handleSettings.bind(this)
    };
    this.apiBaseUrl = `http://172.20.27.76:5000/api`;
  }

  async initialize() {
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      
      if (!token || token === 'demo-key') {
        console.log('📱 Telegram Bot: No token provided, running in demo mode');
        this.initialized = false;
        return;
      }

      console.log('🤖 Initializing Telegram Bot Service...');
      
      this.bot = new TelegramBot(token, { polling: true });
      
      // Set up command handlers
      this.setupCommands();
      this.setupMessageHandlers();
      
      // Set bot commands for UI
      await this.setBotCommands();
      
      this.initialized = true;
      console.log('✅ Telegram Bot Service ready');
      
      // Send startup notification to admin (if configured)
      await this.notifyStartup();
      
    } catch (error) {
      console.error('❌ Telegram Bot Service initialization failed:', error.message);
      this.initialized = false;
    }
  }

  setupCommands() {
    Object.entries(this.commands).forEach(([command, handler]) => {
      this.bot.onText(new RegExp(`^${command.replace('/', '\\/')}`), handler);
    });
  }

  setupMessageHandlers() {
    // Handle contract address inputs
    this.bot.onText(/^(0x[a-fA-F0-9]{40})$/, async (msg, match) => {
      const contractAddress = match[1];
      await this.analyzeContractFromMessage(msg, contractAddress);
    });

    // Handle callback queries from inline keyboards
    this.bot.on('callback_query', async (callbackQuery) => {
      await this.handleCallbackQuery(callbackQuery);
    });

    // Handle errors
    this.bot.on('polling_error', (error) => {
      console.error('Telegram Bot polling error:', error.message);
    });
  }

  async setBotCommands() {
    try {
      await this.bot.setMyCommands([
        { command: 'start', description: 'Start using the Rug Detection Bot' },
        { command: 'help', description: 'Show help and available commands' },
        { command: 'analyze', description: 'Analyze a contract address' },
        { command: 'monitor', description: 'Monitor a contract for alerts' },
        { command: 'unmonitor', description: 'Stop monitoring a contract' },
        { command: 'alerts', description: 'Manage alert preferences' },
        { command: 'status', description: 'Check your monitoring status' },
        { command: 'settings', description: 'Configure bot settings' }
      ]);
    } catch (error) {
      console.error('Error setting bot commands:', error);
    }
  }

  async notifyStartup() {
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (adminChatId) {
      try {
        await this.bot.sendMessage(adminChatId, `
🤖 *Ultimate DeFi Security Bot Started*

✅ Bot is online and ready
⚡ Real-time monitoring active
🔍 Analysis API connected
🌐 Cross-chain detection enabled

Ready to protect users from rug pulls! 🛡️
        `, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Failed to notify admin:', error);
      }
    }
  }

  // Command Handlers
  async handleStart(msg) {
    const chatId = msg.chat.id;
    const user = msg.from;
    
    // Initialize user preferences
    this.subscribedUsers.set(chatId, {
      userId: user.id,
      username: user.username,
      firstName: user.first_name,
      preferences: {
        alertLevel: 'MEDIUM', // CRITICAL, HIGH, MEDIUM, LOW
        autoAnalysis: true,
        notifications: true
      },
      monitoredContracts: new Set(),
      joinedAt: new Date().toISOString()
    });

    const welcomeMessage = `
🛡️ *Welcome to Ultimate DeFi Security Bot!*

I'm your personal guardian against rug pulls and scams. Here's what I can do:

🔍 *Instant Analysis*
Send me any contract address and I'll analyze it using:
• 🤖 AI-powered risk detection
• 📱 Social sentiment analysis  
• 💰 Tokenomics evaluation
• 🌐 Cross-chain investigation

⚡ *Real-time Monitoring*
• Monitor contracts 24/7
• Instant alerts for suspicious activity
• Multi-platform threat intelligence

🚨 *Smart Alerts*
• Risk level notifications
• Social media warnings
• Whale movement alerts
• Liquidity changes

*Quick Start:*
1. Send me a contract address (0x...)
2. Use /analyze <address> for detailed analysis
3. Use /monitor <address> to track it

Type /help for all commands!
    `;

    await this.bot.sendMessage(chatId, welcomeMessage, { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔍 Analyze Contract', callback_data: 'quick_analyze' },
            { text: '⚡ Start Monitoring', callback_data: 'quick_monitor' }
          ],
          [
            { text: '⚙️ Settings', callback_data: 'show_settings' },
            { text: '📊 Status', callback_data: 'show_status' }
          ]
        ]
      }
    });
  }

  async handleHelp(msg) {
    const helpMessage = `
🤖 *Ultimate DeFi Security Bot Commands*

*Analysis Commands:*
/analyze <address> - Comprehensive contract analysis
/status - Show your monitoring status

*Monitoring Commands:*
/monitor <address> - Start monitoring contract
/unmonitor <address> - Stop monitoring contract

*Alert Commands:*
/alerts - Manage alert preferences
/settings - Configure bot settings

*Quick Actions:*
• Send contract address directly for instant analysis
• Use inline buttons for faster interaction

*Examples:*
\`/analyze 0x1234...5678\`
\`/monitor 0xabcd...ef01\`

*Alert Levels:*
🔴 CRITICAL - Immediate scam/rug pull risk
🟠 HIGH - Significant risk factors detected
🟡 MEDIUM - Moderate risk, proceed with caution
🟢 LOW - Appears relatively safe

*Features:*
• 🤖 AI-powered analysis
• 📱 Social sentiment tracking
• 💰 Tokenomics evaluation
• 🌐 Cross-chain detection
• ⚡ Real-time monitoring
• 🚨 Instant alerts

Need help? Contact support or check our documentation.
    `;

    await this.bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'Markdown' });
  }

  async handleAnalyze(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Extract contract address from command
    const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
    
    if (!addressMatch) {
      await this.bot.sendMessage(chatId, `
❌ *Invalid contract address*

Please provide a valid Ethereum contract address.

*Format:* \`/analyze 0x1234567890123456789012345678901234567890\`

Or simply send the contract address directly.
      `, { parse_mode: 'Markdown' });
      return;
    }

    const contractAddress = addressMatch[0];
    await this.analyzeContractFromMessage(msg, contractAddress);
  }

  async analyzeContractFromMessage(msg, contractAddress) {
    const chatId = msg.chat.id;
    
    // Send "analyzing" message
    const loadingMsg = await this.bot.sendMessage(chatId, `
🔍 *Analyzing Contract...*

📊 Address: \`${contractAddress}\`

⏳ Running comprehensive analysis:
• 🤖 AI risk detection
• 📱 Social sentiment check
• 💰 Tokenomics evaluation
• 🌐 Cross-chain investigation

Please wait...
    `, { parse_mode: 'Markdown' });

    try {
      // Call our API for comprehensive analysis
      const response = await axios.post(`${this.apiBaseUrl}/assess-contract`, {
        contractAddress,
        includeAI: true,
        includeSocial: true,
        includeTokenomics: true,
        includeCrossChain: false
      }, { timeout: 30000 });

      const analysis = response.data;
      
      // Format and send analysis results
      await this.sendAnalysisResults(chatId, analysis, loadingMsg.message_id);
      
    } catch (error) {
      console.error('Analysis error:', error);
      
      await this.bot.editMessageText(`
❌ *Analysis Failed*

Contract: \`${contractAddress}\`

Error: ${error.response?.data?.error || error.message}

Please try again later or contact support.
      `, {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
    }
  }

  async sendAnalysisResults(chatId, analysis, messageId) {
    const risk = analysis.overallRisk;
    const riskEmoji = risk.level === 'CRITICAL' ? '🔴' : 
                     risk.level === 'HIGH' ? '🟠' : 
                     risk.level === 'MEDIUM' ? '🟡' : '🟢';
    
    let resultMessage = `
${riskEmoji} *ANALYSIS COMPLETE*

📊 *Contract:* \`${analysis.contractAddress}\`
🎯 *Risk Level:* ${risk.level} (${risk.score}/100)
🔮 *Confidence:* ${Math.round(risk.confidence * 100)}%

`;

    // Add AI analysis summary
    if (analysis.aiAnalysis && !analysis.aiAnalysis.error) {
      const ai = analysis.aiAnalysis.analysis;
      resultMessage += `🤖 *AI Analysis:*
• Risk Score: ${ai.riskScore}/100
• Vulnerabilities: ${ai.vulnerabilities?.length || 0}
• Summary: ${ai.summary}

`;
    }

    // Add tokenomics summary
    if (analysis.tokenomicsAnalysis && !analysis.tokenomicsAnalysis.error) {
      const token = analysis.tokenomicsAnalysis;
      resultMessage += `💰 *Tokenomics:*
• Whale Concentration: ${token.distribution?.whaleConcentration || 'Unknown'}%
• Risk Factors: ${token.riskFactors?.length || 0}
• Token: ${token.tokenInfo?.name || 'Unknown'} (${token.tokenInfo?.symbol || 'Unknown'})

`;
    }

    // Add social analysis summary
    if (analysis.socialAnalysis && !analysis.socialAnalysis.error) {
      const social = analysis.socialAnalysis;
      resultMessage += `📱 *Social Sentiment:*
• Overall: ${social.overallSentiment.label}
• Mentions: ${social.overallSentiment.totalMentions}
• Risk Indicators: ${social.riskIndicators?.length || 0}

`;
    }

    // Add top recommendations
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      resultMessage += `💡 *Key Recommendations:*
`;
      analysis.recommendations.slice(0, 3).forEach((rec, index) => {
        resultMessage += `${index + 1}. ${rec}\n`;
      });
    }

    resultMessage += `
⏰ *Analysis Time:* ${new Date().toLocaleString()}
    `;

    const keyboard = [
      [
        { text: '🔍 Detailed Report', callback_data: `detailed_${analysis.contractAddress}` },
        { text: '⚡ Monitor Contract', callback_data: `monitor_${analysis.contractAddress}` }
      ]
    ];

    // Add warning for high risk
    if (risk.level === 'CRITICAL' || risk.level === 'HIGH') {
      keyboard.push([
        { text: '🚨 Share Warning', callback_data: `share_warning_${analysis.contractAddress}` }
      ]);
    }

    try {
      await this.bot.editMessageText(resultMessage, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    } catch (error) {
      // If edit fails, send new message
      await this.bot.sendMessage(chatId, resultMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    }
  }

  async handleMonitor(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Extract contract address from command
    const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
    
    if (!addressMatch) {
      await this.bot.sendMessage(chatId, `
❌ *Invalid contract address*

*Format:* \`/monitor 0x1234567890123456789012345678901234567890\`
      `, { parse_mode: 'Markdown' });
      return;
    }

    const contractAddress = addressMatch[0];
    const user = this.subscribedUsers.get(chatId);
    
    if (!user) {
      await this.bot.sendMessage(chatId, 'Please use /start first to initialize your account.');
      return;
    }

    user.monitoredContracts.add(contractAddress);
    
    // Start API monitoring
    try {
      await axios.post(`${this.apiBaseUrl}/monitor-contract`, {
        contractAddress,
        options: {
          checkInterval: 60000, // 1 minute
          riskThreshold: user.preferences.alertLevel,
          socialMonitoring: true,
          priceMonitoring: true
        }
      });

      await this.bot.sendMessage(chatId, `
✅ *Monitoring Started*

📊 Contract: \`${contractAddress}\`
⚡ Check Interval: Every minute
🎯 Alert Level: ${user.preferences.alertLevel}
📱 Social Monitoring: Enabled

You'll receive instant alerts for:
• Risk level changes
• Suspicious transactions
• Social media warnings
• Whale movements

Use /unmonitor to stop monitoring.
      `, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '⚙️ Adjust Settings', callback_data: `monitor_settings_${contractAddress}` },
              { text: '📊 View Status', callback_data: 'show_status' }
            ]
          ]
        }
      });

    } catch (error) {
      await this.bot.sendMessage(chatId, `
❌ *Failed to start monitoring*

Error: ${error.response?.data?.error || error.message}
      `, { parse_mode: 'Markdown' });
    }
  }

  async handleUnmonitor(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
    
    if (!addressMatch) {
      // Show list of monitored contracts
      const user = this.subscribedUsers.get(chatId);
      if (!user || user.monitoredContracts.size === 0) {
        await this.bot.sendMessage(chatId, 'You are not monitoring any contracts.');
        return;
      }

      let message = '*Select contract to stop monitoring:*\n\n';
      const keyboard = [];
      
      user.monitoredContracts.forEach(address => {
        message += `• \`${address}\`\n`;
        keyboard.push([{ text: `Stop ${address.slice(0, 8)}...`, callback_data: `unmonitor_${address}` }]);
      });

      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
      return;
    }

    const contractAddress = addressMatch[0];
    const user = this.subscribedUsers.get(chatId);
    
    if (user && user.monitoredContracts.has(contractAddress)) {
      user.monitoredContracts.delete(contractAddress);
      
      await this.bot.sendMessage(chatId, `
✅ *Monitoring Stopped*

📊 Contract: \`${contractAddress}\`

You will no longer receive alerts for this contract.
      `, { parse_mode: 'Markdown' });
    } else {
      await this.bot.sendMessage(chatId, 'You are not monitoring this contract.');
    }
  }

  async handleStatus(msg) {
    const chatId = msg.chat.id;
    const user = this.subscribedUsers.get(chatId);
    
    if (!user) {
      await this.bot.sendMessage(chatId, 'Please use /start first to initialize your account.');
      return;
    }

    const monitoringCount = user.monitoredContracts.size;
    
    let statusMessage = `
👤 *Your DeFi Security Status*

🔍 *Account Info:*
• User: ${user.firstName} ${user.username ? `(@${user.username})` : ''}
• Joined: ${new Date(user.joinedAt).toLocaleDateString()}

⚡ *Monitoring:*
• Active Contracts: ${monitoringCount}
• Alert Level: ${user.preferences.alertLevel}
• Auto Analysis: ${user.preferences.autoAnalysis ? 'ON' : 'OFF'}
• Notifications: ${user.preferences.notifications ? 'ON' : 'OFF'}

`;

    if (monitoringCount > 0) {
      statusMessage += `📊 *Monitored Contracts:*\n`;
      user.monitoredContracts.forEach(address => {
        statusMessage += `• \`${address}\`\n`;
      });
    }

    await this.bot.sendMessage(chatId, statusMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '⚙️ Settings', callback_data: 'show_settings' },
            { text: '🔍 Analyze New', callback_data: 'quick_analyze' }
          ]
        ]
      }
    });
  }

  async handleAlerts(msg) {
    const chatId = msg.chat.id;
    const user = this.subscribedUsers.get(chatId);
    
    if (!user) {
      await this.bot.sendMessage(chatId, 'Please use /start first.');
      return;
    }

    await this.bot.sendMessage(chatId, `
🚨 *Alert Preferences*

Current Level: *${user.preferences.alertLevel}*

Choose your alert sensitivity:
    `, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔴 CRITICAL Only', callback_data: 'alert_level_CRITICAL' },
            { text: '🟠 HIGH & Above', callback_data: 'alert_level_HIGH' }
          ],
          [
            { text: '🟡 MEDIUM & Above', callback_data: 'alert_level_MEDIUM' },
            { text: '🟢 ALL Levels', callback_data: 'alert_level_LOW' }
          ]
        ]
      }
    });
  }

  async handleSettings(msg) {
    const chatId = msg.chat.id;
    await this.showSettingsMenu(chatId);
  }

  async showSettingsMenu(chatId) {
    const user = this.subscribedUsers.get(chatId);
    
    if (!user) {
      await this.bot.sendMessage(chatId, 'Please use /start first.');
      return;
    }

    const settingsMessage = `
⚙️ *Bot Settings*

Current Configuration:
• Alert Level: ${user.preferences.alertLevel}
• Auto Analysis: ${user.preferences.autoAnalysis ? 'ON' : 'OFF'}
• Notifications: ${user.preferences.notifications ? 'ON' : 'OFF'}

Choose what to configure:
    `;

    await this.bot.sendMessage(chatId, settingsMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🚨 Alert Level', callback_data: 'config_alerts' },
            { text: '🤖 Auto Analysis', callback_data: 'toggle_auto_analysis' }
          ],
          [
            { text: '🔔 Notifications', callback_data: 'toggle_notifications' },
            { text: '📊 View Status', callback_data: 'show_status' }
          ]
        ]
      }
    });
  }

  async handleCallbackQuery(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const user = this.subscribedUsers.get(chatId);

    try {
      await this.bot.answerCallbackQuery(callbackQuery.id);

      if (data.startsWith('alert_level_')) {
        const level = data.replace('alert_level_', '');
        if (user) {
          user.preferences.alertLevel = level;
          await this.bot.editMessageText(`
✅ *Alert Level Updated*

New Level: *${level}*

You will now receive alerts for ${level} level risks and above.
          `, {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            parse_mode: 'Markdown'
          });
        }
      } else if (data.startsWith('monitor_')) {
        const contractAddress = data.replace('monitor_', '');
        await this.startMonitoringFromCallback(chatId, contractAddress);
      } else if (data.startsWith('unmonitor_')) {
        const contractAddress = data.replace('unmonitor_', '');
        if (user) {
          user.monitoredContracts.delete(contractAddress);
          await this.bot.sendMessage(chatId, `Stopped monitoring ${contractAddress}`);
        }
      } else if (data === 'toggle_auto_analysis') {
        if (user) {
          user.preferences.autoAnalysis = !user.preferences.autoAnalysis;
          await this.bot.sendMessage(chatId, `Auto Analysis: ${user.preferences.autoAnalysis ? 'ON' : 'OFF'}`);
        }
      } else if (data === 'toggle_notifications') {
        if (user) {
          user.preferences.notifications = !user.preferences.notifications;
          await this.bot.sendMessage(chatId, `Notifications: ${user.preferences.notifications ? 'ON' : 'OFF'}`);
        }
      } else if (data === 'show_settings') {
        await this.showSettingsMenu(chatId);
      } else if (data === 'show_status') {
        await this.handleStatus({ chat: { id: chatId } });
      } else if (data === 'quick_analyze') {
        await this.bot.sendMessage(chatId, `
🔍 *Quick Analysis*

Send me a contract address to analyze:
\`0x1234567890123456789012345678901234567890\`

Or use: \`/analyze <address>\`
        `, { parse_mode: 'Markdown' });
      }

    } catch (error) {
      console.error('Callback query error:', error);
    }
  }

  async startMonitoringFromCallback(chatId, contractAddress) {
    const user = this.subscribedUsers.get(chatId);
    if (!user) return;

    user.monitoredContracts.add(contractAddress);

    try {
      await axios.post(`${this.apiBaseUrl}/monitor-contract`, {
        contractAddress,
        options: {
          checkInterval: 60000,
          riskThreshold: user.preferences.alertLevel
        }
      });

      await this.bot.sendMessage(chatId, `
✅ *Monitoring Started*

📊 Contract: \`${contractAddress}\`
⚡ Real-time alerts enabled
      `, { parse_mode: 'Markdown' });

    } catch (error) {
      await this.bot.sendMessage(chatId, `Failed to start monitoring: ${error.message}`);
    }
  }

  // Alert broadcasting methods
  async broadcastRiskAlert(alertData) {
    if (!this.initialized) return;

    const message = `
🚨 *RISK ALERT*

📊 Contract: \`${alertData.contractAddress}\`
⚠️ Level: ${alertData.riskLevel}
📈 Score: ${alertData.riskScore}/100

${alertData.message}

⏰ ${new Date().toLocaleString()}
    `;

    await this.broadcastToSubscribers(message, alertData.contractAddress, alertData.riskLevel);
  }

  async broadcastSocialAlert(socialData) {
    if (!this.initialized) return;

    const message = `
📱 *SOCIAL ALERT*

📊 Contract: \`${socialData.contractAddress}\`
🌐 Platform: ${socialData.platform}
📊 Sentiment: ${socialData.sentiment}

${socialData.message}

⏰ ${new Date().toLocaleString()}
    `;

    await this.broadcastToSubscribers(message, socialData.contractAddress, 'MEDIUM');
  }

  async broadcastToSubscribers(message, contractAddress, riskLevel) {
    let sentCount = 0;

    for (const [chatId, user] of this.subscribedUsers) {
      try {
        // Check if user is monitoring this contract
        if (!user.monitoredContracts.has(contractAddress)) continue;

        // Check if user wants this alert level
        if (!this.shouldSendAlert(user.preferences.alertLevel, riskLevel)) continue;

        // Check if notifications are enabled
        if (!user.preferences.notifications) continue;

        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        sentCount++;

      } catch (error) {
        console.error(`Failed to send alert to user ${chatId}:`, error.message);
      }
    }

    if (sentCount > 0) {
      console.log(`📱 Telegram alert sent to ${sentCount} users`);
    }

    return sentCount;
  }

  shouldSendAlert(userLevel, alertLevel) {
    const levels = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    return levels[alertLevel] >= levels[userLevel];
  }

  getStats() {
    return {
      initialized: this.initialized,
      totalUsers: this.subscribedUsers.size,
      totalMonitoredContracts: Array.from(this.subscribedUsers.values())
        .reduce((total, user) => total + user.monitoredContracts.size, 0),
      alertsSent: this.alertQueue.length
    };
  }

  shutdown() {
    if (this.bot) {
      this.bot.stopPolling();
      this.initialized = false;
      console.log('📱 Telegram Bot Service shut down');
    }
  }
}

module.exports = new TelegramBotService();
