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
    defaultModel: 'llama2',
    timeout: 30000
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
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        const installedModels = data.models || [];
        
        // Update model availability
        this.config.models.forEach(model => {
          model.available = installedModels.some((installed: any) => 
            installed.name.includes(model.name)
          );
        });

        this.isConnected = true;
        console.log('✅ Ollama connected. Available models:', installedModels.map((m: any) => m.name));
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
      
      const request: OllamaSummaryRequest = {
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 300
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
    return `You are an expert cybersecurity analyst. Analyze the following threat intelligence report and provide a concise summary.

INSTRUCTIONS:
- Summarize in exactly 3-5 sentences
- Clearly identify the threat type (e.g., malware, phishing, APT, vulnerability)
- Mention affected systems, sectors, or entities if specified
- Include the severity level (Critical, High, Medium, Low)
- State key mitigation or response actions
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