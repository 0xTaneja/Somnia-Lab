import { DefiHeader } from "@/components/defi-header"
import { StatsGrid } from "@/components/stats-grid"
import { ActivityFeed } from "@/components/activity-feed"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <DefiHeader />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and analysis of DeFi transactions across multiple networks
          </p>
        </div>

        <StatsGrid />

        <ActivityFeed />
      </main>
    </div>
  )
}
