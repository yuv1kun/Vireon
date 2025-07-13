// RSS/Atom Feed Parser using JavaScript
export interface FeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  content: string;
}

export interface ThreatFeed {
  name: string;
  url: string;
  type: 'rss' | 'atom' | 'github' | 'nvd' | 'alienvault' | 'phishtank' | 'reddit';
  category: string;
  active: boolean;
  apiKey?: string; // For API sources that require authentication
}

// Curated threat intelligence feeds with multiple sources including direct APIs
export const THREAT_FEEDS: ThreatFeed[] = [
  // Existing sources
  {
    name: 'CISA Advisories',
    url: 'https://www.us-cert.gov/ncas/alerts.xml',
    type: 'rss',
    category: 'Government',
    active: true
  },
  {
    name: 'SANS Internet Storm Center',
    url: 'https://isc.sans.edu/rssfeed.xml',
    type: 'rss',
    category: 'Research',
    active: true
  },
  {
    name: 'Malware Traffic Analysis',
    url: 'https://www.malware-traffic-analysis.net/blog-entries.rss',
    type: 'rss',
    category: 'Malware',
    active: true
  },
  {
    name: 'Krebs on Security',
    url: 'https://krebsonsecurity.com/feed/',
    type: 'rss',
    category: 'News',
    active: true
  },
  {
    name: 'CISA Cybersecurity Advisories',
    url: 'https://www.cisa.gov/news-events/cybersecurity-advisories/rss.xml',
    type: 'rss',
    category: 'Government',
    active: true
  },
  {
    name: 'ThreatPost',
    url: 'https://threatpost.com/feed/',
    type: 'rss',
    category: 'News',
    active: true
  },
  {
    name: 'Recorded Future',
    url: 'https://www.recordedfuture.com/feed/',
    type: 'rss',
    category: 'Research',
    active: true
  },

  // New Government & CERT Sources
  {
    name: 'US-CERT Bulletins',
    url: 'https://www.cisa.gov/uscert/ncas/bulletins.xml',
    type: 'rss',
    category: 'Government',
    active: true
  },
  {
    name: 'ENISA Threat Landscape',
    url: 'https://www.enisa.europa.eu/topics/threat-risk-management/threats-and-trends/rss',
    type: 'rss',
    category: 'Government',
    active: true
  },
  {
    name: 'Australian Cyber Security Centre',
    url: 'https://www.cyber.gov.au/acsc/view-all-content/alert/rss',
    type: 'rss',
    category: 'Government',
    active: true
  },
  {
    name: 'UK NCSC Advisories',
    url: 'https://www.ncsc.gov.uk/api/1/services/feed.rss',
    type: 'rss',
    category: 'Government',
    active: true
  },

  // Security Vendors & Research Organizations
  {
    name: 'Microsoft Security Response Center',
    url: 'https://msrc.microsoft.com/blog/feed',
    type: 'rss',
    category: 'Vendor',
    active: true
  },
  {
    name: 'Mandiant Threat Intelligence',
    url: 'https://www.mandiant.com/resources/blog/rss.xml',
    type: 'rss',
    category: 'Vendor',
    active: true
  },
  {
    name: 'Kaspersky Securelist',
    url: 'https://securelist.com/feed/',
    type: 'rss',
    category: 'Vendor',
    active: true
  },
  {
    name: 'Symantec Threat Intelligence',
    url: 'https://symantec-enterprise-blogs.security.com/blogs/threat-intelligence/rss',
    type: 'rss',
    category: 'Vendor',
    active: true
  },
  {
    name: 'Palo Alto Unit 42',
    url: 'https://unit42.paloaltonetworks.com/feed/',
    type: 'rss',
    category: 'Vendor',
    active: true
  },
  {
    name: 'Cisco Talos Intelligence',
    url: 'https://blog.talosintelligence.com/rss',
    type: 'rss',
    category: 'Vendor',
    active: true
  },
  {
    name: 'VirusTotal Blog',
    url: 'https://blog.virustotal.com/feeds/posts/default',
    type: 'rss',
    category: 'Vendor',
    active: true
  },
  {
    name: 'MITRE ATT&CK Updates',
    url: 'https://medium.com/feed/mitre-attack',
    type: 'rss',
    category: 'Research',
    active: true
  },

  // Specialized Security Blogs
  {
    name: 'Schneier on Security',
    url: 'https://www.schneier.com/feed/atom/',
    type: 'atom',
    category: 'Blog',
    active: true
  },
  {
    name: 'The Hacker News',
    url: 'https://feeds.feedburner.com/TheHackersNews',
    type: 'rss',
    category: 'News',
    active: true
  },
  {
    name: 'Dark Reading',
    url: 'https://www.darkreading.com/rss',
    type: 'rss',
    category: 'News',
    active: true
  },
  {
    name: 'Bleeping Computer',
    url: 'https://www.bleepingcomputer.com/feed/',
    type: 'rss',
    category: 'News',
    active: true
  },
  {
    name: 'Zero Day Initiative',
    url: 'https://www.zerodayinitiative.com/blog?format=rss',
    type: 'rss',
    category: 'Research',
    active: true
  },
  {
    name: 'Troy Hunt\'s Blog',
    url: 'https://feeds.feedburner.com/TroyHunt',
    type: 'rss',
    category: 'Blog',
    active: true
  },

  // Vulnerability & Exploit Databases
  {
    name: 'Exploit Database',
    url: 'https://www.exploit-db.com/rss.xml',
    type: 'rss',
    category: 'Vulnerability',
    active: true
  },
  {
    name: 'Full Disclosure Mailing List',
    url: 'https://seclists.org/rss/fulldisclosure.rss',
    type: 'rss',
    category: 'Vulnerability',
    active: true
  },

  // API-based sources (these will be handled specially)
  {
    name: 'GitHub Security Advisories',
    url: 'https://api.github.com/advisories',
    type: 'github',
    category: 'Vulnerability',
    active: true
  },
  {
    name: 'NIST NVD Data Feeds',
    url: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
    type: 'nvd',
    category: 'Government',
    active: true
  },
  {
    name: 'AlienVault OTX',
    url: 'https://otx.alienvault.com/api/v1/pulses/subscribed',
    type: 'alienvault',
    category: 'Research',
    active: true,
    apiKey: '' // Add your API key here
  },
  {
    name: 'PhishTank',
    url: 'https://data.phishtank.com/data/online-valid.json',
    type: 'phishtank',
    category: 'Phishing',
    active: true
  },
  {
    name: 'Reddit r/netsec',
    url: 'https://www.reddit.com/r/netsec/.json',
    type: 'reddit',
    category: 'Social',
    active: true
  }
];

