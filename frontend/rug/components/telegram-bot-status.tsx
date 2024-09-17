"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Send, Users, CheckCircle, AlertCircle, Settings } from "lucide-react"

export function TelegramBotStatus() {
  const [botStatus, setBotStatus] = useState<"active" | "inactive" | "error">("active")
  const [subscriberCount, setSubscriberCount] = useState(892)
  const [alertsSent, setAlertsSent] = useState(1247)
  const [lastActivity, setLastActivity] = useState(new Date())

  // Simulate bot activity
  useEffect(() => {
    const interval = setInterval(() => {
      // Occasionally change bot status
      if (Math.random() < 0.05) {
        const statuses: ("active" | "inactive" | "error")[] = ["active", "inactive", "error"]
        setBotStatus(statuses[Math.floor(Math.random() * statuses.length)])
      }

      // Update metrics
      setSubscriberCount((prev) => prev + Math.floor(Math.random() * 3) - 1)

      if (Math.random() < 0.4) {
        setAlertsSent((prev) => prev + 1)
        setLastActivity(new Date())
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (botStatus) {
      case "active":
        return "text-green-500"
      case "inactive":
        return "text-yellow-500"
      case "error":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusIcon = () => {
    switch (botStatus) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "inactive":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

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
          <div className="w-6 h-6 bg-[#0088cc] rounded-full flex items-center justify-center">
            <Send className="h-3 w-3 text-white" />
          </div>
          Telegram Bot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bot Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Bot Status</span>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge
              variant={botStatus === "active" ? "default" : "secondary"}
              className={`text-xs ${botStatus === "active" ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}`}
            >
              {botStatus.charAt(0).toUpperCase() + botStatus.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Connection Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Connection</span>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                botStatus === "active" ? "bg-[#0088cc] animate-pulse" : "bg-gray-500"
              }`}
            />
            <span className={`text-xs font-medium ${getStatusColor()}`}>
              {botStatus === "active" ? "Connected" : "Disconnected"}
            </span>
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

        {/* Alerts Sent */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Alerts Sent Today</span>
          <span className="text-sm font-medium text-[#0088cc]">{alertsSent.toLocaleString()}</span>
        </div>

        {/* Last Activity */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Last Activity</span>
          <span className="text-sm font-medium text-card-foreground">{formatTimeAgo(lastActivity)}</span>
        </div>

        {/* Bot Settings */}
        <div className="pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs border-[#0088cc]/20 hover:bg-[#0088cc]/10 hover:border-[#0088cc]/40 bg-transparent"
          >
            <Settings className="h-3 w-3 mr-1" />
            Configure Bot
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
