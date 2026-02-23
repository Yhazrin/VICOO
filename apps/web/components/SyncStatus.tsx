import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';

export const SyncStatus: React.FC = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setStatus(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'syncing': return 'bg-amber-500 animate-pulse';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'syncing': return 'Syncing...';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {getStatusText()}
        </span>
      </button>

      {/* Status Details Dropdown */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Sync Status
          </h4>

          <div className="space-y-3">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Connection</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {status === 'online' ? 'Connected' : status === 'offline' ? 'Offline' : 'Syncing'}
                </span>
              </div>
            </div>

            {/* Last Sync */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Sync</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
              </span>
            </div>

            {/* Offline Mode Info */}
            {status === 'offline' && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  You're currently offline. Changes will be saved locally and synced when you reconnect.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  // Trigger manual sync
                  setStatus('syncing');
                  setTimeout(() => {
                    setStatus('online');
                    setLastSync(new Date());
                  }, 2000);
                }}
                className="w-full py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
              >
                Sync Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatus;
