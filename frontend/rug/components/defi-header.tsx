"use client"

import { Activity, AlertTriangle, BarChart3, FileSearch, Shield, Brain, Puzzle, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"

export function DefiHeader() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Somnia network configuration
  const SOMNIA_NETWORK = {
    chainId: '0xc488', // 50312 in decimal
    chainName: 'Somnia Testnet',
    nativeCurrency: {
      name: 'STT',
      symbol: 'STT',
      decimals: 18,
    },
    rpcUrls: ['https://dream-rpc.somnia.network/'],
    blockExplorerUrls: ['https://shannon-explorer.somnia.network/'],
  };

  useEffect(() => {
    checkWalletConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(chainId === SOMNIA_NETWORK.chainId);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setIsConnected(false);
      setAccount('');
    } else {
      setAccount(accounts[0]);
      checkWalletConnection();
    }
  };

  const handleChainChanged = () => {
    checkWalletConnection();
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to connect your wallet');
      return;
    }

    try {
      setIsConnecting(true);
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        
        // Check if we're on Somnia network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== SOMNIA_NETWORK.chainId) {
          // Try to switch to Somnia network
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: SOMNIA_NETWORK.chainId }],
            });
          } catch (switchError: any) {
            // If network doesn't exist, add it
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [SOMNIA_NETWORK],
                });
              } catch (addError) {
                console.error('Error adding Somnia network:', addError);
                alert('Failed to add Somnia network. Please add it manually.');
                return;
              }
            } else {
              console.error('Error switching to Somnia network:', switchError);
              alert('Failed to switch to Somnia network.');
              return;
            }
          }
        }
        
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount('');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="text-2xl">🛡️</div>
          <span className="text-xl font-bold text-primary">Somnia Lab</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/">
            <Button variant="ghost" className="text-foreground hover:text-primary">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/analyzer">
            <Button variant="ghost" className="text-foreground hover:text-primary">
              <Activity className="mr-2 h-4 w-4" />
              Analyzer
            </Button>
          </Link>
          <Link href="/alerts">
            <Button variant="ghost" className="text-foreground hover:text-primary">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Alerts
            </Button>
          </Link>
          <Link href="/contract">
            <Button variant="ghost" className="text-foreground hover:text-primary">
              <FileSearch className="mr-2 h-4 w-4" />
              Contract
            </Button>
          </Link>
          <Link href="/ai-tools">
            <Button variant="ghost" className="text-foreground hover:text-primary relative">
              <Brain className="mr-2 h-4 w-4" />
              AI Tools
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                NEW
              </span>
            </Button>
          </Link>
          <Link href="/snap">
            <Button variant="ghost" className="text-foreground hover:text-primary relative">
              <Puzzle className="mr-2 h-4 w-4" />
              Snap
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                LIVE
              </span>
            </Button>
          </Link>
                  <Link href="/threat-monitor">
                    <Button variant="ghost" className="text-foreground hover:text-primary">
                      <Shield className="mr-2 h-4 w-4" />
                      Threat Monitor
                    </Button>
                  </Link>
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <div className="flex items-center space-x-2 bg-card px-3 py-2 rounded-lg border">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-card-foreground">
                  {formatAddress(account)} • Somnia ⚡
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnectWallet}
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
              >
                ×
              </Button>
            </div>
          ) : (
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
