"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertTriangle, AlertCircle } from "lucide-react"

interface RiskScoreIndicatorProps {
  score?: number
}

export function RiskScoreIndicator({ score = 75 }: RiskScoreIndicatorProps) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score)
    }, 500)
    return () => clearTimeout(timer)
  }, [score])

  const getRiskLevel = (score: number) => {
    if (score <= 30) return { level: "Low", color: "bg-green-500", textColor: "text-green-700", icon: Shield }
    if (score <= 70)
      return { level: "Medium", color: "bg-orange-500", textColor: "text-orange-700", icon: AlertTriangle }
    return { level: "High", color: "bg-red-500", textColor: "text-red-700", icon: AlertCircle }
  }

  const getRiskDescription = (score: number) => {
    if (score <= 30) return "Transaction appears safe with minimal security concerns detected."
    if (score <= 70) return "Moderate risk detected. Review transaction details before proceeding."
    return "High risk transaction. Multiple security concerns identified. Proceed with extreme caution."
  }

  const risk = getRiskLevel(score)
  const Icon = risk.icon
  const circumference = 2 * Math.PI * 90
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardContent className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="relative">
          <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-muted/20"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-1000 ease-out ${
                score <= 30 ? "text-green-500" : score <= 70 ? "text-orange-500" : "text-red-500"
              }`}
              strokeLinecap="round"
            />
          </svg>

          {/* Score display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-foreground mb-1">{Math.round(animatedScore)}</div>
            <div className="text-sm text-muted-foreground">Risk Score</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${risk.textColor}`} />
          <Badge variant="outline" className={`${risk.color} text-white border-0 px-3 py-1 font-semibold`}>
            {risk.level} Risk
          </Badge>
        </div>

        <p className="text-center text-sm text-muted-foreground max-w-md leading-relaxed">
          {getRiskDescription(score)}
        </p>
      </CardContent>
    </Card>
  )
}
