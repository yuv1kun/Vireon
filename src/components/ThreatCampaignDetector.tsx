import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, FileDigit, Network, Cpu, Calendar, Tag, Zap, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { threatIntelPipeline } from '@/services/threatIntelPipeline';
import { ThreatReport } from '@/services/dataStorage';
import { ollamaService } from '@/services/ollamaService';
import { cn } from '@/lib/utils';

// Define campaign interface
interface Campaign {
  id: string;
  name: string;
  description: string;
  firstSeen: string;
  lastSeen: string;
  reports: ThreatReport[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  threatActors: string[];
  techniques: string[];
  iocTypes: Record<string, number>;
  targetSectors: string[];
  primaryMotivation?: string;
}

export function ThreatCampaignDetector(): JSX.Element {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number>(0);

  // Detect campaigns by analyzing correlations between threat reports
  const detectCampaigns = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      // Get all threat reports
      const reports = threatIntelPipeline.getAllReports();
      if (reports.length === 0) {
        setCampaigns([]);
        return;
      }
      
      // Group reports by similarity and potential campaign
      // In a production system, this would use more sophisticated NLP techniques
      const potentialCampaigns: Record<string, ThreatReport[]> = {};
      
      // Simple clustering based on keywords, threat actors and techniques
      reports.forEach(report => {
        const keywords = extractKeywords(report);
        
        let assigned = false;
        Object.keys(potentialCampaigns).forEach(campaignId => {
          const campaignReports = potentialCampaigns[campaignId];
          const campaignKeywords = new Set<string>();
          
          campaignReports.forEach(cr => {
            extractKeywords(cr).forEach(kw => campaignKeywords.add(kw));
          });
          
          // Calculate similarity
          const sharedKeywords = keywords.filter(kw => campaignKeywords.has(kw));
          const similarity = sharedKeywords.length / Math.max(1, Math.min(keywords.length, campaignKeywords.size));
          
          // If similarity is high enough, assign to this campaign
          if (similarity > 0.3 && !assigned) {
            potentialCampaigns[campaignId].push(report);
            assigned = true;
          }
        });
        
        // If not assigned to any campaign, create a new one
        if (!assigned) {
          const campaignId = `campaign-${Object.keys(potentialCampaigns).length + 1}`;
          potentialCampaigns[campaignId] = [report];
        }
      });
      
      // Filter out "campaigns" with just one report
      const validCampaignIds = Object.keys(potentialCampaigns).filter(
        id => potentialCampaigns[id].length > 1
      );
      
      // For each valid campaign, create a campaign object
      const detectedCampaigns: Campaign[] = [];
      for (const campaignId of validCampaignIds) {
        const campaignReports = potentialCampaigns[campaignId];
        
        // Use Ollama to generate campaign name and description if available
        let campaignName = '';
        let campaignDescription = '';
        let threatActors: string[] = [];
        let techniques: string[] = [];
        let targetSectors: string[] = [];
        let primaryMotivation = '';
        
        // Try to generate campaign info with Ollama if available, with built-in timeout
        try {
          if (ollamaService.isAvailable()) {
            // Add timeout protection to prevent hanging
            const timeoutPromise = new Promise<null>((_, reject) => {
              setTimeout(() => reject(new Error('Ollama request timed out')), 10000);
            });
            
            // Create a prompt for LLM to analyze campaign
            const reportTitles = campaignReports.map(r => r.title).join("\n- ");
            const prompt = `Analyze these related threat reports and identify the likely threat campaign they represent:
            
Reports:
- ${reportTitles}

Please identify:
1. A concise name for this threat campaign (2-5 words)
2. A brief description of the campaign (1-2 sentences)
3. The likely threat actor groups involved (comma-separated)
4. The main techniques used (comma-separated)
5. Target sectors (comma-separated)
6. Primary motivation (financial, espionage, disruption, etc.)

Format your response exactly like this:
NAME: [campaign name]
DESCRIPTION: [campaign description]
ACTORS: [actors]
TECHNIQUES: [techniques]
SECTORS: [sectors]
MOTIVATION: [motivation]
`;

            try {
              // Race the actual request against a timeout
              const result = await Promise.race([
                ollamaService.generateSummary(
                  "Campaign Analysis", // title 
                  prompt, // content
                  ollamaService.getConfig().defaultModel // explicitly use default model
                ),
                timeoutPromise
              ]);
              
              if (result && 'summary' in result) { // Type guard to ensure we got the right response
                // Parse the LLM response
                const lines = result.summary.split("\n");
                for (const line of lines) {
                  if (line.startsWith("NAME:")) campaignName = line.substring(5).trim();
                  if (line.startsWith("DESCRIPTION:")) campaignDescription = line.substring(12).trim();
                  if (line.startsWith("ACTORS:")) threatActors = line.substring(7).trim().split(",").map(s => s.trim());
                  if (line.startsWith("TECHNIQUES:")) techniques = line.substring(11).trim().split(",").map(s => s.trim());
                  if (line.startsWith("SECTORS:")) targetSectors = line.substring(8).trim().split(",").map(s => s.trim());
                  if (line.startsWith("MOTIVATION:")) primaryMotivation = line.substring(11).trim();
                }
              }
            } catch (innerError) {
              // Handle timeout or any other errors with the LLM request specifically
              console.error("LLM request failed or timed out:", innerError);
            }
          }
        } catch (error) {
          console.error("Error in Ollama campaign analysis:", error);
          // Continue with fallback methods regardless of Ollama errors
        }
        
        // If LLM analysis failed, generate simple info
        if (!campaignName) {
          const commonWords = findCommonWords(campaignReports.map(r => r.title));
          campaignName = commonWords.length > 0 
            ? `Campaign ${campaignId.split('-')[1]}: ${commonWords.slice(0, 3).join(' ')}` 
            : `Threat Campaign ${campaignId.split('-')[1]}`;
          
          campaignDescription = `A series of ${campaignReports.length} related threat reports with similar characteristics and IOCs.`;
          
          // Extract basic info from reports
          const allTags = campaignReports.flatMap(r => r.tags || []);
          const tagCounts: Record<string, number> = {};
          allTags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
          
          // Find most common tags
          const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([tag]) => tag);
          
          threatActors = sortedTags.filter(tag => tag.includes('apt') || tag.includes('group')).slice(0, 3);
          techniques = sortedTags.filter(tag => !tag.includes('apt') && !tag.includes('group')).slice(0, 5);
        }
        
        // Calculate campaign time range
        const timestamps = campaignReports.map(r => new Date(r.timestamp).getTime());
        const firstSeen = new Date(Math.min(...timestamps)).toISOString();
        const lastSeen = new Date(Math.max(...timestamps)).toISOString();
        
        // Determine severity (use highest severity from reports)
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
        let highestSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';
        campaignReports.forEach(report => {
          if (severityLevels[report.severity] > severityLevels[highestSeverity]) {
            highestSeverity = report.severity;
          }
        });
        
        // Count IOC types
        const iocTypes: Record<string, number> = {};
        campaignReports.forEach(report => {
          if (report.iocs) {
            Object.keys(report.iocs).forEach(iocType => {
              iocTypes[iocType] = (iocTypes[iocType] || 0) + (report.iocs?.[iocType]?.length || 0);
            });
          }
        });
        
        // Create campaign object
        detectedCampaigns.push({
          id: campaignId,
          name: campaignName,
          description: campaignDescription,
          firstSeen,
          lastSeen,
          reports: campaignReports,
          severity: highestSeverity,
          confidence: calculateConfidence(campaignReports),
          threatActors,
          techniques,
          iocTypes,
          targetSectors,
          primaryMotivation
        });
      }
      
