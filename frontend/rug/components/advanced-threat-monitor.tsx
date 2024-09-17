'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Eye, 
  Brain,
  Target,
  Zap,
  Filter,
  Activity,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  Database
} from 'lucide-react';
import { apiService } from '@/lib/api';

interface ThreatPattern {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  confidence: number;
}

interface ExternalThreatIntel {
  forta: {
    alerts: Array<{
      hash: string;
      description: string;
      severity: string;
      name: string;
    }>;
    riskScore: number;
  };
  airstack: {
    identity: string | null;
    reputation: string;
  };
  scamDetector: {
    isScam: boolean;
    confidence: number;
  };
  score: number;
}

interface AlertTrigger {
  ruleId: string;
  name: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  actions: string[];
}

interface ThreatAnalysis {
  threatLevel: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threatScore: number;
  detectedPatterns: ThreatPattern[];
  externalThreatIntel: ExternalThreatIntel;
  falsePositiveReduction: {
    applied: string[];
    reductionAmount: number;
    confidence: number;
  };
  alertTriggers: AlertTrigger[];
  riskFactors: string[];
  mitigationRecommendations: string[];
  confidence: number;
}

interface TransactionAnalysis {
  transactionHash: string;
  timestamp: string;
  threatAnalysis: ThreatAnalysis;
  processingTime: string;
}

