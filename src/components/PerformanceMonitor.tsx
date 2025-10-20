import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Zap, Database, Clock, TrendingUp } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { PerformanceService } from '../services/performanceService';

interface PerformanceMetrics {
  cacheSize: number;
  cacheKeys: string[];
  memoryUsage: number;
  loadTime: number;
  renderCount: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cacheSize: 0,
    cacheKeys: [],
    memoryUsage: 0,
    loadTime: 0,
    renderCount: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  const updateMetrics = useCallback(() => {
    const cacheStats = PerformanceService.getCacheStats();
    const memoryInfo = (performance as any).memory;
    
    setMetrics(prev => ({
      ...prev,
      cacheSize: cacheStats.size,
      cacheKeys: cacheStats.keys,
      memoryUsage: memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0,
      loadTime: Math.round(performance.now()),
      renderCount: prev.renderCount + 1,
    }));
  }, []);

  useEffect(() => {
    if (isVisible) {
      updateMetrics();
      const interval = setInterval(updateMetrics, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible, updateMetrics]);

  const clearCache = () => {
    PerformanceService.clearCache();
    updateMetrics();
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        size="sm"
        variant="outline"
        className="fixed bottom-4 right-4 z-50"
      >
        <Activity className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 p-4 z-50 bg-white shadow-lg border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center">
          <Zap className="w-4 h-4 mr-2 text-yellow-500" />
          Performance Monitor
        </h3>
        <Button
          onClick={() => setIsVisible(false)}
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center">
            <Database className="w-3 h-3 mr-1" />
            Cache Size:
          </span>
          <Badge variant="secondary">{metrics.cacheSize} items</Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            Memory Usage:
          </span>
          <Badge variant={metrics.memoryUsage > 50 ? "destructive" : "secondary"}>
            {metrics.memoryUsage} MB
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Load Time:
          </span>
          <Badge variant="secondary">{metrics.loadTime}ms</Badge>
        </div>

        <div className="flex items-center justify-between">
          <span>Render Count:</span>
          <Badge variant="secondary">{metrics.renderCount}</Badge>
        </div>

        {metrics.cacheKeys.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-600 mb-1">Cached Items:</p>
            <div className="max-h-20 overflow-y-auto">
              {metrics.cacheKeys.slice(0, 5).map((key, index) => (
                <div key={index} className="text-xs text-gray-500 truncate">
                  {key}
                </div>
              ))}
              {metrics.cacheKeys.length > 5 && (
                <div className="text-xs text-gray-400">
                  +{metrics.cacheKeys.length - 5} more...
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          onClick={clearCache}
          size="sm"
          variant="outline"
          className="w-full mt-2 text-xs"
        >
          Clear Cache
        </Button>
      </div>
    </Card>
  );
};
