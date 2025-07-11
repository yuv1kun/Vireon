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

      const feedItems = await feedParser.fetchAllFeeds();
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
            `${report.title} ${report.description} ${report.content}`
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

  private generateTags(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const tags: string[] = [];

    const tagKeywords = {
      'APT': ['apt', 'advanced persistent', 'nation-state'],
      'Ransomware': ['ransomware', 'encryption', 'ransom'],
      'Malware': ['malware', 'trojan', 'virus', 'backdoor'],
      'Phishing': ['phishing', 'credential', 'social engineering'],
      'Vulnerability': ['vulnerability', 'cve', 'exploit', 'patch'],
      'Supply Chain': ['supply chain', 'third-party', 'dependency'],
      'Healthcare': ['healthcare', 'hospital', 'medical'],
      'Financial': ['financial', 'bank', 'payment'],
      'Government': ['government', 'federal', 'agency'],
      'Critical Infrastructure': ['infrastructure', 'critical', 'energy']
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

  // Get pipeline statistics
  getStats(): ThreatIntelligenceStats {
    const storageStats = dataStorage.getStats();
    const reports = dataStorage.getReports();
    const aiSummariesCount = reports.filter(r => r.aiSummary !== null).length;

    return {
      totalReports: storageStats.totalReports,
      totalIOCs: storageStats.totalIOCs,
      activeSources: THREAT_FEEDS.filter(f => f.active).length,
      lastRefresh: storageStats.lastUpdate,
      processingQueue: storageStats.processingQueue,
      aiSummariesGenerated: aiSummariesCount
    };
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