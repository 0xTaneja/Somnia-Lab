'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// ScrollArea component replaced with div
import { Send, Bot, User, Code, Shield, Search, Lightbulb } from 'lucide-react';
import apiService from '@/lib/api';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  features?: string[];
  capabilities?: string[];
  prevention?: string;
  auditStats?: any;
}

export default function AIChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Welcome message
    setMessages([{
      id: '1',
      type: 'ai',
      content: "👋 Hello! I'm your AI Smart Contract Assistant. I can help you generate secure contracts, scan for vulnerabilities, and answer security questions. What would you like to do?",
      timestamp: new Date(),
      capabilities: [
        "🔧 Generate Smart Contracts",
        "🔍 Vulnerability Scanning", 
        "📚 Security Education",
        "🛡️ Audit Assistance"
      ]
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiService.aiChat({
        message: inputValue,
        context: { previousMessages: messages.slice(-5) }
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.response.response,
        timestamp: new Date(),
        suggestions: response.response.suggestions,
        features: response.response.features,
        capabilities: response.response.capabilities,
        prevention: response.response.prevention,
        auditStats: response.response.auditStats
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const renderMessage = (message: ChatMessage) => {
    return (
      <div key={message.id} className={`flex gap-3 mb-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            message.type === 'user' 
              ? 'bg-blue-500 text-white' 
              : 'bg-green-500 text-white'
          }`}>
            {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
          </div>

          {/* Message Content */}
          <div className={`p-3 rounded-lg ${
            message.type === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900 border'
          }`}>
            <p className="whitespace-pre-wrap">{message.content}</p>
            
            {/* Suggestions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium">💡 Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            {message.features && message.features.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium">🚀 Features:</p>
                <div className="grid grid-cols-1 gap-1">
                  {message.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Shield size={12} className="mr-1" />
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Capabilities */}
            {message.capabilities && message.capabilities.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium">🤖 Capabilities:</p>
                <div className="grid grid-cols-2 gap-1">
                  {message.capabilities.map((capability, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Prevention/Fix Advice */}
            {message.prevention && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-sm">
                  <strong>🛡️ Prevention:</strong> {message.prevention}
                </p>
              </div>
            )}

            {/* Audit Stats */}
            {message.auditStats && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium">📊 Audit Database:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Total Audits: {message.auditStats.totalAudits}</div>
                  <div>Contract Types: {message.auditStats.contractTypes?.join(', ')}</div>
                </div>
              </div>
            )}

            <p className="text-xs opacity-60 mt-2">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const quickActions = [
    { icon: Code, text: "Generate ERC20 Token", message: "Generate a secure ERC20 token contract with minting and access control features" },
    { icon: Shield, text: "Security Best Practices", message: "What are the top smart contract security best practices I should follow?" },
    { icon: Lightbulb, text: "Explain Reentrancy", message: "What is reentrancy vulnerability and how to prevent it?" },
    { icon: Search, text: "Audit Database Info", message: "Tell me about your audit database and what vulnerabilities you can detect" }
  ];

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-green-500" />
          AI Smart Contract Assistant
          <Badge variant="secondary" className="ml-auto">
            Phase 2 🚀
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Ask me anything about smart contracts, security, and blockchain development!
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">🚀 Quick Actions:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(action.message)}
                  className="flex items-center gap-2 text-xs h-auto p-2"
                >
                  <action.icon size={14} />
                  {action.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 mb-4 overflow-y-auto max-h-96 pr-2">
          <div className="space-y-4">
            {messages.map(renderMessage)}
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me anything about smart contracts..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            size="icon"
          >
            <Send size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