// CORS proxy fallback options
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://thingproxy.freeboard.io/fetch/',
  'https://api.rss2json.com/v1/api.json?rss_url=',
  'https://api.rss2json.com/v1/api.json?rss_url=',
  'https://api.npoint.io/proxy?url='
];

// Environment-specific CORS proxy (can be set in .env)
const ENV_CORS_PROXY = import.meta.env.VITE_CORS_PROXY || '';

export interface FeedStatus {
  url: string;
  name: string;
  lastSuccess: string | null;
  lastError: string | null;
  isWorking: boolean;
  responseTime: number;
}

class FeedParser {
  private parser: DOMParser;
  private feedStatuses: Map<string, FeedStatus> = new Map();
  private proxyIndex = 0;

  constructor() {
    this.parser = new DOMParser();
    this.initializeFeedStatuses();
  }

  private initializeFeedStatuses(): void {
    THREAT_FEEDS.forEach(feed => {
      this.feedStatuses.set(feed.url, {
        url: feed.url,
        name: feed.name,
        lastSuccess: null,
        lastError: null,
        isWorking: false,
        responseTime: 0
      });
    });
    
    // Log the initialized feeds for debugging
    console.log(`Initialized ${THREAT_FEEDS.length} feeds: ${THREAT_FEEDS.map(f => f.name).join(', ')}`);
    console.log(`RSS/Atom feeds: ${THREAT_FEEDS.filter(f => f.type === 'rss' || f.type === 'atom').length}`);
    console.log(`API-based feeds: ${THREAT_FEEDS.filter(f => !['rss', 'atom'].includes(f.type)).length}`);
  }

