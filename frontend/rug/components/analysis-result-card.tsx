"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown, ChevronUp, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface AnalysisResult {
  id: string
  type: string
  icon: React.ReactNode
  status: "passed" | "failed" | "warning"
  confidence: number
  title: string
  summary: string
  details: {
    findings: string[]
    recommendations: string[]
    technicalData: Record<string, any>
  }
}

interface AnalysisResultCardProps {
  result: AnalysisResult
}

export function AnalysisResultCard({ result }: AnalysisResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "text-green-400 bg-green-400/10 border-green-400/20"
      case "failed":
        return "text-red-400 bg-red-400/10 border-red-400/20"
      case "warning":
        return "text-amber-400 bg-amber-400/10 border-amber-400/20"
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4" />
      case "failed":
        return <XCircle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-400"
    if (confidence >= 60) return "text-amber-400"
    return "text-red-400"
  }

  return (
    <Card className="bg-slate-900/80 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">{result.icon}</div>
            <div>
              <h3 className="font-semibold text-white">{result.title}</h3>
              <p className="text-sm text-slate-300">{result.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(result.status)} font-medium`}>
              {getStatusIcon(result.status)}
              <span className="ml-1 capitalize">{result.status}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-slate-300">{result.summary}</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Confidence Score</span>
            <span className={`font-medium ${getConfidenceColor(result.confidence)}`}>{result.confidence}%</span>
          </div>
          <Progress value={result.confidence} className="h-2 bg-slate-800" />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
        >
          <span>View Details</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-slate-700 animate-in slide-in-from-top-2 duration-300">
            {result.details.findings.length > 0 && (
              <div>
                <h4 className="font-medium text-white mb-2">Key Findings</h4>
                <ul className="space-y-1">
                  {result.details.findings.map((finding, index) => (
                    <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.details.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-white mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {result.details.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Object.keys(result.details.technicalData).length > 0 && (
              <div>
                <h4 className="font-medium text-white mb-2">Technical Data</h4>
                <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-700">
                  <pre className="text-xs text-slate-400 overflow-x-auto">
                    {JSON.stringify(result.details.technicalData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
