"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, FileText, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { apiService, type AnalysisResult } from "@/lib/api"

interface TransactionFormProps {
  onAnalysisComplete?: (result: AnalysisResult) => void
}

export function TransactionForm({ onAnalysisComplete }: TransactionFormProps) {
  const [transactionData, setTransactionData] = useState("")
  const [contractAddress, setContractAddress] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError(null)
    setAnalysisResult(null)

    try {
      // Parse transaction data
      let parsedTxData: any = {}
      if (transactionData.trim()) {
        try {
          parsedTxData = JSON.parse(transactionData)
        } catch (e) {
          throw new Error("Invalid JSON format in transaction data")
        }
      }

      // Prepare request data in the correct format for backend
      const requestData = {
        transactionData: {
          to: contractAddress,
          ...parsedTxData
        },
        contractAddress: contractAddress,
        includeAI: true,
        includeSocial: true
      }

      // Call real API
      const result = await apiService.analyzeTransaction(requestData)
      setAnalysisResult(result)
      
      // Notify parent component about the analysis result
      onAnalysisComplete?.(result)
      
      // Show success toast
      console.log("Analysis completed successfully")
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Analysis failed"
      setError(errorMessage)
      console.error("Analysis error:", errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-primary">Transaction Analysis</CardTitle>
        </div>
        <CardDescription>
          Submit transaction data and contract address for comprehensive security analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="transaction-data" className="text-sm font-medium text-foreground">
            Transaction Data (JSON)
          </Label>
          <Textarea
            id="transaction-data"
            placeholder='{"to": "0x...", "value": "1000000000000000000", "data": "0x..."}'
            value={transactionData}
            onChange={(e) => setTransactionData(e.target.value)}
            className="min-h-[120px] font-mono text-sm border-primary/30 focus:border-primary focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contract-address" className="text-sm font-medium text-foreground">
            Contract Address
          </Label>
          <Input
            id="contract-address"
            placeholder="0x1234567890abcdef1234567890abcdef12345678"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            className="font-mono border-primary/30 focus:border-primary focus:ring-primary/20"
          />
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !contractAddress.trim()}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 transition-all duration-200 disabled:opacity-50"
        >
          <Search className="mr-2 h-4 w-4" />
          {isAnalyzing ? "Analyzing Transaction..." : "Analyze Transaction"}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {/* Results Display */}
        {analysisResult && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold text-foreground">Analysis Complete</h3>
            </div>
            
            {/* Risk Score */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Risk Score</Label>
                <div className="text-2xl font-bold text-foreground">{analysisResult.riskScore}/100</div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Risk Level</Label>
                <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  analysisResult.riskLevel === 'Very Low' || analysisResult.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                  analysisResult.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  analysisResult.riskLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {analysisResult.riskLevel}
                </div>
              </div>
            </div>

            {/* Threats */}
            {analysisResult.threats && analysisResult.threats.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Detected Threats</Label>
                <ul className="space-y-1">
                  {analysisResult.threats.map((threat, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                      <span className="text-foreground">{threat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {analysisResult.warnings && analysisResult.warnings.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Warnings</Label>
                <ul className="space-y-1">
                  {analysisResult.warnings.map((warning, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                      <span className="text-foreground">{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
