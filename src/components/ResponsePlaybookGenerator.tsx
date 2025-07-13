import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight, FileDown, Network, Shield, FileCode, RefreshCw, Cpu, Clipboard, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThreatReport } from '@/services/dataStorage';
import { ollamaService } from '@/services/ollamaService';
import { aiAnalyzer } from "../services/aiAnalyzer";

// Interface for a playbook step
interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  owner: string;
  automationPotential: 'full' | 'partial' | 'manual';
  commands?: string[];
  timeEstimate?: string;
  tools?: string[];
}

// Interface for a playbook
interface Playbook {
  id: string;
  name: string;
  description: string;
  threatType: string;
  steps: PlaybookStep[];
  yaml: string;
  json: string;
}

export function ResponsePlaybookGenerator() {
  const [selectedReport, setSelectedReport] = useState<ThreatReport | null>(null);
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string>('');
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [activeFormat, setActiveFormat] = useState<'visual' | 'yaml' | 'json'>('visual');
  const [processingTime, setProcessingTime] = useState<number>(0);
  
  // Generate playbook for a threat report
  const generatePlaybook = async (report: ThreatReport) => {
    setSelectedReport(report);
    setGenerating(true);
    setGenerationError('');
    setPlaybook(null);
    
    const startTime = Date.now();
    
    // Create a queue of AI methods to try, starting with Ollama and falling back to local AI
    const aiMethodQueue = [
      tryOllamaGeneration, 
      tryLocalAiGeneration
    ];
    
    // Try each AI method in sequence until one succeeds
    for (const aiMethod of aiMethodQueue) {
      try {
        const result = await aiMethod(report, startTime);
        if (result) {
          // Successfully generated playbook with this method
          return;
        }
      } catch (error) {
        console.warn(`AI method failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue to the next method
      }
    }
    
    // If we reach here, all methods failed - use hardcoded template as ultimate fallback
    try {
      generateFallbackTemplate(report, startTime);
    } catch (finalError) {
      console.error('All playbook generation methods failed:', finalError);
      setGenerationError('Failed to generate playbook after multiple attempts');
      setGenerating(false);
    }
  };

  // Try Ollama generation with improved error handling
  const tryOllamaGeneration = async (report: ThreatReport, startTime: number): Promise<boolean> => {
    try {
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Ollama request timed out after 120 seconds')), 120000);
      });

      // Verify Ollama availability with timeout protection
      const isOllamaAvailable = await Promise.race([
        Promise.resolve(ollamaService.isAvailable()),
        new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('Ollama availability check timed out')), 5000);
        })
      ]);

      if (!isOllamaAvailable) {
        console.log('Ollama service appears unavailable, checking connection...');
        await ollamaService.checkConnection();
        if (!ollamaService.isAvailable()) {
          throw new Error('Ollama service is not available');
        }
      }
      
      // Confirm which model is being used
      const availableModels = ollamaService.getAvailableModels();
      const selectedModel = ollamaService.getConfig().defaultModel;
      console.log('Available Ollama models:', availableModels);
      console.log('Using model for playbook generation:', selectedModel);
      
      // Create playbook generation prompt
      const prompt = `Generate a detailed security incident response playbook for the following threat:

THREAT REPORT:
Title: ${report.title}
Description: ${report.description || 'No description available'}
Severity: ${report.severity.toUpperCase()}
IOCs: ${formatIOCs(report.iocs)}

Create a comprehensive playbook with the following:
1. A descriptive name for the playbook
2. A brief overview description
3. The primary threat type being addressed
4. 8-10 detailed response steps, with each step including:
   - Step title
   - Detailed description of actions to take
   - Priority (critical, high, medium, low)
   - Owner role (e.g., SOC Analyst, Incident Responder, Threat Hunter)
   - Automation potential (full, partial, manual)
   - Example commands or tools to use (if applicable)
   - Estimated time to complete
   - Required tools or resources

FORMAT YOUR RESPONSE IN THIS EXACT JSON STRUCTURE:
{
  "name": "Playbook name",
  "description": "Brief overview description",
  "threatType": "Primary threat type",
  "steps": [
    {
      "id": "step1",
      "title": "Step title",
      "description": "Detailed step description",
      "priority": "high|medium|low|critical",
      "owner": "Role responsible",
      "automationPotential": "full|partial|manual",
      "commands": ["command1", "command2"],
      "timeEstimate": "time estimate",
      "tools": ["tool1", "tool2"]
    }
  ]
}`;

      // Generate and process the playbook
      let playbookData;
      try {
        // Generate playbook using LLM with timeout protection
        const result = await Promise.race([
          ollamaService.generateSummary(
            `Playbook for ${report.title}`, 
            prompt,
            ollamaService.getConfig().defaultModel
          ),
          timeoutPromise
        ]);
        
        if (!result || !('summary' in result)) {
          throw new Error('Failed to generate playbook - received invalid response');
        }
        
        // Extract JSON from the response
        let jsonStr = result.summary;
        // Find JSON block if not directly returned
        if (!jsonStr.trim().startsWith('{')) {
          const jsonMatch = jsonStr.match(/```json\n([\s\S]*?)\n```/) || 
                           jsonStr.match(/```\n([\s\S]*?)\n```/) || 
                           jsonStr.match(/({[\s\S]*})/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1];
          } else {
            throw new Error('Could not parse playbook JSON from response - invalid format');
          }
        }

        // Clean up any potential JSON formatting issues
        jsonStr = jsonStr.trim();
        if (jsonStr.endsWith('```')) {
          jsonStr = jsonStr.slice(0, -3).trim();
        }
        
        // Parse the JSON
        try {
          playbookData = JSON.parse(jsonStr);
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError, 'Raw JSON:', jsonStr);
          throw new Error('Failed to parse playbook JSON - invalid format');
        }
      } catch (innerError) {
        console.error('LLM generation error:', innerError);
        
        // Implement fallback mechanism for when Ollama fails
        console.log('Attempting to create fallback playbook template...');
        
        // Create a simple fallback playbook template
        try {
          const fallbackPlaybook = {
            name: `Incident Response for ${report.title}`,
            description: `Standard response procedures for ${report.severity} severity ${report.category || 'security'} incident.`,
            threatType: report.category || 'Unknown',
            steps: [
              {
                id: 'step1',
                title: 'Initial Triage and Assessment',
                description: 'Assess the scope and impact of the incident based on available indicators and determine initial severity.',
                priority: report.severity || 'medium',
                owner: 'SOC Analyst',
                automationPotential: 'partial',
                commands: ['nslookup <domain>', 'whois <ip-address>'],
                timeEstimate: '30-60 minutes',
                tools: ['SIEM', 'TIP Platform']
              },
              {
                id: 'step2',
                title: 'Containment',
                description: 'Implement immediate containment measures to prevent further impact or spread.',
                priority: 'high',
                owner: 'Incident Responder',
                automationPotential: 'partial',
                commands: ['block-ip.sh <ip-address>', 'isolate-host.sh <hostname>'],
                timeEstimate: '1-2 hours',
                tools: ['EDR', 'Firewall']
              },
              {
                id: 'step3',
                title: 'Evidence Collection',
                description: 'Gather and preserve relevant logs, memory dumps, and other forensic artifacts.',
                priority: 'medium',
                owner: 'Forensic Analyst',
                automationPotential: 'partial',
                commands: ['acquire-memory.sh <hostname>', 'collect-logs.sh <timeframe>'],
                timeEstimate: '2-3 hours',
                tools: ['Forensic Toolkit', 'Log Aggregator']
              }
            ]
          };
          
          // Use the fallback playbook instead
          playbookData = fallbackPlaybook;
          console.log('Successfully created fallback playbook template');
          
          // Add a warning that this is a fallback template
          setGenerationError('Ollama was unavailable or timed out. Using simplified playbook template.');
        } catch (fallbackError) {
          // If even the fallback fails, throw the original error
          console.error('Failed to create fallback playbook:', fallbackError);
          throw new Error(`Failed to generate playbook: ${innerError instanceof Error ? innerError.message : 'Unknown LLM error'}`);
        }
      }
      
      // Generate YAML representation
      const yamlPlaybook = convertToYAML(playbookData);
      
      // Create the playbook object
      const newPlaybook: Playbook = {
        id: `playbook-${Date.now()}`,
        name: playbookData.name,
        description: playbookData.description,
        threatType: playbookData.threatType,
        steps: playbookData.steps.map((step: any, index: number) => ({
          ...step,
          id: step.id || `step${index + 1}`
        })),
        yaml: yamlPlaybook,
        json: JSON.stringify(playbookData, null, 2)
      };
      
      setPlaybook(newPlaybook);
      setProcessingTime(Date.now() - startTime);
      setGenerating(false);
      return true; // Successfully generated playbook
    } catch (error) {
      console.error('Error in Ollama generation:', error);
      throw error; // Let the caller handle this error
    }
  };

  // Local AI fallback using aiAnalyzer when Ollama fails
  const tryLocalAiGeneration = async (report: ThreatReport, startTime: number): Promise<boolean> => {
    try {
      console.log('Attempting playbook generation using local AI (aiAnalyzer)...');
      
      // Check if aiAnalyzer is initialized
      if (!aiAnalyzer.isReady()) {
        console.log('Local AI models not ready, will use simplified template');
        throw new Error('Local AI models not initialized');
      }
      
      // Generate a threat summary using the local AI model
      console.log('Generating threat summary with local AI...');
      const threatSummary = await aiAnalyzer.generateThreatSummary(
        report.title,
        report.description || '',
        Object.entries(report.iocs || {}).map(([type, values]) => {
          return (values as string[]).map(value => ({ type, value }));
        }).flat()
      );
      
      if (!threatSummary) {
        throw new Error('Failed to generate threat summary with local AI');
      }
      
      console.log('Local AI summary generated successfully');
      
      // Create a tailored playbook based on the local AI summary
      const playbookData = {
        name: `Incident Response for ${report.title}`,
        description: `Response plan for ${threatSummary.summary.substring(0, 100)}...`,
        threatType: report.category || threatSummary.threatType || 'Advanced Threat',
        steps: [
          {
            id: 'step1',
            title: 'Initial Assessment',
            description: `Assess this threat: ${threatSummary.summary.substring(0, 150)}...`,
            priority: mapSeverityToPriority(report.severity),
            owner: 'SOC Analyst',
            automationPotential: 'partial',
            commands: ['nslookup <domain>', 'whois <ip-address>'],
            timeEstimate: '30-60 minutes',
            tools: ['SIEM', 'TIP Platform']
          } as PlaybookStep,
          {
            id: 'step2',
            title: 'Threat Containment',
            description: 'Prevent threat from spreading to other systems',
            priority: mapSeverityToPriority(report.severity),
            owner: 'Incident Responder',
            automationPotential: 'partial',
            commands: Object.entries(report.iocs || {}).length > 0 ?
              generateContainmentCommands(report.iocs) : 
              ['block-ip.sh <ip-address>', 'isolate-host.sh <hostname>'],
            timeEstimate: '1-2 hours',
            tools: ['EDR', 'Firewall', 'Network Controls']
          } as PlaybookStep,
          {
            id: 'step3',
            title: 'Evidence Collection',
            description: 'Gather and preserve relevant logs, memory dumps, and other forensic artifacts.',
            priority: 'medium',
            owner: 'Forensic Analyst',
            automationPotential: 'partial',
            commands: ['acquire-memory.sh <hostname>', 'collect-logs.sh <timeframe>'],
            timeEstimate: '2-3 hours',
            tools: ['Forensic Toolkit', 'Log Aggregator']
          } as PlaybookStep,
          {
            id: 'step4',
            title: 'Threat Hunting',
            description: `Search for indicators of compromise across the environment based on known IOCs: ${formatIOCs(report.iocs)}`,
            priority: 'high',
            owner: 'Threat Hunter',
            automationPotential: 'partial',
            commands: generateHuntingCommands(report.iocs),
            timeEstimate: '2-4 hours',
            tools: ['EDR', 'SIEM', 'Threat Intelligence Platform']
          } as PlaybookStep,
          {
            id: 'step5',
            title: 'Root Cause Analysis',
            description: 'Determine the initial infection vector and attacker methodology.',
            priority: 'medium',
            owner: 'Security Analyst',
            automationPotential: 'manual',
            timeEstimate: '4-8 hours',
            tools: ['Timeline Analysis Tools', 'MITRE ATT&CK Framework'],
            commands: []
          } as PlaybookStep
        ]
      };
      
      // Generate YAML representation
      const yamlPlaybook = convertToYAML(playbookData);
      
      // Create the playbook object
      const newPlaybook: Playbook = {
        id: `playbook-${Date.now()}`,
        name: playbookData.name,
        description: playbookData.description,
        threatType: playbookData.threatType,
        steps: playbookData.steps,
        yaml: yamlPlaybook,
        json: JSON.stringify(playbookData, null, 2)
      };
      
      setPlaybook(newPlaybook);
      setProcessingTime(Date.now() - startTime);
      setGenerationError('Ollama was unavailable. Using local AI-generated playbook.');
      setGenerating(false);
      
      return true; // Successfully generated playbook with local AI
    } catch (error) {
      console.error('Error in local AI generation:', error);
      throw error; // Let the caller handle this error
    }
  };
  
  // Generate a fallback template when all AI methods fail
  const generateFallbackTemplate = (report: ThreatReport, startTime: number): void => {
    console.log('Generating fallback playbook template...');
    
    // Create a simple fallback playbook template
    const fallbackPlaybook = {
      name: `Incident Response for ${report.title}`,
      description: `Standard response procedures for ${report.severity} severity ${report.category || 'security'} incident.`,
      threatType: report.category || 'Unknown',
      steps: [
        {
          id: 'step1',
          title: 'Initial Triage and Assessment',
          description: 'Assess the scope and impact of the incident based on available indicators and determine initial severity.',
          priority: mapSeverityToPriority(report.severity),
          owner: 'SOC Analyst',
          automationPotential: 'partial',
          commands: ['nslookup <domain>', 'whois <ip-address>'],
          timeEstimate: '30-60 minutes',
          tools: ['SIEM', 'TIP Platform']
        } as PlaybookStep,
        {
          id: 'step2',
          title: 'Containment',
          description: 'Implement immediate containment measures to prevent further impact or spread.',
          priority: 'high',
          owner: 'Incident Responder',
          automationPotential: 'partial',
          commands: ['block-ip.sh <ip-address>', 'isolate-host.sh <hostname>'],
          timeEstimate: '1-2 hours',
          tools: ['EDR', 'Firewall']
        } as PlaybookStep,
        {
          id: 'step3',
          title: 'Evidence Collection',
          description: 'Gather and preserve relevant logs, memory dumps, and other forensic artifacts.',
          priority: 'medium',
          owner: 'Forensic Analyst',
          automationPotential: 'partial',
          commands: ['acquire-memory.sh <hostname>', 'collect-logs.sh <timeframe>'],
          timeEstimate: '2-3 hours',
          tools: ['Forensic Toolkit', 'Log Aggregator']
        } as PlaybookStep
      ]
    };
    
    // Generate YAML representation
    const yamlPlaybook = convertToYAML(fallbackPlaybook);
    
    // Create the playbook object
    const newPlaybook: Playbook = {
      id: `playbook-${Date.now()}`,
      name: fallbackPlaybook.name,
      description: fallbackPlaybook.description,
      threatType: fallbackPlaybook.threatType,
      steps: fallbackPlaybook.steps,
      yaml: yamlPlaybook,
      json: JSON.stringify(fallbackPlaybook, null, 2)
    };
    
    setPlaybook(newPlaybook);
    setProcessingTime(Date.now() - startTime);
    setGenerationError('All AI methods failed. Using basic playbook template.');
    setGenerating(false);
  };
  
  // Helper to map severity to priority
  const mapSeverityToPriority = (severity: string): 'critical' | 'high' | 'medium' | 'low' => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  };
  
  // Generate hunting commands based on IOCs
  const generateHuntingCommands = (iocs: any): string[] => {
    const commands: string[] = [];
    
    try {
      if (iocs?.ip) {
        commands.push(`search_logs.sh -term "${(iocs.ip as string[])[0] || '<ip-address>'}" -days 30`);
      }
      if (iocs?.domain) {
        commands.push(`hunt_domain.sh "${(iocs.domain as string[])[0] || '<domain>'}"`);
      }
      if (iocs?.hash) {
        commands.push(`find_malware.sh -hash "${(iocs.hash as string[])[0] || '<file-hash>'}"`);
      }
      
      // Add a default command if no specific IOCs were available
      if (commands.length === 0) {
        commands.push('hunt.sh -profile "default"');
      }
    } catch (error) {
      console.error('Error generating hunting commands:', error);
      return ['hunt.sh -profile "default"'];
    }
    
    return commands;
  };
  
  // Generate containment commands based on IOCs
  const generateContainmentCommands = (iocs: any): string[] => {
    const commands: string[] = [];
    
    try {
      if (iocs?.ip) {
        commands.push(`block-ip.sh "${(iocs.ip as string[])[0] || '<ip-address>'}"`);
      }
      if (iocs?.domain) {
        commands.push(`block-domain.sh "${(iocs.domain as string[])[0] || '<domain>'}"`);
      }
      if (iocs?.hash) {
        commands.push(`quarantine-file.sh -hash "${(iocs.hash as string[])[0] || '<file-hash>'}"`);
      }
      
      // Add a default command if no specific IOCs were available
      if (commands.length === 0) {
        commands.push('isolate-host.sh <hostname>');
      }
    } catch (error) {
      console.error('Error generating containment commands:', error);
      return ['block-ip.sh <ip-address>', 'isolate-host.sh <hostname>'];
    }
    
    return commands;
  };
  
  // Format IOCs for the prompt
  const formatIOCs = (iocs: any) => {
    if (!iocs) return 'None';
    
    let formattedIOCs = '';
    try {
      Object.entries(iocs).forEach(([type, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          formattedIOCs += `${type.toUpperCase()}: ${values.join(', ')}\n`;
        }
      });
    } catch (error) {
      console.error('Error formatting IOCs:', error);
      return 'Error parsing IOCs';
    }
    
    return formattedIOCs || 'None';
  };

  // Toggle a step's expanded state
  const toggleStep = (stepId: string) => {
    const newSet = new Set(expandedSteps);
    if (newSet.has(stepId)) {
      newSet.delete(stepId);
    } else {
      newSet.add(stepId);
    }
    setExpandedSteps(newSet);
  };

  // Convert JSON to YAML
  const convertToYAML = (json: any): string => {
    // Simple JSON to YAML converter
    const indent = (level: number) => '  '.repeat(level);
    
    const processValue = (value: any, level: number): string => {
      if (value === null || value === undefined) {
        return 'null';
      }
      
      if (typeof value === 'string') {
        // Check if the string contains newlines or special chars
        if (value.includes('\n') || value.match(/[:"'{}[\]|>*&?!%@`]/)) {
          // Multi-line string with proper indentation
          const lines = value.split('\n');
          return '|\n' + lines.map(line => `${indent(level + 1)}${line}`).join('\n');
        }
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      
      if (typeof value === 'number' || typeof value === 'boolean') {
        return value.toString();
      }
      
      if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        return '\n' + value.map(item => `${indent(level + 1)}- ${processValue(item, level + 1)}`).join('\n');
      }
      
      if (typeof value === 'object') {
        return '\n' + Object.entries(value).map(([k, v]) => {
          return `${indent(level + 1)}${k}: ${processValue(v, level + 1)}`;
        }).join('\n');
      }
      
      return String(value);
    };
    
    return Object.entries(json).map(([key, value]) => {
      return `${key}: ${processValue(value, 0)}`;
    }).join('\n');
  };

  // Copy content to clipboard
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard');
    });
  };

  // Export playbook as a file
  const exportPlaybook = (format: 'yaml' | 'json') => {
    if (!playbook) return;
    
    const content = format === 'yaml' ? playbook.yaml : playbook.json;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playbook-${playbook.name.toLowerCase().replace(/\s+/g, '-')}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render priority badge with color
  const renderPriorityBadge = (priority: string) => {
    const config: Record<string, { color: string }> = {
      critical: { color: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30' },
      high: { color: 'bg-destructive/20 text-destructive border-destructive/30' },
      medium: { color: 'bg-warning-amber/20 text-warning-amber border-warning-amber/30' },
      low: { color: 'bg-success-green/20 text-success-green border-success-green/30' }
    };
    
    return (
      <Badge variant="outline" className={cn(config[priority]?.color || '')}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  // Render automation potential badge
  const renderAutomationBadge = (automation: string) => {
    const config: Record<string, { color: string, icon: any }> = {
      full: { color: 'bg-success-green/20 text-success-green border-success-green/30', icon: Cpu },
      partial: { color: 'bg-warning-amber/20 text-warning-amber border-warning-amber/30', icon: Cpu },
      manual: { color: 'bg-muted/20 text-muted-foreground border-muted/30', icon: Shield }
    };
    
    const { color, icon: Icon } = config[automation] || config.manual;
    
    return (
      <Badge variant="outline" className={cn(color)}>
        <Icon className="h-3 w-3 mr-1" />
        {automation.charAt(0).toUpperCase() + automation.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-primary">Response Playbook Generator</h2>
        
        {selectedReport && !generating && playbook && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportPlaybook('yaml')}>
              <FileDown className="h-4 w-4 mr-1" />
              Export YAML
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportPlaybook('json')}>
              <FileCode className="h-4 w-4 mr-1" />
              Export JSON
            </Button>
          </div>
        )}
      </div>
      
      {selectedReport ? (
        <div className="space-y-4">
          <div className="border rounded-md p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold">{selectedReport.title}</h3>
              <Badge variant="outline" className={cn(
                selectedReport.severity === 'critical' && "bg-neon-purple/20 text-neon-purple border-neon-purple/30",
                selectedReport.severity === 'high' && "bg-destructive/20 text-destructive border-destructive/30",
                selectedReport.severity === 'medium' && "bg-warning-amber/20 text-warning-amber border-warning-amber/30",
                selectedReport.severity === 'low' && "bg-success-green/20 text-success-green border-success-green/30"
              )}>
                {selectedReport.severity.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {selectedReport.description?.substring(0, 150)}
              {selectedReport.description && selectedReport.description.length > 150 ? '...' : ''}
            </p>
          </div>
          
          {generating && (
            <div className="flex flex-col items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4">Generating response playbook...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </div>
          )}
          
          {generationError && !playbook && (
            <div className="border border-destructive/30 bg-destructive/10 rounded-md p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
                <h3 className="font-medium text-destructive">Failed to generate playbook</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{generationError}</p>
              <Button 
                variant="destructive" 
                size="sm" 
                className="mt-4"
                onClick={() => generatePlaybook(selectedReport)}
              >
                Retry
              </Button>
            </div>
          )}
          
          {generationError && playbook && (
            <div className="border border-warning-amber/30 bg-warning-amber/10 rounded-md p-4 mb-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-warning-amber mr-2" />
                <h3 className="font-medium text-warning-amber">Note: Using simplified template</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{generationError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => generatePlaybook(selectedReport)}
              >
                Try Again with AI
              </Button>
            </div>
          )}
          
          {!generating && !generationError && playbook && (
            <div>
              {processingTime > 0 && (
                <p className="text-xs text-muted-foreground mb-4">
                  <Cpu className="h-3 w-3 inline mr-1" />
                  Generated in {(processingTime / 1000).toFixed(1)}s
                </p>
              )}
              
              <div className="mb-4">
                <h3 className="text-xl font-display font-semibold">{playbook.name}</h3>
                <p className="text-sm mt-1">{playbook.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">
                    {playbook.threatType}
                  </Badge>
                  <Badge variant="outline">
                    {playbook.steps.length} Steps
                  </Badge>
                </div>
              </div>
              
              <Tabs defaultValue="visual" onValueChange={(v) => setActiveFormat(v as any)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="visual">Visual Steps</TabsTrigger>
                  <TabsTrigger value="yaml">YAML</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>
                
                <TabsContent value="visual" className="space-y-3">
                  {playbook.steps.map((step) => (
                    <Card key={step.id} className="border p-4">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleStep(step.id)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedSteps.has(step.id) ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                          <span className="font-medium">{step.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderPriorityBadge(step.priority)}
                          {renderAutomationBadge(step.automationPotential)}
                        </div>
                      </div>
                      
                      {expandedSteps.has(step.id) && (
                        <div className="mt-4 pl-6 space-y-3">
                          <p className="text-sm">{step.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground font-medium mb-1">Owner</p>
                              <p>{step.owner}</p>
                            </div>
                            
                            {step.timeEstimate && (
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">Estimated Time</p>
                                <p>{step.timeEstimate}</p>
                              </div>
                            )}
                          </div>
                          
                          {step.tools && step.tools.length > 0 && (
                            <div>
                              <p className="text-muted-foreground font-medium mb-1">Required Tools</p>
                              <div className="flex flex-wrap gap-1">
                                {step.tools.map((tool, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {tool}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {step.commands && step.commands.length > 0 && (
                            <div>
                              <p className="text-muted-foreground font-medium mb-1">Example Commands</p>
                              <div className="bg-muted/20 rounded-md p-2 font-mono text-xs">
                                {step.commands.map((cmd, i) => (
                                  <div key={i} className="py-1">{cmd}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </TabsContent>
                
                <TabsContent value="yaml">
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-2 top-2"
                      onClick={() => copyToClipboard(playbook.yaml)}
                    >
                      <Clipboard className="h-4 w-4" />
                    </Button>
                    <ScrollArea className="h-[500px] w-full">
                      <pre className="bg-muted/20 p-4 rounded-md text-xs font-mono whitespace-pre overflow-x-auto">
                        {playbook.yaml}
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>
                
                <TabsContent value="json">
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-2 top-2"
                      onClick={() => copyToClipboard(playbook.json)}
                    >
                      <Clipboard className="h-4 w-4" />
                    </Button>
                    <ScrollArea className="h-[500px] w-full">
                      <pre className="bg-muted/20 p-4 rounded-md text-xs font-mono whitespace-pre overflow-x-auto">
                        {playbook.json}
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-8">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No threat report selected</h3>
          <p className="text-muted-foreground mb-6">Select a threat report to generate an incident response playbook</p>
          
          <div className="grid grid-cols-3 gap-4 mt-8">
            <ThreatReportCard
              onClick={generatePlaybook}
              title="Emotet Banking Trojan Campaign"
              description="New variant of Emotet banking trojan targeting financial institutions through phishing emails with Excel macros"
              severity="high"
              source="VirusTotal"
              timestamp="2025-07-10T15:32:00Z"
            />
            
            <ThreatReportCard
              onClick={generatePlaybook}
              title="Log4j Vulnerability Exploitation"
              description="Active exploitation of Log4j vulnerability (CVE-2021-44228) targeting cloud infrastructure"
              severity="critical"
              source="US-CERT"
              timestamp="2025-07-09T08:15:00Z"
            />
            
            <ThreatReportCard
              onClick={generatePlaybook}
              title="APT29 Spear Phishing Campaign"
              description="Targeted spear phishing campaign from APT29 using diplomatic themes and zero-day exploit"
              severity="high"
              source="Mandiant"
              timestamp="2025-07-08T12:45:00Z"
            />
          </div>
        </div>
      )}
    </Card>
  );
}

// Sample threat report card for selection
interface ThreatReportCardProps {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  timestamp: string;
  onClick: (report: ThreatReport) => void;
}

function ThreatReportCard({ 
  title, 
  description, 
  severity, 
  source, 
  timestamp, 
  onClick 
}: ThreatReportCardProps) {
  const report: ThreatReport = {
    id: `sample-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    description,
    severity,
    source,
    timestamp,
    link: '',
    content: '',
    category: '',
    processed: true,
    aiSummary: null,
    iocs: { ips: [], urls: [], hashes: [], domains: [], emails: [] },
    tags: []
  };
  
  return (
    <Card 
      className={cn(
        "border p-4 cursor-pointer hover:border-primary transition-colors",
        severity === 'critical' && "border-l-4 border-l-neon-purple",
        severity === 'high' && "border-l-4 border-l-destructive",
        severity === 'medium' && "border-l-4 border-l-warning-amber",
        severity === 'low' && "border-l-4 border-l-success-green"
      )}
      onClick={() => onClick(report)}
    >
      <h3 className="font-medium line-clamp-2">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
      <div className="flex justify-between items-center mt-2">
        <Badge
          variant="outline"
          className={cn(
            severity === 'critical' && "bg-neon-purple/20 text-neon-purple border-neon-purple/30",
            severity === 'high' && "bg-destructive/20 text-destructive border-destructive/30",
            severity === 'medium' && "bg-warning-amber/20 text-warning-amber border-warning-amber/30",
            severity === 'low' && "bg-success-green/20 text-success-green border-success-green/30"
          )}
        >
          {severity}
        </Badge>
        <span className="text-xs text-muted-foreground">{source}</span>
      </div>
    </Card>
  );
}
