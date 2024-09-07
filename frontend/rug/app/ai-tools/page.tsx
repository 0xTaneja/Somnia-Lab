'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Code, 
  Shield, 
  Database,
  Zap,
  Brain,
  FileText,
  MessageSquare,
  Search,
  BarChart3
} from 'lucide-react';

// Import our new components
import AIChatInterface from '@/components/ai-chat-interface';
import AIContractGenerator from '@/components/ai-contract-generator';

export default function AIToolsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const features = [
    {
      icon: MessageSquare,
      title: 'AI Chat Assistant',
      description: 'Interactive AI assistant for smart contract questions and guidance',
      capabilities: ['Contract guidance', 'Security advice', 'Best practices', 'Code explanations']
    },
    {
      icon: Code,
      title: 'Contract Generator',
      description: 'Generate secure smart contracts with AI-powered analysis',
      capabilities: ['Multiple contract types', 'Security optimization', 'Gas efficiency', 'Best practices']
    },
    {
      icon: Database,
      title: 'Audit Dataset',
      description: '1,000+ security audits for comprehensive vulnerability detection',
      capabilities: ['Historical patterns', 'Known vulnerabilities', 'Fix recommendations', 'Risk assessment']
    }
  ];

  const stats = [
    { label: 'Audit Records', value: '1,000+', icon: Database },
    { label: 'Contract Types', value: '8+', icon: FileText },
    { label: 'Vulnerability Patterns', value: '50+', icon: Shield },
    { label: 'Security Levels', value: '3', icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
              <Brain className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">AI Smart Contract Tools</h1>
              <p className="text-lg text-gray-600">Phase 2 Revolutionary Features</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              <Database className="mr-1 h-3 w-3" />
              10,000+ Audit Dataset
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Bot className="mr-1 h-3 w-3" />
              AI-Powered Analysis
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Shield className="mr-1 h-3 w-3" />
              Real-time Scanning
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Code className="mr-1 h-3 w-3" />
              Contract Generation
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Generator
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <stat.icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <feature.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      {feature.title}
                    </CardTitle>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {feature.capabilities.map((capability, capIndex) => (
                          <Badge key={capIndex} variant="outline" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => setActiveTab(index === 0 ? 'chat' : 'generator')}
                      >
                        Try {feature.title}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Getting Started */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <span className="text-green-600 font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Start with AI Chat</h3>
                      <p className="text-sm text-gray-600">Ask questions about smart contract security and get expert guidance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <span className="text-blue-600 font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Generate Contracts</h3>
                      <p className="text-sm text-gray-600">Create secure smart contracts tailored to your requirements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <span className="text-purple-600 font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Scan for Issues</h3>
                      <p className="text-sm text-gray-600">Analyze contracts for vulnerabilities and security risks</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Chat Tab */}
          <TabsContent value="chat">
            <AIChatInterface />
          </TabsContent>

          {/* Contract Generator Tab */}
          <TabsContent value="generator">
            <AIContractGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
