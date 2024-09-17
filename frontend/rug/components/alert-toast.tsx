"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiService } from "@/lib/api"

interface Alert {
  id: string
  contractAddress: string
  riskScore: number
  reason: string
  timestamp: Date
  alertType?: string
  analysis?: any
}

export function AlertToast() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Connect to WebSocket for real-time security alerts
    const connectWebSocket = () => {
      try {
        console.log('🔄 Alert service connecting to ws://172.20.27.76:5000/ws...')
        const websocket = new WebSocket('ws://172.20.27.76:5000/ws')
        
        websocket.onopen = () => {
          console.log('🚨 Connected to security alerts feed')
          setIsConnected(true)
        }

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            // Listen for high-risk transactions and contract analyses
            if ((data.type === 'transaction_analysis' || data.type === 'contract_analysis') && 
                (data.riskScore >= 60 || data.data?.riskScore >= 60)) {
              
              const riskScore = data.riskScore || data.data?.riskScore || 60
              const contractAddress = data.contractAddress || data.data?.contractAddress || 'Unknown'
              
              const newAlert: Alert = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                contractAddress,
                riskScore,
                reason: riskScore >= 80 ? "Critical risk contract detected" :
                        riskScore >= 70 ? "High risk transaction pattern" :
                        "Suspicious activity detected",
                timestamp: new Date(),
                alertType: data.type,
                analysis: data
              }

              setAlerts((prev) => [newAlert, ...prev.slice(0, 4)]) // Keep only 5 most recent
            }

            // Listen for specific alert broadcasts
            if (data.type === 'security_alert' || data.type === 'high_risk_contract') {
              const newAlert: Alert = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                contractAddress: data.contractAddress || 'Unknown',
                riskScore: data.riskScore || 80,
                reason: data.message || "Security threat detected",
                timestamp: new Date(),
                alertType: data.alertType || 'security_alert',
                analysis: data
              }

              setAlerts((prev) => [newAlert, ...prev.slice(0, 4)])
            }
          } catch (error) {
            console.error('Error parsing alert WebSocket message:', error)
          }
        }

        websocket.onclose = () => {
          console.log('🚨 Alert WebSocket connection closed, attempting to reconnect...')
          setIsConnected(false)
          setTimeout(connectWebSocket, 5000)
        }

        websocket.onerror = (error) => {
          console.error('Alert WebSocket error:', error)
          setIsConnected(false)
        }

        return websocket
      } catch (error) {
        console.error('Failed to connect to alerts WebSocket:', error)
        setIsConnected(false)
        return null
      }
    }

    const websocket = connectWebSocket()

    return () => {
      if (websocket) {
        websocket.close()
      }
    }
  }, [])

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-400 bg-red-500/10 border-red-500/20"
    if (score >= 60) return "text-orange-400 bg-orange-500/10 border-orange-500/20"
    return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
  }

  return (
    <div className="space-y-4">
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="mb-2">No security alerts detected</p>
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <p className="text-xs">
              {isConnected ? 'Live monitoring active' : 'Connecting to security feed...'}
            </p>
          </div>
        </div>
      ) : (
        alerts.map((alert, index) => (
          <div
            key={alert.id}
            className={`
              bg-red-950/20 border border-red-500/20 rounded-lg p-4 
              animate-in slide-in-from-right-full duration-500
              ${index === 0 ? "ring-2 ring-red-500/30" : ""}
            `}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="bg-red-500/20 p-2 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-sm font-semibold text-red-400">High Risk Transaction</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(alert.riskScore)}`}
                    >
                      Risk: {alert.riskScore}%
                    </span>
                  </div>

                  <p className="text-sm text-foreground mb-2">{alert.reason}</p>

                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <span>Contract:</span>
                      <code className="bg-muted px-1 py-0.5 rounded font-mono">
                        {alert.contractAddress.slice(0, 10)}...{alert.contractAddress.slice(-8)}
                      </code>
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    <span>{alert.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissAlert(alert.id)}
                className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
