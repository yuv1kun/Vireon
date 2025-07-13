// IOC (Indicators of Compromise) Extraction Service
export interface ExtractedIOC {
  type: 'ip' | 'url' | 'hash' | 'domain' | 'email';
  value: string;
  context: string;
  confidence: number;
}

export interface IOCExtractionResult {
  iocs: ExtractedIOC[];
  summary: {
    totalFound: number;
    byType: Record<string, number>;
  };
}

class IOCExtractor {
  // Regex patterns for different IOC types
  private patterns = {
    // IPv4 addresses
    ipv4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    
    // IPv6 addresses (simplified)
    ipv6: /\b(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}\b|\b(?:[a-fA-F0-9]{1,4}:){1,7}:|\b(?:[a-fA-F0-9]{1,4}:){1,6}:[a-fA-F0-9]{1,4}\b/g,
    
    // URLs and domains - enhanced pattern for better detection
    url: /https?:\/\/(?:[-\w.%]+)+(?:\:[0-9]+)?(?:\/(?:[\w\/_\-.%])*(?:\?(?:[\w&=%\-.])*)?(?:\#(?:[\w\-.])*)?)?/g,
    
    // Domain names
    domain: /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b/g,
    
    // File hashes (MD5, SHA1, SHA256)
    md5: /\b[a-fA-F0-9]{32}\b/g,
    sha1: /\b[a-fA-F0-9]{40}\b/g,
    sha256: /\b[a-fA-F0-9]{64}\b/g,
    sha512: /\b[a-fA-F0-9]{128}\b/g,
    
    // Email addresses
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    
    // CVE identifiers - enhanced to capture various formats
    cve: /(?:CVE|cve|vulnerability)[-:\s]*(\d{4})[-:\s]*(\d{4,7})/gi,
    
    // Bitcoin addresses
    bitcoin: /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g,
    
    // GitHub Security Advisory IDs
    ghsa: /\bGHSA-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}\b/gi,
    
    // Common registry keys used in malware
    registry: /\b(HKEY_LOCAL_MACHINE|HKLM|HKEY_CURRENT_USER|HKCU)\\[\\\w*]+\b/g,
    
    // File paths often associated with malware
    filepath: /\b(?:[A-Za-z]:\\(?:[\w\s.-]+\\)*[\w\s.-]+(?:\.[a-zA-Z0-9]+)?|(?:\/[\w\s.-]+)+(?:\.[a-zA-Z0-9]+)?)\b/g,
    
    // MITRE ATT&CK technique IDs
    mitre: /\bT\d{4}(?:\.\d{3})?\b/g
  };

  // Common false positive patterns to exclude
  private excludePatterns = {
    ip: [
      /^0\.0\.0\.0$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^224\./,
      /^255\.255\.255\.255$/
    ],
    domain: [
      /^localhost$/i,
      /^example\.(com|org|net)$/i,
      /^\d+\.\d+\.\d+\.\d+$/,
      /^(www\.)?google\.com$/i,
      /^(www\.)?microsoft\.com$/i
    ]
  };

  /**
   * Extract IOCs from the provided text
   * @param text The text to extract IOCs from
   * @param sourceType Optional source type to help with specialized extraction
   */
  extractIOCs(text: string, sourceType?: string): IOCExtractionResult {
    const iocs: ExtractedIOC[] = [];
    const summary = { totalFound: 0, byType: {} as Record<string, number> };

    // Extract IPv4 addresses
    this.extractPattern(text, this.patterns.ipv4, 'ip', iocs);
    
    // Extract IPv6 addresses
    this.extractPattern(text, this.patterns.ipv6, 'ip', iocs);
    
    // Extract URLs
    this.extractPattern(text, this.patterns.url, 'url', iocs);
    
    // Extract domains (excluding URLs to avoid duplicates)
    const textWithoutUrls = text.replace(this.patterns.url, '');
    this.extractPattern(textWithoutUrls, this.patterns.domain, 'domain', iocs);
    
    // Extract file hashes
    this.extractPattern(text, this.patterns.md5, 'hash', iocs);
    this.extractPattern(text, this.patterns.sha1, 'hash', iocs);
    this.extractPattern(text, this.patterns.sha256, 'hash', iocs);
    this.extractPattern(text, this.patterns.sha512, 'hash', iocs);
    
    // Extract email addresses
    this.extractPattern(text, this.patterns.email, 'email', iocs);
    
    // Extract CVE identifiers directly using the extractPattern method
    this.extractPattern(text, this.patterns.cve, 'hash', iocs);
    
    // Extract GitHub Advisory IDs
    this.extractPattern(text, this.patterns.ghsa, 'hash', iocs);
    
    // Extract MITRE ATT&CK techniques
    this.extractPattern(text, this.patterns.mitre, 'hash', iocs);

    // Remove duplicates and apply filters
    const filteredIOCs = this.filterAndDedupeIOCs(iocs);

    // Calculate summary
    summary.totalFound = filteredIOCs.length;
    filteredIOCs.forEach(ioc => {
      summary.byType[ioc.type] = (summary.byType[ioc.type] || 0) + 1;
    });

    return {
      iocs: filteredIOCs,
      summary
    };
  }

  private extractPattern(
    text: string, 
    pattern: RegExp, 
    type: ExtractedIOC['type'], 
    iocs: ExtractedIOC[]
  ): void {
    const matches = text.match(pattern);
    if (!matches) return;

    matches.forEach(match => {
      const contextStart = Math.max(0, text.indexOf(match) - 50);
      const contextEnd = Math.min(text.length, text.indexOf(match) + match.length + 50);
      const context = text.substring(contextStart, contextEnd).trim();

      iocs.push({
        type,
        value: match.trim(),
        context,
        confidence: this.calculateConfidence(match, type, context)
      });
    });
  }

  private calculateConfidence(value: string, type: string, context: string): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence based on context keywords
    const threatKeywords = [
      'malicious', 'threat', 'malware', 'suspicious', 'attack', 'compromise',
      'phishing', 'ransomware', 'trojan', 'backdoor', 'c2', 'command',
      'control', 'botnet', 'exploit', 'vulnerability', 'breach'
    ];

    const contextLower = context.toLowerCase();
    const keywordMatches = threatKeywords.filter(keyword => 
      contextLower.includes(keyword)
    ).length;

    confidence += keywordMatches * 0.1;

    // Type-specific confidence adjustments
    switch (type) {
      case 'ip':
        // Check if it's likely a real external IP
        if (this.isPrivateIP(value)) {
          confidence -= 0.3;
        }
        break;
      
      case 'url':
        // URLs with suspicious TLDs or keywords
        if (this.isSuspiciousURL(value)) {
          confidence += 0.2;
        }
        break;
      
      case 'hash':
        // File hashes in security contexts are usually high confidence
        confidence += 0.2;
        break;
    }

    return Math.min(1.0, Math.max(0.1, confidence));
  }

