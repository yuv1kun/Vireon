// Ollama LLM Integration Service
export interface OllamaModel {
  name: string;
  displayName: string;
  description: string;
  available: boolean;
}

export interface OllamaConfig {
  apiUrl: string;
  models: OllamaModel[];
  defaultModel: string;
  timeout: number;
}

export interface OllamaSummaryRequest {
  model: string;
  prompt: string;
  stream: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

export interface OllamaSummaryResponse {
  model: string;
  response: string;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

class OllamaService {
  private config: OllamaConfig = {
    apiUrl: 'http://localhost:11434', // Default Ollama API URL
    models: [
      {
        name: 'llama3',
        displayName: 'LLaMA 3',
        description: 'Meta\'s LLaMA 3 model with improved reasoning and safety',
        available: false
      },
      {
        name: 'llama2',
        displayName: 'LLaMA 2',
        description: 'Meta\'s LLaMA 2 model for general-purpose text generation',
        available: false
      },
      {
        name: 'mistral',
        displayName: 'Mistral 7B',
        description: 'Mistral AI\'s efficient 7B parameter model',
        available: false
      },
      {
        name: 'codellama',
        displayName: 'Code Llama',
        description: 'Meta\'s Code Llama for code understanding and generation',
        available: false
      },
      {
        name: 'neural-chat',
        displayName: 'Neural Chat',
        description: 'Intel\'s fine-tuned chat model',
        available: false
      },
      {
        name: 'openchat',
        displayName: 'OpenChat',
        description: 'Open-source conversational AI model',
        available: false
      }
    ],
    defaultModel: 'llama3',
    timeout: 120000 // Increased timeout to 120 seconds for more complex generations
  };

  private isConnected = false;

  constructor() {
    this.checkConnection();
  }

