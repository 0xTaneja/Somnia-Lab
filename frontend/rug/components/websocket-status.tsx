"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Users, Clock } from "lucide-react"

export function WebSocketStatus() {
  const [isConnected, setIsConnected] = useState(true)
  const [subscriberCount, setSubscriberCount] = useState(1247)
  const [lastAlert, setLastAlert] = useState(new Date())

  // Simulate connection status changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Occasionally simulate disconnection
      if (Math.random() < 0.1) {
        setIsConnected(false)
        setTimeout(() => setIsConnected(true), 3000)
      }

      // Update subscriber count
      setSubscriberCount((prev) => prev + Math.floor(Math.random() * 5) - 2)

      // Update last alert timestamp occasionally
      if (Math.random() < 0.3) {
        setLastAlert(new Date())
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    return `${Math.floor(diffInSeconds / 3600)}h ago`
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          {isConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
          WebSocket Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Connection</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        {/* Subscriber Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Users className="h-4 w-4" />
            Subscribers
          </span>
          <span className="text-sm font-medium text-card-foreground">{subscriberCount.toLocaleString()}</span>
        </div>

        {/* Last Alert */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Last Alert
          </span>
          <span className="text-sm font-medium text-card-foreground">{formatTimeAgo(lastAlert)}</span>
        </div>

        {/* Connection Quality */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Connection Quality</span>
            <span className="text-xs font-medium text-green-500">Excellent</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="bg-green-500 h-1.5 rounded-full w-[95%] transition-all duration-300" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
