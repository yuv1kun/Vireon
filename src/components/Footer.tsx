import { Shield, Zap, Github, Heart, Code, Database, Cpu, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/20 bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Branding */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Shield className="h-8 w-8 text-primary" />
                <Zap className="absolute -top-1 -right-1 h-4 w-4 text-neon-purple animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold glow-text bg-gradient-accent bg-clip-text text-transparent">
                  Vireon
                </h3>
                <p className="text-xs text-muted-foreground">Threat Intelligence</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Advanced AI-powered threat intelligence aggregator for cybersecurity professionals, SOC teams, and security researchers.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h4 className="font-semibold text-primary">Key Features</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Database className="h-3 w-3" />
                Real-time Feed Aggregation
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="h-3 w-3" />
                AI-Powered Analysis
              </li>
              <li className="flex items-center gap-2">
                <Globe className="h-3 w-3" />
                IOC Extraction & Export
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                Automated Threat Detection
              </li>
            </ul>
          </div>

          {/* Technology */}
          <div className="space-y-4">
            <h4 className="font-semibold text-primary">Built With</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>React + TypeScript</li>
              <li>Tailwind CSS + shadcn/ui</li>
              <li>Hugging Face Transformers</li>
              <li>Browser-based ML/AI</li>
            </ul>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-primary">Resources</h4>
            <div className="flex flex-col space-y-2">
              <a 
                href="https://github.com" 
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="h-3 w-3" />
                View Source Code
              </a>
              <a 
                href="#" 
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Code className="h-3 w-3" />
                API Documentation
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border/20 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground">
            © 2024 Vireon Threat Intelligence Platform. Built for cybersecurity professionals.
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-4 md:mt-0">
            Made with <Heart className="h-3 w-3 text-red-500" /> for the cybersecurity community
          </div>
        </div>
      </div>
    </footer>
  );
}