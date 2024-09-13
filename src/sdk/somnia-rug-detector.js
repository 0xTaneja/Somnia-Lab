/**
 * Somnia Rug Detection SDK
 * JavaScript SDK for integrating real-time transaction security analysis into dApps
 */

class SomniaRugDetector {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || 'http://172.20.27.76:5000/api';
    this.autoAnalyze = options.autoAnalyze !== false;
    this.showWarnings = options.showWarnings !== false;
    this.riskThreshold = options.riskThreshold || 7;
    this.callbacks = {
      onAnalysis: options.onAnalysis || null,
      onHighRisk: options.onHighRisk || null,
      onError: options.onError || null
    };
    
    this.isInitialized = false;
    this.cache = new Map();
    this.analysisHistory = [];
    
    // Auto-initialize if in browser environment
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  /**
   * Initialize the SDK and set up wallet monitoring
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // Check API connectivity
      await this.checkApiHealth();
      
      // Set up wallet provider monitoring
      if (typeof window !== 'undefined' && window.ethereum) {
        this.setupWalletMonitoring();
      }
      
      this.isInitialized = true;
      console.log('🛡️ Somnia Rug Detection SDK initialized');
      
    } catch (error) {
      console.error('Failed to initialize Somnia SDK:', error);
      throw error;
    }
  }

  /**
   * Analyze a transaction for security risks
   * @param {Object} transactionData - The transaction to analyze
   * @param {string} contractAddress - The target contract address
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeTransaction(transactionData, contractAddress) {
    if (!this.isInitialized) {
      await this.init();
    }

    // Check cache first
    const cacheKey = this.getCacheKey(transactionData, contractAddress);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.result;
      }
    }

    try {
      const response = await fetch(`${this.apiUrl}/analyze-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionData,
          contractAddress
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const analysis = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        result: analysis,
        timestamp: Date.now()
      });

      // Add to history
      this.analysisHistory.push({
        ...analysis,
        analyzedAt: Date.now(),
        transactionData,
        contractAddress
      });

      // Keep only last 100 analyses
      if (this.analysisHistory.length > 100) {
        this.analysisHistory = this.analysisHistory.slice(-100);
      }

      // Trigger callbacks
      if (this.callbacks.onAnalysis) {
        this.callbacks.onAnalysis(analysis);
      }

      if (analysis.riskScore >= this.riskThreshold && this.callbacks.onHighRisk) {
        this.callbacks.onHighRisk(analysis);
      }

      // Show warning if enabled
      if (this.showWarnings && analysis.riskScore >= this.riskThreshold) {
        this.showRiskWarning(analysis);
      }

      return analysis;

    } catch (error) {
      console.error('Transaction analysis failed:', error);
      
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      
      throw error;
    }
  }

  /**
   * Analyze a contract for general security risks
   * @param {string} contractAddress - The contract address to analyze
   * @returns {Promise<Object>} Contract analysis results
   */
  async analyzeContract(contractAddress) {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      const response = await fetch(`${this.apiUrl}/assess-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress,
          networkId: 'somnia-testnet'
        })
      });

      if (!response.ok) {
        throw new Error(`Contract analysis failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Contract analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get the current risk levels and their descriptions
   * @returns {Promise<Object>} Risk level information
   */
  async getRiskLevels() {
    try {
      const response = await fetch(`${this.apiUrl}/risk-levels`);
      if (!response.ok) {
        throw new Error(`Failed to get risk levels: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get risk levels:', error);
      throw error;
    }
  }

  /**
   * Set up automatic wallet transaction monitoring
   */
  setupWalletMonitoring() {
    if (!window.ethereum) return;

    // Override the request method to intercept transactions
    const originalRequest = window.ethereum.request;
    const self = this;

    window.ethereum.request = async function(args) {
      // Monitor transaction-related methods
      if (self.autoAnalyze && (
        args.method === 'eth_sendTransaction' ||
        args.method === 'eth_signTransaction'
      )) {
        
        try {
          const txData = args.params[0];
          if (txData.to && txData.data) {
            // Analyze the transaction before sending
            const analysis = await self.analyzeTransaction(txData, txData.to);
            
            // If high risk, prompt user
            if (analysis.riskScore >= self.riskThreshold) {
              const proceed = await self.confirmHighRiskTransaction(analysis);
              if (!proceed) {
                throw new Error('Transaction cancelled due to security risk');
              }
            }
          }
        } catch (error) {
          console.warn('Pre-transaction analysis failed:', error);
          // Don't block transaction if analysis fails
        }
      }

      // Call original method
      return originalRequest.call(this, args);
    };
  }

  /**
   * Show a risk warning to the user
   * @param {Object} analysis - The analysis results
   */
  showRiskWarning(analysis) {
    // Create a modal warning
    const modal = document.createElement('div');
    modal.id = 'somnia-risk-warning';
    modal.innerHTML = `
      <div class="somnia-modal-overlay">
        <div class="somnia-modal-content">
          <div class="somnia-modal-header">
            <h3>⚠️ Security Warning</h3>
            <button class="somnia-modal-close">&times;</button>
          </div>
          <div class="somnia-modal-body">
            <div class="risk-score">
              Risk Score: <span class="risk-number">${analysis.riskScore}/10</span>
            </div>
            <div class="risk-description">
              ${analysis.humanDescription || 'High-risk transaction detected'}
            </div>
            <div class="risk-factors">
              <h4>Risk Factors:</h4>
              <ul>
                ${analysis.analysis.riskFactors.map(factor => 
                  `<li>${factor.replace(/_/g, ' ')}</li>`
                ).join('')}
              </ul>
            </div>
            <div class="recommendations">
              <h4>Recommendations:</h4>
              <ul>
                ${analysis.recommendations.map(rec => 
                  `<li>${rec}</li>`
                ).join('')}
              </ul>
            </div>
          </div>
          <div class="somnia-modal-actions">
            <button class="btn-danger">Cancel Transaction</button>
            <button class="btn-proceed">Proceed Anyway</button>
          </div>
        </div>
      </div>
    `;

    // Add styles if not already present
    if (!document.getElementById('somnia-sdk-styles')) {
      this.injectStyles();
    }

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.somnia-modal-close').onclick = () => modal.remove();
    modal.querySelector('.btn-danger').onclick = () => modal.remove();
    modal.querySelector('.btn-proceed').onclick = () => modal.remove();
  }

  /**
   * Prompt user to confirm a high-risk transaction
   * @param {Object} analysis - The analysis results
   * @returns {Promise<boolean>} User's decision
   */
  async confirmHighRiskTransaction(analysis) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.innerHTML = `
        <div class="somnia-modal-overlay">
          <div class="somnia-modal-content risk-confirmation">
            <div class="somnia-modal-header">
              <h3>🚨 High Risk Transaction</h3>
            </div>
            <div class="somnia-modal-body">
              <p><strong>Risk Score: ${analysis.riskScore}/10</strong></p>
              <p>${analysis.humanDescription || 'This transaction has been flagged as high risk.'}</p>
              <p>Are you sure you want to proceed?</p>
            </div>
            <div class="somnia-modal-actions">
              <button class="btn-danger" id="cancel-tx">Cancel</button>
              <button class="btn-proceed" id="proceed-tx">Proceed</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#cancel-tx').onclick = () => {
        modal.remove();
        resolve(false);
      };

      modal.querySelector('#proceed-tx').onclick = () => {
        modal.remove();
        resolve(true);
      };
    });
  }

  /**
   * Inject CSS styles for the SDK UI
   */
  injectStyles() {
    const styles = document.createElement('style');
    styles.id = 'somnia-sdk-styles';
    styles.textContent = `
      .somnia-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .somnia-modal-content {
        background: white;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      }
      
      .somnia-modal-header {
        padding: 20px 24px 16px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .somnia-modal-header h3 {
        margin: 0;
        color: #e53e3e;
      }
      
      .somnia-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
      }
      
      .somnia-modal-body {
        padding: 20px 24px;
      }
      
      .risk-score {
        text-align: center;
        margin-bottom: 16px;
      }
      
      .risk-number {
        font-size: 2rem;
        font-weight: bold;
        color: #e53e3e;
      }
      
      .somnia-modal-actions {
        padding: 16px 24px 24px;
        display: flex;
        gap: 12px;
      }
      
      .somnia-modal-actions button {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      }
      
      .btn-danger {
        background: #e53e3e;
        color: white;
      }
      
      .btn-proceed {
        background: #e2e8f0;
        color: #4a5568;
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Check API health
   */
  async checkApiHealth() {
    const response = await fetch(`${this.apiUrl.replace('/api', '')}/health`);
    if (!response.ok) {
      throw new Error(`API health check failed: ${response.status}`);
    }
    return await response.json();
  }

  /**
   * Generate cache key for analysis results
   */
  getCacheKey(transactionData, contractAddress) {
    return `${contractAddress}_${JSON.stringify(transactionData)}`;
  }

  /**
   * Get analysis history
   */
  getAnalysisHistory() {
    return [...this.analysisHistory];
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    const response = await fetch(`${this.apiUrl.replace('/api', '')}/api/network-info`);
    if (!response.ok) {
      throw new Error(`Network info failed: ${response.status}`);
    }
    return await response.json();
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SomniaRugDetector;
}

if (typeof window !== 'undefined') {
  window.SomniaRugDetector = SomniaRugDetector;
}

// Auto-initialize if global options are provided
if (typeof window !== 'undefined' && window.SOMNIA_AUTO_INIT) {
  window.somniaDetector = new SomniaRugDetector(window.SOMNIA_AUTO_INIT);
}
