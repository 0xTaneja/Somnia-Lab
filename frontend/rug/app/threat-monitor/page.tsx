import AdvancedThreatMonitor from '@/components/advanced-threat-monitor';

export default function ThreatMonitorPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <AdvancedThreatMonitor />
    </main>
  );
}

export const metadata = {
  title: 'Advanced Threat Monitor | DeFi Security Platform',
  description: 'SecureMon-powered threat detection with pattern recognition and false positive reduction',
};
