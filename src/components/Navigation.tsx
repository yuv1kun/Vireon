import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Activity, 
  Target, 
  Search, 
  Settings, 
  Shield, 
  Zap,
  Github,
  Menu,
  X,
  ExternalLink,
  Moon,
  Sun,
  Bell,
  Database
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'feed', label: 'Threat Feed', icon: Activity },
  { id: 'iocs', label: 'IOC Manager', icon: Target },
  { id: 'playbook', label: 'Response Playbooks', icon: Shield },
  { id: 'attack-graph', label: 'Attack Graph', icon: Database },
  { id: 'campaign', label: 'Campaign Detection', icon: Bell },
  { id: 'sources', label: 'Sources', icon: Settings },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'llm-settings', label: 'LLM Settings', icon: Zap },
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();
  
  // Load settings from localStorage or use defaults
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('vireon-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('vireon-notifications');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const saved = localStorage.getItem('vireon-auto-refresh');
    return saved ? JSON.parse(saved) : true;
  });

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('vireon-dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Save notification preference
  useEffect(() => {
    localStorage.setItem('vireon-notifications', JSON.stringify(notifications));
    if (notifications) {
      // Request notification permission if enabled
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            toast({
              title: "Notifications Enabled",
              description: "You'll receive alerts for critical threats.",
            });
          }
        });
      }
    }
  }, [notifications, toast]);

  // Save auto-refresh preference and dispatch event
  useEffect(() => {
    localStorage.setItem('vireon-auto-refresh', JSON.stringify(autoRefresh));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('autoRefreshChanged', { 
      detail: { enabled: autoRefresh } 
    }));
    
    toast({
      title: autoRefresh ? "Auto-refresh Enabled" : "Auto-refresh Disabled",
      description: autoRefresh 
        ? "Threat feeds will refresh automatically." 
        : "Manual refresh required for updates.",
    });
  }, [autoRefresh, toast]);

  const handleGitHubClick = () => {
    // This will open the GitHub repository in a new tab
    window.open('https://github.com/yuv1kun/Vireon', '_blank');
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    toast({
      title: checked ? "Dark Mode Enabled" : "Light Mode Enabled",
      description: "Theme updated successfully.",
    });
  };

  const handleNotificationsToggle = (checked: boolean) => {
    setNotifications(checked);
    if (checked && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            toast({
              title: "Notifications Enabled",
              description: "You'll receive alerts for critical threats.",
            });
          } else {
            toast({
              title: "Permission Denied",
              description: "Enable notifications in browser settings.",
              variant: "destructive"
            });
          }
        });
      } else if (Notification.permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive alerts for critical threats.",
        });
      }
    } else {
      toast({
        title: "Notifications Disabled",
        description: "You won't receive threat alerts.",
      });
    }
  };

  const handleAutoRefreshToggle = (checked: boolean) => {
    setAutoRefresh(checked);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block fixed left-0 top-0 h-full w-64 glass-card border-r border-border/20 z-40">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="relative">
              <Shield className="h-8 w-8 text-primary" />
              <Zap className="absolute -top-1 -right-1 h-4 w-4 text-neon-purple animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold glow-text bg-gradient-accent bg-clip-text text-transparent">
                Vireon
              </h1>
              <p className="text-xs text-muted-foreground">Threat Intelligence</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full justify-start gap-3 h-12 text-left transition-all duration-300",
                    activeTab === item.id && "shadow-glow bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="space-y-4">
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2" 
                    onClick={handleSettingsClick}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Application Settings
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="dark-mode" className="flex items-center gap-2">
                            {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                            Dark Mode
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Toggle between light and dark themes
                          </p>
                        </div>
                        <Switch
                          id="dark-mode"
                          checked={darkMode}
                          onCheckedChange={handleDarkModeToggle}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="notifications" className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Notifications
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Get alerts for critical threats and updates
                          </p>
                        </div>
                        <Switch
                          id="notifications"
                          checked={notifications}
                          onCheckedChange={handleNotificationsToggle}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="auto-refresh" className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Auto Refresh
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically refresh threat intelligence feeds
                          </p>
                        </div>
                        <Switch
                          id="auto-refresh"
                          checked={autoRefresh}
                          onCheckedChange={handleAutoRefreshToggle}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-3">About</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Vireon Threat Intelligence Platform</p>
                        <p>Version 1.0.0</p>
                        <p>Built with React, TypeScript & AI</p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleGitHubClick}
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Built with passion ⚡️
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <header className="fixed top-0 left-0 right-0 h-16 glass-card border-b border-border/20 z-50">
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Shield className="h-6 w-6 text-primary" />
                <Zap className="absolute -top-1 -right-1 h-3 w-3 text-neon-purple animate-pulse" />
              </div>
              <h1 className="text-lg font-display font-bold glow-text bg-gradient-accent bg-clip-text text-transparent">
                Vireon
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed top-16 left-0 right-0 glass-card border-b border-border/20 p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "default" : "ghost"}
                      onClick={() => {
                        onTabChange(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full justify-start gap-3 h-12",
                        activeTab === item.id && "shadow-glow"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  );
                })}
                
                {/* Mobile Settings and GitHub */}
                <div className="pt-4 border-t space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      handleSettingsClick();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      handleGitHubClick();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Github className="h-5 w-5" />
                    View on GitHub
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}