"use client"

import { DefiHeader } from "@/components/defi-header"
import { AlertToast } from "@/components/alert-toast"
import { NetworkStatus } from "@/components/network-status"
import { WebSocketStatus } from "@/components/websocket-status"
import { TelegramBotStatus } from "@/components/telegram-bot-status"

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DefiHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Security Alerts</h1>
          <p className="text-muted-foreground">Real-time monitoring and network status</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alert Notifications Section */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">Active Alerts</h2>
              <AlertToast />
            </div>
          </div>

          {/* Status Widgets Section */}
          <div className="lg:col-span-1 space-y-6">
            <NetworkStatus />
            <WebSocketStatus />
            <TelegramBotStatus />
          </div>
        </div>
      </main>
    </div>
  )
}
