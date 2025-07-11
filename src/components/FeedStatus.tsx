import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { feedParser, FeedStatus as IFeedStatus, THREAT_FEEDS } from '@/services/feedParser';

export function FeedStatus() {
  const [feedStatuses, setFeedStatuses] = useState<IFeedStatus[]>([]);
  const [testing, setTesting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshStatuses();
  }, []);

  const refreshStatuses = () => {
    setFeedStatuses(feedParser.getFeedStatuses());
  };

  const testFeed = async (feedUrl: string) => {
    setTesting(feedUrl);
    try {
      const result = await feedParser.testFeed(feedUrl);
      console.log(`Test result for ${feedUrl}:`, result);
      refreshStatuses();
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setTesting(null);
    }
  };

  const testAllFeeds = async () => {
    setRefreshing(true);
    const activeFeeds = THREAT_FEEDS.filter(f => f.active);
    
    for (const feed of activeFeeds) {
      await testFeed(feed.url);
    }
    
    setRefreshing(false);
  };

  const getStatusIcon = (status: IFeedStatus) => {
    if (status.isWorking) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (status.lastError) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: IFeedStatus) => {
    if (status.isWorking) {
      return <Badge variant="default" className="bg-green-500">Live Data</Badge>;
    } else {
      return <Badge variant="destructive">Mock Data</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Feed Status Monitor</CardTitle>
        <Button 
          onClick={testAllFeeds} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          {refreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Test All Feeds
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {feedStatuses.map((status) => (
            <div key={status.url} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status)}
                <div>
                  <div className="font-medium">{status.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {status.lastSuccess ? (
                      <span>Last success: {new Date(status.lastSuccess).toLocaleString()}</span>
                    ) : (
                      <span>Never succeeded</span>
                    )}
                  </div>
                  {status.lastError && (
                    <div className="text-sm text-red-500 mt-1">
                      Error: {status.lastError}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {getStatusBadge(status)}
                {status.responseTime > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {status.responseTime}ms
                  </Badge>
                )}
                <Button
                  onClick={() => testFeed(status.url)}
                  disabled={testing === status.url}
                  variant="outline"
                  size="sm"
                >
                  {testing === status.url ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="text-sm">
            <div className="font-medium mb-2">Status Legend:</div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Real-time data</span>
              </div>
              <div className="flex items-center space-x-1">
                <XCircle className="h-3 w-3 text-red-500" />
                <span>Using mock data</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                <span>Untested</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}