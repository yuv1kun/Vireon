import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { AlertTriangle, Network, Shield, Activity, FileDigit, Zap, Lock, RefreshCw } from 'lucide-react';
import { ThreatReport } from '@/services/dataStorage';
import { ExtractedIOC } from '@/services/iocExtractor';
import { threatIntelPipeline } from '@/services/threatIntelPipeline';
import { cn } from '@/lib/utils';

// Severity configuration for styling nodes
const severityConfig = {
  low: { color: '#10B981', borderColor: '#059669', icon: Shield },
  medium: { color: '#F59E0B', borderColor: '#D97706', icon: AlertTriangle },
  high: { color: '#EF4444', borderColor: '#DC2626', icon: AlertTriangle },
  critical: { color: '#8B5CF6', borderColor: '#7C3AED', icon: AlertTriangle }
};

// Node types for different IOC types
const nodeTypes = {
  ip: { color: '#3B82F6', borderColor: '#2563EB', icon: Network },
  domain: { color: '#8B5CF6', borderColor: '#7C3AED', icon: Network },
  url: { color: '#6366F1', borderColor: '#4F46E5', icon: Network },
  hash: { color: '#EC4899', borderColor: '#DB2777', icon: FileDigit },
  email: { color: '#10B981', borderColor: '#059669', icon: FileDigit },
  threat: { color: '#F59E0B', borderColor: '#D97706', icon: AlertTriangle }
};

