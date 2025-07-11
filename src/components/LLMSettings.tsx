import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, RefreshCw, Settings, Zap } from 'lucide-react';
import { ollamaService, type OllamaModel } from '@/services/ollamaService';
import { cn } from '@/lib/utils';

export function LLMSettings() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [testing, setTesting] = useState(false);
  const [useOllama, setUseOllama] = useState(true);

  useEffect(() => {
    // Load initial settings
    ollamaService.loadSettings();
    const config = ollamaService.getConfig();
    setApiUrl(config.apiUrl);
    setDefaultModel(config.defaultModel);
    setModels(config.models);
    setIsConnected(ollamaService.isAvailable());
    
    // Load preference for using Ollama
    const preference = localStorage.getItem('use-ollama');
    setUseOllama(preference !== 'false');
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      ollamaService.setApiUrl(apiUrl);
      const connected = await ollamaService.checkConnection();
      setIsConnected(connected);
      setModels(ollamaService.getAllModels());
      
      if (connected) {
        ollamaService.saveSettings();
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setIsConnected(false);
    }
    setTesting(false);
  };

  const handleModelChange = (modelName: string) => {
    setDefaultModel(modelName);
    ollamaService.setDefaultModel(modelName);
    ollamaService.saveSettings();
  };

  const handleUseOllamaChange = (enabled: boolean) => {
    setUseOllama(enabled);
    localStorage.setItem('use-ollama', enabled.toString());
  };

  const availableModels = models.filter(m => m.available);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-display font-medium">LLM Configuration</h3>
      </div>

      {/* Ollama Toggle */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium mb-1">Use Ollama LLMs</h4>
            <p className="text-sm text-muted-foreground">
              Enable integration with locally hosted Ollama models for enhanced privacy and customization
            </p>
          </div>
          <Switch checked={useOllama} onCheckedChange={handleUseOllamaChange} />
        </div>
      </Card>

      {useOllama && (
        <>
          {/* Connection Settings */}
          <Card className="glass-card p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Ollama Connection</h4>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Badge className="bg-success-green/20 text-success-green border-success-green/30">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Optional
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-url">Ollama API URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleTestConnection} 
                    disabled={testing}
                    variant="outline"
                    size="sm"
                  >
                    {testing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isConnected 
                    ? '✅ Ollama is connected and ready for enhanced AI analysis'
                    : '💡 Ollama is optional. Install from https://ollama.ai for local AI models'
                  }
                </p>
              </div>
            </div>
          </Card>

          {/* Model Selection */}
          <Card className="glass-card p-4">
            <div className="space-y-4">
              <h4 className="font-medium">Model Selection</h4>
              
              {isConnected && availableModels.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="default-model">Default Model</Label>
                  <Select value={defaultModel} onValueChange={handleModelChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.name} value={model.name}>
                          <div className="flex items-center gap-2">
                            <Zap className="h-3 w-3 text-primary" />
                            {model.displayName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This model will be used by default for generating threat intelligence summaries.
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm mb-2">
                    {!isConnected 
                      ? 'Ollama not connected (fallback to Hugging Face models)'
                      : 'No models installed'
                    }
                  </p>
                  {!isConnected ? (
                    <div className="text-xs space-y-1">
                      <p>To enable Ollama:</p>
                      <p>1. Install from https://ollama.ai</p>
                      <p>2. Run: ollama serve</p>
                      <p>3. Pull models: ollama pull llama2</p>
                    </div>
                  ) : (
                    <p className="text-xs">Install models using: ollama pull &lt;model-name&gt;</p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Available Models List */}
          {models.length > 0 && (
            <Card className="glass-card p-4">
              <div className="space-y-4">
                <h4 className="font-medium">Available Models</h4>
                <div className="space-y-2">
                  {models.map((model) => (
                    <div
                      key={model.name}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border',
                        model.available 
                          ? 'border-success-green/30 bg-success-green/5' 
                          : 'border-border bg-muted/20'
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.displayName}</span>
                          {model.available ? (
                            <CheckCircle className="h-4 w-4 text-success-green" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{model.description}</p>
                      </div>
                      {!model.available && (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          ollama pull {model.name}
                        </code>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}