  // Check if Ollama API is available and get available models
  async checkConnection(): Promise<boolean> {
    try {
      console.log('Checking Ollama connection...');
      const response = await fetch(`${this.config.apiUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000) // Extended timeout for slower connections
      });

      if (response.ok) {
        const data = await response.json();
        const installedModels = data.models || [];
        console.log('Detected Ollama models:', installedModels);
        
        // Update model availability for known models
        this.config.models.forEach(model => {
          // Check if model exists either as exact name or with a tag (e.g., llama3:latest)
          model.available = installedModels.some((installed: any) => {
            const installedName = installed.name.toLowerCase();
            const modelName = model.name.toLowerCase();
            return (
              installedName === modelName || 
              installedName.startsWith(`${modelName}:`) ||
              installedName.split(':')[0] === modelName
            );
          });
          
          // If model is available, set the actual name from installed models for exact matching
          if (model.available) {
            const matchedModel = installedModels.find((installed: any) => {
              const installedName = installed.name.toLowerCase();
              const modelName = model.name.toLowerCase();
              return (
                installedName === modelName || 
                installedName.startsWith(`${modelName}:`) ||
                installedName.split(':')[0] === modelName
              );
            });
            
            if (matchedModel) {
              model.name = matchedModel.name; // Use exact name from Ollama API
              console.log(`Model ${model.displayName} found as ${model.name}`);
            }
          }
        });
        
        // Add any new models that weren't previously configured
        installedModels.forEach((installed: any) => {
          const modelName = installed.name.split(':')[0]; // Get base name without tag
          const existingModel = this.config.models.find(m => 
            m.name === modelName || 
            modelName.startsWith(m.name)
          );
          
          if (!existingModel) {
            // Add the new model to our config
            this.config.models.push({
              name: modelName,
              displayName: modelName.charAt(0).toUpperCase() + modelName.slice(1), // Capitalize
              description: `Automatically detected ${modelName} model`,
              available: true
            });
          }
        });
        
        // Set default model to first available if current default is unavailable
        const defaultIsAvailable = this.config.models.some(m => 
          m.name === this.config.defaultModel && m.available
        );
        
        if (!defaultIsAvailable) {
          const firstAvailable = this.config.models.find(m => m.available);
          if (firstAvailable) {
            console.log(`Setting default model to ${firstAvailable.name} (current default unavailable)`);
            this.config.defaultModel = firstAvailable.name;
          }
        }

        this.isConnected = true;
        const availableModels = this.config.models.filter(m => m.available).map(m => m.name);
        console.log('✅ Ollama connected. Available models:', availableModels);
        return true;
      }
    } catch (error) {
      console.log('ℹ️ Ollama not available (this is optional):', error instanceof Error ? error.message : 'Connection failed');
      console.log('💡 To enable Ollama: Install from https://ollama.ai and run "ollama serve"');
    }

    this.isConnected = false;
    return false;
  }

  // Generate threat intelligence summary using Ollama
  async generateSummary(
    title: string,
    content: string,
    model: string = this.config.defaultModel
  ): Promise<{ summary: string; model: string; processingTime: number } | null> {
    if (!this.isConnected) {
      await this.checkConnection();
      if (!this.isConnected) {
        return null;
      }
    }

    const startTime = Date.now();

    try {
      const prompt = this.buildThreatAnalysisPrompt(title, content);
      
      // Handle model name with or without a tag
      let modelToUse = model;
      
      // If the exact model name isn't working, try with :latest tag
      if (!this.config.models.some(m => m.name === model && m.available)) {
        const availableTagged = this.config.models.find(m => 
          m.name.startsWith(model) && m.available
        );
        if (availableTagged) {
          modelToUse = availableTagged.name;
        } else {
          // Try with explicit latest tag
          modelToUse = `${model}:latest`;
          console.log(`Model ${model} not found, trying ${modelToUse}`);
        }
      }
      
      const request: OllamaSummaryRequest = {
        model: modelToUse,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 2000 // Increased token limit for playbook generation
        }
      };

      const response = await fetch(`${this.config.apiUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data: OllamaSummaryResponse = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        summary: data.response.trim(),
        model: `Ollama/${model}`,
        processingTime
      };

    } catch (error) {
      console.error('Ollama summary generation failed:', error);
      return null;
    }
  }

  // Build specialized prompt for threat intelligence analysis
  private buildThreatAnalysisPrompt(title: string, content: string): string {
    return `You are an expert cybersecurity analyst. Analyze the following threat intelligence report and provide a well-structured summary.

FORMATTING INSTRUCTIONS:
- Format your response using bullet points for better readability
- Use section headers (e.g., ### Overview, ### Threat Details, ### Impact Assessment, ### Recommended Actions)
- Include whitespace between sections for clarity
- Keep each bullet point concise and actionable

CONTENT INSTRUCTIONS:
- Include a brief overview section with threat type (e.g., malware, phishing, APT, vulnerability)
- Mention affected systems, sectors, or entities if specified
- Include the severity level (Critical, High, Medium, Low) with justification
- State key mitigation or response actions as actionable bullet points
- Use clear, professional language suitable for SOC teams

THREAT REPORT:
Title: ${title}

Content: ${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}

ANALYSIS:`;
  }

  // Get available models
  getAvailableModels(): OllamaModel[] {
    return this.config.models.filter(model => model.available);
  }

  // Get all configured models (including unavailable ones)
  getAllModels(): OllamaModel[] {
    return this.config.models;
  }

  // Check if service is connected
  isAvailable(): boolean {
    return this.isConnected;
  }

  // Set API URL (for custom Ollama installations)
  setApiUrl(url: string): void {
    this.config.apiUrl = url;
    this.isConnected = false;
    this.checkConnection();
  }

  // Get current configuration
  getConfig(): OllamaConfig {
    return { ...this.config };
  }

  // Set default model
  setDefaultModel(modelName: string): void {
    if (this.config.models.some(m => m.name === modelName)) {
      this.config.defaultModel = modelName;
      localStorage.setItem('ollama-default-model', modelName);
    }
  }

  // Load settings from localStorage
  loadSettings(): void {
    const savedModel = localStorage.getItem('ollama-default-model');
    const savedUrl = localStorage.getItem('ollama-api-url');
    
    if (savedModel) {
      this.config.defaultModel = savedModel;
    }
    
    if (savedUrl) {
      this.config.apiUrl = savedUrl;
    }
  }

  // Save settings to localStorage
  saveSettings(): void {
    localStorage.setItem('ollama-default-model', this.config.defaultModel);
    localStorage.setItem('ollama-api-url', this.config.apiUrl);
  }
}

export const ollamaService = new OllamaService();