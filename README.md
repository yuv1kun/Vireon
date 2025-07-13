<div align="center">

# <img src="https://img.shields.io/badge/V-000000?style=for-the-badge" height="30"/> VIREON <img src="https://img.shields.io/badge/N-000000?style=for-the-badge" height="30"/>

### AI-Powered Threat Intelligence Platform

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=for-the-badge)]()
[![React](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![LLM Powered](https://img.shields.io/badge/LLM-Powered-8A2BE2?style=for-the-badge&logo=openai)]()

<p align="center">
<img src="./public/vireon-logo.png" width="180" height="180" alt="Vireon Logo">
</p>

</div>

## 🔍 Overview

A modern, AI-powered threat intelligence platform designed for cybersecurity professionals, SOC teams, and security researchers. Vireon automatically aggregates threat intelligence from multiple sources, extracts Indicators of Compromise (IOCs), and generates AI-powered summaries to accelerate incident response and enhance security operations.

## ✨ Key Features

<table>
  <tr>
    <td width="50%">
      <h3 align="center">🤖 AI-Powered Intelligence</h3>
      <p align="center">
        <img src="https://img.icons8.com/fluency/96/artificial-intelligence.png" width="80" alt="AI Intelligence"/>
      </p>
      <ul>
        <li>Integration with Ollama LLMs (LLaMA 2, Mistral, Code Llama)</li>
        <li>Automated threat summaries and analysis</li>
        <li>Intelligent severity scoring and risk assessment</li>
        <li>Pattern recognition for attribution and threat actors</li>
      </ul>
    </td>
    <td width="50%">
      <h3 align="center">🎯 Advanced IOC Extraction</h3>
      <p align="center">
        <img src="https://img.icons8.com/fluency/96/target.png" width="80" alt="IOC Extraction"/>
      </p>
      <ul>
        <li>Sophisticated regex pattern matching for all IOC types</li>
        <li>Automatic extraction of IP addresses, domains, URLs, and hashes</li>
        <li>False positive reduction with confidence scoring</li>
        <li>Context preservation with IOC sourcing</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3 align="center">🔄 Multi-Source Aggregation</h3>
      <p align="center">
        <img src="https://img.icons8.com/fluency/96/data-configuration.png" width="80" alt="Feed Aggregation"/>
      </p>
      <ul>
        <li>Monitors RSS feeds, GitHub repositories, and security blogs</li>
        <li>Real-time feed monitoring and status tracking</li>
        <li>Configurable refresh intervals with auto-update</li>
        <li>Source prioritization and categorization</li>
      </ul>
    </td>
    <td width="50%">
      <h3 align="center">📊 Actionable Insights</h3>
      <p align="center">
        <img src="https://img.icons8.com/fluency/96/combo-chart.png" width="80" alt="Analytics Dashboard"/>
      </p>
      <ul>
        <li>Comprehensive threat distribution analysis</li>
        <li>Source performance and reliability metrics</li>
        <li>System health monitoring and feed status</li>
        <li>Trend analysis and emerging threat detection</li>
      </ul>
    </td>
  </tr>
</table>

### Additional Capabilities

<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center">
  <div style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px; margin: 5px; width: 180px; text-align: center">
    <h4>🔍 Smart Search</h4>
    Advanced filtering by keywords, IOC types, sources, severity
  </div>
  <div style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px; margin: 5px; width: 180px; text-align: center">
    <h4>📤 Export Options</h4>
    Download IOCs and reports in JSON/CSV formats
  </div>
  <div style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px; margin: 5px; width: 180px; text-align: center">
    <h4>⚡ Real-time Alerts</h4>
    Live notifications for critical threats
  </div>
  <div style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px; margin: 5px; width: 180px; text-align: center">
    <h4>🎨 Modern Interface</h4>
    Dark/light mode with cybersecurity theme
  </div>
</div>

## 🏗️ Architecture

<div align="center">
<p><em>Architecture diagram will be added here</em></p>
<p><strong>Vireon's High-Level Architecture</strong></p>
</div>

### Component Structure

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

### Core Components

<table>
  <tr>
    <th align="center">🔍 Frontend</th>
    <th align="center">⚙️ Services</th>
    <th align="center">💾 Data Layer</th>
  </tr>
  <tr>
    <td>
      <ul>
        <li><strong>Dashboard</strong> - Main interface with threat overview</li>
        <li><strong>ThreatFeed</strong> - Real-time intelligence stream</li>
        <li><strong>IOCViewer</strong> - Detailed indicator analysis</li>
        <li><strong>SourceManager</strong> - Feed configuration</li>
        <li><strong>Analytics</strong> - Visualizations and trends</li>
        <li><strong>Settings</strong> - System configuration</li>
      </ul>
    </td>
    <td>
      <ul>
        <li><strong>FeedService</strong> - Multi-source data acquisition</li>
        <li><strong>IOCExtractor</strong> - Pattern matching engine</li>
        <li><strong>AIAnalyzer</strong> - LLM integration & analysis</li>
        <li><strong>OllamaService</strong> - Local LLM orchestration</li>
        <li><strong>SearchService</strong> - Full-text search & filters</li>
        <li><strong>ExportService</strong> - Data sharing/reporting</li>
      </ul>
    </td>
    <td>
      <ul>
        <li><strong>StorageService</strong> - Persistent data management</li>
        <li><strong>Feeds Repository</strong> - Source configurations</li>
        <li><strong>Threat Reports</strong> - Processed intelligence</li>
        <li><strong>IOC Database</strong> - Extracted indicators</li>
        <li><strong>Analytics Store</strong> - Performance metrics</li>
      </ul>
    </td>
  </tr>
</table>

### Threat Intelligence Pipeline

<div style="background: rgba(0,0,0,0.03); padding: 20px; border-radius: 8px; margin: 10px 0">

#### 1. Data Acquisition

- Multi-format feed ingestion (RSS, HTML, JSON, GitHub)
- Configurable polling intervals
- Fetch status monitoring and error handling

#### 2. Processing & Extraction

- Content normalization and de-duplication
- Advanced regex-based IOC extraction
- Context preservation around each indicator
- Confidence scoring and false positive reduction

#### 3. AI Analysis

- Integration with Ollama for local LLM processing
- Hugging Face models as fallback options
- Summarization and key point extraction
- Threat severity assessment and categorization

#### 4. Storage & Indexing

- Efficient local storage with configurable retention
- Full-text indexing for search performance
- Tagged and categorized threat intelligence
- IOC deduplication and relationship mapping

#### 5. Presentation Layer

- Real-time updates and notifications
- Customizable dashboard views
- Interactive data visualizations
- Comprehensive filtering and search options

</div>

## 🚀 Quick Start

<div align="center">
<p><em>Dashboard screenshot will be added here</em></p>
</div>

### Prerequisites

<table>
  <tr>
    <td align="center" width="33%">
      <img src="https://img.icons8.com/color/48/nodejs.png" width="32" alt="Node.js"/><br>
      <strong>Node.js 18+</strong>
    </td>
    <td align="center" width="33%">
      <img src="https://img.icons8.com/color/48/npm.png" width="32" alt="npm"/><br>
      <strong>npm or yarn</strong>
    </td>
    <td align="center" width="33%">
      <img src="[https://img.icons8.com/external-filled-outline-lima-studio/64/external-llm-artificial-intelligence-filled-outline-lima-studio.png](https://miro.medium.com/v2/resize:fit:948/0*fP8ryjrDov_KhXO4)" width="32" alt="Ollama"/><br>
      <strong>Ollama</strong> (optional)
    </td>
  </tr>
</table>

### Installation

<div style="background: #f6f8fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">

#### 1. Clone the repository

```bash
git clone https://github.com/yuv1kun/Vireon.git
cd Vireon
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Configure your environment (optional)

Create a `.env` file in the root directory to customize settings:

```bash
VITE_OLLAMA_ENDPOINT=http://localhost:11434
VITE_REFRESH_INTERVAL=300000
VITE_CORS_PROXY=https://corsproxy.io/
```

#### 4. Start the development server

```bash
npm run dev
```

#### 5. Access the application

Open [http://localhost:5173](http://localhost:5173) in your browser
</div>

> 💡 **Tip:** For enhanced AI capabilities, [install Ollama](https://ollama.ai/download) and run the Llama2 model with `ollama run llama2` before starting Vireon.

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

## ⚙️ Configuration

<div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px;">
  <div style="flex: 1; min-width: 300px; background: #f8f9fa; padding: 20px; border-radius: 8px;">
    <h3>🌐 Source Management</h3>
    
    <p>Vireon supports multiple threat intelligence feed types:</p>
    
    <table>
      <tr>
        <th align="center">Feed Type</th>
        <th align="center">Description</th>
        <th align="center">Example Sources</th>
      </tr>
      <tr>
        <td><b>RSS/Atom</b></td>
        <td>Standard syndication formats</td>
        <td>US-CERT, Microsoft Security, AlienVault OTX</td>
      </tr>
      <tr>
        <td><b>GitHub</b></td>
        <td>Repository monitoring</td>
        <td>MITRE ATT&CK, CISA KEV, Mandiant IOCs</td>
      </tr>
      <tr>
        <td><b>Web Scraper</b></td>
        <td>HTML parsing for non-RSS sites</td>
        <td>Security blogs, Pastebin monitoring, Forums</td>
      </tr>
      <tr>
        <td><b>API Endpoints</b></td>
        <td>JSON/XML API integration</td>
        <td>VirusTotal, AbuseIPDB, ThreatFox</td>
      </tr>
    </table>
    
    <h4>Adding New Sources:</h4>
    <ol>
      <li>Navigate to "Sources" in the sidebar</li>
      <li>Click "Add New Source"</li>
      <li>Configure feed details:
        <ul>
          <li><b>Name:</b> Descriptive source name</li>
          <li><b>URL:</b> Feed URL or repository path</li>
          <li><b>Type:</b> Select from supported types</li>
          <li><b>Category:</b> Assign to threat category</li>
          <li><b>Priority:</b> Set importance level (1-5)</li>
          <li><b>Update Interval:</b> Refresh frequency in minutes</li>
        </ul>
      </li>
    </ol>
  </div>

  <div style="flex: 1; min-width: 300px; background: #f8f9fa; padding: 20px; border-radius: 8px;">
    <h3>🤖 AI Configuration</h3>
    
    <p>Customize how Vireon uses AI for threat intelligence analysis:</p>
    
    <h4>Local LLM Options (Ollama):</h4>
    <ul>
      <li><b>Endpoint:</b> http://localhost:11434 (default)</li>
      <li><b>Models:</b>
        <ul>
          <li><code>llama2</code> - General purpose, balanced</li>
          <li><code>mistral</code> - Efficient, high quality</li>
          <li><code>codellama</code> - Technical analysis focused</li>
          <li><code>neural-chat</code> - Fast, lightweight option</li>
        </ul>
      </li>
      <li><b>Parameters:</b> Temperature, max tokens, and system prompt can be adjusted</li>
    </ul>
    
    <h4>Hugging Face Fallback:</h4>
    <ul>
      <li>Automatically used when Ollama is unavailable</li>
      <li>Uses WebGPU acceleration if available</li>
      <li>Falls back to CPU processing if needed</li>
      <li>Model: <code>Xenova/distilbart-cnn-6-6</code> (summarization)</li>
    </ul>
  </div>
</div>

<details>
  <summary><b>🔍 Advanced Environment Variables</b></summary>
  
  <table>
    <tr>
      <th>Variable</th>
      <th>Description</th>
      <th>Default</th>
    </tr>
    <tr>
      <td><code>VITE_OLLAMA_ENDPOINT</code></td>
      <td>URL for Ollama API endpoint</td>
      <td><code>http://localhost:11434</code></td>
    </tr>
    <tr>
      <td><code>VITE_REFRESH_INTERVAL</code></td>
      <td>Auto-refresh interval (ms)</td>
      <td><code>300000</code> (5 minutes)</td>
    </tr>
    <tr>
      <td><code>VITE_CORS_PROXY</code></td>
      <td>CORS proxy for external feeds</td>
      <td><code>https://corsproxy.io/</code></td>
    </tr>
    <tr>
      <td><code>VITE_MAX_FEED_ITEMS</code></td>
      <td>Maximum items per feed</td>
      <td><code>50</code></td>
    </tr>
    <tr>
      <td><code>VITE_STORAGE_RETENTION</code></td>
      <td>Data retention period (days)</td>
      <td><code>30</code></td>
    </tr>
  </table>
</details>
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

## 🧪 Development & Contributing

<div align="center">
<img src="https://img.icons8.com/fluency/96/developer-mode.png" width="80" alt="Developer Mode" />
<p><em>Vireon is built with modern web technologies for cyber security professionals</em></p>
</div>

### Development Workflow

<div style="background: #f8f9fa; padding: 16px; border-radius: 8px;">

```bash
# Clone the repository
git clone https://github.com/yuv1kun/Vireon.git
cd Vireon

# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Lint codebase
npm run lint

# Type check
npm run typecheck

# Run tests
npm run test

# Build for production
npm run build

# Preview production build locally
npm run preview
```

</div>

### Technology Stack

<table>
  <tr>
    <th>Category</th>
    <th>Technologies</th>
  </tr>
  <tr>
    <td>Frontend Framework</td>
    <td>
      <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react" alt="React" />
      <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript" alt="TypeScript" />
    </td>
  </tr>
  <tr>
    <td>Build Tools</td>
    <td>
      <img src="https://img.shields.io/badge/Vite-5.4.1-646CFF?style=flat&logo=vite" alt="Vite" />
      <img src="https://img.shields.io/badge/ESLint-8.0.0-4B32C3?style=flat&logo=eslint" alt="ESLint" />
    </td>
  </tr>
  <tr>
    <td>Styling</td>
    <td>
      <img src="https://img.shields.io/badge/TailwindCSS-3.4.1-38B2AC?style=flat&logo=tailwind-css" alt="TailwindCSS" />
      <img src="https://img.shields.io/badge/Lucide_Icons-0.295.0-5468FF?style=flat&logo=feather" alt="Lucide Icons" />
    </td>
  </tr>
  <tr>
    <td>AI/ML</td>
    <td>
      <img src="https://img.shields.io/badge/Hugging_Face-Transformers-FFD21E?style=flat&logo=huggingface" alt="Hugging Face" />
      <img src="https://img.shields.io/badge/Ollama-Local_LLMs-0A0A0A?style=flat" alt="Ollama" />
    </td>
  </tr>
</table>

### Project Structure

<details>
  <summary><b>Click to expand directory structure</b></summary>

```
vireon/
├── public/                 # Static assets served as-is
│   ├── favicon.ico        # Site favicon
│   └── vireon-logo.png    # Logo image
│
├── src/
│   ├── components/        # Reusable React components
│   │   ├── Dashboard/     # Main dashboard components
│   │   │   ├── Analytics.tsx      # Analytics widgets
│   │   │   ├── RecentActivity.tsx # Activity timeline
│   │   │   └── StatCards.tsx      # Statistics cards
│   │   ├── IOC/          # IOC related components
│   │   │   ├── IOCTable.tsx       # IOC display table
│   │   │   ├── IOCDetails.tsx     # Detailed IOC view
│   │   │   └── IOCFilters.tsx     # Filtering options
│   │   ├── Navigation.tsx # Site navigation
│   │   ├── ThreatFeed.tsx # Main feed display
│   │   ├── SourceManager.tsx # Feed source management
│   │   ├── ui/           # Shared UI components
│   │   │   ├── Button.tsx       # Custom buttons
│   │   │   ├── Card.tsx         # Card containers
│   │   │   └── Dropdown.tsx     # Dropdown menus
│   │   └── LLMSettings.tsx # AI model settings
│   │
│   ├── services/         # Core business logic
│   │   ├── feedParser.ts      # Feed acquisition and parsing
│   │   ├── iocExtractor.ts    # IOC pattern extraction
│   │   ├── aiAnalyzer.ts      # AI-powered analysis
│   │   ├── ollamaService.ts   # Ollama LLM integration
│   │   ├── searchService.ts   # Search functionality
│   │   ├── storageService.ts  # Data persistence
│   │   └── threatIntelPipeline.ts # Main orchestration
│   │
│   ├── pages/           # Route-level components
│   │   ├── DashboardPage.tsx  # Main dashboard page
│   │   ├── SettingsPage.tsx   # Settings page
│   │   └── ThreatDetailPage.tsx # Detailed threat view
│   │
│   ├── utils/           # Helper utilities
│   │   ├── dateUtils.ts       # Date formatting
│   │   ├── formatters.ts      # Data formatters
│   │   └── validators.ts      # Input validation
│   │
│   ├── types/           # TypeScript definitions
│   │   ├── feed.types.ts      # Feed related types
│   │   ├── ioc.types.ts       # IOC related types
│   │   └── threat.types.ts    # Threat report types
│   │
│   ├── data/            # Static data & defaults
│   │   ├── defaultSources.ts  # Default feed sources
│   │   └── mockData.ts        # Testing/demo data
│   │
│   ├── main.tsx         # Application entry point
│   ├── App.tsx          # Main application component
│   └── index.css        # Global styles
│
├── .env                 # Environment variables
├── package.json         # Dependencies & scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── README.md           # Project documentation
```

</details>

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **Business Logic**: Add to `src/services/`
3. **Routing**: Update `src/main.tsx`
4. **Styling**: Use Tailwind CSS with design tokens

## 🤝 Contributing

<div style="background: #f0f8ff; padding: 20px; border-left: 5px solid #3498db; border-radius: 5px; margin-bottom: 20px;">
Vireon welcomes contributions from security researchers, developers, and threat intelligence professionals. Together, we can build a more powerful threat intelligence platform!
</div>

### Contribution Workflow

<table>
  <tr>
    <td width="50px" align="center"><b>1</b></td>
    <td width="250px"><b>Fork & Clone</b></td>
    <td>Fork the repository on GitHub and clone your fork locally</td>
  </tr>
  <tr>
    <td align="center"><b>2</b></td>
    <td><b>Create Branch</b></td>
    <td><code>git checkout -b feature/your-feature-name</code></td>
  </tr>
  <tr>
    <td align="center"><b>3</b></td>
    <td><b>Develop & Test</b></td>
    <td>Make your changes, add tests, ensure existing tests pass</td>
  </tr>
  <tr>
    <td align="center"><b>4</b></td>
    <td><b>Commit</b></td>
    <td><code>git commit -am 'Add feature: description of changes'</code></td>
  </tr>
  <tr>
    <td align="center"><b>5</b></td>
    <td><b>Push</b></td>
    <td><code>git push origin feature/your-feature-name</code></td>
  </tr>
  <tr>
    <td align="center"><b>6</b></td>
    <td><b>Pull Request</b></td>
    <td>Open a PR against the main branch with a clear description</td>
  </tr>
</table>

### Contribution Areas

We especially welcome contributions in these areas:

- **New Feed Sources**: Implementations for additional threat intel sources
- **IOC Extraction**: Improved detection patterns and confidence scoring
- **UI Enhancements**: Dashboard widgets and visualizations
- **AI Integration**: Enhanced LLM analysis and summarization techniques
- **Documentation**: Tutorials, examples, and clarifications

### Code Style & Guidelines

- Follow the existing TypeScript/React patterns in the codebase
- Maintain type safety with proper TypeScript interfaces
- Write unit tests for new functionality
- Use Tailwind CSS for styling following project conventions
- Document complex functions and components

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

<div style="background: #fff8f8; padding: 20px; border-left: 5px solid #e74c3c; border-radius: 5px; margin-bottom: 20px;">
<h3>⚠️ Before Reporting an Issue</h3>
Check the common solutions below, clear your browser cache, and try running Vireon in a private/incognito window to rule out extension conflicts.
</div>

### Common Issues & Solutions

<details>
  <summary><b>AI/LLM Connection Problems</b></summary>
  <div style="padding: 15px; background: #f9f9f9; margin: 10px 0;">
    
  #### Symptoms
  - "Unable to connect to Ollama" error message
  - AI summaries not generating or timing out
  - Default to "Rule-based Fallback" model
  
  #### Solutions
  1. Verify Ollama is running with `ollama serve` in terminal
  2. Check connection settings:
     - Default URL: `http://localhost:11434`
     - No trailing slash
     - No authentication headers (local install)
  3. Test with `curl http://localhost:11434/api/tags` to verify API access
  4. If using Docker, ensure proper port mapping
  5. Verify the model is pulled: `ollama list`
  6. System fallback to Hugging Face models is automatic
  </div>
</details>

<details>
  <summary><b>CORS & Network Issues</b></summary>
  <div style="padding: 15px; background: #f9f9f9; margin: 10px 0;">
    
  #### Symptoms
  - Feed loading errors in console
  - "Failed to fetch" warnings
  - Empty threat feed despite valid sources
  
  #### Solutions
  1. Vireon uses multiple CORS proxy fallbacks:
     - Default: `https://corsproxy.io/`
     - Alternatives in `src/services/feedParser.ts`
  2. Configure custom proxy in `.env`:
     ```
     VITE_CORS_PROXY=https://your-proxy.example.com/
     ```
  3. For persistent issues with specific feeds:
     - Use server-side feed fetching
     - Set up a dedicated CORS proxy
     - Switch to API-based sources when available
  </div>
</details>

<details>
  <summary><b>Performance & Storage Issues</b></summary>
  <div style="padding: 15px; background: #f9f9f9; margin: 10px 0;">
    
  #### Symptoms
  - Sluggish UI response
  - High memory usage
  - Long loading times for threat data
  
  #### Solutions
  1. Optimize refresh intervals:
     - Increase interval in settings (e.g., 10-15 minutes)
     - Disable auto-refresh for non-critical sources
  2. Manage data storage:
     - Regularly clear old threat data
     - In Console: `localStorage.clear()`
     - Or use "Clear Data" in Settings
  3. Limit active sources:
     - Prioritize high-value feeds
     - Disable rarely-used sources
  4. Reduce AI processing:
     - Use "Simple Analysis" mode
     - Process only critical threats
  </div>
</details>

### Diagnostic Tools

```javascript
// Run in browser console to check system status
const diagnostics = {
  storageUsed: (JSON.stringify(localStorage).length / 1024 / 1024).toFixed(2) + " MB",
  activeSources: Object.keys(JSON.parse(localStorage.getItem('threatSources') || '{}')).length,
  threatCount: JSON.parse(localStorage.getItem('threatReports') || '[]').length,
  browserInfo: navigator.userAgent,
  lastRefresh: new Date(JSON.parse(localStorage.getItem('lastRefresh') || 'null')).toLocaleString()
};

console.table(diagnostics);
```

### Getting Help

- 📚 Review the [Wiki](https://github.com/yuv1kun/Vireon/wiki) for detailed documentation
- 🔍 Check [existing issues](https://github.com/yuv1kun/Vireon/issues) for similar problems
- 📝 Submit new issues with:
  - Detailed steps to reproduce
  - Console output/errors
  - Browser and OS information
  - Screenshots if applicable

## 📝 License

<div style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin-bottom: 20px;">

This project is licensed under the <a href="https://github.com/yuv1kun/Vireon/blob/main/LICENSE">MIT License</a>.

```
Copyright (c) 2023-2025 Yuvraj Kumar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions...
```

Full license text available in the LICENSE file.
</div>

## ✨ Acknowledgements

- Icons by [Lucide](https://lucide.dev/) and [Icons8](https://icons8.com/)
- LLM support via [Ollama](https://ollama.ai/) and [Hugging Face](https://huggingface.co/)
- Built with [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), and [Vite](https://vitejs.dev/)

## 💬 Get in Touch

- GitHub: [yuv1kun](https://github.com/yuv1kun)
- Project Repository: [github.com/yuv1kun/Vireon](https://github.com/yuv1kun/Vireon)

---

<div align="center">

### Vireon: Empowering Security Through AI-Enhanced Threat Intelligence

<p>🔍 <strong>Detect</strong> &nbsp;&nbsp; 🔐 <strong>Analyze</strong> &nbsp;&nbsp; 🗝 <strong>Defend</strong></p>

</div>
**Built with ❤️ for the cybersecurity community**
