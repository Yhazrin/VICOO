/**
 * Vicoo Plugin System - Core Types and Interfaces
 *
 * This module defines the plugin API that third-party developers
 * can use to extend Vicoo's functionality.
 */

import type { Note, Tag, Node } from '@vicoo/types';

// ==================== Plugin Metadata ====================

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  keywords?: string[];
  license?: string;
}

export interface PluginPermissions {
  // API Access
  canReadNotes: boolean;
  canWriteNotes: boolean;
  canReadTags: boolean;
  canWriteTags: boolean;
  canAccessNetwork: boolean;

  // UI Extensions
  canAddMenuItems: boolean;
  canAddSidebarItems: boolean;
  canAddEditorCommands: boolean;

  // Storage
  canUseLocalStorage: boolean;
  canUseIndexedDB: boolean;
}

// ==================== Plugin Lifecycle ====================

export interface PluginContext {
  // API for interacting with Vicoo
  api: VicooPluginAPI;

  // Storage
  storage: PluginStorage;

  // Events
  events: PluginEventBus;

  // UI
  ui: PluginUI;
}

export interface VicooPluginAPI {
  // Notes
  getNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | null>;
  createNote(note: Partial<Note>): Promise<Note>;
  updateNote(id: string, data: Partial<Note>): Promise<Note>;
  deleteNote(id: string): Promise<void>;

  // Tags
  getTags(): Promise<Tag[]>;
  createTag(name: string, color?: string): Promise<Tag>;
  deleteTag(id: string): Promise<void>;

  // Graph
  getNodes(): Promise<Node[]>;
  createNode(node: Partial<Node>): Promise<Node>;
  deleteNode(id: string): Promise<void>;

  // Search
  search(query: string): Promise<Note[]>;
}

export interface PluginStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface PluginEventBus {
  on<T = any>(event: string, handler: (data: T) => void): () => void;
  emit<T = any>(event: string, data: T): void;
}

export interface PluginUI {
  // Menu items
  addMenuItem(item: MenuItemConfig): () => void;

  // Sidebar
  addSidebarItem(item: SidebarItemConfig): () => void;

  // Editor commands
  addEditorCommand(command: EditorCommandConfig): () => void;

  // Modal
  showModal(config: ModalConfig): void;
  hideModal(): void;

  // Toast notifications
  showToast(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void;
}

export interface MenuItemConfig {
  id: string;
  label: string;
  icon?: string;
  accelerator?: string;
  action: () => void;
  position?: 'start' | 'end';
}

export interface SidebarItemConfig {
  id: string;
  label: string;
  icon: string;
  view: React.ReactNode;
  position?: number;
}

export interface EditorCommandConfig {
  id: string;
  label: string;
  icon?: string;
  action: (context: { note: Note; selection: string }) => void;
}

export interface ModalConfig {
  title: string;
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closable?: boolean;
}

// ==================== Plugin Interface ====================

export interface VicooPlugin {
  // Required
  manifest: PluginManifest;

  // Lifecycle
  activate(context: PluginContext): Promise<void> | void;
  deactivate(): Promise<void> | void;

  // Optional
  permissions?: PluginPermissions;
}

// ==================== Plugin Manager ====================

export interface PluginManager {
  // Lifecycle
  loadPlugin(plugin: VicooPlugin): Promise<void>;
  unloadPlugin(pluginId: string): Promise<void>;

  // Query
  getPlugin(pluginId: string): VicooPlugin | undefined;
  getAllPlugins(): VicooPlugin[];

  // Events
  onPluginLoaded(callback: (plugin: VicooPlugin) => void): () => void;
  onPluginUnloaded(callback: (pluginId: string) => void): () => void;
}

// ==================== Plugin Decorators ====================

export function definePlugin(manifest: PluginManifest): (plugin: Partial<VicooPlugin>) => VicooPlugin {
  return (plugin) => ({
    manifest,
    activate: () => {},
    deactivate: () => {},
    ...plugin,
  });
}

// ==================== Built-in Plugin Hooks ====================

export type NoteHookType = 'beforeCreate' | 'afterCreate' | 'beforeUpdate' | 'afterUpdate' | 'beforeDelete' | 'afterDelete';

export interface NoteHookConfig {
  type: NoteHookType;
  handler: (note: Note) => Promise<void> | void;
}

export type EditorHookType = 'beforeRender' | 'afterRender' | 'onSave' | 'onSlashCommand';

export interface EditorHookConfig {
  type: EditorHookType;
  handler: (context: any) => Promise<void> | void;
}
