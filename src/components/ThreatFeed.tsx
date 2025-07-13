import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Shield, Clock, ExternalLink, Eye, Download, RefreshCw, Wifi, WifiOff, Cpu, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { threatIntelPipeline } from '@/services/threatIntelPipeline';
import { ThreatReport, dataStorage } from '@/services/dataStorage';
import { aiAnalyzer } from '@/services/aiAnalyzer';
import { ollamaService } from '@/services/ollamaService';
import { useAlertSystem } from '@/hooks/useAlertSystem';

const severityConfig = {
  low: { color: 'bg-success-green/20 text-success-green border-success-green/30', icon: Shield },
  medium: { color: 'bg-warning-amber/20 text-warning-amber border-warning-amber/30', icon: AlertTriangle },
  high: { color: 'bg-destructive/20 text-destructive border-destructive/30', icon: AlertTriangle },
  critical: { color: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30', icon: AlertTriangle }
};

export function ThreatFeed() {
  const [selectedReport, setSelectedReport] = useState<ThreatReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [threatData, setThreatData] = useState<ThreatReport[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const saved = localStorage.getItem('vireon-auto-refresh');
    return saved ? JSON.parse(saved) : true;
  });
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [regenerating, setRegenerating] = useState<string | null>(null);
  
  // Initialize alert system
  const { checkForNewThreats } = useAlertSystem({
    severityThreshold: 'medium' // Only alert for medium and above
  });

  useEffect(() => {
    // Load existing reports on mount
    loadLatestReports();
    setLastUpdate(new Date().toLocaleTimeString());
    
    // Initialize alert system with existing reports (but don't alert for them initially)
    checkForNewThreats([]);

    // Listen for auto-refresh setting changes
    const handleAutoRefreshChange = (event: CustomEvent) => {
      setAutoRefresh(event.detail.enabled);
    };

    window.addEventListener('autoRefreshChanged', handleAutoRefreshChange as EventListener);
    
    return () => {
      window.removeEventListener('autoRefreshChanged', handleAutoRefreshChange as EventListener);
    };
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    // Initial load to ensure we have the latest data
    handleRefresh();
    
    const interval = setInterval(() => {
      handleRefresh();
    }, 3 * 60 * 1000); // Refresh every 3 minutes for more frequent updates
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Load the most recent reports, properly sorted by timestamp
  const loadLatestReports = () => {
    try {
      const reports = threatIntelPipeline.getAllReports();
      // Sort reports by timestamp (newest first)
      const sortedReports = [...reports].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const latestReports = sortedReports.slice(0, 10); // Show latest 10
      setThreatData(latestReports);
      console.log('Loaded latest threat reports:', latestReports.length);
    } catch (error) {
      console.error('Error loading latest reports:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('Starting threat intelligence refresh...');
      const result = await threatIntelPipeline.refreshThreatIntelligence({ 
        forceFeedRefresh: true,  // Force refresh to get latest data
        maxItems: 20 // Get more items for better coverage
      });
      console.log('Refresh result:', result);
      
      loadLatestReports();
      setLastUpdate(new Date().toLocaleTimeString());
      
      // Check for new threats and trigger alerts
      checkForNewThreats(threatData);
      console.log('Checked for new threats using current threat data');
    } catch (error) {
      console.error('Refresh failed:', error);
    }
    setRefreshing(false);
  };

  const exportIOCs = (report: ThreatReport) => {
    const data = { source: report.source, timestamp: report.timestamp, iocs: report.iocs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iocs-${report.id}.json`;
    a.click();
  };

  const regenerateSummary = async (report: ThreatReport, model?: string) => {
    setRegenerating(report.id);
    try {
      // Add formatting instructions to ensure structured output
      const formattedDescription = report.description + 
        `\n\nFORMATTING INSTRUCTIONS:\n` +
        `- Format your response using bullet points for better readability\n` + 
        `- Use section headers (e.g., ### Overview, ### Technical Details, ### Impact Assessment)\n` + 
        `- Include whitespace between sections for clarity\n` + 
        `- Keep each bullet point concise and actionable\n` + 
        `- Organize information logically with most critical information first\n` +
        `- Use markdown formatting for enhanced readability\n`;
        
      const iocsArray = report.iocs ? [report.iocs] : [];
      const newSummary = await aiAnalyzer.generateThreatSummary(
        report.title,
        formattedDescription,
        iocsArray,
        model
      );
      
      // Update the report with new AI summary
      const updatedReport = { ...report, aiSummary: newSummary };
      // Store the updated report back to storage
      dataStorage.addReport(updatedReport);
      
      // Update local state
      setThreatData(prev => prev.map(r => 
        r.id === report.id ? updatedReport : r
      ));
      
      if (selectedReport?.id === report.id) {
        setSelectedReport(updatedReport);
      }
    } catch (error) {
      console.error('Failed to regenerate summary:', error);
    }
    setRegenerating(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold glow-text">Live Threat Feed</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Last updated: {lastUpdate} {autoRefresh && '• Auto-refresh enabled'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {autoRefresh ? (
              <Wifi className="h-4 w-4 text-green-500 animate-pulse" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <Switch 
              checked={autoRefresh} 
              onCheckedChange={setAutoRefresh}
              aria-label="Auto-refresh"
            />
            <span className="text-sm text-muted-foreground">
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </span>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant="cyber" size="lg" className={cn(refreshing && "animate-pulse")}>
            {refreshing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Feed
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-display font-medium text-muted-foreground">Recent Threats</h3>
          {threatData.map((report) => {
            const SeverityIcon = severityConfig[report.severity].icon;
            const isNew = new Date(report.timestamp).getTime() > Date.now() - (60 * 60 * 1000); // Last hour
            const isCritical = report.severity === 'critical';
            
            return (
              <Card 
                key={report.id} 
                className={cn(
                  "glass-card p-4 cursor-pointer transition-all duration-300 hover:shadow-glow",
                  selectedReport?.id === report.id && "ring-2 ring-primary shadow-intense",
                  isNew && "animate-pulse border-l-4 border-l-electric-teal",
                  isCritical && "border-l-4 border-l-red-500 shadow-red-500/20 shadow-lg"
                )} 
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <SeverityIcon className="h-5 w-5 text-destructive mt-1 flex-shrink-0" />
                    {isNew && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-electric-teal rounded-full animate-ping" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className={severityConfig[report.severity].color}>
                        {report.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{report.category}</Badge>
                      {isNew && (
                        <Badge className="bg-electric-teal/20 text-electric-teal border-electric-teal/30 text-xs animate-pulse">
                          NEW
                        </Badge>
                      )}
                      {isCritical && (
                        <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-xs">
                          🚨 CRITICAL
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-medium text-sm leading-tight mb-2 line-clamp-2">{report.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(report.timestamp).toLocaleString()}
                      </span>
                      <span>{report.source}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          {selectedReport ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-medium text-muted-foreground">Threat Analysis</h3>
                <Button variant="glass" size="sm" onClick={() => exportIOCs(selectedReport)}>
                  <Download className="h-4 w-4" />Export IOCs
                </Button>
              </div>
              <Card className="glass-card p-6">
                <h4 className="font-display font-semibold text-lg mb-2">{selectedReport.title}</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-primary">AI Summary</h5>
                    <div className="flex items-center gap-2">
                      {selectedReport.aiSummary?.model && (
                        <Badge variant="outline" className="text-xs">
                          {selectedReport.aiSummary.model.startsWith('Ollama/') ? (
                            <Zap className="h-3 w-3 mr-1" />
                          ) : (
                            <Cpu className="h-3 w-3 mr-1" />
                          )}
                          {selectedReport.aiSummary.model}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => regenerateSummary(selectedReport)}
                        disabled={regenerating === selectedReport.id}
                      >
                        {regenerating === selectedReport.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="glass-card p-4 border-l-4 border-l-primary">
                    <p className="text-sm leading-relaxed">
                      {selectedReport.aiSummary?.summary || selectedReport.description}
                    </p>
                    {selectedReport.aiSummary?.processingTime && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Generated in {selectedReport.aiSummary.processingTime}ms
                      </p>
                    )}
                  </div>
                  {ollamaService.isAvailable() && (
                    <div className="flex gap-2 flex-wrap">
                      {ollamaService.getAvailableModels().map((model) => (
                        <Button
                          key={model.name}
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateSummary(selectedReport, `ollama/${model.name}`)}
                          disabled={regenerating === selectedReport.id}
                          className="text-xs"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Try {model.displayName}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </>
          ) : (
            <Card className="glass-card p-8 text-center">
              <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Select a threat report to view detailed analysis</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}