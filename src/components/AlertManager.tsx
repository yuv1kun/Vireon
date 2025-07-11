import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell, BellOff, Volume2, VolumeX, Download, Trash2, Filter, AlertTriangle, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { simulateNewThreat } from '@/utils/testAlerts';

export interface AlertLog {
  id: string;
  timestamp: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  source: string;
  description: string;
  acknowledged: boolean;
}

interface AlertManagerProps {
  onNewThreat?: (threatData: any) => void;
}

const severityConfig = {
  low: { 
    color: 'bg-success-green/20 text-success-green border-success-green/30', 
    icon: Shield,
    soundFile: 'low-alert.mp3'
  },
  medium: { 
    color: 'bg-warning-amber/20 text-warning-amber border-warning-amber/30', 
    icon: AlertTriangle,
    soundFile: 'medium-alert.mp3'
  },
  high: { 
    color: 'bg-destructive/20 text-destructive border-destructive/30', 
    icon: AlertTriangle,
    soundFile: 'high-alert.mp3'
  },
  critical: { 
    color: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30', 
    icon: AlertTriangle,
    soundFile: 'critical-alert.mp3'
  }
};

export function AlertManager({ onNewThreat }: AlertManagerProps) {
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    const saved = localStorage.getItem('vireon-alerts-enabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('vireon-sound-enabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Load alerts from localStorage on mount
  useEffect(() => {
    const savedAlerts = localStorage.getItem('vireon-alert-logs');
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts));
      } catch (error) {
        console.error('Error loading alert logs:', error);
      }
    }
  }, []);

  // Save alerts to localStorage whenever alerts change
  useEffect(() => {
    localStorage.setItem('vireon-alert-logs', JSON.stringify(alerts));
  }, [alerts]);

  // Save settings
  useEffect(() => {
    localStorage.setItem('vireon-alerts-enabled', JSON.stringify(alertsEnabled));
  }, [alertsEnabled]);

  useEffect(() => {
    localStorage.setItem('vireon-sound-enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // Create audio context for alert sounds
  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Function to add new alert
  const addAlert = (threatData: any) => {
    if (!alertsEnabled) return;

    const newAlert: AlertLog = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      title: threatData.title,
      severity: threatData.severity || 'medium',
      category: threatData.category || 'Unknown',
      source: threatData.source || 'Unknown',
      description: threatData.description,
      acknowledged: false
    };

    setAlerts(prev => [newAlert, ...prev.slice(0, 999)]); // Keep last 1000 alerts

    // Play sound alert
    if (soundEnabled) {
      playAlertSound(newAlert.severity);
    }

    // Show toast notification
    const SeverityIcon = severityConfig[newAlert.severity].icon;
    toast({
      title: "New Threat Detected",
      description: `${newAlert.severity.toUpperCase()}: ${newAlert.title.substring(0, 100)}`,
      duration: 5000,
      variant: newAlert.severity === 'critical' || newAlert.severity === 'high' ? 'destructive' : 'default'
    });

    // Call callback if provided
    if (onNewThreat) {
      onNewThreat(threatData);
    }
  };

  // Function to play alert sound
  const playAlertSound = (severity: AlertLog['severity']) => {
    if (!audioRef.current || !soundEnabled) return;

    try {
      // Generate different tones for different severities
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies and patterns for each severity
      const configs = {
        low: { frequency: 440, duration: 0.2, repeats: 1 },
        medium: { frequency: 660, duration: 0.3, repeats: 2 },
        high: { frequency: 880, duration: 0.4, repeats: 3 },
        critical: { frequency: 1100, duration: 0.5, repeats: 4 }
      };

      const config = configs[severity];
      
      oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + config.duration);

      // Play multiple times for higher severity
      if (config.repeats > 1) {
        for (let i = 1; i < config.repeats; i++) {
          setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0, audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.duration);
            
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + config.duration);
          }, i * (config.duration + 0.1) * 1000);
        }
      }
    } catch (error) {
      console.error('Error playing alert sound:', error);
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  // Clear all alerts
  const clearAllAlerts = () => {
    setAlerts([]);
    toast({
      title: "Alerts Cleared",
      description: "All alert logs have been cleared.",
    });
  };

  // Export alerts
  const exportAlerts = (format: 'json' | 'csv' = 'json') => {
    const filteredAlerts = getFilteredAlerts();
    
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'csv') {
      const headers = ['Timestamp', 'Severity', 'Category', 'Source', 'Title', 'Description', 'Acknowledged'];
      const rows = filteredAlerts.map(alert => [
        alert.timestamp,
        alert.severity,
        alert.category,
        alert.source,
        alert.title.replace(/"/g, '""'),
        alert.description.replace(/"/g, '""'),
        alert.acknowledged ? 'Yes' : 'No'
      ]);
      
      content = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      filename = `vireon-alerts-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(filteredAlerts, null, 2);
      filename = `vireon-alerts-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Alert logs exported as ${format.toUpperCase()}`,
    });
  };

  // Get filtered alerts
  const getFilteredAlerts = () => {
    return alerts.filter(alert => 
      filterSeverity === 'all' || alert.severity === filterSeverity
    );
  };

  // Expose addAlert function for external use
  useEffect(() => {
    (window as any).vireonAddAlert = addAlert;
    return () => {
      delete (window as any).vireonAddAlert;
    };
  }, [addAlert]);

  const filteredAlerts = getFilteredAlerts();
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <Card className="glass-card p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-display font-semibold">Threat Alerts</h3>
            {unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unacknowledgedCount} new
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Sound Toggle */}
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch 
                checked={soundEnabled} 
                onCheckedChange={setSoundEnabled}
                aria-label="Enable sound alerts"
              />
            </div>

            {/* Alerts Toggle */}
            <div className="flex items-center gap-2">
              {alertsEnabled ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch 
                checked={alertsEnabled} 
                onCheckedChange={setAlertsEnabled}
                aria-label="Enable alerts"
              />
              <span className="text-sm text-muted-foreground">
                {alertsEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-background border border-border rounded px-3 py-1 text-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAlerts('json')}
              disabled={filteredAlerts.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAlerts('csv')}
              disabled={filteredAlerts.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => simulateNewThreat()}
              className="bg-primary/10 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Bell className="h-4 w-4 mr-1" />
              Test Alert
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllAlerts}
              disabled={alerts.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>

        <Separator />

        {/* Alert Log */}
        <div className="space-y-4">
          <h4 className="font-medium text-muted-foreground">
            Alert Log ({filteredAlerts.length} alerts)
          </h4>
          
          <ScrollArea className="h-[400px] w-full">
            <div className="space-y-3">
              {filteredAlerts.length > 0 ? filteredAlerts.map((alert) => {
                const SeverityIcon = severityConfig[alert.severity].icon;
                
                return (
                  <Card 
                    key={alert.id} 
                    className={cn(
                      "p-4 border transition-all duration-200",
                      alert.acknowledged 
                        ? "bg-muted/20 border-muted" 
                        : "glass-card hover:shadow-glow",
                      !alert.acknowledged && alert.severity === 'critical' && "border-red-500/50 shadow-red-500/20 shadow-lg animate-pulse"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <SeverityIcon className="h-5 w-5 text-destructive mt-1 flex-shrink-0" />
                        {!alert.acknowledged && (
                          <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="outline" className={severityConfig[alert.severity].color}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">{alert.category}</Badge>
                          {!alert.acknowledged && (
                            <Badge variant="destructive" className="text-xs">
                              NEW
                            </Badge>
                          )}
                        </div>
                        
                        <h5 className="font-medium text-sm leading-tight mb-1">{alert.title}</h5>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{alert.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                            <span>{alert.source}</span>
                          </div>
                          
                          {!alert.acknowledged && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="text-xs"
                            >
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              }) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No alerts to display</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {!alertsEnabled ? "Enable alerts to start monitoring threats" : "Alerts will appear here when new threats are detected"}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
}