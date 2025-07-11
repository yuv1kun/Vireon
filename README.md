# Vireon: Threat Intelligence Feed Aggregator

![Vireon Dashboard](https://img.shields.io/badge/Status-Demo%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![AI Powered](https://img.shields.io/badge/AI-Powered-purple)

A modern, AI-powered threat intelligence feed aggregator designed for cybersecurity professionals, SOC teams, and security researchers. Vireon automatically aggregates threat intelligence from multiple sources, extracts IOCs, and generates AI-powered summaries to accelerate incident response.

## 🚀 Features

### Core Capabilities
- **🔄 Real-time Feed Aggregation** - Monitors RSS feeds, GitHub repositories, and security blogs
- **🎯 Automatic IOC Extraction** - Extracts IP addresses, domains, URLs, and file hashes using advanced regex patterns
- **🤖 AI-Powered Summarization** - Integrates with Ollama LLMs (LLaMA 2, Mistral, Code Llama) and Hugging Face models
- **📊 Interactive Dashboard** - Modern React-based interface with real-time updates
- **🔍 Advanced Search & Filtering** - Search by keywords, IOCs, sources, and severity
- **📤 Export Functionality** - Download IOCs and reports in JSON/CSV formats
- **⚡ Live Threat Monitoring** - Real-time alerts for critical threats with visual indicators

### Advanced Features
- **🎛️ Source Management** - Add, configure, and prioritize threat intelligence feeds
- **📈 Analytics Dashboard** - Threat distribution, source performance, and system health metrics
- **🔧 LLM Configuration** - Switch between multiple AI models for different analysis needs
- **🔄 Auto-refresh** - Configurable automatic feed updates (5-minute intervals)
- **🎨 Modern UI** - Futuristic cybersecurity-themed interface with dark/light mode

## 🏗️ Architecture

```
vireon/
├── src/
│   ├── components/          # React UI components
│   │   ├── Dashboard.tsx    # Main dashboard interface
│   │   ├── ThreatFeed.tsx   # Live threat feed display
│   │   ├── IOCManager.tsx   # IOC management interface
│   │   ├── LLMSettings.tsx  # AI model configuration
│   │   └── ui/             # Reusable UI components
│   ├── services/           # Core business logic
│   │   ├── feedParser.ts   # Multi-source feed aggregation
│   │   ├── iocExtractor.ts # IOC pattern matching & extraction
│   │   ├── aiAnalyzer.ts   # AI summarization engine
│   │   ├── ollamaService.ts# Ollama LLM integration
│   │   └── dataStorage.ts  # Data persistence layer
│   └── pages/              # Application pages
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Optional: Ollama for local LLM support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vireon-threat-intelligence
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open http://localhost:5173 in your browser
   - The dashboard will load with sample threat intelligence data

### Optional: Ollama Setup for Enhanced AI

1. **Install Ollama** (for local LLM support)
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Windows
   # Download from https://ollama.ai/download
   ```

2. **Start Ollama service**
   ```bash
   ollama serve
   ```

3. **Pull supported models**
   ```bash
   ollama pull llama2        # Meta's LLaMA 2
   ollama pull mistral       # Mistral 7B
   ollama pull codellama     # Code Llama
   ollama pull neural-chat   # Intel Neural Chat
   ```

4. **Configure in Vireon**
   - Navigate to "LLM Settings" in the sidebar
   - Test connection to http://localhost:11434
   - Select your preferred default model

## 📖 Usage Guide

### 1. Dashboard Overview
- **Live Threat Feed**: Real-time updates from configured sources
- **IOC Summary**: Quick overview of extracted indicators
- **Source Status**: Monitor feed health and connectivity
- **Analytics**: Threat distribution and system metrics

### 2. Threat Feed Management
- **Auto-refresh**: Toggle 5-minute automatic updates
- **Manual Refresh**: Force immediate feed update
- **Threat Selection**: Click any threat for detailed analysis
- **Export IOCs**: Download indicators in JSON format

### 3. AI-Powered Analysis
- **Automatic Summaries**: Generated for all new threats
- **Model Selection**: Choose between Ollama and Hugging Face models
- **Regenerate Summaries**: Try different models for comparison
- **Model Transparency**: See which AI generated each summary

### 4. Search & Filter
- **Global Search**: Find threats by keywords or IOCs
- **Source Filtering**: Filter by specific feed sources
- **Severity Filtering**: Focus on critical or high-severity threats
- **Date Range**: Filter by publication timeframe

### 5. IOC Management
- **Bulk Export**: Download all IOCs in structured format
- **Source Tracking**: See origin and context for each IOC
- **Type Classification**: IP addresses, domains, URLs, hashes
- **Metadata Preservation**: Timestamp, source, and context included

## 🔧 Configuration

### Adding New Threat Intelligence Sources

1. Navigate to "Sources" in the sidebar
2. Click "Add New Source"
3. Configure feed details:
   - **Name**: Descriptive source name
   - **URL**: RSS/Atom feed URL or GitHub repository
   - **Type**: RSS, GitHub, or Web Scraper
   - **Update Interval**: How often to check for updates
   - **Priority**: High, Medium, or Low

### Configuring AI Models

1. Go to "LLM Settings"
2. **Ollama Configuration**:
   - Set API URL (default: http://localhost:11434)
   - Test connection
   - Select default model
3. **Fallback Models**: Hugging Face models automatically available

### Customizing Refresh Intervals

- **Auto-refresh**: 5-minute intervals (configurable)
- **Manual refresh**: Available via dashboard button
- **Source-specific**: Configure per-source update frequencies

## 🏭 Production Deployment

### Docker Deployment

1. **Build Docker image**
   ```bash
   docker build -t vireon-threat-intel .
   ```

2. **Run container**
   ```bash
   docker run -p 5173:5173 -d vireon-threat-intel
   ```

### Manual Deployment

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Serve static files**
   ```bash
   npm run preview
   # Or deploy the 'dist' folder to your web server
   ```

### Environment Configuration

- **CORS Proxies**: Configure in `src/services/feedParser.ts`
- **Data Storage**: LocalStorage by default, easily adaptable to databases
- **API Endpoints**: Configurable in service files

## 🔌 API Integration

### Adding Custom Data Sources

```typescript
// Example: Custom feed integration
import { feedParser } from './services/feedParser';

const customSource = {
  name: 'Custom Threat Feed',
  url: 'https://example.com/threats.xml',
  type: 'rss',
  priority: 'high'
};

feedParser.addCustomSource(customSource);
```

### IOC Extraction Customization

```typescript
// Example: Custom IOC patterns
import { iocExtractor } from './services/iocExtractor';

const customPatterns = {
  'custom-hash': /\b[a-f0-9]{64}\b/gi,  // Custom hash format
  'custom-id': /ID-\d{6,}/gi             // Custom identifier
};

iocExtractor.addPatterns(customPatterns);
```

## 🧪 Development

### Development Server
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Project Structure
- **Components**: Reusable React components
- **Services**: Business logic and data processing
- **Pages**: Route-level components
- **Hooks**: Custom React hooks
- **Utils**: Utility functions and helpers

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **Business Logic**: Add to `src/services/`
3. **Routing**: Update `src/main.tsx`
4. **Styling**: Use Tailwind CSS with design tokens

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📋 Requirements Met

✅ **Multi-source aggregation** (RSS, GitHub, web scrapers)  
✅ **Automatic IOC extraction** (IP, domains, URLs, hashes)  
✅ **AI-powered summarization** (Ollama + Hugging Face)  
✅ **Interactive dashboard** (Modern React interface)  
✅ **Search and filtering** (Keywords, IOCs, sources)  
✅ **Export functionality** (JSON/CSV downloads)  
✅ **Real-time updates** (Live feed monitoring)  
✅ **Modular architecture** (Clean, maintainable code)  

## 🐛 Troubleshooting

### Common Issues

1. **Ollama Connection Failed**
   - Ensure Ollama is running: `ollama serve`
   - Check URL in LLM Settings: http://localhost:11434
   - Fallback to Hugging Face models automatic

2. **CORS Errors**
   - Multiple proxy fallbacks implemented
   - Check browser console for specific errors
   - Some feeds may require direct server integration

3. **Performance Issues**
   - Reduce auto-refresh frequency
   - Limit number of active sources
   - Clear browser storage to reset data

### Getting Help

- Check the [Demo Guide](docs/DEMO_GUIDE.md) for usage examples
- Review [Technical Approach](docs/TECHNICAL_APPROACH.md) for architecture details
- Open an issue for bugs or feature requests

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Hackathon Submission

This project was developed for the Threat Intelligence Feed Aggregator hackathon challenge, demonstrating:

- **Real-time threat intelligence aggregation**
- **AI-powered analysis and summarization**
- **Comprehensive IOC extraction and management**
- **Modern, intuitive user interface**
- **Extensible, production-ready architecture**

For demonstration purposes, see the [Demo Guide](docs/DEMO_GUIDE.md) and [Technical Approach](docs/TECHNICAL_APPROACH.md).

---

**Built with ❤️ for the cybersecurity community**