import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Clock, AlertTriangle, Shield, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'threat' | 'ioc' | 'report';
  title: string;
  snippet: string;
  source: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  relevanceScore: number;
}

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    type: 'threat',
    title: 'Lazarus Group APT Campaign Targeting Financial Infrastructure',
    snippet: 'Advanced persistent threat campaign utilizing zero-day exploits to target banking and financial services infrastructure across multiple regions...',
    source: 'CISA Advisories',
    timestamp: '2 hours ago',
    severity: 'critical',
    tags: ['APT', 'Financial', 'Zero-day'],
    relevanceScore: 95
  },
  {
    id: '2',
    type: 'ioc',
    title: 'Malicious IP Address: 192.168.1.100',
    snippet: 'Command and control server identified in recent APT campaign. Associated with data exfiltration and lateral movement activities...',
    source: 'AlienVault OTX',
    timestamp: '4 hours ago',
    severity: 'high',
    tags: ['C2', 'IP', 'Infrastructure'],
    relevanceScore: 87
  },
  {
    id: '3',
    type: 'report',
    title: 'Healthcare Ransomware Campaign Analysis',
    snippet: 'Comprehensive analysis of ransomware campaign specifically targeting healthcare organizations with improved encryption techniques...',
    source: 'GitHub Security',
    timestamp: '6 hours ago',
    severity: 'high',
    tags: ['Ransomware', 'Healthcare', 'Analysis'],
    relevanceScore: 82
  },
  {
    id: '4',
    type: 'ioc',
    title: 'Malicious URL: https://phishing-portal.com/secure',
    snippet: 'Phishing portal designed to harvest credentials from financial institution customers. Active since last week...',
    source: 'Abuse.ch',
    timestamp: '8 hours ago',
    severity: 'medium',
    tags: ['Phishing', 'URL', 'Credentials'],
    relevanceScore: 78
  },
  {
    id: '5',
    type: 'threat',
    title: 'Supply Chain Attack on JavaScript Ecosystem',
    snippet: 'Malicious npm package identified affecting thousands of applications. Package contains code for data exfiltration...',
    source: 'US-CERT',
    timestamp: '12 hours ago',
    severity: 'medium',
    tags: ['Supply Chain', 'npm', 'JavaScript'],
    relevanceScore: 74
  }
];

const quickFilters = [
  { label: 'Critical Threats', value: 'critical', count: 23 },
  { label: 'Last 24h', value: '24h', count: 156 },
  { label: 'APT Campaigns', value: 'apt', count: 34 },
  { label: 'Ransomware', value: 'ransomware', count: 28 },
  { label: 'Supply Chain', value: 'supply-chain', count: 12 }
];

const typeConfig = {
  threat: { 
    icon: AlertTriangle, 
    color: 'bg-destructive/20 text-destructive border-destructive/30',
    label: 'Threat'
  },
  ioc: { 
    icon: Target, 
    color: 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30',
    label: 'IOC'
  },
  report: { 
    icon: Shield, 
    color: 'bg-electric-teal/20 text-electric-teal border-electric-teal/30',
    label: 'Report'
  }
};

const severityConfig = {
  low: { color: 'bg-success-green/20 text-success-green border-success-green/30' },
  medium: { color: 'bg-warning-amber/20 text-warning-amber border-warning-amber/30' },
  high: { color: 'bg-destructive/20 text-destructive border-destructive/30' },
  critical: { color: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30' }
};

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate API search
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Filter results based on search query
    const filteredResults = mockSearchResults.filter(result =>
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    setSearchResults(filteredResults);
    setIsSearching(false);
  };

  const handleQuickFilter = (filterValue: string) => {
    setActiveFilter(filterValue === activeFilter ? null : filterValue);
    setSearchQuery(filterValue === activeFilter ? '' : filterValue);
    if (filterValue !== activeFilter) {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-display font-bold glow-text">Threat Intelligence Search</h2>
        <p className="text-muted-foreground text-lg">
          Search across all threat feeds, IOCs, and security reports
        </p>
      </div>

      {/* Search Bar */}
      <Card className="glass-card p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search threats, IOCs, CVEs, malware families..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-12 h-12 text-lg glass-button"
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            variant="cyber"
            size="lg"
            className="px-8"
          >
            {isSearching ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Quick Filters */}
      <Card className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold">Quick Filters</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {quickFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuickFilter(filter.value)}
              className={cn(
                "transition-all duration-300",
                activeFilter === filter.value && "shadow-glow"
              )}
            >
              {filter.label}
              <Badge variant="secondary" className="ml-2 text-xs">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <Card className="glass-card">
          <div className="p-6 border-b border-border/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold">
                Search Results ({searchResults.length})
              </h3>
              {searchResults.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Search completed in 0.8s
                </div>
              )}
            </div>
          </div>
          
          <div className="divide-y divide-border/20">
            {searchResults.length > 0 ? (
              searchResults.map((result) => {
                const TypeIcon = typeConfig[result.type].icon;
                return (
                  <div key={result.id} className="p-6 hover:bg-card/50 transition-colors cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-2 rounded-lg flex-shrink-0",
                        typeConfig[result.type].color
                      )}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={typeConfig[result.type].color}>
                              {typeConfig[result.type].label}
                            </Badge>
                            <Badge variant="outline" className={severityConfig[result.severity].color}>
                              {result.severity.toUpperCase()}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <TrendingUp className="h-3 w-3" />
                              {result.relevanceScore}% match
                            </div>
                          </div>
                          
                          <h4 className="font-medium text-lg leading-tight hover:text-primary transition-colors">
                            {result.title}
                          </h4>
                          
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {result.snippet}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Source: {result.source}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {result.timestamp}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {result.tags.map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h4 className="font-medium text-lg mb-2">No results found</h4>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or using different keywords
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Suggested searches:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['APT', 'ransomware', 'malware', 'phishing', 'IOC'].map((term) => (
                      <Button
                        key={term}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery(term);
                          handleSearch();
                        }}
                      >
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Search Tips */}
      {!hasSearched && (
        <Card className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4">Search Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-primary">Search by IOC Type:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• IP addresses: <code className="bg-muted/20 px-1 rounded">192.168.1.1</code></li>
                <li>• Domains: <code className="bg-muted/20 px-1 rounded">malicious.com</code></li>
                <li>• File hashes: <code className="bg-muted/20 px-1 rounded">a1b2c3d4...</code></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-primary">Search by Category:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Threat types: <code className="bg-muted/20 px-1 rounded">APT, ransomware</code></li>
                <li>• CVE numbers: <code className="bg-muted/20 px-1 rounded">CVE-2024-1234</code></li>
                <li>• Malware families: <code className="bg-muted/20 px-1 rounded">Emotet, Lazarus</code></li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}