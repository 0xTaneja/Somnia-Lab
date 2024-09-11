'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DefiHeader } from '@/components/defi-header';
import { 
  Shield, 
  Download, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Zap,
  Brain,
  Database,
  Eye,
  Globe
} from 'lucide-react';

export default function SnapPage() {
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);
  const [snapStatus, setSnapStatus] = useState<'not-installed' | 'installing' | 'installed' | 'error'>('not-installed');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    // Check if MetaMask Flask is available (required for snaps)
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log('🔍 Checking MetaMask...', {
        isMetaMask: window.ethereum.isMetaMask,
        hasRequest: !!window.ethereum.request,
        version: window.ethereum.version
      });
      
      // Check if it's MetaMask Flask by checking for snap methods
      if (window.ethereum.isMetaMask && window.ethereum.request) {
        // Try to detect Flask by checking for snap methods
        window.ethereum.request({ method: 'wallet_getSnaps' })
          .then((snaps: any) => {
            console.log('✅ Flask detected, existing snaps:', snaps);
            setIsMetaMaskAvailable(true);
          })
          .catch((error: any) => {
            console.log('❌ Flask detection failed:', error);
            // This might still be Flask, just need to handle the error better
            if (error.code === -32601) {
              // Method not found - definitely not Flask
              setIsMetaMaskAvailable(false);
              setStatusMessage('MetaMask Flask is required for snaps. Regular MetaMask detected.');
            } else {
              // Other error, might still be Flask - let's try
              console.log('🤔 Assuming Flask due to non-method-not-found error');
              setIsMetaMaskAvailable(true);
            }
          });
      } else {
        setIsMetaMaskAvailable(false);
        setStatusMessage('MetaMask not detected or not supported.');
      }
    } else {
      setStatusMessage('MetaMask not found. Please install MetaMask Flask.');
    }
  }, []);

  const connectSnap = async () => {
    if (!window.ethereum) {
      setStatusMessage('MetaMask not found. Please install MetaMask Flask.');
      return;
    }

    if (!window.ethereum.isMetaMask) {
      setStatusMessage('Please use MetaMask Flask for snap installation.');
      return;
    }

    try {
      setSnapStatus('installing');
      setStatusMessage('Checking MetaMask Flask compatibility...');

      // First, check if snaps are supported
      try {
        await window.ethereum.request({ method: 'wallet_getSnaps' });
      } catch (snapError) {
        setSnapStatus('error');
        setStatusMessage('MetaMask Flask is required. Please install Flask version from metamask.io/flask');
        return;
      }

      setStatusMessage('Installing Somnia Security Guard...');

      // Request account access first
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Install the snap
      const result = await window.ethereum.request({
        method: 'wallet_requestSnaps',
        params: {
          'local:http://localhost:8080': {
            version: '^0.1.0'
          }
        }
      });

      if (result && result['local:http://localhost:8080']) {
        setSnapStatus('installed');
        setStatusMessage('Successfully installed! Transaction security is now active.');
      } else {
        setSnapStatus('error');
        setStatusMessage('Installation failed. Please try again.');
      }
    } catch (error: any) {
      setSnapStatus('error');
      console.error('Snap installation error:', error);
      
      if (error.code === 4001) {
        setStatusMessage('Installation cancelled by user');
      } else if (error.code === -32601) {
        setStatusMessage('MetaMask Flask required. Regular MetaMask does not support snaps.');
      } else if (error.message?.includes('wallet_requestSnaps')) {
        setStatusMessage('Please install MetaMask Flask. Regular MetaMask does not support snaps.');
      } else {
        setStatusMessage(`Installation failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const features = [
    {
      icon: Eye,
      title: 'Real-time Transaction Analysis',
      description: 'Automatically analyzes every transaction before you sign it',
      status: 'active'
    },
    {
      icon: Brain,
      title: 'AI-Powered Security',
      description: 'GPT-4 powered vulnerability detection and risk assessment',
      status: 'active'
    },
    {
      icon: Database,
      title: '1,000+ Audit Dataset',
      description: 'Leverages comprehensive audit database for pattern recognition',
      status: 'active'
    },
    {
      icon: Zap,
      title: 'Instant Warnings',
      description: 'Get immediate security warnings before confirming transactions',
      status: 'active'
    }
  ];

  const getStatusIcon = () => {
    switch (snapStatus) {
      case 'installed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'installing':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <Download className="h-5 w-5" />;
    }
  };

  const getButtonText = () => {
    switch (snapStatus) {
      case 'installed':
        return 'Snap Installed ✅';
      case 'installing':
        return 'Installing...';
      case 'error':
        return 'Retry Installation';
      default:
        return 'Install Somnia Security Guard';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DefiHeader />
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Shield className="h-16 w-16 text-primary" />
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                LIVE
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">Somnia Lab Security Guard</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            MetaMask Snap from Somnia Lab that provides real-time AI-powered security analysis for your Somnia transactions
          </p>
        </div>

        {/* Installation Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                {getStatusIcon()}
                Get Protected Now
              </CardTitle>
              <p className="text-muted-foreground">
                Install the snap to start protecting your transactions
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isMetaMaskAvailable && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <strong>MetaMask Flask Required</strong>
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                    Snaps only work with MetaMask Flask (the developer version). Regular MetaMask does not support snaps.
                  </p>
                  <a 
                    href="https://metamask.io/flask/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Download MetaMask Flask <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              
              <Button 
                onClick={connectSnap}
                disabled={!isMetaMaskAvailable || snapStatus === 'installing' || snapStatus === 'installed'}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {getButtonText()}
              </Button>
              
              {statusMessage && (
                <p className={`text-center text-sm ${
                  snapStatus === 'installed' ? 'text-green-600 dark:text-green-400' : 
                  snapStatus === 'error' ? 'text-red-600 dark:text-red-400' : 
                  'text-muted-foreground'
                }`}>
                  {statusMessage}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {feature.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it Works */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">1</span>
                </div>
                <h3 className="font-semibold">Install Snap</h3>
                <p className="text-sm text-muted-foreground">
                  Click the install button and approve in MetaMask Flask
                </p>
              </div>
              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">2</span>
                </div>
                <h3 className="font-semibold">Use Normally</h3>
                <p className="text-sm text-muted-foreground">
                  Continue using DeFi apps on Somnia as usual
                </p>
              </div>
              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">3</span>
                </div>
                <h3 className="font-semibold">Stay Protected</h3>
                <p className="text-sm text-muted-foreground">
                  Get AI security analysis before every transaction
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Info */}
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-6 w-6 text-blue-600" />
              <h3 className="font-semibold">Optimized for Somnia</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              This snap is specially designed for the Somnia blockchain and provides the best security analysis for Somnia transactions.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Supported Networks:</strong> Somnia Testnet (50312), Somnia Mainnet (5031)</p>
              <p><strong>Backend:</strong> Connected to our AI analysis API</p>
              <p><strong>Dataset:</strong> 1,000+ security audit records</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
