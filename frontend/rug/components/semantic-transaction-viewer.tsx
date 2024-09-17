'use client';

import React, { useState } from 'react';
import { Brain, Shield, AlertTriangle, Info, Zap, Lock, Eye, Code, ChevronDown, ChevronRight } from 'lucide-react';

interface SemanticAnalysis {
  intent: string;
  functionName: string | null;
  humanExplanation: string | null;
  securityWarnings: Array<{
    message: string;
    severity: string;
  }>;
  riskFactors: string[];
  confidence: number;
}

interface TransactionData {
  transactionHash: string;
  contractAddress: string;
  from: string;
  value: string;
  riskScore: number;
  riskLevel: string;
  timestamp: string;
  semanticAnalysis: SemanticAnalysis | null;
  displayData: {
    intent: string;
    riskLevel: string;
    hasSemanticAnalysis: boolean;
    shortExplanation: string;
  };
}

interface SemanticTransactionViewerProps {
  transaction: TransactionData;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function SemanticTransactionViewer({ 
  transaction, 
  isExpanded = false, 
  onToggleExpand 
}: SemanticTransactionViewerProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toUpperCase()) {
      case 'CRITICAL': return 'from-red-500 to-red-700';
      case 'HIGH': return 'from-orange-500 to-red-500';
      case 'MEDIUM': return 'from-yellow-500 to-orange-500';
      case 'LOW': return 'from-green-500 to-blue-500';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getIntentIcon = (intent: string) => {
    if (intent.toLowerCase().includes('transfer')) return '💸';
    if (intent.toLowerCase().includes('approval')) return '✅';
    if (intent.toLowerCase().includes('swap')) return '🔄';
    if (intent.toLowerCase().includes('withdraw')) return '💰';
    if (intent.toLowerCase().includes('deposit')) return '🏦';
    if (intent.toLowerCase().includes('mint')) return '🪙';
    if (intent.toLowerCase().includes('burn')) return '🔥';
    return '❓';
  };

  const formatAddress = (address: string) => {
    if (!address || address === 'Unknown') return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatValue = (value: string) => {
    try {
      const ethValue = parseFloat(value) / 1e18;
      if (ethValue === 0) return '0 ETH';
      if (ethValue < 0.0001) return '<0.0001 ETH';
      return `${ethValue.toFixed(4)} ETH`;
    } catch {
      return '0 ETH';
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden transition-all duration-300">
      {/* Header Section */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Semantic Analysis Badge */}
            {transaction.semanticAnalysis ? (
              <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                <Brain size={16} />
                <span>AI Analyzed</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-gray-600 text-gray-300 px-3 py-1 rounded-full text-sm">
                <Brain size={16} />
                <span>Basic Analysis</span>
              </div>
            )}

            {/* Risk Level Badge */}
            <div className={`bg-gradient-to-r ${getRiskColor(transaction.riskLevel)} text-white px-3 py-1 rounded-full text-sm font-bold`}>
              {transaction.riskLevel} RISK
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">
              {transaction.timestamp === "Live Somnia" || transaction.timestamp === "Just now" 
                ? transaction.timestamp 
                : new Date(transaction.timestamp).toLocaleTimeString()}
            </span>
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
        </div>

        {/* Transaction Intent */}
        <div className="mt-3 flex items-center space-x-3">
          <span className="text-2xl">{getIntentIcon(transaction.displayData.intent)}</span>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {transaction.displayData.intent}
            </h3>
            <p className="text-gray-400 text-sm">
              {formatAddress(transaction.from)} → {formatAddress(transaction.contractAddress)}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-3 flex items-center space-x-4 text-sm">
          <span className="text-gray-300">
            <strong>Value:</strong> {formatValue(transaction.value)}
          </span>
          <span className="text-gray-300">
            <strong>Risk Score:</strong> {transaction.riskScore}/100
          </span>
          {transaction.semanticAnalysis?.confidence && (
            <span className="text-green-400">
              <strong>AI Confidence:</strong> {Math.round(transaction.semanticAnalysis.confidence * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-700 transition-all duration-300">
            <div className="p-4 space-y-4">
              {/* Semantic Explanation */}
              {transaction.semanticAnalysis?.humanExplanation && (
                <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-4 border border-blue-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <Brain className="text-blue-400" size={20} />
                    <h4 className="text-lg font-semibold text-blue-400">AI Explanation</h4>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    {transaction.semanticAnalysis.humanExplanation}
                  </p>
                </div>
              )}

              {/* Security Warnings */}
              {transaction.semanticAnalysis?.securityWarnings && transaction.semanticAnalysis.securityWarnings.length > 0 && (
                <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-lg p-4 border border-red-500/30">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="text-red-400" size={20} />
                    <h4 className="text-lg font-semibold text-red-400">Security Warnings</h4>
                  </div>
                  <div className="space-y-2">
                    {transaction.semanticAnalysis.securityWarnings.map((warning, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertTriangle 
                          size={16} 
                          className={`mt-0.5 ${
                            warning.severity === 'high' ? 'text-red-400' : 
                            warning.severity === 'medium' ? 'text-yellow-400' : 'text-orange-400'
                          }`} 
                        />
                        <span className="text-gray-300 text-sm">{warning.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Factors */}
              {transaction.semanticAnalysis?.riskFactors && transaction.semanticAnalysis.riskFactors.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-lg p-4 border border-yellow-500/30">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lock className="text-yellow-400" size={20} />
                    <h4 className="text-lg font-semibold text-yellow-400">Risk Factors</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {transaction.semanticAnalysis.riskFactors.map((factor, index) => (
                      <span 
                        key={index}
                        className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-sm border border-yellow-500/30"
                      >
                        {factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Details Toggle */}
              <div className="border-t border-gray-700 pt-4">
                <button
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Code size={16} />
                  <span>Technical Details</span>
                  {showTechnicalDetails ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {showTechnicalDetails && (
                  <div className="mt-3 bg-gray-800/50 rounded-lg p-3 font-mono text-sm transition-all duration-300">
                      <div className="space-y-2 text-gray-300">
                        <div><span className="text-gray-500">Hash:</span> {transaction.transactionHash}</div>
                        <div><span className="text-gray-500">From:</span> {transaction.from}</div>
                        <div><span className="text-gray-500">To:</span> {transaction.contractAddress}</div>
                        <div><span className="text-gray-500">Value:</span> {transaction.value}</div>
                        {transaction.semanticAnalysis?.functionName && (
                          <div><span className="text-gray-500">Function:</span> {transaction.semanticAnalysis.functionName}</div>
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <a 
                  href={`https://shannon-explorer.somnia.network/tx/${transaction.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Eye size={16} />
                  <span>View on Somnia Explorer</span>
                </a>
                
                {transaction.semanticAnalysis && (
                  <button 
                    onClick={() => {
                      // Create a modal or detailed view with full semantic analysis
                      const analysis = transaction.semanticAnalysis;
                      alert(`🧠 Full AI Analysis:\n\nFunction: ${analysis?.functionName || 'Unknown'}\n\nExplanation: ${analysis?.humanExplanation || 'No detailed explanation available'}\n\nRisk Factors: ${analysis?.riskFactors?.join(', ') || 'None detected'}\n\nConfidence: ${Math.round((analysis?.confidence || 0) * 100)}%`);
                    }}
                    className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Brain size={16} />
                    <span>Full AI Analysis</span>
                  </button>
                )}
              </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default SemanticTransactionViewer;
