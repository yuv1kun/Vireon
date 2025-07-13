// AI Summarization Service using Hugging Face Transformers and Ollama LLMs
import { pipeline } from '@huggingface/transformers';
import { ollamaService } from './ollamaService';

export interface ThreatSummary {
  summary: string;
  keyPoints: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  threatType: string;
  affectedSectors: string[];
  recommendations: string[];
  confidence: number;
  model: string;
  processingTime: number;
}

class AIThreatAnalyzer {
  private summarizer: any = null;
  private classifier: any = null;
  private isInitialized = false;

  constructor() {
    this.initializeModels();
  }

  private async initializeModels(): Promise<void> {
    try {
      console.log('Initializing AI models...');
      
      // Initialize summarization model
      this.summarizer = await pipeline(
        'summarization',
        'Xenova/distilbart-cnn-6-6',
        { device: 'webgpu' }
      );

      // Initialize text classification model
      this.classifier = await pipeline(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { device: 'webgpu' }
      );

      this.isInitialized = true;
      console.log('AI models initialized successfully');
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU:', error);
      try {
        // Fallback to CPU
        this.summarizer = await pipeline(
          'summarization',
          'Xenova/distilbart-cnn-6-6'
        );
        
        this.isInitialized = true;
        console.log('AI models initialized on CPU');
      } catch (fallbackError) {
        console.error('Failed to initialize AI models:', fallbackError);
        this.isInitialized = false;
      }
    }
  }

  async generateThreatSummary(
    title: string, 
    content: string, 
    iocs: any[] = [],
    preferredModel?: string
  ): Promise<ThreatSummary> {
    const startTime = Date.now();

    // If formatting instructions are not already included, add them
    if (!content.includes('FORMATTING INSTRUCTIONS:')) {
      content += `

FORMATTING INSTRUCTIONS:
` +
        `- Format your response using bullet points for better readability
` + 
        `- Use section headers (e.g., ### Overview, ### Technical Details, ### Impact Assessment)
` + 
        `- Include whitespace between sections for clarity
` + 
        `- Keep each bullet point concise and actionable
` + 
        `- Organize information logically with most critical information first
` +
        `- Use markdown formatting for enhanced readability
`;
    }

    // Try Ollama first if a preferred model is specified or if available
    if (preferredModel?.startsWith('ollama/') || ollamaService.isAvailable()) {
      const ollamaModel = preferredModel?.replace('ollama/', '') || ollamaService.getConfig().defaultModel;
      const ollamaResult = await ollamaService.generateSummary(title, content, ollamaModel);
      
      if (ollamaResult) {
        const analysis = this.analyzeThreatContent(title, content, iocs);
        const keyPoints = this.extractKeyPoints(content, analysis);
        const recommendations = this.generateRecommendations(analysis, iocs);

        return {
          summary: ollamaResult.summary,
          keyPoints,
          severity: analysis.severity,
          threatType: analysis.threatType,
          affectedSectors: analysis.affectedSectors,
          recommendations,
          confidence: analysis.confidence,
          model: ollamaResult.model,
          processingTime: ollamaResult.processingTime
        };
      }
    }

    if (!this.isInitialized || !this.summarizer) {
      return this.generateFallbackSummary(title, content, iocs, startTime);
    }

    try {
      // Prepare text for summarization (truncate if too long)
      const fullText = `${title}. ${content}`;
      const truncatedText = this.truncateText(fullText, 1024);

      // Generate summary
      const summaryResult = await this.summarizer(truncatedText, {
        max_length: 150,
        min_length: 50,
        do_sample: false
      });

      const summary = Array.isArray(summaryResult) 
        ? summaryResult[0]?.summary_text || truncatedText.substring(0, 200)
        : summaryResult.summary_text || truncatedText.substring(0, 200);

      // Analyze content for threat characteristics
      const analysis = this.analyzeThreatContent(title, content, iocs);
      
      // Extract key points
      const keyPoints = this.extractKeyPoints(content, analysis);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(analysis, iocs);

      const processingTime = Date.now() - startTime;

      return {
        summary,
        keyPoints,
        severity: analysis.severity,
        threatType: analysis.threatType,
        affectedSectors: analysis.affectedSectors,
        recommendations,
        confidence: analysis.confidence,
        model: 'Xenova/distilbart-cnn-6-6',
        processingTime
      };

    } catch (error) {
      console.error('Error generating AI summary:', error);
      return this.generateFallbackSummary(title, content, iocs, startTime);
    }
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    
    // Try to truncate at sentence boundary
    const truncated = text.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    
    if (lastSentence > maxLength * 0.7) {
      return truncated.substring(0, lastSentence + 1);
    }
    
    return truncated + '...';
  }

