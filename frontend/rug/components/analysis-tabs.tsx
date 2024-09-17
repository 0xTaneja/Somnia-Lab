"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Brain, Network, TrendingUp, Coins, Play, Activity, Link, Users, ChevronDown, ChevronRight } from "lucide-react"
import { type AnalysisResult } from "@/lib/api"

interface AnalysisTabsProps {
  analysisResult?: AnalysisResult
}


export function AnalysisTabs({ analysisResult }: AnalysisTabsProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["ai"])

  // Create real analysis types from API data
  const getRealAnalysisTypes = () => {
    if (!analysisResult) return []
    
    return [
      {
        id: "ai",
        label: "AI Analysis",
        icon: Brain,
        status: analysisResult.aiAnalysis ? "completed" : "processing",
        description: "AI-powered smart contract vulnerability detection and pattern analysis",
        findings: analysisResult.aiAnalysis?.recommendations || [
          "AI analysis completed",
          `Risk Level: ${analysisResult.aiAnalysis?.analysis?.riskLevel || 'LOW'}`,
          `Confidence: ${analysisResult.aiAnalysis?.confidence ? Math.round(analysisResult.aiAnalysis.confidence * 100) : 0}%`
        ],
      },
      {
        id: "social",
        label: "Social Sentiment",
        icon: TrendingUp,
        status: analysisResult.socialAnalysis ? "completed" : "processing",
        description: "Community sentiment analysis and social media monitoring",
        findings: analysisResult.socialAnalysis ? [
          `Overall Sentiment: ${analysisResult.socialAnalysis.overallSentiment?.label || 'Unknown'}`,
          `Total Mentions: ${analysisResult.socialAnalysis.overallSentiment?.totalMentions || 0}`,
          `Confidence: ${analysisResult.socialAnalysis.overallSentiment?.confidence ? Math.round(analysisResult.socialAnalysis.overallSentiment.confidence * 100) : 0}%`,
          ...Object.keys(analysisResult.socialAnalysis.platforms || {}).map(platform => 
            `${platform}: ${analysisResult.socialAnalysis?.platforms[platform]?.mentions || 0} mentions`
          )
        ] : ["Social analysis in progress..."],
      },
      {
        id: "simulation",
        label: "Simulation",
        icon: Play,
        status: analysisResult.simulation ? "completed" : "processing",
        description: "Real-time transaction simulation on Somnia network",
        findings: analysisResult.simulation ? [
          `Network: ${analysisResult.simulation.network?.name || 'Somnia Testnet'}`,
          `Success: ${analysisResult.simulation.success ? 'Yes' : 'No'}`,
          analysisResult.simulation.error ? `Error: ${analysisResult.simulation.error.split('"')[1] || 'Contract validation'}` : 'Simulation successful',
          `Gas Estimate: ${analysisResult.simulation.gasEstimate || 'Unknown'}`,
          `Block Number: ${analysisResult.simulation.blockNumber || 'Unknown'}`
        ] : ["Simulation in progress..."],
      },
      {
        id: "risk",
        label: "Risk Assessment",
        icon: Activity,
        status: "completed",
        description: "Comprehensive risk scoring and threat analysis",
        findings: [
          `Risk Score: ${analysisResult.riskScore}/100`,
          `Risk Level: ${analysisResult.riskLevel}`,
          `Confidence: ${Math.round((analysisResult.riskAssessment?.confidence || 0) * 100)}%`,
          `Summary: ${analysisResult.riskAssessment?.summary || 'No summary available'}`,
          ...analysisResult.recommendations || []
        ],
      },
      {
        id: "onchain", 
        label: "On-Chain",
        icon: Link,
        status: "completed",
        description: "Blockchain data analysis and contract verification",
        findings: [
          `Contract Address: ${analysisResult.contractAddress}`,
          `Analysis Timestamp: ${analysisResult.timestamp}`,
          "Contract interaction analyzed on Somnia network",
          "Real-time blockchain data retrieved"
        ],
      },
      {
        id: "transaction",
        label: "Transaction",
        icon: Network,
        status: analysisResult.decodedTransaction ? "completed" : "pending", 
        description: "Transaction decoding and parameter analysis",
        findings: analysisResult.decodedTransaction ? [
          `Type: ${analysisResult.decodedTransaction.type}`,
          `Value: ${analysisResult.decodedTransaction.value}`,
          `Risk: ${analysisResult.decodedTransaction.risk}`,
          `Description: ${analysisResult.decodedTransaction.description}`
        ] : ["Transaction analysis in progress..."],
      }
    ]
  }

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "processing":
        return "bg-orange-500"
      case "pending":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const realAnalysisTypes = getRealAnalysisTypes()

  if (!analysisResult) {
    return (
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-primary">Security Analysis Results</CardTitle>
          <CardDescription>Submit a transaction above to see detailed analysis results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No analysis data available yet
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-primary">Security Analysis Results</CardTitle>
        <CardDescription>Comprehensive multi-layered security analysis across {realAnalysisTypes.length} different vectors</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
            {realAnalysisTypes.map((type) => {
              const Icon = type.icon
              return (
                <TabsTrigger
                  key={type.id}
                  value={type.id}
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs hidden sm:block">{type.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {realAnalysisTypes.map((type) => {
            const Icon = type.icon
            const isExpanded = expandedSections.includes(type.id)

            return (
              <TabsContent key={type.id} value={type.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-semibold text-foreground">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(type.status)} text-white border-0`}>{type.status}</Badge>
                </div>

                <div className="border border-primary/20 rounded-lg">
                  <button
                    onClick={() => toggleSection(type.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium text-foreground">Analysis Details</span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2 border-t border-primary/10">
                      {type.findings.map((finding: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 py-2">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">{finding}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}
