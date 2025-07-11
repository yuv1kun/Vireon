import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download, Eye, AlertTriangle, Target, Hash, Globe, Mail } from 'lucide-react';
import { threatIntelPipeline } from '@/services/threatIntelPipeline';
import { ExtractedIOC } from '@/services/iocExtractor';

interface IOC extends ExtractedIOC {
  id: string;
  source: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  description: string;
}

const typeIcons = {
  ip: Target,
  url: Globe,
  hash: Hash,
  domain: Globe,
  email: Mail
};

const severityStyles = {
  low: { color: 'bg-success-green/20 text-success-green border-success-green/30' },
  medium: { color: 'bg-warning-amber/20 text-warning-amber border-warning-amber/30' },
  high: { color: 'bg-destructive/20 text-destructive border-destructive/30' },
  critical: { color: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30' }
};

export function IOCManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [iocData, setIocData] = useState<IOC[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIOCs();
    const interval = setInterval(loadIOCs, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadIOCs = () => {
    try {
      const extractedIOCs = threatIntelPipeline.getAllIOCs();
      const reports = threatIntelPipeline.getAllReports();
      
      // Convert ExtractedIOC to IOC format with additional metadata
      const enrichedIOCs: IOC[] = extractedIOCs.map((ioc, index) => {
        // Find the report this IOC came from
        const sourceReport = reports.find(report => 
          Object.values(report.iocs).flat().includes(ioc.value)
        );
        
        return {
          id: `ioc-${index}`,
          type: ioc.type as any,
          value: ioc.value,
          context: ioc.context,
          confidence: ioc.confidence,
          source: sourceReport?.source || 'Unknown',
          timestamp: sourceReport?.timestamp || new Date().toISOString(),
          severity: sourceReport?.severity || 'medium',
          tags: sourceReport?.tags || ['IOC'],
          description: ioc.context || `${ioc.type.toUpperCase()} indicator extracted from threat intelligence`
        };
      });
      
      setIocData(enrichedIOCs);
      setLoading(false);
    } catch (error) {
      console.error('Error loading IOCs:', error);
      setLoading(false);
    }
  };

  const filteredIOCs = useMemo(() => {
    return iocData.filter(ioc => {
      const matchesSearch = ioc.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ioc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ioc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = selectedType === 'all' || ioc.type === selectedType;
      const matchesSeverity = selectedSeverity === 'all' || ioc.severity === selectedSeverity;
      
      return matchesSearch && matchesType && matchesSeverity;
    });
  }, [iocData, searchTerm, selectedType, selectedSeverity]);

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    // In a real app, show a toast notification here
  };

  const exportIOCs = () => {
    const data = filteredIOCs.map(ioc => ({
      type: ioc.type,
      value: ioc.value,
      source: ioc.source,
      severity: ioc.severity,
      timestamp: ioc.timestamp,
      tags: ioc.tags,
      description: ioc.description
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vireon-iocs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleExport = () => {
    try {
      const csvData = threatIntelPipeline.exportData('iocs', 'csv');
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iocs-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading IOCs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-semibold glow-text mb-2">
          IOC Management
        </h2>
        <p className="text-muted-foreground">
          Manage and analyze Indicators of Compromise extracted from threat intelligence feeds.
        </p>
      </div>

      {/* Filters */}
      <Card className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search IOCs</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search IOCs, descriptions, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ip">IP Addresses</SelectItem>
                <SelectItem value="url">URLs</SelectItem>
                <SelectItem value="hash">File Hashes</SelectItem>
                <SelectItem value="domain">Domains</SelectItem>
                <SelectItem value="email">Email Addresses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Severity</label>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Actions</label>
            <Button onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export IOCs
            </Button>
          </div>
        </div>
      </Card>

      {/* IOC List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Indicators of Compromise ({filteredIOCs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredIOCs.length > 0 ? (
            <div className="space-y-4">
              {filteredIOCs.map((ioc) => {
                const TypeIcon = typeIcons[ioc.type] || Target;
                return (
                  <div key={ioc.id} className="glass-card p-4 rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <TypeIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-mono text-sm font-medium">{ioc.value}</div>
                          <div className="text-xs text-muted-foreground">{ioc.type.toUpperCase()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={severityStyles[ioc.severity].color}
                        >
                          {ioc.severity.toUpperCase()}
                        </Badge>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Details
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {ioc.description}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {ioc.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {ioc.source} • {new Date(ioc.timestamp).toLocaleDateString()}
                      </div>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No IOCs Found</h3>
              <p className="text-muted-foreground">
                {iocData.length === 0 
                  ? 'No IOCs have been extracted yet. Run the threat intelligence pipeline to extract IOCs from feeds.'
                  : 'No IOCs match your current filters. Try adjusting your search criteria.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}