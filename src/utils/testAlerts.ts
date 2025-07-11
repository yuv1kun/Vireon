// Test utility to generate sample alerts for demonstration
export const generateTestThreat = () => {
  const threatSamples = [
    {
      title: "Critical APT Campaign Targeting Financial Institutions",
      description: "New advanced persistent threat campaign discovered targeting major banks with sophisticated malware",
      category: "APT",
      severity: "critical" as const,
      source: "Threat Intelligence Demo"
    },
    {
      title: "Ransomware Group Exploiting Zero-Day Vulnerability",
      description: "Known ransomware group leveraging recently discovered zero-day exploit in popular software",
      category: "Ransomware", 
      severity: "high" as const,
      source: "Security Research Team"
    },
    {
      title: "Supply Chain Attack on Open Source Package",
      description: "Malicious code injected into widely-used npm package affecting thousands of applications",
      category: "Supply Chain",
      severity: "high" as const,
      source: "Package Security Monitor"
    },
    {
      title: "Phishing Campaign Targeting Healthcare Organizations", 
      description: "Large-scale phishing operation targeting healthcare workers with COVID-19 themed emails",
      category: "Phishing",
      severity: "medium" as const,
      source: "Healthcare ISAC"
    },
    {
      title: "Nation-State Actor Scanning Critical Infrastructure",
      description: "Intelligence reports indicate nation-state group conducting reconnaissance on power grid systems",
      category: "Infrastructure",
      severity: "critical" as const,
      source: "CISA Alert"
    }
  ];

  const randomThreat = threatSamples[Math.floor(Math.random() * threatSamples.length)];
  
  return {
    ...randomThreat,
    timestamp: new Date().toISOString(),
    id: `test_threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
};

export const simulateNewThreat = () => {
  const threat = generateTestThreat();
  
  // Trigger the global alert system
  if ((window as any).vireonAddAlert) {
    (window as any).vireonAddAlert(threat);
  } else {
    console.warn('Alert system not initialized yet');
  }
  
  return threat;
};