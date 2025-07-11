// Data Storage and Management Service
import { FeedItem } from './feedParser';
import { ExtractedIOC } from './iocExtractor';
import { ThreatSummary } from './aiAnalyzer';

export interface ThreatReport {
  id: string;
  title: string;
  description: string;
  content: string;
  source: string;
  link: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  iocs: {
    ips: string[];
    urls: string[];
    hashes: string[];
    domains: string[];
    emails: string[];
  };
  aiSummary: ThreatSummary | null;
  processed: boolean;
  tags: string[];
}

export interface StorageStats {
  totalReports: number;
  totalIOCs: number;
  lastUpdate: string;
  processingQueue: number;
}

class DataStorageService {
  private readonly STORAGE_KEYS = {
    REPORTS: 'vireon_threat_reports',
    IOCS: 'vireon_extracted_iocs',
    SETTINGS: 'vireon_settings',
    STATS: 'vireon_stats'
  };

  // Get all threat reports
  getReports(): ThreatReport[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.REPORTS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading reports:', error);
      return [];
    }
  }

  // Save threat reports
  saveReports(reports: ThreatReport[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.REPORTS, JSON.stringify(reports));
      this.updateStats();
    } catch (error) {
      console.error('Error saving reports:', error);
    }
  }

  // Add new report
  addReport(report: ThreatReport): void {
    const reports = this.getReports();
    
    // Check for duplicates based on title and source
    const existingIndex = reports.findIndex(r => 
      r.title === report.title && r.source === report.source
    );
    
    if (existingIndex >= 0) {
      // Update existing report
      reports[existingIndex] = { ...reports[existingIndex], ...report };
    } else {
      // Add new report
      reports.unshift(report); // Add to beginning for newest first
    }
    
    // Keep only last 1000 reports
    if (reports.length > 1000) {
      reports.splice(1000);
    }
    
    this.saveReports(reports);
  }

  // Get all extracted IOCs
  getIOCs(): ExtractedIOC[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.IOCS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading IOCs:', error);
      return [];
    }
  }

  // Save IOCs
  saveIOCs(iocs: ExtractedIOC[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.IOCS, JSON.stringify(iocs));
    } catch (error) {
      console.error('Error saving IOCs:', error);
    }
  }

  // Add new IOCs
  addIOCs(newIOCs: ExtractedIOC[], sourceReport: string): void {
    const existingIOCs = this.getIOCs();
    
    // Add source metadata to IOCs
    const iocsWithSource = newIOCs.map(ioc => ({
      ...ioc,
      sourceReport,
      timestamp: new Date().toISOString()
    }));
    
    // Remove duplicates based on type and value
    const uniqueIOCs = [...existingIOCs];
    
    iocsWithSource.forEach(newIOC => {
      const existingIndex = uniqueIOCs.findIndex(ioc => 
        ioc.type === newIOC.type && ioc.value === newIOC.value
      );
      
      if (existingIndex >= 0) {
        // Update existing IOC with higher confidence if applicable
        if (newIOC.confidence > uniqueIOCs[existingIndex].confidence) {
          uniqueIOCs[existingIndex] = newIOC;
        }
      } else {
        uniqueIOCs.push(newIOC);
      }
    });
    
    // Keep only last 10000 IOCs
    if (uniqueIOCs.length > 10000) {
      uniqueIOCs.sort((a, b) => b.confidence - a.confidence);
      uniqueIOCs.splice(10000);
    }
    
    this.saveIOCs(uniqueIOCs);
  }

  // Search functionality
  searchReports(query: string, filters?: {
    severity?: string[];
    sources?: string[];
    dateRange?: { start: string; end: string };
    category?: string[];
  }): ThreatReport[] {
    const reports = this.getReports();
    const queryLower = query.toLowerCase();
    
    return reports.filter(report => {
      // Text search
      const matchesQuery = !query || 
        report.title.toLowerCase().includes(queryLower) ||
        report.description.toLowerCase().includes(queryLower) ||
        report.content.toLowerCase().includes(queryLower) ||
        report.tags.some(tag => tag.toLowerCase().includes(queryLower));
      
      // Filter by severity
      const matchesSeverity = !filters?.severity?.length || 
        filters.severity.includes(report.severity);
      
      // Filter by source
      const matchesSource = !filters?.sources?.length || 
        filters.sources.includes(report.source);
      
      // Filter by date range
      const matchesDate = !filters?.dateRange || (
        new Date(report.timestamp) >= new Date(filters.dateRange.start) &&
        new Date(report.timestamp) <= new Date(filters.dateRange.end)
      );
      
      // Filter by category
      const matchesCategory = !filters?.category?.length ||
        filters.category.includes(report.category);
      
      return matchesQuery && matchesSeverity && matchesSource && matchesDate && matchesCategory;
    });
  }

  // Search IOCs
  searchIOCs(query: string, filters?: {
    types?: string[];
    confidenceMin?: number;
    dateRange?: { start: string; end: string };
  }): ExtractedIOC[] {
    const iocs = this.getIOCs();
    const queryLower = query.toLowerCase();
    
    return iocs.filter(ioc => {
      // Text search
      const matchesQuery = !query || 
        ioc.value.toLowerCase().includes(queryLower) ||
        ioc.context.toLowerCase().includes(queryLower);
      
      // Filter by type
      const matchesType = !filters?.types?.length || 
        filters.types.includes(ioc.type);
      
      // Filter by confidence
      const matchesConfidence = !filters?.confidenceMin || 
        ioc.confidence >= filters.confidenceMin;
      
      // Filter by date range (if timestamp exists)
      const matchesDate = !filters?.dateRange || !('timestamp' in ioc) || (
        new Date((ioc as any).timestamp) >= new Date(filters.dateRange.start) &&
        new Date((ioc as any).timestamp) <= new Date(filters.dateRange.end)
      );
      
      return matchesQuery && matchesType && matchesConfidence && matchesDate;
    });
  }

  // Get statistics
  getStats(): StorageStats {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.STATS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    
    // Generate stats if not found
    return this.generateStats();
  }

  private generateStats(): StorageStats {
    const reports = this.getReports();
    const iocs = this.getIOCs();
    const unprocessedReports = reports.filter(r => !r.processed).length;
    
    const stats: StorageStats = {
      totalReports: reports.length,
      totalIOCs: iocs.length,
      lastUpdate: new Date().toISOString(),
      processingQueue: unprocessedReports
    };
    
    this.saveStats(stats);
    return stats;
  }

  private saveStats(stats: StorageStats): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  private updateStats(): void {
    this.generateStats();
  }

  // Export data
  exportReports(format: 'json' | 'csv' = 'json'): string {
    const reports = this.getReports();
    
    if (format === 'csv') {
      const headers = ['ID', 'Title', 'Source', 'Timestamp', 'Severity', 'Category', 'Description'];
      const rows = reports.map(report => [
        report.id,
        report.title.replace(/\"/g, '\"\"'),
        report.source,
        report.timestamp,
        report.severity,
        report.category,
        report.description.replace(/\"/g, '\"\"')
      ]);
      
      return [headers, ...rows]
        .map(row => row.map(cell => `\"${cell}\"`).join(','))
        .join('\n');
    }
    
    return JSON.stringify(reports, null, 2);
  }

  exportIOCs(format: 'json' | 'csv' = 'json'): string {
    const iocs = this.getIOCs();
    
    if (format === 'csv') {
      const headers = ['Type', 'Value', 'Confidence', 'Context', 'Source Report'];
      const rows = iocs.map(ioc => [
        ioc.type,
        ioc.value,
        ioc.confidence.toString(),
        ioc.context.replace(/\"/g, '\"\"'),
        (ioc as any).sourceReport || 'Unknown'
      ]);
      
      return [headers, ...rows]
        .map(row => row.map(cell => `\"${cell}\"`).join(','))
        .join('\n');
    }
    
    return JSON.stringify(iocs, null, 2);
  }

  // Clear all data
  clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Get storage usage
  getStorageUsage(): { used: number; total: number; percentage: number } {
    let used = 0;
    Object.values(this.STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        used += item.length;
      }
    });
    
    // Estimate total available storage (5MB is typical)
    const total = 5 * 1024 * 1024; // 5MB in bytes
    
    return {
      used,
      total,
      percentage: (used / total) * 100
    };
  }

  // Settings management
  getSettings(): any {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  }

  saveSetting(key: string, value: any): void {
    const settings = this.getSettings();
    settings[key] = value;
    
    try {
      localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
}

export const dataStorage = new DataStorageService();