  // Fetch GitHub Security Advisories
  async fetchGitHubAdvisories(feed: ThreatFeed): Promise<FeedItem[]> {
    const startTime = Date.now();
    const status = this.feedStatuses.get(feed.url);
    
    try {
      console.log(`Fetching GitHub Security Advisories from ${feed.url}`);
      
      // GitHub API requires User-Agent
      const response = await fetch('https://api.github.com/advisories', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Vireon-ThreatIntel-App/1.0'
          // If you have a GitHub token, add it here for higher rate limits
          // 'Authorization': `token ${feed.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      const advisories = await response.json();
      
      // Transform to FeedItem format
      const feedItems = advisories.map((advisory: any) => ({
        id: advisory.ghsa_id || `github-${Date.now()}-${Math.random()}`,
        title: advisory.summary || 'GitHub Security Advisory',
        description: advisory.description || '',
        link: advisory.html_url || `https://github.com/advisories/${advisory.ghsa_id}`,
        pubDate: this.formatDate(advisory.published_at || new Date().toISOString()),
        source: 'GitHub Security Advisories',
        content: `${advisory.description || ''}

Severity: ${advisory.severity || 'Not specified'}
Affected packages: ${(advisory.affected?.length ? advisory.affected.map((pkg: any) => pkg.package?.name).join(', ') : 'Not specified')}
CVE IDs: ${advisory.cve_id || 'Not assigned'}
References: ${advisory.references?.join('\n') || 'None provided'}`
      }));
      
      // Update success status
      if (status) {
        status.lastSuccess = new Date().toISOString();
        status.lastError = null;
        status.isWorking = true;
        status.responseTime = Date.now() - startTime;
      }
      
      return feedItems;
    } catch (error) {
      console.error(`Error fetching GitHub advisories:`, error);
      
      // Update error status
      if (status) {
        status.lastError = error instanceof Error ? error.message : 'Unknown error';
        status.isWorking = false;
        status.responseTime = Date.now() - startTime;
      }
      
      return this.getMockFeedData(feed.url);
    }
  }
  
  // Fetch NIST NVD Data Feed
  async fetchNistNvd(feed: ThreatFeed): Promise<FeedItem[]> {
    const startTime = Date.now();
    const status = this.feedStatuses.get(feed.url);
    
    try {
      console.log(`Fetching NIST NVD data from ${feed.url}`);
      
      // Get recent vulnerabilities from NVD API
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const apiUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${twoWeeksAgo}T00:00:00.000&resultsPerPage=20`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Vireon-ThreatIntel-App/1.0'
          // If you have an API key, add it here
          // 'apiKey': feed.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`NIST NVD API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform to FeedItem format
      const feedItems = data.vulnerabilities?.map((vuln: any) => {
        const cve = vuln.cve;
        return {
          id: cve.id || `nvd-${Date.now()}-${Math.random()}`,
          title: `${cve.id}: ${cve.descriptions?.find((d: any) => d.lang === 'en')?.value || 'No description available'}`,
          description: cve.descriptions?.find((d: any) => d.lang === 'en')?.value || 'No description available',
          link: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
          pubDate: this.formatDate(cve.published || new Date().toISOString()),
          source: 'NIST NVD',
          content: `
# ${cve.id}

## Description
${cve.descriptions?.find((d: any) => d.lang === 'en')?.value || 'No description available'}

## Severity
${cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseSeverity || 'Not specified'}
CVSS Score: ${cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 'Not specified'}

## Affected Products
${cve.configurations?.[0]?.nodes?.map((node: any) => 
  node.cpeMatch?.map((cpe: any) => cpe.criteria).join('\n')
).join('\n') || 'Not specified'}

## References
${cve.references?.map((ref: any) => `- ${ref.url}`).join('\n') || 'None provided'}`
        };
      }) || [];
      
      // Update success status
      if (status) {
        status.lastSuccess = new Date().toISOString();
        status.lastError = null;
        status.isWorking = true;
        status.responseTime = Date.now() - startTime;
      }
      
      return feedItems;
    } catch (error) {
      console.error(`Error fetching NIST NVD data:`, error);
      
      // Update error status
      if (status) {
        status.lastError = error instanceof Error ? error.message : 'Unknown error';
        status.isWorking = false;
        status.responseTime = Date.now() - startTime;
      }
      
      return this.getMockFeedData(feed.url);
    }
  }
  
  // Fetch AlienVault OTX data
  async fetchAlienVaultOTX(feed: ThreatFeed): Promise<FeedItem[]> {
    const startTime = Date.now();
    const status = this.feedStatuses.get(feed.url);
    
    try {
      console.log(`Fetching AlienVault OTX data from ${feed.url}`);
      
      // AlienVault OTX requires an API key
      if (!feed.apiKey) {
        console.warn('AlienVault OTX API key not provided, using mock data');
        throw new Error('API key required for AlienVault OTX');
      }
      
      const response = await fetch('https://otx.alienvault.com/api/v1/pulses/subscribed', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Vireon-ThreatIntel-App/1.0',
          'X-OTX-API-KEY': feed.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`AlienVault OTX API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform to FeedItem format
      const feedItems = data.results?.map((pulse: any) => ({
        id: pulse.id || `otx-${Date.now()}-${Math.random()}`,
        title: pulse.name || 'AlienVault OTX Pulse',
        description: pulse.description || '',
        link: `https://otx.alienvault.com/pulse/${pulse.id}`,
        pubDate: this.formatDate(pulse.created || new Date().toISOString()),
        source: 'AlienVault OTX',
        content: `
# ${pulse.name || 'AlienVault OTX Pulse'}

## Description
${pulse.description || 'No description available'}

## TLP
${pulse.tlp || 'Not specified'}

## Tags
${pulse.tags?.join(', ') || 'None'}

## Indicators
${pulse.indicators?.map((ioc: any) => `- ${ioc.type}: ${ioc.indicator}`).join('\n') || 'None provided'}

## Author
${pulse.author?.username || 'Unknown'}`
      })) || [];
      
      // Update success status
      if (status) {
        status.lastSuccess = new Date().toISOString();
        status.lastError = null;
        status.isWorking = true;
        status.responseTime = Date.now() - startTime;
      }
      
      return feedItems;
    } catch (error) {
      console.error(`Error fetching AlienVault OTX data:`, error);
      
      // Update error status
      if (status) {
        status.lastError = error instanceof Error ? error.message : 'Unknown error';
        status.isWorking = false;
        status.responseTime = Date.now() - startTime;
      }
      
      return this.getMockFeedData(feed.url);
    }
  }
  
  // Fetch PhishTank data
  async fetchPhishTank(feed: ThreatFeed): Promise<FeedItem[]> {
    const startTime = Date.now();
    const status = this.feedStatuses.get(feed.url);
    
    try {
      console.log(`Fetching PhishTank data from ${feed.url}`);
      
      // PhishTank offers data in multiple formats, we'll use JSON
      const apiUrl = 'https://data.phishtank.com/data/online-valid.json';
      
      // If API key is provided, use it (app_key parameter for PhishTank)
      const urlWithKey = feed.apiKey ? `${apiUrl}?app_key=${feed.apiKey}` : apiUrl;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      const response = await fetch(urlWithKey, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Vireon-ThreatIntel-App/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`PhishTank API error: ${response.status} ${response.statusText}`);
      }
      
      const phishingData = await response.json();
      
      // Transform to FeedItem format - limit to 20 most recent items
      const recentEntries = phishingData
        .sort((a: any, b: any) => new Date(b.submission_time).getTime() - new Date(a.submission_time).getTime())
        .slice(0, 20);
        
      const feedItems = recentEntries.map((entry: any) => ({
        id: entry.phish_id || `phishtank-${Date.now()}-${Math.random()}`,
        title: `Phishing: ${new URL(entry.url).hostname}`,
        description: `Verified phishing site targeting ${entry.target || 'unknown services'}`,
        link: `https://phishtank.com/phish_detail.php?phish_id=${entry.phish_id}`,
        pubDate: this.formatDate(entry.verification_time || new Date().toISOString()),
        source: 'PhishTank',
        content: `
# Phishing Site Details

## URL
${entry.url}

## Target
${entry.target || 'Unknown'}

## Verified
${entry.verified === 'yes' ? 'Yes' : 'No'}

## Verification Time
${entry.verification_time || 'Unknown'}

## Submitted By
${entry.submitted_by || 'Unknown'}`
      }));
      
      // Update success status
      if (status) {
        status.lastSuccess = new Date().toISOString();
        status.lastError = null;
        status.isWorking = true;
        status.responseTime = Date.now() - startTime;
      }
      
      return feedItems;
    } catch (error) {
      console.error(`Error fetching PhishTank data:`, error);
      
      // Update error status
      if (status) {
        status.lastError = error instanceof Error ? error.message : 'Unknown error';
        status.isWorking = false;
        status.responseTime = Date.now() - startTime;
      }
      
      return this.getMockFeedData(feed.url);
    }
  }
  
  // Fetch Reddit Security data
  async fetchRedditSecurity(feed: ThreatFeed): Promise<FeedItem[]> {
    const startTime = Date.now();
    const status = this.feedStatuses.get(feed.url);
    
    try {
      console.log(`Fetching Reddit security data from ${feed.url}`);
      
      // Reddit provides JSON API directly
      const subreddit = feed.url.includes('r/netsec') ? 'netsec' : 'cybersecurity';
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=15`, {
        headers: {
          'User-Agent': 'Vireon-ThreatIntel-App/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform to FeedItem format
      const feedItems = data.data?.children?.map((post: any) => {
        const postData = post.data;
        return {
          id: postData.id || `reddit-${Date.now()}-${Math.random()}`,
          title: postData.title || 'Reddit Security Post',
          description: postData.selftext?.substring(0, 200) || 'Visit link for details',
          link: `https://www.reddit.com${postData.permalink}`,
          pubDate: this.formatDate(new Date(postData.created_utc * 1000).toISOString()),
          source: `Reddit r/${subreddit}`,
          content: `
# ${postData.title || 'Reddit Security Post'}

${postData.selftext || 'No text content available. Visit the link for details.'}

## Posted by
u/${postData.author}

## Score
${postData.score} points

## Comments
${postData.num_comments} comments`
        };
      }) || [];
      
      // Update success status
      if (status) {
        status.lastSuccess = new Date().toISOString();
        status.lastError = null;
        status.isWorking = true;
        status.responseTime = Date.now() - startTime;
      }
      
      return feedItems;
    } catch (error) {
      console.error(`Error fetching Reddit security data:`, error);
      
      // Update error status
      if (status) {
        status.lastError = error instanceof Error ? error.message : 'Unknown error';
        status.isWorking = false;
        status.responseTime = Date.now() - startTime;
      }
      
      return this.getMockFeedData(feed.url);
    }
  }

  async fetchFeed(feedUrl: string): Promise<FeedItem[]> {
    const startTime = Date.now();
    const status = this.feedStatuses.get(feedUrl);
    
    // First try environment-specific CORS proxy if available
    if (ENV_CORS_PROXY) {
      try {
        console.log(`Trying environment-configured proxy for ${feedUrl}`);
        const proxyUrl = `${ENV_CORS_PROXY}${encodeURIComponent(feedUrl)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
        
        const response = await fetch(proxyUrl, {
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml, application/json',
            'User-Agent': 'ThreatIntel-Bot/1.0'
          },
          signal: controller.signal,
          cache: 'no-store' // Prevent caching issues
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseText = await response.text();
        let xmlText = responseText;
        
        // Check if response is JSON (for RSS-to-JSON services)
        if (responseText.trim().startsWith('{')) {
          try {
            const jsonResponse = JSON.parse(responseText);
            
            // Handle RSS2JSON API format
            if (jsonResponse.items && jsonResponse.feed) {
              // Convert to RSS-like format for our parser
              const convertedItems = jsonResponse.items.map(item => ({
                id: item.guid || item.link,
                title: item.title,
                description: item.description,
                link: item.link,
                pubDate: item.pubDate,
                source: jsonResponse.feed.title,
                content: item.content
              }));
              
              // Update success status
              if (status) {
                status.lastSuccess = new Date().toISOString();
                status.lastError = null;
                status.isWorking = true;
                status.responseTime = Date.now() - startTime;
              }
              
              return convertedItems;
            }
          } catch (jsonError) {
            console.warn('Failed to parse JSON response:', jsonError);
            // Continue with XML parsing attempt
          }
        }
        
        // Validate that we got XML content
        if (!xmlText.trim().startsWith('<?xml') && !xmlText.includes('<rss') && !xmlText.includes('<feed')) {
          throw new Error('Invalid XML content received');
        }

        const items = this.parseXML(xmlText, feedUrl);
        
        // Update success status
        if (status) {
          status.lastSuccess = new Date().toISOString();
          status.lastError = null;
          status.isWorking = true;
          status.responseTime = Date.now() - startTime;
        }
        
        return items;
      } catch (error) {
        console.warn(`Environment proxy failed for ${feedUrl}:`, error);
        // Continue to fallback proxies
      }
    }
    
    // Try multiple proxy options
    for (let attempt = 0; attempt < CORS_PROXIES.length; attempt++) {
      try {
        const proxyUrl = `${CORS_PROXIES[this.proxyIndex]}${encodeURIComponent(feedUrl)}`;
        console.log(`Attempting to fetch ${feedUrl} via proxy ${this.proxyIndex + 1}/${CORS_PROXIES.length}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
        
        const response = await fetch(proxyUrl, {
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml, application/json',
            'User-Agent': 'ThreatIntel-Bot/1.0'
          },
          signal: controller.signal,
          cache: 'no-store' // Prevent caching issues
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseText = await response.text();
        let xmlText = responseText;
        
        // Check if response is JSON (for RSS-to-JSON services)
        if (responseText.trim().startsWith('{')) {
          try {
            const jsonResponse = JSON.parse(responseText);
            
            // Handle RSS2JSON API format
            if (jsonResponse.items && jsonResponse.feed) {
              // Convert to our FeedItem format
              const convertedItems = jsonResponse.items.map(item => ({
                id: item.guid || item.link,
                title: item.title,
                description: item.description,
                link: item.link,
                pubDate: item.pubDate,
                source: jsonResponse.feed.title,
                content: item.content
              }));
              
              // Update success status
              if (status) {
                status.lastSuccess = new Date().toISOString();
                status.lastError = null;
                status.isWorking = true;
                status.responseTime = Date.now() - startTime;
              }
              
              // Advance proxy index for next request (round-robin)
              this.proxyIndex = (this.proxyIndex + 1) % CORS_PROXIES.length;
              
              return convertedItems;
            }
          } catch (jsonError) {
            console.warn('Failed to parse JSON response:', jsonError);
            // Continue with XML parsing attempt
          }
        }
        
        // Validate that we got XML content
        if (!xmlText.trim().startsWith('<?xml') && !xmlText.includes('<rss') && !xmlText.includes('<feed')) {
          throw new Error('Invalid XML content received');
        }

        const items = this.parseXML(xmlText, feedUrl);
        
        // Update success status
        if (status) {
          status.lastSuccess = new Date().toISOString();
          status.lastError = null;
          status.isWorking = true;
          status.responseTime = Date.now() - startTime;
        }
        
        // Advance proxy index for next request (round-robin)
        this.proxyIndex = (this.proxyIndex + 1) % CORS_PROXIES.length;
        
        return items;
      } catch (error) {
        console.warn(`Proxy ${this.proxyIndex + 1} failed:`, error);
        
        // Update error status
        if (status) {
          status.lastError = error instanceof Error ? error.message : 'Unknown error';
          status.isWorking = false;
        }
        
        // Try next proxy
        this.proxyIndex = (this.proxyIndex + 1) % CORS_PROXIES.length;
      }
    }
    
    // If all proxies fail, return mock data for testing
    console.log(`All proxies failed for ${feedUrl}, falling back to mock data`);
    
    // Update status
    if (status) {
      status.lastError = 'All proxies failed';
      status.isWorking = false;
      status.responseTime = Date.now() - startTime;
    }
    
    return this.getMockFeedData(feedUrl);
  }

  private parseXML(xmlText: string, sourceUrl: string): FeedItem[] {
    try {
      const doc = this.parser.parseFromString(xmlText, 'text/xml');
      
      // Check for RSS format
      const rssItems = doc.querySelectorAll('item');
      if (rssItems.length > 0) {
        return this.parseRSSItems(rssItems, sourceUrl);
      }

      // Check for Atom format
      const atomEntries = doc.querySelectorAll('entry');
      if (atomEntries.length > 0) {
        return this.parseAtomEntries(atomEntries, sourceUrl);
      }

      throw new Error('Unknown feed format');
    } catch (error) {
      console.error('Error parsing XML:', error);
      return this.getMockFeedData(sourceUrl);
    }
  }

  private parseRSSItems(items: NodeListOf<Element>, sourceUrl: string): FeedItem[] {
    const feedItems: FeedItem[] = [];
    
    items.forEach((item, index) => {
      const title = this.getTextContent(item, 'title') || 'Untitled';
      const description = this.getTextContent(item, 'description') || '';
      const link = this.getTextContent(item, 'link') || sourceUrl;
      const pubDate = this.getTextContent(item, 'pubDate') || new Date().toISOString();
      const content = this.getTextContent(item, 'content:encoded') || description;

      feedItems.push({
        id: `${sourceUrl}-${index}-${Date.now()}`,
        title,
        description,
        link,
        pubDate: this.formatDate(pubDate),
        source: this.getSourceName(sourceUrl),
        content
      });
    });

    return feedItems;
  }

  private parseAtomEntries(entries: NodeListOf<Element>, sourceUrl: string): FeedItem[] {
    const feedItems: FeedItem[] = [];
    
    entries.forEach((entry, index) => {
      const title = this.getTextContent(entry, 'title') || 'Untitled';
      const summary = this.getTextContent(entry, 'summary') || '';
      const linkEl = entry.querySelector('link');
      const link = linkEl?.getAttribute('href') || sourceUrl;
      const updated = this.getTextContent(entry, 'updated') || new Date().toISOString();
      const content = this.getTextContent(entry, 'content') || summary;

      feedItems.push({
        id: `${sourceUrl}-${index}-${Date.now()}`,
        title,
        description: summary,
        link,
        pubDate: this.formatDate(updated),
        source: this.getSourceName(sourceUrl),
        content
      });
    });

    return feedItems;
  }

  private getTextContent(element: Element, selector: string): string {
    // Handle namespaced selectors like content:encoded
    const escapedSelector = selector.includes(':') ? selector.replace(':', '\\:') : selector;
    const node = element.querySelector(escapedSelector);
    return node ? node.textContent?.trim() || '' : '';
  }

  private getSourceName(url: string): string {
    const feed = THREAT_FEEDS.find(f => f.url === url);
    return feed?.name || new URL(url).hostname;
  }

  private formatDate(dateString: string): string {
    try {
      return new Date(dateString).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  private getMockFeedData(sourceUrl: string): FeedItem[] {
    const sourceName = this.getSourceName(sourceUrl);
    
    // More realistic mock data based on actual threat intelligence patterns
    const mockTemplates = [
      {
        title: 'CRITICAL: APT29 Targeting Government Networks with New PowerShell Framework',
        description: 'Russian state-sponsored group APT29 (Cozy Bear) has been observed using a novel PowerShell-based persistence framework targeting government and diplomatic entities.',
        content: 'Security researchers have identified a sophisticated campaign by APT29 utilizing a previously unknown PowerShell framework for persistence and lateral movement. The campaign targets government networks and diplomatic missions. IOCs include: C2 server at 45.129.96.147, malicious PowerShell script hash 8f14e45fceea167a5a36dedd4bea2543, and compromised domain gov-secure[.]tk. The framework uses WMI for persistence and leverages legitimate Microsoft tools for living-off-the-land attacks.'
      },
      {
        title: 'BlackCat Ransomware Evolves with Rust-Based Encryptor and Data Theft',
        description: 'The BlackCat (ALPHV) ransomware group has updated their toolkit with a new Rust-based encryptor and enhanced data exfiltration capabilities.',
        content: 'BlackCat ransomware operators have deployed an updated version of their Rust-based ransomware with improved encryption speed and new data theft mechanisms. The malware communicates with C2 infrastructure at 185.220.101.182 and exfiltrates data to backup-service[.]onion. Key indicators include: ransomware binary hash d41d8cd98f00b204e9800998ecf8427e, PowerShell loader hash a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6, and TOR communication nodes.'
      },
      {
        title: 'Supply Chain Attack: NPM Package Typosquatting Campaign Discovered',
        description: 'Malicious NPM packages mimicking popular libraries have been discovered stealing developer credentials and injecting backdoors into applications.',
        content: 'Security researchers have uncovered a sophisticated supply chain attack targeting JavaScript developers through typosquatted NPM packages. The malicious packages steal credentials and inject backdoors into build processes. Command and control is maintained through compromised-repo[.]github[.]io and data is exfiltrated to steal-data[.]herokuapp[.]com. Affected package hashes include: fake-react hash b2d3f4g5h6i7j8k9l0m1n2o3p4q5r6s7, malicious-lodash hash c3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8.'
      },
      {
        title: 'CVE-2024-XXXX: Critical RCE Vulnerability in Popular Web Framework',
        description: 'A critical remote code execution vulnerability has been discovered in a widely-used web application framework, affecting millions of installations.',
        content: 'Security researchers have disclosed a critical vulnerability (CVE-2024-XXXX) allowing remote code execution in a popular web framework. The vulnerability affects versions prior to the latest security patch. Exploitation attempts have been observed from IPs including 94.102.49.190 and 103.224.182.245. Malicious payloads are being delivered via compromised sites including exploit-kit[.]malware[.]com. Proof-of-concept exploit hash: e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0.'
      },
      {
        title: 'Phishing Campaign Targets Healthcare Workers with Fake COVID-19 Updates',
        description: 'A large-scale phishing campaign is targeting healthcare organizations with fraudulent COVID-19 policy updates to steal credentials.',
        content: 'Cybercriminals are conducting a targeted phishing campaign against healthcare workers using fake COVID-19 policy update emails. The campaign uses legitimate-looking domains such as health-updates[.]org and covid-policy[.]net to harvest credentials. Phishing infrastructure includes mail servers at 167.172.89.15 and 159.89.214.73. Malicious attachments contain trojans with hashes f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2 and credential harvesting scripts.'
      }
    ];

    // Generate 2-3 random items from templates
    const selectedTemplates = mockTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 2) + 2);

    return selectedTemplates.map((template, index) => ({
      id: `mock-${Date.now()}-${index}`,
      title: `${template.title} - ${sourceName}`,
      description: template.description,
      link: `https://example.com/threat-${Date.now()}-${index}`,
      pubDate: new Date(Date.now() - (Math.random() * 4 * 60 * 60 * 1000)).toISOString(), // Random time in last 4 hours
      source: sourceName,
      content: template.content
    }));
  }

  /**
   * Fetch feeds from specific source names
   * @param sourceNames Array of source names to fetch
   * @returns Array of feed items from the specified sources
   */
  async fetchFeedsFromSources(sourceNames: string[]): Promise<FeedItem[]> {
    console.log(`Fetching feeds from specified sources: ${sourceNames.join(', ')}`);
    
    // Filter feeds to only those in the sourceNames list
    const filteredFeeds = THREAT_FEEDS.filter(feed => 
      feed.active && sourceNames.includes(feed.name)
    );
    
    if (filteredFeeds.length === 0) {
      console.warn('No matching active feeds found for specified sources');
      return [];
    }
    
    console.log(`Found ${filteredFeeds.length} matching feeds, fetching...`);
    
    // Use the same fetching logic as fetchAllFeeds
    const allItems: FeedItem[] = [];
    // Handle each feed based on its type
    const fetchPromises = filteredFeeds.map(feed => {
      if (feed.type === 'rss' || feed.type === 'atom') {
        return this.fetchFeed(feed.url);
      } else if (feed.type === 'github') {
        return this.fetchGitHubAdvisories(feed);
      } else if (feed.type === 'nvd') {
        return this.fetchNistNvd(feed);
      } else if (feed.type === 'alienvault') {
        return this.fetchAlienVaultOTX(feed);
      } else if (feed.type === 'phishtank') {
        return this.fetchPhishTank(feed);
      } else if (feed.type === 'reddit') {
        return this.fetchRedditSecurity(feed);
      } else {
        // Default to RSS for unknown types
        return this.fetchFeed(feed.url);
      }
    });
    
    try {
      const results = await Promise.allSettled(fetchPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allItems.push(...result.value);
        } else {
          console.error(`Error fetching feed ${filteredFeeds[index].name}:`, result.reason);
          // Use mock data on error
          const mockData = this.getMockFeedData(filteredFeeds[index].url);
          allItems.push(...mockData);
        }
      });
      
      return allItems;
    } catch (error) {
      console.error('Error fetching filtered feeds:', error);
      return [];
    }
  }

  /**
   * Main fetch method to get all feed items from all active feeds
   */
  async fetchAllFeeds(): Promise<FeedItem[]> {
    const activeFeeds = THREAT_FEEDS.filter(feed => feed.active);
    console.log(`Fetching ${activeFeeds.length} active threat intelligence feeds...`);
    
    // Map each feed to its appropriate fetch method based on type
    const feedPromises = activeFeeds.map(feed => {
      // For API-based sources, use specialized fetchers
      switch(feed.type) {
        case 'github':
          return this.fetchGitHubAdvisories(feed);
        case 'nvd':
          return this.fetchNistNvd(feed);
        case 'alienvault':
          return this.fetchAlienVaultOTX(feed);
        case 'phishtank':
          return this.fetchPhishTank(feed);
        case 'reddit':
          return this.fetchRedditSecurity(feed);
        default:
          // For RSS/Atom feeds, use the standard fetch method
          return this.fetchFeed(feed.url);
      }
    });
    
    try {
      const results = await Promise.allSettled(feedPromises);
      const allItems: FeedItem[] = [];
      let successCount = 0;
      let mockCount = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const items = result.value;
          allItems.push(...items);
          
          // Check if this is real data or mock data
          if (items.length > 0 && items[0].id.startsWith('mock-')) {
            mockCount++;
          } else {
            successCount++;
          }
        } else {
          console.error(`Feed ${activeFeeds[index].name} failed:`, result.reason);
        }
      });

      console.log(`Feed fetch complete: ${successCount} real feeds, ${mockCount} mock feeds, ${allItems.length} total items`);

      // Sort by date (newest first)
      return allItems.sort((a, b) => 
        new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      );
    } catch (error) {
      console.error('Error fetching feeds:', error);
      return [];
    }
  }

  // Get feed status information
  getFeedStatuses(): FeedStatus[] {
    return Array.from(this.feedStatuses.values());
  }

  // Test a specific feed manually
  async testFeed(feedUrl: string): Promise<{ success: boolean; items: number; error?: string }> {
    try {
      const items = await this.fetchFeed(feedUrl);
      const isReal = items.length === 0 || !items[0].id.startsWith('mock-');
      return {
        success: isReal,
        items: items.length,
        error: isReal ? undefined : 'Returned mock data - real feed may be unavailable'
      };
    } catch (error) {
      return {
        success: false,
        items: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const feedParser = new FeedParser();