  private analyzeThreatContent(title: string, content: string, iocs: any[]): {
    severity: 'low' | 'medium' | 'high' | 'critical';
    threatType: string;
    affectedSectors: string[];
    confidence: number;
  } {
    const fullText = `${title} ${content}`.toLowerCase();
    
    // Severity analysis
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    const criticalKeywords = ['zero-day', 'critical vulnerability', 'nation-state', 'apt', 'supply chain'];
    const highKeywords = ['ransomware', 'data breach', 'malware', 'exploit', 'backdoor'];
    const mediumKeywords = ['phishing', 'suspicious', 'trojan', 'botnet'];
    
    if (criticalKeywords.some(keyword => fullText.includes(keyword))) {
      severity = 'critical';
    } else if (highKeywords.some(keyword => fullText.includes(keyword))) {
      severity = 'high';
    } else if (mediumKeywords.some(keyword => fullText.includes(keyword))) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    // Threat type classification
    let threatType = 'Unknown';
    
    const threatTypes = {
      'APT': ['apt', 'advanced persistent', 'nation-state', 'targeted attack'],
      'Ransomware': ['ransomware', 'encryption', 'ransom', 'lockbit', 'conti'],
      'Malware': ['malware', 'trojan', 'virus', 'backdoor', 'rat'],
      'Phishing': ['phishing', 'credential', 'social engineering', 'fake'],
      'Supply Chain': ['supply chain', 'third-party', 'dependency', 'npm', 'package'],
      'Vulnerability': ['vulnerability', 'cve', 'exploit', 'patch', 'zero-day']
    };

    for (const [type, keywords] of Object.entries(threatTypes)) {
      if (keywords.some(keyword => fullText.includes(keyword))) {
        threatType = type;
        break;
      }
    }

    // Affected sectors analysis
    const sectors: string[] = [];
    const sectorKeywords = {
      'Healthcare': ['healthcare', 'hospital', 'medical', 'health'],
      'Financial': ['financial', 'bank', 'payment', 'finance', 'fintech'],
      'Government': ['government', 'agency', 'federal', 'municipal'],
      'Education': ['education', 'university', 'school', 'academic'],
      'Energy': ['energy', 'power', 'utility', 'oil', 'gas'],
      'Technology': ['technology', 'software', 'tech', 'cloud'],
      'Manufacturing': ['manufacturing', 'industrial', 'factory'],
      'Critical Infrastructure': ['infrastructure', 'critical', 'transportation']
    };

    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
      if (keywords.some(keyword => fullText.includes(keyword))) {
        sectors.push(sector);
      }
    }

    // Calculate confidence based on IOCs and content analysis
    let confidence = 0.6;
    
    if (iocs.length > 0) confidence += 0.2;
    if (iocs.length > 5) confidence += 0.1;
    if (threatType !== 'Unknown') confidence += 0.1;
    if (sectors.length > 0) confidence += 0.1;