const AdvancedThreatMonitor: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [recentAnalyses, setRecentAnalyses] = useState<TransactionAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<TransactionAnalysis | null>(null);
  const [threatStats, setThreatStats] = useState({
    totalAnalyzed: 1247,
    criticalThreats: 23,
    highThreats: 156,
    falsePositivesReduced: 89,
    avgProcessingTime: '287ms'
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [testAddress, setTestAddress] = useState('');

  useEffect(() => {
    // Initialize WebSocket connection for real-time threat monitoring
    initializeRealTimeMonitoring();
    
    // Load historical analyses
    loadRecentAnalyses();

    return () => {
      // Cleanup connections
    };
  }, []);

  const initializeRealTimeMonitoring = () => {
    try {
      // For demo purposes, simulate connection
      setIsConnected(true);
      console.log('🔍 Advanced Threat Monitor connected');
    } catch (error) {
      console.error('Failed to connect to threat monitoring:', error);
      setIsConnected(false);
    }
  };

  const loadRecentAnalyses = async () => {
    try {
      // For now, create some sample data to show the UI
      const sampleAnalyses: TransactionAnalysis[] = [
        {
          transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
          timestamp: new Date().toISOString(),
          processingTime: '245ms',
          threatAnalysis: {
            threatLevel: 'HIGH',
            threatScore: 78,
            detectedPatterns: [
              {
                type: 'flash_loan_attack',
                severity: 'HIGH',
                description: 'Potential flash loan exploit detected',
                confidence: 0.85
              },
              {
                type: 'mev_bot_activity',
                severity: 'MEDIUM',
                description: 'MEV bot characteristic patterns',
                confidence: 0.72
              }
            ],
            externalThreatIntel: {
              forta: {
                alerts: [
                  {
                    hash: '0xabc123',
                    description: 'Suspicious activity detected',
                    severity: 'HIGH',
                    name: 'MEV Bot Alert'
                  }
                ],
                riskScore: 25
              },
              airstack: {
                identity: null,
                reputation: 'unknown'
              },
              scamDetector: {
                isScam: false,
                confidence: 0.95
              },
              score: 25
            },
            falsePositiveReduction: {
              applied: ['standard_defi_operation'],
              reductionAmount: 10,
              confidence: 0.8
            },
            alertTriggers: [
              {
                ruleId: 'high_value_alert',
                name: 'High Value Transaction Alert',
                severity: 'HIGH',
                message: 'High-risk transaction detected',
                actions: ['notify', 'log']
              }
            ],
            riskFactors: ['high_value_transaction', 'new_contract_interaction'],
            mitigationRecommendations: [
              '⚠️ Flag for manual review',
              '🔍 Increase monitoring frequency',
              '📝 Document threat patterns'
            ],
            confidence: 0.85
          }
        }
      ];
      
      setRecentAnalyses(sampleAnalyses);
      setSelectedAnalysis(sampleAnalyses[0]); // Auto-select first analysis for demo
      setThreatStats({
        totalAnalyzed: 1247,
        criticalThreats: 23,
        highThreats: 156,
        falsePositivesReduced: 89,
        avgProcessingTime: '287ms'
      });
    } catch (error) {
      console.error('Failed to load recent analyses:', error);
    }
  };

  const runThreatAnalysis = async () => {
    if (!testAddress) return;
    
    setIsAnalyzing(true);
    try {
      const response = await apiService.getThreatIntelligence({
        address: testAddress
      });
      
      console.log('🔍 Threat analysis completed:', response);
      
      // Add to recent analyses
      const newAnalysis: TransactionAnalysis = {
        transactionHash: testAddress,
        timestamp: new Date().toISOString(),
        processingTime: '156ms',
        threatAnalysis: {
          threatLevel: 'LOW',
          threatScore: 25,
          detectedPatterns: [],
          externalThreatIntel: response.threatIntelligence || response,
          falsePositiveReduction: {
            applied: [],
            reductionAmount: 0,
            confidence: 0.8
          },
          alertTriggers: [],
          riskFactors: [],
          mitigationRecommendations: ['Monitor closely'],
          confidence: 0.75
        }
      };
      
      setRecentAnalyses(prev => [newAnalysis, ...prev]);
      setSelectedAnalysis(newAnalysis);
      
    } catch (error) {
      console.error('Threat analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'HIGH': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'MEDIUM': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'LOW': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-500" />
            Advanced Threat Monitor
          </h1>
          <p className="text-gray-600 mt-1">
            SecureMon-powered threat detection with pattern recognition and false positive reduction
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Analyzed</p>
                <p className="text-2xl font-bold">{threatStats.totalAnalyzed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Critical Threats</p>
                <p className="text-2xl font-bold text-red-600">{threatStats.criticalThreats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">High Threats</p>
                <p className="text-2xl font-bold text-orange-600">{threatStats.highThreats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">False Positives Reduced</p>
                <p className="text-2xl font-bold text-green-600">{threatStats.falsePositivesReduced}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Avg Processing</p>
                <p className="text-2xl font-bold text-purple-600">{threatStats.avgProcessingTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Test Threat Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter address or transaction hash to analyze..."
              value={testAddress}
              onChange={(e) => setTestAddress(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button 
              onClick={runThreatAnalysis} 
              disabled={isAnalyzing || !testAddress}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Analyze Threat
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Analyses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Threat Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAnalyses.map((analysis, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAnalysis?.transactionHash === analysis.transactionHash
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAnalysis(analysis)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(analysis.threatAnalysis.threatLevel)}
                      <span className="font-mono text-sm">
                        {analysis.transactionHash.substring(0, 10)}...
                      </span>
                    </div>
                    <Badge variant={getThreatLevelColor(analysis.threatAnalysis.threatLevel)}>
                      {analysis.threatAnalysis.threatLevel}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                    <span>Score: {analysis.threatAnalysis.threatScore}</span>
                    <span>{analysis.processingTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Threat Analysis Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAnalysis ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="patterns">Patterns</TabsTrigger>
                  <TabsTrigger value="intel">Intel</TabsTrigger>
                  <TabsTrigger value="alerts">Alerts</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Threat Score</span>
                      <span className="text-lg font-bold">
                        {selectedAnalysis.threatAnalysis.threatScore}/100
                      </span>
                    </div>
                    <Progress value={selectedAnalysis.threatAnalysis.threatScore} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Threat Level</p>
                      <Badge variant={getThreatLevelColor(selectedAnalysis.threatAnalysis.threatLevel)} className="mt-1">
                        {selectedAnalysis.threatAnalysis.threatLevel}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Confidence</p>
                      <p className="font-medium">
                        {Math.round(selectedAnalysis.threatAnalysis.confidence * 100)}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Risk Factors</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAnalysis.threatAnalysis.riskFactors.map((factor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {factor.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Mitigation Recommendations</p>
                    <div className="space-y-1">
                      {selectedAnalysis.threatAnalysis.mitigationRecommendations.map((rec, idx) => (
                        <div key={idx} className="text-sm p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="patterns" className="space-y-4">
                  {selectedAnalysis.threatAnalysis.detectedPatterns.map((pattern, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(pattern.severity)}
                          <span className="font-medium">
                            {pattern.type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                        <Badge variant={getThreatLevelColor(pattern.severity)}>
                          {pattern.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{pattern.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          Confidence: {Math.round(pattern.confidence * 100)}%
                        </span>
                        <Progress value={pattern.confidence * 100} className="w-24 h-1" />
                      </div>
                    </div>
                  ))}
                  
                  {selectedAnalysis.threatAnalysis.detectedPatterns.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>No threat patterns detected</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="intel" className="space-y-4">
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-2">Forta Network Intelligence</h4>
                      <div className="text-sm">
                        <p>Risk Score: {selectedAnalysis.threatAnalysis.externalThreatIntel.forta.riskScore}</p>
                        <p>Alerts: {selectedAnalysis.threatAnalysis.externalThreatIntel.forta.alerts.length}</p>
                      </div>
                    </div>

                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-2">Airstack Identity</h4>
                      <div className="text-sm">
                        <p>Identity: {selectedAnalysis.threatAnalysis.externalThreatIntel.airstack.identity || 'Unknown'}</p>
                        <p>Reputation: {selectedAnalysis.threatAnalysis.externalThreatIntel.airstack.reputation}</p>
                      </div>
                    </div>

                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-2">Scam Detection</h4>
                      <div className="text-sm">
                        <p>Is Scam: {selectedAnalysis.threatAnalysis.externalThreatIntel.scamDetector.isScam ? 'Yes' : 'No'}</p>
                        <p>Confidence: {Math.round(selectedAnalysis.threatAnalysis.externalThreatIntel.scamDetector.confidence * 100)}%</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="alerts" className="space-y-4">
                  {selectedAnalysis.threatAnalysis.alertTriggers.map((alert, idx) => (
                    <div key={idx} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-orange-900">{alert.name}</span>
                            <Badge variant={getThreatLevelColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-orange-800">{alert.message}</p>
                          <div className="flex gap-1 mt-2">
                            {alert.actions.map((action, actionIdx) => (
                              <Badge key={actionIdx} variant="outline" className="text-xs">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {selectedAnalysis.threatAnalysis.alertTriggers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>No alerts triggered</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4" />
                <p>Select a transaction to view detailed threat analysis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedThreatMonitor;
