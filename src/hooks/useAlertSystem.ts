import { useEffect, useRef } from 'react';
import { ThreatReport } from '@/services/dataStorage';

interface UseAlertSystemOptions {
  onNewThreat?: (threat: ThreatReport) => void;
  enableSound?: boolean;
  severityThreshold?: 'low' | 'medium' | 'high' | 'critical';
}

export function useAlertSystem(options: UseAlertSystemOptions = {}) {
  const lastProcessedRef = useRef<Set<string>>(new Set());
  const { onNewThreat, enableSound = true, severityThreshold = 'low' } = options;

  const severityLevels = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  };

  const shouldAlert = (severity: ThreatReport['severity']) => {
    return severityLevels[severity] >= severityLevels[severityThreshold];
  };

  const triggerAlert = (threat: ThreatReport) => {
    // Check if we should alert for this severity level
    if (!shouldAlert(threat.severity)) return;

    // Add to global alert system
    if ((window as any).vireonAddAlert) {
      (window as any).vireonAddAlert(threat);
    }

    // Call custom callback
    if (onNewThreat) {
      onNewThreat(threat);
    }
  };

  const checkForNewThreats = (threats: ThreatReport[]) => {
    threats.forEach(threat => {
      // Check if this is a new threat we haven't processed
      if (!lastProcessedRef.current.has(threat.id)) {
        // Check if it's actually new (within last hour)
        const threatTime = new Date(threat.timestamp).getTime();
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        if (threatTime > oneHourAgo) {
          triggerAlert(threat);
        }
        
        lastProcessedRef.current.add(threat.id);
      }
    });

    // Clean up old processed IDs to prevent memory leaks
    if (lastProcessedRef.current.size > 10000) {
      const oldIds = Array.from(lastProcessedRef.current).slice(0, 5000);
      oldIds.forEach(id => lastProcessedRef.current.delete(id));
    }
  };

  return {
    checkForNewThreats,
    triggerAlert
  };
}