    return {
      severity,
      threatType,
      affectedSectors: sectors,
      confidence: Math.min(1.0, confidence)
    };
  }

  private extractKeyPoints(content: string, analysis: any): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keyPoints: string[] = [];

    // Look for sentences containing important keywords
    const importantKeywords = [
      'attack', 'malware', 'vulnerability', 'exploit', 'threat',
      'compromised', 'infected', 'malicious', 'suspicious', 'detected'
    ];

    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase();
      const keywordCount = importantKeywords.filter(keyword => 
        sentenceLower.includes(keyword)
      ).length;

      if (keywordCount >= 2 && sentence.trim().length > 20) {
        keyPoints.push(sentence.trim());
      }
    });

    // If not enough key points found, take first few sentences
    if (keyPoints.length < 3) {
      sentences.slice(0, 3).forEach(sentence => {
        if (sentence.trim().length > 20 && !keyPoints.includes(sentence.trim())) {
          keyPoints.push(sentence.trim());
        }
      });
    }

    return keyPoints.slice(0, 5); // Limit to 5 key points
  }

  private generateRecommendations(analysis: any, iocs: any[]): string[] {
    const recommendations: string[] = [];

    // Base recommendations based on threat type
    switch (analysis.threatType) {
      case 'APT':
        recommendations.push('Implement enhanced network monitoring and threat hunting');
        recommendations.push('Review and strengthen access controls and segmentation');
        recommendations.push('Consider threat intelligence sharing with relevant authorities');
        break;
      
      case 'Ransomware':
        recommendations.push('Ensure backup systems are isolated and regularly tested');
        recommendations.push('Deploy endpoint detection and response (EDR) solutions');
        recommendations.push('Implement application whitelisting and behavior analysis');
        break;
      
      case 'Phishing':
        recommendations.push('Enhance email security filters and user training');
        recommendations.push('Implement multi-factor authentication for all accounts');
        recommendations.push('Deploy email authentication protocols (DMARC, SPF, DKIM)');
        break;
      
      case 'Supply Chain':
        recommendations.push('Audit and monitor third-party dependencies');
        recommendations.push('Implement software composition analysis tools');
        recommendations.push('Establish vendor security assessment procedures');
        break;
      
      default:
        recommendations.push('Monitor network traffic for suspicious activity');
        recommendations.push('Update security policies and incident response procedures');
        recommendations.push('Implement comprehensive logging and monitoring');
    }

    // IOC-specific recommendations
    if (iocs.some((ioc: any) => ioc.type === 'ip')) {
      recommendations.push('Block identified malicious IP addresses at network perimeter');
    }
    
    if (iocs.some((ioc: any) => ioc.type === 'url' || ioc.type === 'domain')) {
      recommendations.push('Update DNS filtering and web proxies to block malicious domains');
    }
    
    if (iocs.some((ioc: any) => ioc.type === 'hash')) {
      recommendations.push('Update antivirus signatures and scan systems for identified file hashes');
    }

    // Severity-based recommendations
    if (analysis.severity === 'critical') {
      recommendations.push('Activate incident response team and consider emergency patching');
      recommendations.push('Notify relevant stakeholders and regulatory bodies if required');
    }

    return recommendations.slice(0, 6); // Limit to 6 recommendations
  }

  private generateFallbackSummary(
    title: string, 
    content: string, 
    iocs: any[], 
    startTime: number
  ): ThreatSummary {
    const analysis = this.analyzeThreatContent(title, content, iocs);
    
    // Generate a simple extractive summary
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const summary = sentences.slice(0, 2).join('. ') + '.';
    
    const keyPoints = this.extractKeyPoints(content, analysis);
    const recommendations = this.generateRecommendations(analysis, iocs);

    return {
      summary: summary || title,
      keyPoints,
      severity: analysis.severity,
      threatType: analysis.threatType,
      affectedSectors: analysis.affectedSectors,
      recommendations,
      confidence: analysis.confidence * 0.8, // Lower confidence for fallback
      model: 'Rule-based Fallback',
      processingTime: Date.now() - startTime
    };
  }

  async batchSummarize(items: Array<{ title: string; content: string; iocs?: any[] }>): Promise<ThreatSummary[]> {
    const summaries: ThreatSummary[] = [];
    
    // Process in smaller batches to avoid overwhelming the browser
    const batchSize = 3;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(item => 
        this.generateThreatSummary(item.title, item.content, item.iocs || [])
      );
      
      const batchResults = await Promise.all(batchPromises);
      summaries.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return summaries;
  }

  // Method to check if AI is ready
  isReady(): boolean {
    return this.isInitialized;
  }

  // Get model status
  getStatus(): { initialized: boolean; model: string; device: string } {
    return {
      initialized: this.isInitialized,
      model: this.isInitialized ? 'Xenova/distilbart-cnn-6-6' : 'Not loaded',
      device: 'WebGPU/CPU'
    };
  }
}

export const aiAnalyzer = new AIThreatAnalyzer();