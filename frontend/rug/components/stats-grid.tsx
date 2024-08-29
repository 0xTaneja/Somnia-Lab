"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle, TrendingUp, Users, Activity, Zap } from "lucide-react"
import { apiService, type HealthStatus } from "@/lib/api"

interface Stat {
  title: string
  value: string
  icon: any
  status: 'operational' | 'disconnected' | 'initializing' | 'disabled' | 'connected' | 'error'
  description: string
}

export function StatsGrid() {
  const [healthData, setHealthData] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const health = await apiService.getHealth()
        setHealthData(health)
      } catch (error) {
        console.error('Failed to fetch health data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHealthData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats: Stat[] = healthData ? [
    {
      title: "API Status",
      value: healthData.services.api === 'operational' ? 'Online' : 'Offline',
      icon: Activity,
      status: healthData.services.api as any,
      description: `Version ${healthData.version}`
    },
    {
      title: "Somnia Network",
      value: healthData.services.somniaNetwork === 'connected' ? 'Connected' : 'Disconnected',
      icon: Zap,
      status: healthData.services.somniaNetwork as any,
      description: healthData.network ? `Block ${healthData.network.blockNumber}` : 'Not connected'
    },
    {
      title: "AI Analysis",
      value: healthData.services.aiAnalysis === 'operational' ? 'Active' : 'Inactive',
      icon: TrendingUp,
      status: healthData.services.aiAnalysis as any,
      description: 'GPT-powered analysis'
    },
    {
      title: "Cross-Chain",
      value: healthData.services.crossChain === 'operational' ? 'Active' : 'Inactive',
      icon: Shield,
      status: healthData.services.crossChain as any,
      description: 'Multi-network support'
    },
    {
      title: "Social Analysis",
      value: healthData.services.socialAnalysis === 'operational' ? 'Active' : 'Inactive',
      icon: Users,
      status: healthData.services.socialAnalysis as any,
      description: 'Sentiment monitoring'
    },
    {
      title: "WebSocket",
      value: healthData.services.websocket === 'operational' ? 'Active' : 'Inactive',
      icon: AlertTriangle,
      status: healthData.services.websocket as any,
      description: healthData.websocket ? `${healthData.websocket.connections} clients` : 'Real-time alerts'
    }
  ] : []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600'
      case 'connected': return 'text-green-600'
      case 'initializing': return 'text-yellow-600'
      case 'disconnected': return 'text-red-600'
      case 'disabled': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
      case 'connected':
        return '🟢'
      case 'initializing':
        return '🟡'
      case 'disconnected':
      case 'error':
        return '🔴'
      case 'disabled':
        return '⚪'
      default:
        return '⚪'
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span>{getStatusIcon(stat.status)}</span>
                <span className={getStatusColor(stat.status)}>
                  {stat.description}
                </span>
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
