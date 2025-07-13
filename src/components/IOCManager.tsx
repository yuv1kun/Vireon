import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download, Eye, AlertTriangle, Target, Hash, Globe, Mail, Loader2, Zap, RefreshCw } from 'lucide-react';
import { threatIntelPipeline } from '@/services/threatIntelPipeline';
import { ollamaService } from '@/services/ollamaService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
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
  
  // State for IOC details dialog
  const [selectedIOC, setSelectedIOC] = useState<IOC | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [iocAnalysis, setIocAnalysis] = useState<{
    analysis: string;
    model: string;
    processingTime: number;
  } | null>(null);

  useEffect(() => {
    loadIOCs();
    // More frequent refresh to match dashboard's refresh rate
    const interval = setInterval(loadIOCs, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadIOCs = () => {
    setLoading(true);
    try {
      console.log('Loading IOC data...');
      const extractedIOCs = threatIntelPipeline.getAllIOCs() || [];
      const reports = threatIntelPipeline.getAllReports() || [];
      
      console.log(`Found ${extractedIOCs.length} IOCs and ${reports.length} reports`);
      
      // Convert ExtractedIOC to IOC format with additional metadata
      const enrichedIOCs: IOC[] = extractedIOCs.map((ioc, index) => {
        // Find the report this IOC came from
        const sourceReport = reports.find(report => {
          if (!report.iocs) return false;
          // Safely check each type of IOC
          return Object.values(report.iocs).some(iocsOfType => {
            if (!Array.isArray(iocsOfType)) return false;
            return iocsOfType.includes(ioc.value);
          });
        });
        
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
      
      // Sort IOCs by timestamp, newest first
      const sortedIOCs = enrichedIOCs.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setIocData(sortedIOCs);
      setLoading(false);
      console.log(`Successfully loaded ${sortedIOCs.length} enriched IOCs`);
    } catch (error) {
      console.error('Error loading IOCs:', error);
      // Provide fallback empty data so UI isn't stuck in loading state
      setIocData([]);
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
  
  // Show IOC details dialog and generate analysis
  const showIOCDetails = async (ioc: IOC) => {
    setSelectedIOC(ioc);
    setShowDetailsDialog(true);
    setAnalysisLoading(true);
    setIocAnalysis(null);
    
    try {
      // Generate IOC context for the LLM
      const iocContext = `
        IOC Type: ${ioc.type.toUpperCase()}
        IOC Value: ${ioc.value}
        Severity: ${ioc.severity.toUpperCase()}
        Source: ${ioc.source}
        Tags: ${ioc.tags.join(', ')}
        Detected: ${new Date(ioc.timestamp).toLocaleString()}
        Context: ${ioc.context || 'No additional context available'}
      `;
      
      // Try to get associated threat report for additional context
      const reports = threatIntelPipeline.getAllReports() || [];
      const associatedReport = reports.find(report => {
        if (!report.iocs) return false;
        return Object.values(report.iocs).some(iocsOfType => {
          if (!Array.isArray(iocsOfType)) return false;
          return iocsOfType.includes(ioc.value);
        });
      });
      
      let analysisPrompt = `Analyze this IOC (Indicator of Compromise) and provide a well-structured explanation using bullet points.

INSTRUCTIONS FOR RESPONSE FORMAT:
- Use bullet points (•) for better readability
- Include a "Type Explanation" section explaining what this type of IOC represents
- Include a "Threat Assessment" section evaluating potential risks
- Include a "Recommended Actions" section with mitigation steps
- Use formatting like headers and whitespace to structure your response
- Keep points concise and actionable

Your analysis should explain:`;
      if (associatedReport) {
        analysisPrompt += `\n\nAssociated Threat Report: ${associatedReport.title}\n${associatedReport.description || ''}`;
      }
      
      // Add formatting instructions for structured output
      const formattingInstructions = `
FORMATTING INSTRUCTIONS:
- Format your response in bullet points for better readability
- Use section headers (e.g., ### Type Explanation, ### Threat Assessment, ### Recommended Actions)
- Include whitespace between sections for clarity
- Keep each bullet point concise and actionable
- Focus on the most relevant information for SOC analysts
`;
      
      // Generate analysis using local LLM
      if (ollamaService.isAvailable()) {
        const result = await ollamaService.generateSummary(
          `IOC Analysis: ${ioc.type} - ${ioc.value}`, 
          iocContext + formattingInstructions + '\n\nPlease analyze this IOC and format your response as instructed above.\n' + analysisPrompt
        );
        
        if (result) {
          setIocAnalysis({
            analysis: result.summary,
            model: result.model,
            processingTime: result.processingTime
          });
        } else {
          setIocAnalysis({
            analysis: 'Failed to generate analysis with the local LLM. Ollama may not be running or is having issues.',
            model: 'Error',
            processingTime: 0
          });
        }
      } else {
        setIocAnalysis({
          analysis: 'Local LLM (Ollama) is not available. Please make sure Ollama is running to get IOC analysis.',
          model: 'Not available',
          processingTime: 0
        });
      }
    } catch (error) {
      console.error('Error generating IOC analysis:', error);
      setIocAnalysis({
        analysis: 'An error occurred while generating the analysis.',
        model: 'Error',
        processingTime: 0
      });
    } finally {
      setAnalysisLoading(false);
    }
  };
  
  // Regenerate analysis with a different model
  const regenerateAnalysis = async (model?: string) => {
    if (!selectedIOC) return;
    
    setAnalysisLoading(true);
    setIocAnalysis(null);
    
    try {
      const iocContext = `
        IOC Type: ${selectedIOC.type.toUpperCase()}
        IOC Value: ${selectedIOC.value}
        Severity: ${selectedIOC.severity.toUpperCase()}
        Source: ${selectedIOC.source}
        Tags: ${selectedIOC.tags.join(', ')}
        Context: ${selectedIOC.context || 'No additional context available'}
      `;
      
      const formattingInstructions = `
FORMATTING INSTRUCTIONS:
- Format your response in bullet points for better readability
- Use section headers (e.g., ### Type Explanation, ### Threat Assessment, ### Recommended Actions)
- Include whitespace between sections for clarity
- Keep each bullet point concise and actionable
- Focus on the most relevant information for SOC analysts
`;
      
      const result = await ollamaService.generateSummary(
        `IOC Analysis: ${selectedIOC.type} - ${selectedIOC.value}`,
        iocContext + formattingInstructions + `

Please analyze this IOC and format your response as instructed above.`,
        model
      );
      
      if (result) {
        setIocAnalysis({
          analysis: result.summary,
          model: result.model,
          processingTime: result.processingTime
        });
      } else {
        setIocAnalysis({
          analysis: 'Failed to generate analysis with the requested model.',
          model: model || 'Error',
          processingTime: 0
        });
      }
    } catch (error) {
      console.error('Error regenerating IOC analysis:', error);
    } finally {
      setAnalysisLoading(false);
    }
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => showIOCDetails(ioc)}
                      >
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
      
      {/* IOC Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIOC?.type === 'ip' && <Globe className="h-5 w-5 text-blue-500" />}
              {selectedIOC?.type === 'domain' && <Globe className="h-5 w-5 text-green-500" />}
              {selectedIOC?.type === 'url' && <Globe className="h-5 w-5 text-purple-500" />}
              {selectedIOC?.type === 'hash' && <Hash className="h-5 w-5 text-amber-500" />}
              {selectedIOC?.type === 'email' && <Mail className="h-5 w-5 text-red-500" />}
              IOC Details: {selectedIOC?.value}
            </DialogTitle>
            <DialogDescription>
              {selectedIOC && (
                <div className="mt-2">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <div className="text-sm font-semibold">Type</div>
                      <div className="text-sm">{selectedIOC.type.toUpperCase()}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Severity</div>
                      <div className="text-sm">
                        <Badge className={`
                          ${selectedIOC.severity === 'critical' ? 'bg-red-600' : ''}
                          ${selectedIOC.severity === 'high' ? 'bg-red-500' : ''}
                          ${selectedIOC.severity === 'medium' ? 'bg-yellow-500' : ''}
                          ${selectedIOC.severity === 'low' ? 'bg-blue-500' : ''}
                        `}>
                          {selectedIOC.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Source</div>
                      <div className="text-sm">{selectedIOC.source}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Detected</div>
                      <div className="text-sm">{new Date(selectedIOC.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-sm font-semibold">Tags</div>
                      <div className="text-sm flex flex-wrap gap-1">
                        {selectedIOC.tags.map((tag, i) => (
                          <Badge variant="outline" key={i}>{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    {selectedIOC.context && (
                      <div className="col-span-2">
                        <div className="text-sm font-semibold">Context</div>
                        <div className="text-sm">{selectedIOC.context}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-md p-4 my-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                LLM Analysis
              </h3>
              
              <div className="flex items-center gap-2">
                {analysisLoading ? (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Generating...
                  </div>
                ) : iocAnalysis ? (
                  <div className="text-xs text-muted-foreground">
                    {iocAnalysis.model} • {Math.round(iocAnalysis.processingTime / 100) / 10}s
                  </div>
                ) : null}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => regenerateAnalysis()}
                  disabled={analysisLoading}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {analysisLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Generating analysis...</span>
              </div>
            ) : iocAnalysis ? (
              <div className="text-sm whitespace-pre-wrap">
                {iocAnalysis.analysis}
              </div>
            ) : (
              <div className="text-muted-foreground text-center p-4">
                No analysis available
              </div>
            )}
            
            {!analysisLoading && !ollamaService.isAvailable() && (
              <div className="text-xs text-amber-600 mt-2 p-2 bg-amber-50 rounded">
                <p className="font-medium">Local LLM service (Ollama) is not available</p>
                <p>Install Ollama from <a href="https://ollama.ai" className="underline" target="_blank" rel="noreferrer">ollama.ai</a> and run "ollama serve" to enable local AI analysis.</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}