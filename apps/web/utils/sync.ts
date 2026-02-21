/**
 * 多平台同步服务
 * 支持 CRDT 冲突解决和离线优先架构
 */

import { createStore } from 'zustand/vanilla';
import { eventBus, Events } from '@vicoo/events';

// ==================== 类型定义 ====================

export interface SyncItem<T> {
  id: string;
  data: T;
  timestamp: number;
  deviceId: string;
  version: number;
  deleted?: boolean;
}

export interface SyncConflict<T> {
  itemId: string;
  localVersion: SyncItem<T>;
  remoteVersion: SyncItem<T>;
  resolution?: 'local' | 'remote' | 'merge';
}

export type ConflictResolutionStrategy = 'last-write-wins' | 'manual' | 'auto-merge';

export interface SyncConfig {
  deviceId: string;
  serverUrl: string;
  conflictStrategy: ConflictResolutionStrategy;
  autoSyncInterval: number;
  enableOffline: boolean;
}

export interface SyncState<T> {
  items: Map<string, SyncItem<T>>;
  pendingChanges: SyncItem<T>[];
  lastSyncTimestamp: number;
  isOnline: boolean;
  isSyncing: boolean;
  conflicts: SyncConflict<T>[];
}

// ==================== CRDT 实现 ====================

/**
 * 简化的 CRDT 实现
 * 使用 LWW (Last-Write-Wins) 作为默认策略
 */
export class CRDT<T extends { id: string }> {
  private items: Map<string, SyncItem<T>> = new Map();
  private deviceId: string;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
    // 从 localStorage 恢复数据
    this.loadFromStorage();
  }

  // 更新或插入项
  update timestamp: number = Date.now()): SyncItem<T> {
    const existing(item: T, = this.items.get(item.id);
    
    // LWW 策略：如果新版本的时间戳更晚，则更新
    if (!existing || timestamp >= existing.timestamp) {
      const syncItem: SyncItem<T> = {
        id: item.id,
        data: item,
        timestamp,
        deviceId: this.deviceId,
        version: (existing?.version || 0) + 1,
      };
      this.items.set(item.id, syncItem);
      this.saveToStorage();
      return syncItem;
    }
    
    return existing;
  }

  // 删除项（标记删除）
  delete(itemId: string, timestamp: number = Date.now()): SyncItem<T> | null {
    const existing = this.items.get(itemId);
    if (!existing) return null;

    const deletedItem: SyncItem<T> = {
      ...existing,
      timestamp,
      deleted: true,
      version: existing.version + 1,
    };
    this.items.set(itemId, deletedItem);
    this.saveToStorage();
    return deletedItem;
  }

  // 获取所有未删除的项
  getAll(): T[] {
    return Array.from(this.items.values())
      .filter(item => !item.deleted)
      .map(item => item.data);
  }

  // 获取特定项
  get(itemId: string): T | null {
    const item = this.items.get(itemId);
    return item && !item.deleted ? item.data : null;
  }

  // 合并远程数据
  merge(remoteItems: SyncItem<T>[]): SyncConflict<T>[] {
    const conflicts: SyncConflict<T>[] = [];

    for (const remoteItem of remoteItems) {
      const localItem = this.items.get(remoteItem.id);

      if (!localItem) {
        // 远程有，本地没有，直接添加
        this.items.set(remoteItem.id, remoteItem);
      } else if (localItem.timestamp !== remoteItem.timestamp) {
        // 时间戳不同，需要合并
        if (remoteItem.timestamp > localItem.timestamp) {
          // 远程更新，用远程版本覆盖本地
          this.items.set(remoteItem.id, remoteItem);
        } else if (remoteItem.timestamp === localItem.timestamp) {
          // 时间戳相同但版本不同，这可能是冲突
          if (remoteItem.version !== localItem.version) {
            conflicts.push({
              itemId: remoteItem.id,
              localVersion: localItem,
              remoteVersion: remoteItem,
            });
          }
        }
      }
    }

    this.saveToStorage();
    return conflicts;
  }

  // 获取所有数据用于同步
  getAllForSync(): SyncItem<T>[] {
    return Array.from(this.items.values());
  }

  // 解决冲突
  resolveConflict(itemId: string, resolution: 'local' | 'remote', remoteItem?: SyncItem<T>): void {
    const conflict = this.items.get(itemId);
    if (!conflict || !remoteItem) return;

    if (resolution === 'remote' && remoteItem) {
      this.items.set(itemId, remoteItem);
    }
    // local 保留本地版本
    this.saveToStorage();
  }

  // 保存到 localStorage
  private saveToStorage(): void {
    try {
      const data = Array.from(this.items.entries());
      localStorage.setItem(`vicoo_crdt_${this.deviceId}`, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save CRDT to storage:', e);
    }
  }

  // 从 localStorage 恢复
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(`vicoo_crdt_${this.deviceId}`);
      if (stored) {
        const data = JSON.parse(stored) as [string, SyncItem<T>][];
        this.items = new Map(data);
      }
    } catch (e) {
      console.error('Failed to load CRDT from storage:', e);
    }
  }
}

