// Main Threat Intelligence Pipeline Orchestrator
import { feedParser, FeedItem, THREAT_FEEDS } from './feedParser';
import { iocExtractor, ExtractedIOC } from './iocExtractor';
import { aiAnalyzer, ThreatSummary } from './aiAnalyzer';
import { dataStorage, ThreatReport } from './dataStorage';

export interface ProcessingStatus {
  isProcessing: boolean;
  currentStep: string;
  progress: number;
  totalSteps: number;
  errors: string[];
  lastUpdate: string;
}

export interface ThreatIntelligenceStats {
  totalReports: number;
  totalIOCs: number;
  activeSources: number;
  lastRefresh: string;
  processingQueue: number;
  aiSummariesGenerated: number;
  reportsBySource?: Record<string, number>;
  apiSourceReports?: number;
  rssFeedReports?: number;
}

class ThreatIntelligencePipeline {
  private isProcessing = false;
  private processingStatus: ProcessingStatus = {
    isProcessing: false,
    currentStep: '',
    progress: 0,
    totalSteps: 0,
    errors: [],
    lastUpdate: ''
  };

  private statusCallbacks: ((status: ProcessingStatus) => void)[] = [];

  constructor() {
    this.initializePipeline();
  }

  private async initializePipeline(): Promise<void> {
    console.log('Initializing Threat Intelligence Pipeline...');
    
    // Load existing data
    const existingReports = dataStorage.getReports();
    console.log(`Loaded ${existingReports.length} existing reports`);
    
    // Check if we need initial data load
    if (existingReports.length === 0) {
      console.log('No existing data found, loading initial dataset...');
      await this.performInitialDataLoad();
    }
  }

