import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from '@/components/Dashboard';
import { ThreatFeed } from '@/components/ThreatFeed';
import { IOCManager } from '@/components/IOCManager';
import { ResponsePlaybookGenerator } from '@/components/ResponsePlaybookGenerator';
import { AttackGraphVisualizer } from '@/components/AttackGraphVisualizer';
import { ThreatCampaignDetector } from '@/components/ThreatCampaignDetector';
import { SourceManagement } from '@/components/SourceManagement';
import { SearchPage } from '@/components/SearchPage';
import { LLMSettings } from '@/components/LLMSettings';
import { Footer } from '@/components/Footer';
import { cn } from '@/lib/utils';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'feed':
        return <ThreatFeed />;
      case 'iocs':
        return <IOCManager />;
      case 'playbook':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-semibold glow-text mb-2">
                Response Playbook Generator
              </h2>
              <p className="text-muted-foreground">
                Generate detailed incident response playbooks with AI-powered analysis.
              </p>
            </div>
            <ResponsePlaybookGenerator />
          </div>
        );
      case 'attack-graph':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-semibold glow-text mb-2">
                Attack Graph Visualization
              </h2>
              <p className="text-muted-foreground">
                Visualize attack paths and infrastructure relationships in threat campaigns.
              </p>
            </div>
            <AttackGraphVisualizer />
          </div>
        );
      case 'campaign':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-semibold glow-text mb-2">
                Threat Campaign Detection
              </h2>
              <p className="text-muted-foreground">
                Identify and track related threat activities across multiple incidents.
              </p>
            </div>
            <ThreatCampaignDetector />
          </div>
        );
      case 'sources':
        return <SourceManagement />;
      case 'search':
        return <SearchPage />;
      case 'llm-settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-semibold glow-text mb-2">
                LLM Configuration
              </h2>
              <p className="text-muted-foreground">
                Configure and manage Large Language Models for enhanced threat intelligence analysis.
              </p>
            </div>
            <LLMSettings />
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary cyber-grid">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 ease-in-out",
        "lg:ml-64 lg:pt-0 pt-16" // Account for mobile header
      )}>
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="animate-in fade-in-50 duration-500">
            {renderContent()}
            <Footer />
          </div>
        </div>
      </main>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-electric-teal/3 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>
    </div>
  );
};

export default Index;