// ==================== 同步存储 ====================

interface SyncStore<T extends { id: string }> {
  crdt: CRDT<T>;
  config: SyncConfig;
  
  // Actions
  updateItem: (item: T) => void;
  deleteItem: (id: string) => void;
  getAll: () => T[];
  getItem: (id: string) => T | null;
  sync: () => Promise<void>;
  resolveConflict: (itemId: string, resolution: 'local' | 'remote', remoteItem?: SyncItem<T>) => void;
  setOnline: (online: boolean) => void;
}

export function createSyncStore<T extends { id: string }>(
  config: SyncConfig,
  initialItems: T[] = []
): SyncStore<T> {
  const crdt = new CRDT<T>(config.deviceId);
  
  // 初始化本地数据
  for (const item of initialItems) {
    crdt.update(item);
  }

  let isSyncing = false;
  let lastSyncTimestamp = Date.now();
  let isOnline = navigator.onLine;
  const pendingChanges: SyncItem<T>[] = [];

  // 监听网络状态
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      isOnline = true;
      // 自动同步
      sync();
    });
    window.addEventListener('offline', () => {
      isOnline = false;
    });
  }

  async function sync() {
    if (isSyncing || !isOnline) return;

    isSyncing = true;

    // Emit syncing event to mascot
    eventBus.emit(Events.MASCOT_STATE, { state: 'syncing', message: 'Syncing...', duration: 0 });

    try {
      // 获取远程数据
      const response = await fetch(`${config.serverUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('vicoo_token')}`,
        },
        body: JSON.stringify({
          deviceId: config.deviceId,
          items: crdt.getAllForSync(),
          since: lastSyncTimestamp,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // 合并远程数据
        const conflicts = crdt.merge(data.items);

        // 处理冲突
        for (const conflict of conflicts) {
          if (config.conflictStrategy === 'last-write-wins') {
            // 自动选择较新的版本
            const resolution = conflict.localVersion.timestamp > conflict.remoteVersion.timestamp
              ? 'local'
              : 'remote';
            crdt.resolveConflict(conflict.itemId, resolution, conflict.remoteVersion);
          }
          // manual 策略需要用户手动处理
        }

        lastSyncTimestamp = Date.now();

        // Emit synced event
        eventBus.emit(Events.MASCOT_STATE, {
          state: 'synced',
          message: 'All synced!',
          duration: 2000
        });
      }
    } catch (error) {
      // Emit sync error event
      eventBus.emit(Events.MASCOT_STATE, {
        state: 'sync_error',
        message: 'Sync failed!',
        duration: 5000
      });
    } finally {
      isSyncing = false;
    }
  }

  return {
    crdt,
    config,
    
    updateItem: (item: T) => {
      const syncItem = crdt.update(item);
      pendingChanges.push(syncItem);
      
      if (config.enableOffline && isOnline) {
        sync();
      }
    },
    
    deleteItem: (id: string) => {
      const syncItem = crdt.delete(id);
      if (syncItem) {
        pendingChanges.push(syncItem);
      }
      
      if (config.enableOffline && isOnline) {
        sync();
      }
    },
    
    getAll: () => crdt.getAll(),
    
    getItem: (id: string) => crdt.get(id),
    
    sync,
    
    resolveConflict: (itemId: string, resolution, remoteItem) => {
      crdt.resolveConflict(itemId, resolution, remoteItem);
    },
    
    setOnline: (online: boolean) => {
      isOnline = online;
    },
  };
}

// ==================== 便捷函数 ====================

// 生成设备 ID
export function generateDeviceId(): string {
  let deviceId = localStorage.getItem('vicoo_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('vicoo_device_id', deviceId);
  }
  return deviceId;
}

// 默认配置
export function getDefaultSyncConfig(): SyncConfig {
  return {
    deviceId: generateDeviceId(),
    serverUrl: 'http://localhost:8000',
    conflictStrategy: 'last-write-wins',
    autoSyncInterval: 30000, // 30秒
    enableOffline: true,
  };
}

export default {
  CRDT,
  createSyncStore,
  generateDeviceId,
  getDefaultSyncConfig,
};