  // Subscribe to processing status updates
  onStatusUpdate(callback: (status: ProcessingStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  private updateStatus(update: Partial<ProcessingStatus>): void {
    this.processingStatus = {
      ...this.processingStatus,
      ...update,
      lastUpdate: new Date().toISOString()
    };
    
    this.statusCallbacks.forEach(callback => callback(this.processingStatus));
  }

  // Main pipeline execution
  async refreshThreatIntelligence(options?: {
    forceFeedRefresh?: boolean;
    reprocessExisting?: boolean;
    maxItems?: number;
    sourcesFilter?: string[];
  }): Promise<{ success: boolean; processed: number; errors: string[] }> {
    
    if (this.isProcessing) {
      throw new Error('Pipeline is already processing. Please wait for current operation to complete.');
    }

    this.isProcessing = true;
    const errors: string[] = [];
    let processedCount = 0;

    try {
      this.updateStatus({
        isProcessing: true,
        currentStep: 'Initializing',
        progress: 0,
        totalSteps: 5,
        errors: []
      });

      // Step 1: Fetch feeds
      this.updateStatus({
        currentStep: 'Fetching threat intelligence feeds',
        progress: 1
      });

      // Apply source filtering if provided
      let feedItems: FeedItem[] = [];
      if (options?.sourcesFilter && options.sourcesFilter.length > 0) {
        console.log(`Filtering feeds by sources: ${options.sourcesFilter.join(', ')}`);
        feedItems = await feedParser.fetchFeedsFromSources(options.sourcesFilter);
      } else {
        feedItems = await feedParser.fetchAllFeeds();
      }
      console.log(`Fetched ${feedItems.length} feed items`);

      // Step 2: Convert feed items to threat reports
      this.updateStatus({
        currentStep: 'Processing feed items',
        progress: 2
      });

      const newReports = await this.processFeedItems(
        feedItems, 
        options?.maxItems || 50
      );

      // Step 3: Extract IOCs from reports
      this.updateStatus({
        currentStep: 'Extracting indicators of compromise',
        progress: 3
      });

      for (const report of newReports) {
        try {
          const extractionResult = iocExtractor.extractIOCs(
            `${report.title} ${report.description} ${report.content}`,
            report.source // Pass the source type to help with specialized extraction
          );
          
          // Update report with extracted IOCs
          report.iocs = this.organizeIOCs(extractionResult.iocs);
          
          // Store IOCs separately
          dataStorage.addIOCs(extractionResult.iocs, report.id);
          
          processedCount++;
        } catch (error) {
          console.error(`Error extracting IOCs for report ${report.id}:`, error);
          errors.push(`IOC extraction failed for ${report.title}`);
        }
      }

      // Step 4: Generate AI summaries
      this.updateStatus({
        currentStep: 'Generating AI threat summaries',
        progress: 4
      });

      if (aiAnalyzer.isReady()) {
        for (const report of newReports) {
          try {
            const aiSummary = await aiAnalyzer.generateThreatSummary(
              report.title,
              report.content,
              Object.values(report.iocs).flat()
            );
            
            report.aiSummary = aiSummary;
            report.severity = aiSummary.severity;
            report.category = aiSummary.threatType;
            report.processed = true;
            
          } catch (error) {
            console.error(`Error generating AI summary for report ${report.id}:`, error);
            errors.push(`AI summary failed for ${report.title}`);
            report.processed = false;
          }
        }
      } else {
        console.log('AI analyzer not ready, skipping AI summaries');
        newReports.forEach(report => {
          report.processed = false;
          report.aiSummary = null;
        });
      }

      // Step 5: Save processed reports
      this.updateStatus({
        currentStep: 'Saving processed reports',
        progress: 5
      });

      newReports.forEach(report => {
        dataStorage.addReport(report);
      });

      this.updateStatus({
        isProcessing: false,
        currentStep: 'Complete',
        progress: 5,
        errors
      });

      return {
        success: true,
        processed: processedCount,
        errors
      };

    } catch (error) {
      console.error('Pipeline error:', error);
      errors.push(`Pipeline error: ${error}`);
      
      this.updateStatus({
        isProcessing: false,
        currentStep: 'Error',
        errors
      });

      return {
        success: false,
        processed: processedCount,
        errors
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process feed items into threat reports
   * This handles all source types including API-based sources
   */
  private async processFeedItems(feedItems: FeedItem[], maxItems: number): Promise<ThreatReport[]> {
    const reports: ThreatReport[] = [];
    const itemsToProcess = feedItems.slice(0, maxItems);

    for (const item of itemsToProcess) {
      const report: ThreatReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: item.title,
        description: item.description,
        content: item.content,
        source: item.source,
        link: item.link,
        timestamp: item.pubDate,
        severity: 'medium', // Will be updated by AI analysis
        category: 'Unknown', // Will be updated by AI analysis
        iocs: {
          ips: [],
          urls: [],
          hashes: [],
          domains: [],
          emails: []
        },
        aiSummary: null,
        processed: false,
        tags: this.generateTags(item.title, item.description)
      };

      reports.push(report);
    }

    return reports;
  }

  private organizeIOCs(iocs: ExtractedIOC[]): ThreatReport['iocs'] {
    const organized = {
      ips: [] as string[],
      urls: [] as string[],
      hashes: [] as string[],
      domains: [] as string[],
      emails: [] as string[]
    };

    iocs.forEach(ioc => {
      switch (ioc.type) {
        case 'ip':
          organized.ips.push(ioc.value);
          break;
        case 'url':
          organized.urls.push(ioc.value);
          break;
        case 'hash':
          organized.hashes.push(ioc.value);
          break;
        case 'domain':
          organized.domains.push(ioc.value);
          break;
        case 'email':
          organized.emails.push(ioc.value);
          break;
      }
    });

    return organized;
  }

  /**
   * Generate tags based on content keywords
   * Enhanced to include new source types like GHSA and NIST NVD
   */
  private generateTags(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const tags: string[] = [];

    const tagKeywords = {
      'APT': ['apt', 'advanced persistent', 'nation-state', 'threat actor', 'campaign'],
      'Ransomware': ['ransomware', 'encryption', 'ransom', 'payment', 'decrypt', 'locked'],
      'Malware': ['malware', 'trojan', 'virus', 'backdoor', 'payload', 'dropper', 'rootkit'],
      'Phishing': ['phishing', 'credential', 'social engineering', 'spear', 'email', 'spoofing'],
      'Vulnerability': ['vulnerability', 'cve', 'exploit', 'patch', 'zero-day', 'disclosure'],
      'Supply Chain': ['supply chain', 'third-party', 'dependency', 'vendor', 'upstream'],
      'Healthcare': ['healthcare', 'hospital', 'medical', 'patient', 'hipaa'],
      'Financial': ['financial', 'bank', 'payment', 'atm', 'swift', 'transaction'],
      'Government': ['government', 'federal', 'agency', 'military', 'classified'],
      'Critical Infrastructure': ['infrastructure', 'critical', 'energy', 'grid', 'scada', 'ics'],
      'GHSA': ['github', 'advisory', 'ghsa', 'package', 'dependency', 'npm', 'pip'],
      'Cloud': ['aws', 'azure', 'gcp', 'cloud', 's3', 'bucket', 'container'],
      'Cryptojacking': ['crypto', 'mining', 'monero', 'bitcoin', 'blockchain', 'wallet'],
      'IoT': ['iot', 'device', 'router', 'camera', 'smart home', 'embedded'],
      'Mobile': ['android', 'ios', 'mobile', 'app', 'smartphone', 'tablet']
    };

    Object.entries(tagKeywords).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(tag);
      }
    });

    return tags;
  }

  private async performInitialDataLoad(): Promise<void> {
    console.log('Performing initial data load...');
    
    try {
      await this.refreshThreatIntelligence({
        forceFeedRefresh: true,
        maxItems: 20 // Limit initial load
      });
    } catch (error) {
      console.error('Initial data load failed:', error);
    }
  }

  // Get current processing status
  getStatus(): ProcessingStatus {
    return { ...this.processingStatus };
  }

  /**
   * Get statistics about the current threat intelligence state
   * Enhanced to provide more detailed source information
   */
  getThreatIntelligenceStats(): ThreatIntelligenceStats {
    console.log('Getting threat intelligence stats...');
    try {
      const storageStats = dataStorage.getStats();
      console.log('Retrieved storage stats', storageStats);
      
      const reports = dataStorage.getReports();
      console.log(`Retrieved ${reports.length} reports`);
      
      const allIOCs = dataStorage.getIOCs();
      console.log(`Retrieved ${allIOCs.length} IOCs`);
      
      const aiSummariesCount = reports.filter(r => r.aiSummary !== null).length;
      console.log(`Found ${aiSummariesCount} AI summaries`);

      // Get stats by source type
      const sourceCounts = reports.reduce((acc, report) => {
        const source = report.source || 'Unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
      // Count reports by source type (API vs RSS/Atom)
      const apiSources = ['github', 'nvd', 'alienvault', 'phishtank', 'reddit'];
      const apiReports = reports.filter(r => {
        const sourceFeed = THREAT_FEEDS.find(feed => feed.name === r.source);
        return sourceFeed && apiSources.includes(sourceFeed.type);
      }).length;
      
      const rssFeedReports = reports.length - apiReports;
      
      // Get the last refresh date from the most recent report, or use current date
      const lastRefreshDate = reports.length > 0 
        ? new Date(Math.max(...reports.map(r => new Date(r.timestamp).getTime())))
        : new Date();
        
      return {
        totalReports: reports.length,
        totalIOCs: allIOCs.length,
        activeSources: THREAT_FEEDS.filter(feed => feed.active).length,
        lastRefresh: lastRefreshDate.toISOString(),
        processingQueue: this.isProcessing ? 1 : 0,
        aiSummariesGenerated: aiSummariesCount,
        reportsBySource: sourceCounts,
        apiSourceReports: apiReports,
        rssFeedReports: rssFeedReports
      };
    } catch (error) {
      console.error('Error getting threat intelligence stats:', error);
      // Return default stats if there's an error
      return {
        totalReports: 0,
        totalIOCs: 0,
        activeSources: 0,
        lastRefresh: new Date().toISOString(),
        processingQueue: 0,
        aiSummariesGenerated: 0,
        reportsBySource: {},
        apiSourceReports: 0,
        rssFeedReports: 0
      };
    }
  }

  // Search functionality
  searchReports(query: string, filters?: any) {
    return dataStorage.searchReports(query, filters);
  }

  searchIOCs(query: string, filters?: any) {
    return dataStorage.searchIOCs(query, filters);
  }

  // Get all reports
  getAllReports(): ThreatReport[] {
    return dataStorage.getReports();
  }

  // Get all IOCs
  getAllIOCs(): ExtractedIOC[] {
    return dataStorage.getIOCs();
  }

  // Export functionality
  exportData(type: 'reports' | 'iocs', format: 'json' | 'csv' = 'json'): string {
    if (type === 'reports') {
      return dataStorage.exportReports(format);
    } else {
      return dataStorage.exportIOCs(format);
    }
  }

  // Check if processing
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  // Force stop processing (emergency use)
  forceStop(): void {
    this.isProcessing = false;
    this.updateStatus({
      isProcessing: false,
      currentStep: 'Stopped',
      errors: ['Processing was manually stopped']
    });
  }
}

export const threatIntelPipeline = new ThreatIntelligencePipeline();