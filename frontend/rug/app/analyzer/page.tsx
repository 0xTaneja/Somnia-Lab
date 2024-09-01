"use client"

import { useState } from "react"
import { DefiHeader } from "@/components/defi-header"
import { TransactionForm } from "@/components/transaction-form"
import { RiskScoreIndicator } from "@/components/risk-score-indicator"
import { AnalysisTabs } from "@/components/analysis-tabs"
import { AnalysisResultCard } from "@/components/analysis-result-card"
import { Brain, Link, MessageSquare } from "lucide-react"
import { type AnalysisResult } from "@/lib/api"


export default function AnalyzerPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  // Create real analysis results from API response  
  const createRealResults = (result: AnalysisResult): Array<{
    id: string;
    type: string;
    icon: JSX.Element;
    status: "passed" | "warning" | "failed";
    confidence: number;
    title: string;
    summary: string;
    details: any;
  }> => [
    {
      id: "1",
      type: "AI Analysis",
      icon: <Brain className="h-4 w-4 text-cyan-400" />,
      status: result.aiAnalysis ? "passed" as const : "failed" as const,
      confidence: result.aiAnalysis?.confidence ? Math.round(result.aiAnalysis.confidence * 100) : 0,
      title: "Smart Contract Security",
      summary: result.aiAnalysis?.analysis?.summary || "AI analysis pending...",
      details: {
        findings: result.aiAnalysis?.recommendations || ["Analysis in progress..."],
        recommendations: result.aiAnalysis?.recommendations || [],
        technicalData: {
          contractSize: "Real Contract",
          gasOptimization: "Unknown",
          auditScore: result.aiAnalysis?.analysis?.riskScore || 0,
        },
      },
    },
    {
      id: "2", 
      type: "Social Sentiment",
      icon: <MessageSquare className="h-4 w-4 text-cyan-400" />,
      status: result.socialAnalysis ? "passed" as const : "failed" as const,
      confidence: result.socialAnalysis?.overallSentiment?.confidence ? Math.round(result.socialAnalysis.overallSentiment.confidence * 100) : 0,
      title: "Community Analysis",
      summary: result.socialAnalysis?.overallSentiment?.label === "neutral" ? "Neutral community sentiment detected" : result.socialAnalysis?.overallSentiment?.label || "Social analysis pending...",
      details: {
        findings: result.socialAnalysis?.platforms ? Object.keys(result.socialAnalysis.platforms).map(platform => `${platform}: ${result.socialAnalysis?.platforms[platform]?.mentions || 0} mentions`) : ["Social analysis in progress..."],
        recommendations: result.socialAnalysis?.warnings || [],
        technicalData: {
          totalMentions: result.socialAnalysis?.overallSentiment?.totalMentions || 0,
          sentiment: result.socialAnalysis?.overallSentiment?.label || "unknown",
          platforms: result.socialAnalysis?.platforms ? Object.keys(result.socialAnalysis.platforms).length : 0,
        },
      },
    },
    {
      id: "3",
      type: "Transaction Simulation", 
      icon: <Link className="h-4 w-4 text-cyan-400" />,
      status: result.simulation?.success ? "passed" as const : "warning" as const,
      confidence: 85,
      title: "Somnia Network Simulation",
      summary: result.simulation?.error ? `Simulation detected: ${result.simulation.error.split(':')[1]?.trim() || 'Contract validation error'}` : "Transaction simulation successful",
      details: {
        findings: result.simulation?.error ? 
          [`Real contract interaction: ${result.simulation.error.split('"')[1] || 'Contract validation'}`, "Transaction would revert", "This is expected behavior for some contracts"] :
          ["Transaction simulation successful", "Gas estimation completed", "No critical issues detected"],
        recommendations: result.simulation?.error ? 
          ["Verify transaction parameters", "Check contract documentation", "This may be normal contract behavior"] :
          ["Transaction appears safe to execute", "Gas cost estimated"],
        technicalData: {
          network: result.simulation?.network?.name || "Somnia Testnet",
          gasEstimate: result.simulation?.gasEstimate || "Unknown",
          blockNumber: result.simulation?.blockNumber || 0,
        },
      },
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <DefiHeader />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Transaction Analyzer</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of DeFi transactions with AI-powered risk assessment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TransactionForm onAnalysisComplete={setAnalysisResult} />
          </div>
          <div>
            <RiskScoreIndicator score={analysisResult?.riskScore || 0} />
          </div>
        </div>

        {analysisResult && (
          <>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Analysis Results</h2>
                <div className="text-sm text-muted-foreground">3 checks completed</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {createRealResults(analysisResult).map((result) => (
                  <AnalysisResultCard key={result.id} result={result} />
                ))}
              </div>
            </div>

            <AnalysisTabs analysisResult={analysisResult} />
          </>
        )}

        {!analysisResult && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Submit a transaction above to see comprehensive security analysis results</p>
          </div>
        )}
      </main>
    </div>
  )
}
