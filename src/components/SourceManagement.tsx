import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Settings, Trash2, Globe, Clock, CheckCircle, XCircle, Edit } from 'lucide-react';
import { THREAT_FEEDS, ThreatFeed as IThreatFeed, FeedStatus as IFeedStatus, feedParser } from '@/services/feedParser';
import { cn } from '@/lib/utils';

export function SourceManagement() {
  const [feeds, setFeeds] = useState<IThreatFeed[]>(THREAT_FEEDS);
  const [feedStatuses, setFeedStatuses] = useState<IFeedStatus[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newFeed, setNewFeed] = useState<{ name: string; url: string; category: string; type: 'rss' | 'atom' | 'github' }>({ 
    name: '', 
    url: '', 
    category: '', 
    type: 'rss'
  });

  useEffect(() => {
    refreshStatuses();
  }, []);

  const refreshStatuses = () => {
    setFeedStatuses(feedParser.getFeedStatuses());
  };

  const toggleFeedActive = (index: number) => {
    const updatedFeeds = [...feeds];
    updatedFeeds[index].active = !updatedFeeds[index].active;
    setFeeds(updatedFeeds);
  };

  const removeFeed = (index: number) => {
    const updatedFeeds = feeds.filter((_, i) => i !== index);
    setFeeds(updatedFeeds);
  };

  const addFeed = () => {
    if (!newFeed.name || !newFeed.url) return;
    
    const feed: IThreatFeed = {
      name: newFeed.name,
      url: newFeed.url,
      type: newFeed.type,
      category: newFeed.category || 'Custom',
      active: true
    };
    
    setFeeds([...feeds, feed]);
    setNewFeed({ name: '', url: '', category: '', type: 'rss' });
    setShowAddDialog(false);
  };

  const getStatusIndicator = (feedUrl: string) => {
    const status = feedStatuses.find(s => s.url === feedUrl);
    if (!status) return <Clock className="h-4 w-4 text-muted-foreground" />;
    
    return status.isWorking 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      'Government': 'bg-blue-500/20 text-blue-500',
      'Research': 'bg-purple-500/20 text-purple-500', 
      'News': 'bg-orange-500/20 text-orange-500',
      'Malware': 'bg-red-500/20 text-red-500',
      'Custom': 'bg-gray-500/20 text-gray-500'
    };
    return colors[category as keyof typeof colors] || colors.Custom;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold glow-text">Source Management</h2>
          <p className="text-muted-foreground mt-1">Manage threat intelligence feed sources</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="cyber" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Add New Feed Source</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Feed Name</Label>
                <Input
                  id="name"
                  value={newFeed.name}
                  onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                  placeholder="e.g., Custom Security Blog"
                />
              </div>
              <div>
                <Label htmlFor="url">Feed URL</Label>
                <Input
                  id="url"
                  value={newFeed.url}
                  onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                  placeholder="https://example.com/feed.xml"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newFeed.category}
                  onChange={(e) => setNewFeed({ ...newFeed, category: e.target.value })}
                  placeholder="e.g., Research, News, Government"
                />
              </div>
              <div>
                <Label htmlFor="type">Feed Type</Label>
                <Select value={newFeed.type} onValueChange={(value: 'rss' | 'atom' | 'github') => setNewFeed({ ...newFeed, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rss">RSS</SelectItem>
                    <SelectItem value="atom">Atom</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={addFeed} className="flex-1">Add Feed</Button>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{feeds.length}</div>
                <div className="text-sm text-muted-foreground">Total Sources</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{feeds.filter(f => f.active).length}</div>
                <div className="text-sm text-muted-foreground">Active Sources</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{feedStatuses.filter(s => s.isWorking).length}</div>
                <div className="text-sm text-muted-foreground">Working Feeds</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{feedStatuses.filter(s => !s.isWorking).length}</div>
                <div className="text-sm text-muted-foreground">Failed Feeds</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feed List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feed Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feeds.map((feed, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg glass-card">
                <div className="flex items-center gap-4">
                  {getStatusIndicator(feed.url)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{feed.name}</span>
                      <Badge className={getCategoryBadgeColor(feed.category)}>
                        {feed.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {feed.type.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {feed.url}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={feed.active}
                    onCheckedChange={() => toggleFeedActive(index)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeed(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}