"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertTriangle, CheckCircle, Clock, Brain } from "lucide-react"
import { Activity } from "lucide-react" // Declared the Activity variable
import { apiService } from "@/lib/api"
import { SemanticTransactionViewer } from "./semantic-transaction-viewer"

interface SemanticAnalysis {
  intent: string;
  functionName: string | null;
  humanExplanation: string | null;
  securityWarnings: Array<{
    message: string;
    severity: string;
  }>;
  riskFactors: string[];
  confidence: number;
}

interface Transaction {
  id: string
  transactionHash: string
  contractAddress: string
  from: string
  value: string
  riskScore: number
  riskLevel: string
  status: "safe" | "warning" | "danger"
  timestamp: string
  type: string
  analysis?: any
  semanticAnalysis?: SemanticAnalysis | null
  displayData?: {
    intent: string;
    riskLevel: string;
    hasSemanticAnalysis: boolean;
    shortExplanation: string;
  }
}

export function ActivityFeed() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [newTransactionId, setNewTransactionId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Connect to WebSocket for real-time transaction data
    const connectWebSocket = () => {
      try {
        console.log('🔄 Attempting to connect to ws://172.20.27.76:5000/ws...')
        const websocket = new WebSocket('ws://172.20.27.76:5000/ws')
        
        websocket.onopen = () => {
          console.log('🔗 Connected to live transaction feed')
          setIsConnected(true)
          setWs(websocket)
        }

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            // Handle user-initiated analyses
            if (data.type === 'transaction_analysis' || data.type === 'contract_analysis') {
              const newTransaction: Transaction = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                transactionHash: data.transactionHash || data.data?.hash || Date.now().toString(),
                contractAddress: data.contractAddress || data.data?.contractAddress || 'Unknown',
                from: data.from || data.data?.from || 'Unknown',
                value: data.value || data.data?.value || '0',
                riskScore: data.riskScore || data.data?.riskScore || 50,
                riskLevel: data.riskLevel || 'MEDIUM',
                status: (data.riskScore || 50) >= 70 ? "safe" : 
                        (data.riskScore || 50) >= 40 ? "warning" : "danger",
                timestamp: "Just now",
                type: data.type === 'contract_analysis' ? 'Contract Analysis' : 'Transaction Analysis',
                analysis: data,
                semanticAnalysis: null,
                displayData: {
                  intent: 'Analysis Result',
                  riskLevel: data.riskLevel || 'MEDIUM',
                  hasSemanticAnalysis: false,
                  shortExplanation: 'Manual analysis completed'
                }
              }

              setTransactions((prev) => [newTransaction, ...prev.slice(0, 9)])
              setNewTransactionId(newTransaction.id)
              setTimeout(() => setNewTransactionId(null), 3000)
            }

            // Handle live Somnia testnet transactions with SEMANTIC ANALYSIS! 🧠
            if (data.type === 'live_transaction' || data.type === 'somnia_transaction') {
              const txData = data.data || data
              const isDemo = data.isDemoTransaction || false
              const txHash = data.transactionHash || txData.hash || txData.transaction_hash
              
              // Skip duplicates based on transaction hash
              if (txHash) {
                setTransactions((prev) => {
                  const exists = prev.some(tx => 
                    tx.transactionHash === txHash || 
                    tx.analysis?.transactionHash === txHash || 
                    tx.analysis?.data?.hash === txHash ||
                    tx.analysis?.data?.transaction_hash === txHash
                  )
                  if (exists) {
                    console.log(`🔄 Skipping duplicate transaction: ${txHash}`)
                    return prev
                  }

                  // 🧠 Extract semantic analysis data
                  const semanticAnalysis = data.semanticAnalysis ? {
                    intent: data.semanticAnalysis.intent || 'Unknown',
                    functionName: data.semanticAnalysis.functionName || null,
                    humanExplanation: data.semanticAnalysis.humanExplanation || null,
                    securityWarnings: data.semanticAnalysis.securityWarnings || [],
                    riskFactors: data.semanticAnalysis.riskFactors || [],
                    confidence: data.semanticAnalysis.confidence || 0
                  } : null

                  // Map display data
                  const displayData = data.displayData || {
                    intent: semanticAnalysis?.intent || 'Unknown Action',
                    riskLevel: data.riskLevel || 'MEDIUM',
                    hasSemanticAnalysis: !!semanticAnalysis,
                    shortExplanation: semanticAnalysis?.humanExplanation?.substring(0, 100) + '...' || 'Transaction analysis not available'
                  }

                  const newTransaction: Transaction = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    transactionHash: txHash,
                    contractAddress: data.contractAddress || txData.to || 'Contract Creation',
                    from: data.from || txData.from || 'Unknown',
                    value: data.value || txData.value || '0',
                    riskScore: data.riskScore || 50,
                    riskLevel: data.riskLevel || 'MEDIUM',
                    status: (data.riskScore || 50) >= 70 ? "safe" : 
                            (data.riskScore || 50) >= 40 ? "warning" : "danger",
                    timestamp: data.timestampDisplay || "Live Somnia",
                    type: data.transactionHash ? `Tx ${data.transactionHash.substring(0, 10)}...` : 'Live Transaction',
                    analysis: data,
                    semanticAnalysis,
                    displayData
                  }

                  console.log(`🧠 New transaction with semantic analysis:`, {
                    hash: txHash.substring(0, 10),
                    hasSemanticAnalysis: !!semanticAnalysis,
                    intent: semanticAnalysis?.intent || 'None'
                  })

                  setNewTransactionId(newTransaction.id)
                  setTimeout(() => setNewTransactionId(null), 4000)
                  
                  return [newTransaction, ...prev.slice(0, 9)]
                })
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        websocket.onclose = () => {
          console.log('📡 WebSocket connection closed, attempting to reconnect...')
          setIsConnected(false)
          setTimeout(connectWebSocket, 5000) // Reconnect after 5 seconds
        }

        websocket.onerror = (error) => {
          console.error('❌ WebSocket connection error:', error)
          console.error('❌ Failed to connect to ws://172.20.27.76:5000/ws')
          setIsConnected(false)
        }

        return websocket
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error)
        setIsConnected(false)
        return null
      }
    }

    const websocket = connectWebSocket()

    // Fetch initial transactions from health status
    const fetchInitialData = async () => {
      try {
        const health = await apiService.getHealth()
        // Add some initial activity based on health data
        const initialTransaction: Transaction = {
          id: Date.now().toString(),
          transactionHash: Date.now().toString(),
          contractAddress: "0x6AAC14f090A35EeA150705f72D90E4CDC4a49b2C",
          from: 'System',
          value: '0',
          riskScore: 75,
          riskLevel: 'HIGH',
          status: "warning",
          timestamp: "Active now",
          type: "System Monitor",
          semanticAnalysis: null,
          displayData: {
            intent: 'System Monitoring',
            riskLevel: 'HIGH',
            hasSemanticAnalysis: false,
            shortExplanation: 'System monitoring active'
          }
        }
        setTransactions([initialTransaction])
      } catch (error) {
        console.error('Failed to fetch initial data:', error)
      }
    }

    fetchInitialData()

    return () => {
      if (websocket) {
        websocket.close()
      }
    }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "safe":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "danger":
        return <Shield className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe":
        return "bg-green-100 text-green-800 border-green-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "danger":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-green-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const toggleTransactionExpanded = (transactionId: string) => {
    setExpandedTransactions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId)
      } else {
        newSet.add(transactionId)
      }
      return newSet
    })
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>🧠 AI-Powered Transaction Analysis</span>
            <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-purple-500">
              NEW
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="mx-auto h-12 w-12 mb-4 opacity-50 text-purple-500" />
              <p className="mb-2">🧠 Monitoring live transactions with AI analysis...</p>
              <p className="text-xs">
                {isConnected ? 'Connected to real-time semantic feed' : 'Connecting to WebSocket...'}
              </p>
            </div>
          ) : (
            transactions.map((transaction) => {
              // Convert to format expected by SemanticTransactionViewer
              const semanticTransaction = {
                transactionHash: transaction.transactionHash || transaction.id,
                contractAddress: transaction.contractAddress,
                from: transaction.from || 'Unknown',
                value: transaction.value || '0',
                riskScore: transaction.riskScore,
                riskLevel: transaction.riskLevel || 'MEDIUM',
                timestamp: transaction.timestamp,
                semanticAnalysis: transaction.semanticAnalysis || null,
                displayData: transaction.displayData || {
                  intent: 'Unknown Action',
                  riskLevel: transaction.riskLevel || 'MEDIUM',
                  hasSemanticAnalysis: !!transaction.semanticAnalysis,
                  shortExplanation: 'Transaction analysis not available'
                }
              }

              return (
                <div
                  key={transaction.id}
                  className={`transition-all duration-500 ${
                    newTransactionId === transaction.id
                      ? "animate-pulse border-2 border-purple-500 rounded-lg"
                      : ""
                  }`}
                >
                  <SemanticTransactionViewer 
                    transaction={semanticTransaction}
                    isExpanded={expandedTransactions.has(transaction.id)}
                    onToggleExpand={() => toggleTransactionExpanded(transaction.id)}
                  />
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
