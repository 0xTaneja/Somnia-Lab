'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle, Code, Download, Zap } from 'lucide-react';
import apiService from '@/lib/api';

interface ContractRequirements {
  type: string;
  description: string;
  features: string[];
  securityLevel: string;
}

interface GeneratedContract {
  code: string;
  language: string;
  requirements: ContractRequirements;
  securityScore: number;
  vulnerabilities: any[];
  gasEstimate: {
    deployment: number;
    averageFunction: number;
    complexity: string;
  };
  recommendations: string[];
  note?: string;
}

export default function AIContractGenerator() {
  const [requirements, setRequirements] = useState<ContractRequirements>({
    type: '',
    description: '',
    features: [],
    securityLevel: 'High'
  });
  
  const [generatedContract, setGeneratedContract] = useState<GeneratedContract | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractTypes = [
    { value: 'ERC20', label: 'ERC20 Token' },
    { value: 'NFT', label: 'NFT Collection' },
    { value: 'DeFi', label: 'DeFi Protocol' },
    { value: 'DAO', label: 'DAO Governance' },
    { value: 'Staking', label: 'Staking Contract' },
    { value: 'Bridge', label: 'Cross-Chain Bridge' },
    { value: 'Oracle', label: 'Price Oracle' },
    { value: 'Marketplace', label: 'NFT Marketplace' }
  ];

  const availableFeatures = [
    'Mintable',
    'Burnable', 
    'Pausable',
    'Upgradeable',
    'Access Control',
    'ReentrancyGuard',
    'Time Locks',
    'Rate Limiting',
    'Emergency Stop',
    'Multi-Signature',
    'Batch Operations',
    'Meta Transactions'
  ];

  const securityLevels = [
    { value: 'Standard', label: 'Standard Security' },
    { value: 'High', label: 'High Security' },
    { value: 'Maximum', label: 'Maximum Security' }
  ];

  const handleFeatureToggle = (feature: string) => {
    setRequirements(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleGenerate = async () => {
    if (!requirements.type || !requirements.description) {
      setError('Please fill in contract type and description');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await apiService.generateContract(requirements);
      
      if (response.success) {
        setGeneratedContract(response.contract);
      } else {
        setError('Failed to generate contract');
      }
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedContract) return;
    
    const blob = new Blob([generatedContract.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${requirements.type}Contract.sol`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-blue-500" />
            AI Smart Contract Generator
            <Badge variant="secondary" className="ml-auto">
              10,000+ Audits 🛡️
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Generate secure, gas-optimized smart contracts with AI-powered security analysis
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Contract Type */}
          <div className="space-y-2">
            <Label htmlFor="contract-type">Contract Type *</Label>
            <Select value={requirements.type} onValueChange={(value) => 
              setRequirements(prev => ({ ...prev, type: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select contract type" />
              </SelectTrigger>
              <SelectContent>
                {contractTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what your contract should do..."
              value={requirements.description}
              onChange={(e) => setRequirements(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Security Level */}
          <div className="space-y-2">
            <Label htmlFor="security-level">Security Level</Label>
            <Select value={requirements.securityLevel} onValueChange={(value) => 
              setRequirements(prev => ({ ...prev, securityLevel: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {securityLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <Label>Features</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableFeatures.map(feature => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature}
                    checked={requirements.features.includes(feature)}
                    onCheckedChange={() => handleFeatureToggle(feature)}
                  />
                  <Label htmlFor={feature} className="text-sm">
                    {feature}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Zap className="mr-2 h-4 w-4 animate-spin" />
                Generating Contract...
              </>
            ) : (
              <>
                <Code className="mr-2 h-4 w-4" />
                Generate Smart Contract
              </>
            )}
          </Button>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Contract */}
      {generatedContract && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Generated Contract
              </span>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Security Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Security Score</p>
                <p className={`text-2xl font-bold ${getSecurityScoreColor(generatedContract.securityScore)}`}>
                  {generatedContract.securityScore}/100
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Deployment Cost</p>
                <p className="text-2xl font-bold text-blue-600">
                  {generatedContract.gasEstimate.deployment.toLocaleString()} gas
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Complexity</p>
                <Badge className={getComplexityColor(generatedContract.gasEstimate.complexity)}>
                  {generatedContract.gasEstimate.complexity}
                </Badge>
              </div>
            </div>

            {/* Vulnerabilities */}
            {generatedContract.vulnerabilities.length > 0 && (
              <div className="space-y-2">
                <Label>⚠️ Detected Issues</Label>
                <div className="space-y-2">
                  {generatedContract.vulnerabilities.map((vuln, index) => (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{vuln.type}</span>
                        <Badge variant={vuln.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                          {vuln.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{vuln.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {generatedContract.recommendations.length > 0 && (
              <div className="space-y-2">
                <Label>💡 Recommendations</Label>
                <div className="space-y-1">
                  {generatedContract.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Code */}
            <div className="space-y-2">
              <Label>📄 Generated Code</Label>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
                  <code>{generatedContract.code}</code>
                </pre>
              </div>
            </div>

            {generatedContract.note && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  ℹ️ {generatedContract.note}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