  private isPrivateIP(ip: string): boolean {
    return this.excludePatterns.ip.some(pattern => pattern.test(ip));
  }

  private isSuspiciousURL(url: string): boolean {
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.onion'];
    const suspiciousKeywords = ['download', 'payload', 'malware', 'exploit'];
    
    const urlLower = url.toLowerCase();
    return suspiciousTLDs.some(tld => urlLower.includes(tld)) ||
           suspiciousKeywords.some(keyword => urlLower.includes(keyword));
  }

  /**
   * Filter out false positives and deduplicate IOCs
   */
  private filterAndDedupeIOCs(iocs: ExtractedIOC[]): ExtractedIOC[] {
    // Remove duplicates based on type and value
    const seen = new Set<string>();
    const filtered: ExtractedIOC[] = [];

    iocs.forEach(ioc => {
      const key = `${ioc.type}:${ioc.value.toLowerCase()}`;
      
      if (!seen.has(key)) {
        // Apply exclusion filters
        if (this.shouldIncludeIOC(ioc)) {
          seen.add(key);
          filtered.push(ioc);
        }
      }
    });

    // Sort by confidence (highest first)
    return filtered.sort((a, b) => b.confidence - a.confidence);
  }

  private shouldIncludeIOC(ioc: ExtractedIOC): boolean {
    switch (ioc.type) {
      case 'ip':
        return !this.excludePatterns.ip.some(pattern => pattern.test(ioc.value));
      
      case 'domain':
        return !this.excludePatterns.domain.some(pattern => pattern.test(ioc.value)) &&
               !ioc.value.includes('.local') &&
               ioc.value.includes('.');
      
      case 'url':
        return ioc.value.startsWith('http') && ioc.value.length > 10;
      
      case 'hash':
        return ioc.value.length >= 32; // At least MD5 length
      
      case 'email':
        return ioc.value.includes('@') && ioc.value.includes('.');
      
      default:
        return true;
    }
  }

  // Analyze IOC patterns for threat attribution
  analyzeIOCPatterns(iocs: ExtractedIOC[]): {
    threatGroups: string[];
    malwareFamilies: string[];
    tactics: string[];
    confidence: number;
  } {
    const patterns = {
      threatGroups: [] as string[],
      malwareFamilies: [] as string[],
      tactics: [] as string[],
      confidence: 0.5
    };

    // Simple pattern recognition based on IOC characteristics
    const ipCount = iocs.filter(ioc => ioc.type === 'ip').length;
    const urlCount = iocs.filter(ioc => ioc.type === 'url').length;
    const hashCount = iocs.filter(ioc => ioc.type === 'hash').length;

    if (ipCount > 5 && urlCount > 0) {
      patterns.tactics.push('Command and Control');
      patterns.confidence += 0.2;
    }

    if (hashCount > 2) {
      patterns.tactics.push('Malware Distribution');
      patterns.confidence += 0.15;
    }

    if (urlCount > 3) {
      patterns.tactics.push('Phishing');
      patterns.confidence += 0.1;
    }

    return patterns;
  }
}

export const iocExtractor = new IOCExtractor();