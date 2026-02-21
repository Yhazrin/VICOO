import React, { useEffect, useState } from 'react';

interface WebVitals {
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  fid: number | null;
  ttfb: number | null;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showPanel?: boolean;
  onVitalsUpdate?: (vitals: WebVitals) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = true,
  showPanel = true,
  onVitalsUpdate,
}) => {
  const [vitals, setVitals] = useState<WebVitals>({
    fcp: null,
    lcp: null,
    cls: null,
    fid: null,
    ttfb: null,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Function to report web vitals
    const reportWebVitals = (metric: any) => {
      const metricName = metric.name.toLowerCase();
      setVitals((prev) => {
        const newVitals = { ...prev, [metricName]: metric.value };
        onVitalsUpdate?.(newVitals);
        return newVitals;
      });
    };

    // Check if web-vitals library is available
    const initWebVitals = async () => {
      try {
        // Dynamically import web-vitals if available
        const webVitals = await import('web-vitals');
        const { onCLS, onFCP, onLCP, onFID, onTTFB } = webVitals;

        onCLS(reportWebVitals);
        onFCP(reportWebVitals);
        onLCP(reportWebVitals);
        onFID(reportWebVitals);
        onTTFB(reportWebVitals);
      } catch (error) {
        // Fallback to Performance API if web-vitals not available
        console.warn('web-vitals library not found, using Performance API fallback');
        initPerformanceObserver();
      }
    };

    // Fallback using Performance Observer
    const initPerformanceObserver = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            setVitals((prev) => ({
              ...prev,
              ttfb: navEntry.responseStart - navEntry.requestStart,
            }));
          }
          if (entry.entryType === 'paint') {
            const paintEntry = entry as PerformancePaintTiming;
            if (paintEntry.name === 'first-contentful-paint') {
              setVitals((prev) => ({ ...prev, fcp: paintEntry.startTime }));
            }
          }
        }
      });

      try {
        observer.observe({ type: 'navigation', buffered: true });
        observer.observe({ type: 'paint', buffered: true });
      } catch (e) {
        console.warn('Performance Observer not supported');
      }
    };

    initWebVitals();

    return () => {
      // Cleanup if needed
    };
  }, [enabled, onVitalsUpdate]);

  const getVitalColor = (name: keyof WebVitals, value: number | null): string => {
    if (value === null) return 'text-gray-400';

    const thresholds = {
      fcp: { good: 1800, needsImprovement: 3000 },
      lcp: { good: 2500, needsImprovement: 4000 },
      cls: { good: 0.1, needsImprovement: 0.25 },
      fid: { good: 100, needsImprovement: 300 },
      ttfb: { good: 800, needsImprovement: 1800 },
    };

    const threshold = thresholds[name];
    if (!threshold) return 'text-gray-400';

    if (value <= threshold.good) return 'text-green-500';
    if (value <= threshold.needsImprovement) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatValue = (value: number | null, unit: string = 'ms'): string => {
    if (value === null) return '--';
    if (unit === 'ms') return `${Math.round(value)}ms`;
    return value.toFixed(3);
  };

  if (!showPanel) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 font-mono text-xs"
      style={{ zIndex: 9999 }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span>Performance</span>
      </button>

      {isExpanded && (
        <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[200px]">
          <div className="space-y-2">
            <VitalRow
              label="FCP"
              value={formatValue(vitals.fcp)}
              color={getVitalColor('fcp', vitals.fcp)}
            />
            <VitalRow
              label="LCP"
              value={formatValue(vitals.lcp)}
              color={getVitalColor('lcp', vitals.lcp)}
            />
            <VitalRow
              label="CLS"
              value={formatValue(vitals.cls, '')}
              color={getVitalColor('cls', vitals.cls)}
            />
            <VitalRow
              label="FID"
              value={formatValue(vitals.fid)}
              color={getVitalColor('fid', vitals.fid)}
            />
            <VitalRow
              label="TTFB"
              value={formatValue(vitals.ttfb)}
              color={getVitalColor('ttfb', vitals.ttfb)}
            />
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-[10px] text-gray-500">
              <span className="text-green-500">Good</span>
              <span className="text-yellow-500">Needs Work</span>
              <span className="text-red-500">Poor</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VitalRow: React.FC<{
  label: string;
  value: string;
  color: string;
}> = ({ label, value, color }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-500 dark:text-gray-400">{label}</span>
    <span className={`font-medium ${color}`}>{value}</span>
  </div>
);

export default PerformanceMonitor;
