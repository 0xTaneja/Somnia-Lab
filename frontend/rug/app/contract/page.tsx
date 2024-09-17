"use client"
import { DefiHeader } from "@/components/defi-header"
import { ContractScanner } from "@/components/contract-scanner"

export default function ContractPage() {
  return (
    <div className="min-h-screen bg-background">
      <DefiHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Contract Scanner</h1>
            <p className="text-muted-foreground">
              Analyze smart contracts for security vulnerabilities, reputation, and community feedback
            </p>
          </div>

          <ContractScanner />
        </div>
      </main>
    </div>
  )
}
