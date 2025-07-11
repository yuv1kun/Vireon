import { LLMSettings } from '@/components/LLMSettings';

export default function LLMSettingsPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold glow-text mb-2">
          LLM Configuration
        </h1>
        <p className="text-muted-foreground">
          Configure and manage Large Language Models for enhanced threat intelligence analysis.
        </p>
      </div>
      
      <LLMSettings />
    </div>
  );
}