      // Sort campaigns by confidence and severity
      const sortedCampaigns = detectedCampaigns.sort((a, b) => {
        const severityDiff = severityToNum(b.severity) - severityToNum(a.severity);
        if (severityDiff !== 0) return severityDiff;
        return b.confidence - a.confidence;
      });
      
      setCampaigns(sortedCampaigns);
      setProcessingTime(Date.now() - startTime);
    } catch (error) {
      console.error('Error detecting campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract keywords from a threat report
  const extractKeywords = (report: ThreatReport): string[] => {
    // In a production system, this would use proper NLP techniques
    // For this demo, we'll use a simple approach with tags and title words
    const keywords: Set<string> = new Set();
    
    // Add tags
    if (report.tags && report.tags.length > 0) {
      report.tags.forEach(tag => keywords.add(tag.toLowerCase()));
    }
    
    // Add important words from title
    const titleWords = report.title.toLowerCase().split(/\s+/);
    titleWords.forEach(word => {
      if (word.length > 4 && !stopWords.includes(word)) {
        keywords.add(word);
      }
    });
    
    // Add important words from description
    if (report.description) {
      const descWords = report.description.toLowerCase().split(/\s+/);
      descWords.forEach(word => {
        if (word.length > 5 && !stopWords.includes(word)) {
          keywords.add(word);
        }
      });
    }
    
    return Array.from(keywords);
  };

  // Find common words in report titles
  const findCommonWords = (titles: string[]): string[] => {
    const wordCounts: Record<string, number> = {};
    
    titles.forEach(title => {
      const words = title.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 4 && !stopWords.includes(word)) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
    });
    
    return Object.entries(wordCounts)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
  };

  // Calculate confidence score for a campaign
  const calculateConfidence = (reports: ThreatReport[]): number => {
    if (reports.length < 2) return 0;
    
    // More reports = higher confidence (up to a point)
    const reportCount = Math.min(reports.length / 2, 5); // 0-5
    
    // More recent reports = higher confidence
    const now = Date.now();
    const avgAge = reports.reduce((sum, r) => {
      const age = now - new Date(r.timestamp).getTime();
      return sum + age;
    }, 0) / reports.length;
    const recency = Math.max(0, 1 - (avgAge / (30 * 24 * 60 * 60 * 1000))); // 0-1
    
    // More shared IOCs = higher confidence
    let sharedIocCount = 0;
    const iocSets: Record<string, Set<string>> = {};
    
    reports.forEach(report => {
      if (report.iocs) {
        Object.entries(report.iocs).forEach(([type, values]) => {
          if (!iocSets[type]) iocSets[type] = new Set();
          // Fix type checking by ensuring values is an array before using forEach
          if (Array.isArray(values)) {
            values.forEach(ioc => iocSets[type].add(ioc));
          }
        });
      }
    });
    
    Object.values(iocSets).forEach(set => {
      if (set.size > 1) sharedIocCount += set.size;
    });
    
    const iocFactor = Math.min(sharedIocCount / 5, 3); // 0-3
    
    // Calculate final score (0-100)
    return Math.min(100, Math.round((reportCount + recency + iocFactor) * 11));
  };

  // Convert severity to number for sorting
  const severityToNum = (severity: string): number => {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  // Initialize on component mount
  useEffect(() => {
    detectCampaigns();
  }, []);

  // Toggle campaign expansion
  const toggleCampaign = (id: string) => {
    setExpandedCampaign(expandedCampaign === id ? null : id);
  };

  // Common English stop words to filter out
  const stopWords = ['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during', 'without', 'before', 'under', 'around', 'among'];

  // Render severity badge with appropriate styling
  const renderSeverityBadge = (severity: string) => {
    const severityConfig: Record<string, { color: string, icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
      low: { color: 'bg-success-green/20 text-success-green border-success-green/30', icon: FileDigit },
      medium: { color: 'bg-warning-amber/20 text-warning-amber border-warning-amber/30', icon: AlertTriangle },
      high: { color: 'bg-destructive/20 text-destructive border-destructive/30', icon: AlertTriangle },
      critical: { color: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30', icon: AlertTriangle }
    };
    
    const config = severityConfig[severity] || severityConfig.medium;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={cn(config.color, "font-medium")}>
        <Icon className="h-3 w-3 mr-1" />
        {severity.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-display font-bold text-primary">Threat Campaign Detector</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={detectCampaigns} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? 'Analyzing...' : 'Analyze Campaigns'}
          </Button>
        </div>
      </div>
      
      {processingTime > 0 && (
        <p className="text-xs text-muted-foreground mb-4">
          <Cpu className="h-3 w-3 inline mr-1" />
          Analysis completed in {(processingTime / 1000).toFixed(1)}s
        </p>
      )}
      
      {campaigns.length === 0 && !loading ? (
        <div className="p-8 text-center">
          <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No threat campaigns detected yet</p>
          <p className="text-xs text-muted-foreground mt-1">Ingest more threat reports or click Analyze Campaigns</p>
        </div>
      ) : (
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {campaigns.map(campaign => (
              <Card key={campaign.id} className={cn(
                "border p-4",
                campaign.severity === 'critical' && "border-l-4 border-l-neon-purple",
                campaign.severity === 'high' && "border-l-4 border-l-destructive",
                campaign.severity === 'medium' && "border-l-4 border-l-warning-amber",
                campaign.severity === 'low' && "border-l-4 border-l-success-green"
              )}>
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCampaign(campaign.id)}
                >
                  <div className="flex items-center gap-2">
                    {expandedCampaign === campaign.id ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                    <h3 className="font-display font-semibold">{campaign.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderSeverityBadge(campaign.severity)}
                    <Badge variant="secondary" className="font-mono">
                      {campaign.reports.length} reports
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    First seen: {new Date(campaign.firstSeen).toLocaleDateString()}
                  </span>
                  <span className="flex items-center ml-4">
                    <Calendar className="h-3 w-3 mr-1" />
                    Last seen: {new Date(campaign.lastSeen).toLocaleDateString()}
                  </span>
                </div>
                
                {expandedCampaign === campaign.id && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-sm">{campaign.description}</p>
                      <div className="mt-2">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs text-muted-foreground">Confidence:</span>
                          <Progress value={campaign.confidence} className="h-2 w-24" />
                          <span className="text-xs font-mono">{campaign.confidence}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Threat Actors</h4>
                        <div className="flex flex-wrap gap-1">
                          {campaign.threatActors.length > 0 ? (
                            campaign.threatActors.map((actor, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {actor}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">None identified</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Techniques</h4>
                        <div className="flex flex-wrap gap-1">
                          {campaign.techniques.length > 0 ? (
                            campaign.techniques.map((technique, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {technique}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">None identified</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">IOC Types</h4>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(campaign.iocTypes).map(([type, count]) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Target Sectors</h4>
                        <div className="flex flex-wrap gap-1">
                          {campaign.targetSectors.length > 0 ? (
                            campaign.targetSectors.map((sector, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {sector}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Unknown</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {campaign.primaryMotivation && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Primary Motivation</h4>
                        <p className="text-sm">{campaign.primaryMotivation}</p>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Related Reports</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {campaign.reports.map(report => (
                          <div key={report.id} className="text-sm p-2 rounded bg-accent/40">
                            <div className="font-medium">{report.title}</div>
                            <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                              <span>{report.source}</span>
                              <span>{new Date(report.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
      
      {loading && (
        <div className="mt-4 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2">Analyzing threat intelligence for campaign patterns...</p>
        </div>
      )}
    </Card>
  );
}