interface GraphNode {
  id: string;
  name: string;
  type: string;
  val: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  desc?: string;
  timestamp?: string;
  reportId?: string;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
  relationship: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function AttackGraphVisualizer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [complexity, setComplexity] = useState<number>(70);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Function to generate graph data from threat reports and IOCs
  const generateGraphData = () => {
    setLoading(true);
    
    try {
      // Get all threat reports and IOCs
      const reports = threatIntelPipeline.getAllReports();
      const iocs = threatIntelPipeline.getAllIOCs();
      
      const nodes: GraphNode[] = [];
      const links: GraphLink[] = [];
      const nodeIds = new Set<string>();
      
      // Add threat reports as nodes
      reports.forEach(report => {
        const nodeId = `report-${report.id}`;
        if (!nodeIds.has(nodeId)) {
          nodes.push({
            id: nodeId,
            name: report.title.substring(0, 25) + (report.title.length > 25 ? '...' : ''),
            type: 'threat',
            val: 3,
            severity: report.severity,
            desc: report.description,
            timestamp: report.timestamp,
            reportId: report.id
          });
          nodeIds.add(nodeId);
        }
      });
      
      // Add IOCs as nodes and create links
      iocs.forEach(ioc => {
        const nodeId = `${ioc.type}-${ioc.value.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        // Only add if not already added
        if (!nodeIds.has(nodeId)) {
          nodes.push({
            id: nodeId,
            name: ioc.type === 'hash' && ioc.value.length > 15 ? 
              `${ioc.value.substring(0, 6)}...${ioc.value.substring(ioc.value.length - 6)}` : 
              ioc.value,
            type: ioc.type,
            val: 2,
            // Use medium severity as default for IOCs
            severity: 'medium',
            desc: ioc.context
          });
          nodeIds.add(nodeId);
        }
        
        // Link IOCs to their related reports
        reports.forEach(report => {
          if (report.iocs) {
            // Check if this IOC value exists in any of the report's IOC lists
            let foundInReport = false;
            
            if (ioc.type === 'ip' && report.iocs.ips?.includes(ioc.value)) foundInReport = true;
            if (ioc.type === 'domain' && report.iocs.domains?.includes(ioc.value)) foundInReport = true;
            if (ioc.type === 'url' && report.iocs.urls?.includes(ioc.value)) foundInReport = true;
            if (ioc.type === 'hash' && report.iocs.hashes?.includes(ioc.value)) foundInReport = true;
            if (ioc.type === 'email' && report.iocs.emails?.includes(ioc.value)) foundInReport = true;
            
            if (foundInReport) {
              const reportNodeId = `report-${report.id}`;
              
              if (nodeIds.has(reportNodeId)) {
                links.push({
                  source: reportNodeId,
                  target: nodeId,
                  value: 1,
                  relationship: 'contains'
                });
              }
            }
          }
        });
      });
      
      // Create links between related IOCs based on similarity or association
      // This is a simplified approach - in a real system you would use more sophisticated correlation
      
      // First, find which IOCs appear in which reports
      const iocToReports: Record<string, string[]> = {};
      
      // Build a map of IOC node IDs to report IDs they appear in
      iocs.forEach(ioc => {
        const iocNodeId = `${ioc.type}-${ioc.value.replace(/[^a-zA-Z0-9]/g, '-')}`;
        iocToReports[iocNodeId] = [];
        
        reports.forEach(report => {
          if (report.iocs) {
            let foundInReport = false;
            
            if (ioc.type === 'ip' && report.iocs.ips?.includes(ioc.value)) foundInReport = true;
            if (ioc.type === 'domain' && report.iocs.domains?.includes(ioc.value)) foundInReport = true;
            if (ioc.type === 'url' && report.iocs.urls?.includes(ioc.value)) foundInReport = true;
            if (ioc.type === 'hash' && report.iocs.hashes?.includes(ioc.value)) foundInReport = true;
            if (ioc.type === 'email' && report.iocs.emails?.includes(ioc.value)) foundInReport = true;
            
            if (foundInReport) {
              iocToReports[iocNodeId].push(report.id);
            }
          }
        });
      });
      
      // Now link IOCs that appear in the same reports
      const iocNodeIds = Object.keys(iocToReports);
      for (let i = 0; i < iocNodeIds.length; i++) {
        const sourceId = iocNodeIds[i];
        const sourceReports = iocToReports[sourceId];
        
        for (let j = i + 1; j < iocNodeIds.length; j++) {
          const targetId = iocNodeIds[j];
          const targetReports = iocToReports[targetId];
          
          // Find common reports
          const commonReports = sourceReports.filter(id => targetReports.includes(id));
          
          if (commonReports.length > 0) {
            // Check if both nodes exist and the link doesn't already exist
            const linkExists = links.some(link => 
              (link.source === sourceId && link.target === targetId) || 
              (link.source === targetId && link.target === sourceId)
            );
            
            if (!linkExists) {
              links.push({
                source: sourceId,
                target: targetId,
                value: commonReports.length,
                relationship: 'related'
              });
            }
          }
        }
      }
      
      // Apply complexity filter (remove some less significant nodes for cleaner visualization)
      const filteredData = applyComplexityFilter({ nodes, links }, complexity);
      
      setGraphData(filteredData);
    } catch (error) {
      console.error('Error generating attack graph:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Apply a filter to reduce complexity if needed
  const applyComplexityFilter = (data: GraphData, complexityFactor: number): GraphData => {
    if (complexityFactor === 100) return data;
    
    // The higher the complexity factor, the more nodes we keep
    const threshold = (100 - complexityFactor) / 100;
    const nodeImportance: Record<string, number> = {};
    
    // Calculate node importance based on connections
    data.nodes.forEach(node => {
      const connections = data.links.filter(
        link => link.source === node.id || link.target === node.id
      ).length;
      
      // Higher severity = more important
      const severityWeight = 
        node.severity === 'critical' ? 1.0 :
        node.severity === 'high' ? 0.75 :
        node.severity === 'medium' ? 0.5 : 0.25;
        
      nodeImportance[node.id] = connections * severityWeight;
    });
    
    // Sort nodes by importance
    const sortedNodes = [...data.nodes].sort((a, b) => 
      (nodeImportance[b.id] || 0) - (nodeImportance[a.id] || 0)
    );
    
    // Keep top nodes based on complexity factor
    const nodesToKeep = sortedNodes.slice(
      0, Math.max(5, Math.round(data.nodes.length * (1 - threshold)))
    );
    
    const keepNodeIds = new Set(nodesToKeep.map(n => n.id));
    
    // Filter links to only keep those between remaining nodes
    const filteredLinks = data.links.filter(
      link => keepNodeIds.has(link.source as string) && keepNodeIds.has(link.target as string)
    );
    
    return {
      nodes: nodesToKeep,
      links: filteredLinks
    };
  };
  
  // Filter the graph by severity or type
  const filterGraph = (filter: string) => {
    setSelectedFilter(filter);
    
    // Regenerate graph with filter
    generateGraphData();
  };
  
  // Draw the attack graph using canvas
  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const containerWidth = containerRef.current?.clientWidth || 600;
    const containerHeight = 500;
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Position nodes using a simple force-directed layout (simplified)
    const nodes = positionNodes(graphData.nodes, canvas.width, canvas.height);
    
    // Draw links
    graphData.links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      
      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = '#888';
        ctx.lineWidth = Math.max(1, Math.min(link.value, 3));
        ctx.stroke();
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      const config = node.type === 'threat' ? 
        severityConfig[node.severity] : nodeTypes[node.type as keyof typeof nodeTypes];
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.val * 5, 0, Math.PI * 2);
      ctx.fillStyle = config.color;
      ctx.fill();
      ctx.strokeStyle = config.borderColor || '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw label
      ctx.font = '10px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(node.name.substring(0, 12), node.x, node.y + node.val * 5 + 12);
    });
  };
  
  // Simple positioning algorithm for nodes
  const positionNodes = (nodes: GraphNode[], width: number, height: number) => {
    const positionedNodes = nodes.map((node, i) => {
      // Simple positioning in a circle
      const angle = (i / nodes.length) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.4;
      
      return {
        ...node,
        x: width / 2 + radius * Math.cos(angle),
        y: height / 2 + radius * Math.sin(angle)
      };
    });
    
    return positionedNodes;
  };
  
  // Initialize graph when component mounts
  useEffect(() => {
    generateGraphData();
  }, []);
  
  // Redraw graph when data changes
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      drawGraph();
    }
  }, [graphData]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      drawGraph();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [graphData]);

  // Handle node click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is on a node
    const positionedNodes = positionNodes(graphData.nodes, canvas.width, canvas.height);
    const clickedNode = positionedNodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= node.val * 5;
    });
    
    setSelectedNode(clickedNode || null);
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-display font-bold text-primary">Attack Graph Visualizer</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generateGraphData} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="flex mb-4 gap-2">
        <Select defaultValue="all" onValueChange={filterGraph}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All IOCs</SelectItem>
            <SelectItem value="ip">IP Addresses</SelectItem>
            <SelectItem value="domain">Domains</SelectItem>
            <SelectItem value="url">URLs</SelectItem>
            <SelectItem value="hash">File Hashes</SelectItem>
            <SelectItem value="email">Email Addresses</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-muted-foreground">Complexity:</span>
          <Slider
            defaultValue={[70]}
            max={100}
            step={10}
            className="w-[100px]"
            onValueChange={(values) => setComplexity(values[0])}
          />
        </div>
      </div>
      
      <div className="relative" ref={containerRef}>
        <canvas 
          ref={canvasRef} 
          className="w-full h-[500px] rounded-md"
          onClick={handleCanvasClick}
        />
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-md">
            <div className="flex flex-col items-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2">Generating attack graph...</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-4 mt-4 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-primary" />
          <span className="text-xs">Report</span>
        </div>
        {Object.entries(nodeTypes).map(([type, config]) => (
          <div key={type} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
            <span className="text-xs">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </div>
        ))}
      </div>
      
      {selectedNode && (
        <div className="mt-4 p-3 border rounded-md">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{selectedNode.name}</h3>
            <Badge 
              variant="outline" 
              style={{
                backgroundColor: selectedNode.type === 'threat' 
                  ? `${severityConfig[selectedNode.severity].color}33` 
                  : `${nodeTypes[selectedNode.type as keyof typeof nodeTypes].color}33`,
                borderColor: selectedNode.type === 'threat' 
                  ? severityConfig[selectedNode.severity].borderColor 
                  : nodeTypes[selectedNode.type as keyof typeof nodeTypes].borderColor
              }}
            >
              {selectedNode.type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{selectedNode.desc || 'No description available'}</p>
          {selectedNode.timestamp && (
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(selectedNode.timestamp).toLocaleString()}
            </p>
          )}
          {selectedNode.reportId && (
            <Button variant="link" size="sm" className="p-0 h-auto mt-1">
              View Full Report
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
