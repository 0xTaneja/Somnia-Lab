// API service for connecting to the Rug Detection backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.27.76:5000';

export interface TransactionAnalysisRequest {
  transactionData: {
    to: string;
    value?: string;
    data?: string;
    from?: string;
    gasLimit?: string;
    gasPrice?: string;
  };
  contractAddress: string;
  includeAI?: boolean;
  includeSocial?: boolean;
}

export interface ContractAssessmentRequest {
  contractAddress: string;
  includeAI?: boolean;
  includeSocial?: boolean;
  includeTokenomics?: boolean;
}

export interface AnalysisResult {
  transactionHash?: string;
  contractAddress: string;
  riskScore: number;
  riskLevel: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Critical';
  threats: string[];
  warnings: string[];
  analysis?: any;
  decodedTransaction?: any;
  simulation?: {
    success?: boolean;
    error?: string;
    gasEstimate?: string;
    network?: {
      name?: string;
      chainId?: string;
    };
    blockNumber?: number;
  };
  aiAnalysis?: {
    confidence?: number;
    analysis?: any;
    recommendations?: string[];
  };
  socialAnalysis?: {
    overallSentiment?: {
      label?: string;
      confidence?: number;
      totalMentions?: number;
    };
    platforms?: any;
    warnings?: string[];
  };
  riskAssessment?: {
    confidence?: number;
    summary?: string;
  };
  recommendations?: string[];
  timestamp: string;
}

export interface NetworkStats {
  chainId: number;
  networkName: string;
  blockNumber: number;
  gasPrice: string;
  isConnected: boolean;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  services: {
    api: string;
    somniaNetwork: string;
    abiDecoder: string;
    riskAnalysis: string;
    aiAnalysis: string;
    crossChain: string;
    socialAnalysis: string;
    tokenomics: string;
    websocket: string;
    telegramBot: string;
    contracts: string;
  };
  network?: NetworkStats;
  websocket?: any;
}

export interface ContractAssessment {
  contractAddress: string;
  timestamp: string;
  basicAnalysis: {
    success?: boolean;
    error?: string;
    gasEstimate?: string;
    network?: {
      name: string;
      chainId: string;
    };
  };
  aiAnalysis?: {
    aiProvider: string;
    analysis: {
      riskScore: number;
      riskLevel: string;
      riskFactors: string[];
      vulnerabilities: any[];
      rugPullIndicators: any[];
      summary: string;
      confidence: number;
    };
    confidence: number;
    recommendations: string[];
  };
  socialAnalysis?: {
    overallSentiment: {
      score: number;
      label: string;
      confidence: number;
      totalMentions: number;
    };
    platforms: any;
    riskIndicators: any[];
    warnings: string[];
  };
  tokenomicsAnalysis?: {
    riskLevel: string;
    riskScore: number;
    riskFactors: string[];
  };
  overallRisk: {
    score: number;
    level: string;
    confidence: number;
  };
  recommendations: string[];
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health');
  }

  // Network information
  async getNetworkInfo(): Promise<NetworkStats> {
    return this.request<NetworkStats>('/api/network-info');
  }

  // Analyze transaction
  async analyzeTransaction(data: TransactionAnalysisRequest): Promise<AnalysisResult> {
    return this.request<AnalysisResult>('/api/analyze-transaction', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // AI Analysis
  async getAiAnalysis(contractAddress: string): Promise<any> {
    return this.request<any>('/api/ai-analysis', {
      method: 'POST',
      body: JSON.stringify({ contractAddress }),
    });
  }

  // Cross-chain analysis
  async getCrossChainAnalysis(contractAddress: string): Promise<any> {
    return this.request<any>('/api/cross-chain-analysis', {
      method: 'POST',
      body: JSON.stringify({ contractAddress }),
    });
  }

  // Social analysis
  async getSocialAnalysis(contractAddress: string): Promise<any> {
    return this.request<any>('/api/social-analysis', {
      method: 'POST',
      body: JSON.stringify({ contractAddress }),
    });
  }

  // Tokenomics analysis
  async getTokenomicsAnalysis(contractAddress: string): Promise<any> {
    return this.request<any>('/api/tokenomics-analysis', {
      method: 'POST',
      body: JSON.stringify({ contractAddress }),
    });
  }

  // Monitor contract
  async monitorContract(contractAddress: string): Promise<any> {
    return this.request<any>('/api/monitor-contract', {
      method: 'POST',
      body: JSON.stringify({ contractAddress }),
    });
  }

  // WebSocket info
  async getWebSocketInfo(): Promise<any> {
    return this.request<any>('/api/websocket-info');
  }

  // Test alert
  async testAlert(message: string): Promise<any> {
    return this.request<any>('/api/test-alert', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // On-chain analysis
  async getOnChainAnalysis(contractAddress: string): Promise<any> {
    return this.request<any>('/api/on-chain-analysis', {
      method: 'POST',
      body: JSON.stringify({ contractAddress }),
    });
  }

  // Submit to blockchain
  async submitToChain(data: any): Promise<any> {
    return this.request<any>('/api/submit-to-chain', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Report threat
  async reportThreat(data: any): Promise<any> {
    return this.request<any>('/api/report-threat-on-chain', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Assess contract
  async assessContract(contractAddress: string): Promise<ContractAssessment> {
    return this.request<ContractAssessment>('/api/assess-contract', {
      method: 'POST',
      body: JSON.stringify({ 
        contractAddress,
        includeAI: true,
        includeSocial: true,
        includeTokenomics: true,
        includeCrossChain: false
      }),
    });
  }

  // Generic POST method for convenience
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Generic GET method for convenience
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  // Advanced Threat Monitoring endpoints
  async analyzeThreat(data: { transactionData: any; semanticAnalysis?: any }): Promise<any> {
    return this.request<any>('/api/threat-analysis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeThreatBatch(data: { transactions: any[]; maxConcurrent?: number }): Promise<any> {
    return this.request<any>('/api/threat-analysis-batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getThreatIntelligence(data: { address: string; checkType?: string }): Promise<any> {
    return this.request<any>('/api/threat-intel', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Social Security Service endpoints removed

  // ═══════════════════════════════════════════════════════════════
  // 🤖 AI CONTRACT TOOLS ENDPOINTS (Phase 2 Revolutionary Features)
  // ═══════════════════════════════════════════════════════════════

  // AI Contract Generator
  async generateContract(requirements: {
    type?: string;
    description?: string;
    features?: string[];
    securityLevel?: string;
  }): Promise<any> {
    return this.request<any>('/api/ai-generate-contract', {
      method: 'POST',
      body: JSON.stringify({ requirements }),
    });
  }

  // Real-time Vulnerability Scanner
  async scanVulnerabilities(data: { contractCode: string; contractAddress?: string }): Promise<any> {
    return this.request<any>('/api/ai-scan-vulnerabilities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // AI Chat Interface
  async aiChat(data: { message: string; context?: any }): Promise<any> {
    return this.request<any>('/api/ai-chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get Audit Dataset Stats
  async getAuditStats(): Promise<any> {
    return this.request<any>('/api/ai-audit-stats');
  }

  // Search Audit Dataset
  async searchAuditDataset(data: {
    query?: string;
    contractType?: string;
    severity?: string;
    limit?: number;
  }): Promise<any> {
    return this.request<any>('/api/ai-audit-search', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
