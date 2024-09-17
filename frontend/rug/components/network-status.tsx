"use client"

import { useState, useEffect } from "react"
import { Activity, Zap, Globe, TrendingUp } from "lucide-react"

interface NetworkStats {
  blockHeight: number
  gasPrice: number
  tps: number
  activeNodes: number
  networkHealth: number
}

export function NetworkStatus() {
  const [stats, setStats] = useState<NetworkStats>({
    blockHeight: 2847392,
    gasPrice: 0.000000012,
    tps: 847,
    activeNodes: 1247,
    networkHealth: 98.7,
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        blockHeight: prev.blockHeight + Math.floor(Math.random() * 3) + 1,
        gasPrice: Math.max(0.000000008, prev.gasPrice + (Math.random() - 0.5) * 0.000000004),
        tps: Math.max(100, prev.tps + Math.floor((Math.random() - 0.5) * 100)),
        activeNodes: Math.max(1000, prev.activeNodes + Math.floor((Math.random() - 0.5) * 20)),
        networkHealth: Math.max(95, Math.min(100, prev.networkHealth + (Math.random() - 0.5) * 2)),
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getHealthColor = (health: number) => {
    if (health >= 98) return "text-green-400"
    if (health >= 95) return "text-yellow-400"
    return "text-red-400"
  }

  const getHealthBgColor = (health: number) => {
    if (health >= 98) return "bg-green-500/10 border-green-500/20"
    if (health >= 95) return "bg-yellow-500/10 border-yellow-500/20"
    return "bg-red-500/10 border-red-500/20"
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-card-foreground">Network Status</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-400 font-medium">Live</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Network Health */}
        <div className={`p-4 rounded-lg border ${getHealthBgColor(stats.networkHealth)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-card-foreground">Network Health</span>
            </div>
            <span className={`text-lg font-bold ${getHealthColor(stats.networkHealth)}`}>
              {stats.networkHealth.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-primary h-2 rounded-full transition-all duration-1000"
              style={{ width: `${stats.networkHealth}%` }}
            ></div>
          </div>
        </div>

        {/* Block Height */}
        <div className="bg-muted/50 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-card-foreground">Block Height</span>
            </div>
            <span className="text-lg font-bold text-primary font-mono">{stats.blockHeight.toLocaleString()}</span>
          </div>
        </div>

        {/* Gas Price */}
        <div className="bg-muted/50 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-card-foreground">Gas Price</span>
            </div>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {(stats.gasPrice * 1000000000).toFixed(2)} Gwei
            </span>
          </div>
        </div>

        {/* TPS */}
        <div className="bg-muted/50 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-card-foreground">Transactions/sec</span>
            </div>
            <span className="text-lg font-bold text-cyan-400 font-mono">{stats.tps.toLocaleString()}</span>
          </div>
        </div>

        {/* Active Nodes */}
        <div className="bg-muted/50 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-card-foreground">Active Nodes</span>
            </div>
            <span className="text-lg font-bold text-green-400 font-mono">{stats.activeNodes.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Somnia Branding */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <span>⚡</span>
          <span>Somnia Testnet</span>
          <div className="w-1 h-1 bg-primary rounded-full"></div>
          <span>EVM Compatible</span>
        </div>
      </div>
    </div>
  )
}
