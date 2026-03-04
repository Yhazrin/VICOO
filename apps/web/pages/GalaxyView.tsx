/**
 * GalaxyView - 银河视图
 * 使用 React Flow 实现高性能无限画布
 * 支持 100+ 节点流畅渲染
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  BackgroundVariant,
  Panel,
  NodeTypes,
  ReactFlowProvider,
  useReactFlow,
  Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NeoButton } from '../components/NeoButton';
import { GalaxyNode } from '../components/GalaxyNode';
import { useApi } from '../contexts/ApiContext';
import { VicooIcon } from '../components/VicooIcon';
import type { Node as VicooNode, Link } from '../types';

// 自定义节点类型
const nodeTypes: NodeTypes = {
  galaxy: GalaxyNode,
};

// 视口虚拟化阈值
const MIN_VISIBLE_SCALE = 0.1;
const MAX_VISIBLE_SCALE = 3;

interface GalaxyViewProps {
  onOpenNote?: (noteId: string) => void;
}

const GalaxyViewContent: React.FC<GalaxyViewProps> = ({ onOpenNote }) => {
  const {
    nodes: apiNodes,
    links: apiLinks,
    refreshGraph,
    createNode,
    updateNode,
    deleteNode,
    createLink,
    deleteLink,
    generateGraphFromNotes,
    cleanupGraph,
    loading
  } = useApi();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // 将 API 数据转换为 React Flow 格式
  const initialNodes: Node[] = useMemo(() => 
    apiNodes.map(node => ({
      id: node.id,
      type: 'galaxy',
      position: { x: node.x, y: node.y },
      data: {
        label: node.label,
        icon: node.icon,
        color: node.color,
        description: node.description,
        selected: false,
      },
    })), 
    [apiNodes]
  );

  const initialEdges: Edge[] = useMemo(() => 
    apiLinks.map(link => {
      const rel = (link as any).relation || 'relates';
      const strength: number = (link as any).strength ?? 0.5;
      const edgeLabel: string = (link as any).label || '';

      const RELATION_STYLES: Record<string, { stroke: string; dash?: string; animated?: boolean }> = {
        foundation: { stroke: '#3B82F6' },             // blue — foundational
        contains:   { stroke: '#8B5CF6' },             // purple — part-of
        extends:    { stroke: '#10B981' },             // green — extends
        contrasts:  { stroke: '#EF4444', dash: '6 3' }, // red dashed — contrast
        depends:    { stroke: '#F59E0B' },             // amber — dependency
        implements: { stroke: '#06B6D4' },             // cyan — implementation
        relates:    { stroke: '#6B7280', dash: '4 4' }, // gray dashed — weak
      };

      const s = RELATION_STYLES[rel] || RELATION_STYLES.relates;
      const sw = 1.5 + strength * 2.5; // 1.5..4 px

      return {
        id: link.id,
        source: link.source,
        target: link.target,
        type: 'smoothstep',
        label: edgeLabel || undefined,
        labelStyle: { fontSize: 12, fontWeight: 800, fill: s.stroke },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.92, stroke: s.stroke, strokeWidth: 1 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 6,
        style: {
          stroke: s.stroke,
          strokeWidth: sw,
          strokeDasharray: s.dash,
          opacity: 0.35 + strength * 0.45,
        },
        animated: s.animated ?? false,
        markerEnd: rel === 'foundation' || rel === 'depends'
          ? { type: 'arrowclosed' as const, color: s.stroke, width: 14, height: 14 }
          : undefined,
      };
    }),
    [apiLinks]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });

  // 同步 API 数据到本地状态
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // 刷新图谱
  useEffect(() => {
    refreshGraph();
  }, [refreshGraph]);

  // 过滤节点
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    return nodes.filter(n => 
      n.data.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [nodes, searchQuery]);

  // 选中节点
  const selectedNode = useMemo(() => {
    return apiNodes.find(n => n.id === selectedNodeId);
  }, [apiNodes, selectedNodeId]);

  // 处理连接
  const onConnect = useCallback(async (connection: Connection) => {
    if (connection.source && connection.target) {
      try {
        await createLink({ 
          source: connection.source, 
          target: connection.target 
        });
      } catch (err) {
        console.error('Failed to create link:', err);
      }
    }
  }, [createLink]);

  // 处理节点选择
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // 处理节点拖拽结束
  const onNodeDragStop = useCallback(async (_: React.MouseEvent, node: Node) => {
    try {
      await updateNode(node.id, { 
        x: node.position.x, 
        y: node.position.y 
      });
    } catch (err) {
      console.error('Failed to update node position:', err);
    }
  }, [updateNode]);

  // 双击画布创建节点
  const onPaneClick = useCallback(async (event: React.MouseEvent) => {
    if (event.detail === 2) { // Double click
      const reactFlowBounds = (event.target as HTMLElement).getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      try {
        const newNode = await createNode({
          x: position.x,
          y: position.y,
          label: 'New Idea',
          icon: 'lightbulb',
          color: '#FFD166',
          type: 'planet',
          description: 'Double-clicked to create.',
        });
        setSelectedNodeId(newNode.id);
      } catch (err) {
        console.error('Failed to create node:', err);
      }
    }
  }, [createNode]);

  // 处理删除
  const handleDeleteNode = useCallback(async () => {
    if (selectedNodeId) {
      try {
        await deleteNode(selectedNodeId);
        setSelectedNodeId(null);
      } catch (err) {
        console.error('Failed to delete node:', err);
      }
    }
  }, [selectedNodeId, deleteNode]);

  // 从笔记生成知识图谱
  const handleGenerateFromNotes = useCallback(async () => {
    if (!confirm('确定要从笔记生成知识图谱吗？这将清除现有的节点和关联。')) {
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateGraphFromNotes(true);
      alert(`成功生成知识图谱！\n处理笔记: ${result.summary.notesProcessed}\n创建节点: ${result.summary.nodesCreated}\n创建关联: ${result.summary.linksCreated}`);
    } catch (err) {
      console.error('Failed to generate graph:', err);
      alert('生成知识图谱失败，请确认 MiniMax API 已配置');
    } finally {
      setIsGenerating(false);
    }
  }, [generateGraphFromNotes]);

  // 清理重复节点
  const handleCleanupGraph = useCallback(async () => {
    if (!confirm('确定要清理重复的节点吗？这将保留每个标签的第一个节点，删除其余重复节点。')) {
      return;
    }

    setIsCleaningUp(true);
    try {
      const result = await cleanupGraph();
      alert(`清理完成！\n发现重复组: ${result.duplicatesFound}\n删除节点: ${result.nodesDeleted}\n删除关联: ${result.linksDeleted}`);
    } catch (err) {
      console.error('Failed to cleanup graph:', err);
      alert('清理失败，请重试');
    } finally {
      setIsCleaningUp(false);
    }
  }, [cleanupGraph]);

  // 处理删除边
  const onEdgeClick = useCallback(async (_: React.MouseEvent, edge: Edge) => {
    if (edge.id) {
      try {
        await deleteLink(edge.id);
      } catch (err) {
        console.error('Failed to delete link:', err);
      }
    }
  }, [deleteLink]);

  // 跳转到节点
  const handleFocusNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setViewport({ x: window.innerWidth / 2 - node.position.x * viewport.zoom, y: window.innerHeight / 2 - node.position.y * viewport.zoom, zoom: 1 });
    }
    setSearchQuery('');
  }, [nodes, viewport.zoom]);

  return (
    <div className="flex h-full w-full relative">
      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        onEdgeClick={onEdgeClick}
        onMove={(_, viewport) => setViewport(viewport)}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        minZoom={MIN_VISIBLE_SCALE}
        maxZoom={MAX_VISIBLE_SCALE}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: 'var(--edge-color, #6B7280)', strokeWidth: 2, opacity: 0.35 },
        }}
        className="[--edge-color:#6B7280] dark:[--edge-color:#9CA3AF] bg-[#f0f4f8] dark:bg-[#0a0a0a]"
        proOptions={{ hideAttribution: true }}
      >
        {/* 网格背景 */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={40}
          size={1}
          color="#1a1a1a"
          className="opacity-10 dark:opacity-5"
        />

        {/* 缩放控制 */}
        <Controls
          className="!bg-white dark:!bg-gray-800 !border-3 !border-ink dark:!border-gray-500 !rounded-neo !shadow-neo-sm"
          showInteractive={false}
        />

        {/* 小地图 */}
        <MiniMap
          className="!bg-white dark:!bg-gray-800 !border-3 !border-ink dark:!border-gray-500 !rounded-neo !shadow-neo-sm"
          nodeColor={(node) => node.data?.color || '#FFD166'}
          maskColor="rgba(240, 244, 248, 0.8)"
        />

        {/* 搜索面板 */}
        <Panel position="top-left" className="!left-4 !top-4">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur border-3 border-ink dark:border-gray-500 shadow-neo-sm rounded-neo p-2 flex items-center gap-2 max-w-md w-full animate-fade-in">
            <VicooIcon name="search" size={20} className="text-gray-400 ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes..."
              className="bg-transparent border-none focus:ring-0 font-bold text-ink dark:text-white w-full placeholder-gray-400"
            />
          </div>
          {searchQuery && filteredNodes.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-3 border-ink dark:border-gray-500 rounded-neo shadow-neo-lg overflow-hidden z-50 animate-scale-in">
              {filteredNodes.slice(0, 5).map(node => (
                <button
                  key={node.id}
                  onClick={() => handleFocusNode(node.id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center gap-2 text-ink dark:text-white transition-colors"
                >
                  <VicooIcon name={node.data.icon} size={14} />
                  {node.data.label}
                </button>
              ))}
            </div>
          )}
        </Panel>

        {/* 从笔记生成图谱按钮 */}
        <Panel position="top-left" className="!left-4 !top-20">
          <div className="flex gap-2">
            <button
              onClick={handleGenerateFromNotes}
              disabled={isGenerating}
              className={`
                bg-white/95 dark:bg-gray-900/95 backdrop-blur border-3 border-ink dark:border-gray-500
                shadow-neo-sm rounded-neo px-4 py-2 flex items-center gap-2 font-bold text-sm
                hover:shadow-neo transition-all hover:-translate-y-0.5
                ${isGenerating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                text-ink dark:text-white
              `}
            >
              <VicooIcon name={isGenerating ? 'hourglass_empty' : 'auto_awesome'} size={14} />
              {isGenerating ? '生成中...' : '从笔记生成'}
            </button>
            <button
              onClick={handleCleanupGraph}
              disabled={isCleaningUp}
              className={`
                bg-white/95 dark:bg-gray-900/95 backdrop-blur border-3 border-ink dark:border-gray-500
                shadow-neo-sm rounded-neo px-4 py-2 flex items-center gap-2 font-bold text-sm
                hover:shadow-neo transition-all hover:-translate-y-0.5
                ${isCleaningUp ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                text-ink dark:text-white
              `}
            >
              <VicooIcon name={isCleaningUp ? 'hourglass_empty' : 'cleaning_services'} size={14} />
              {isCleaningUp ? '清理中...' : '清理重复'}
            </button>
          </div>
        </Panel>

        {/* 帮助提示 */}
        <Panel position="bottom-left" className="!left-4 !bottom-4">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur border-3 border-ink dark:border-gray-500 rounded-neo px-4 py-3 shadow-neo-sm animate-fade-in">
            <div className="flex items-center gap-4 text-xs font-bold text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 border-2 border-gray-400 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-800">↔</span> 
                Pan
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 border-2 border-gray-400 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-800">🖱</span> 
                Zoom
              </span>
              <span className="flex items-center gap-1">
                <span className="px-1 border-2 border-gray-400 rounded bg-gray-100 dark:bg-gray-800">Shift</span> 
                + Drag to Link
              </span>
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {/* 节点详情面板 */}
      <div
        className={`
          absolute top-4 bottom-4 right-4 w-96 bg-white dark:bg-gray-800 border-3 border-ink dark:border-gray-500 rounded-neo-lg shadow-neo-lg z-50
          transform transition-all duration-300 ease-out flex flex-col overflow-hidden
          ${selectedNodeId ? 'translate-x-0 animate-scale-in' : 'translate-x-[120%]'}
        `}
      >
        {selectedNode && (
          <>
            <div className={`p-6 ${selectedNode.color} border-b-3 border-ink dark:border-gray-600 relative`}>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/70 border-2 border-ink dark:border-gray-600 rounded-neo-sm flex items-center justify-center hover:bg-white/90 shadow-neo-sm transition-all hover:scale-105 active:scale-95"
              >
                <VicooIcon name="close" size={14} className="text-ink" />
              </button>
              <div className="w-14 h-14 bg-white border-3 border-ink dark:border-gray-600 rounded-neo flex items-center justify-center shadow-neo-sm mb-3">
                <VicooIcon name={selectedNode.icon} size={28} className="text-ink" />
              </div>
              <h2 className="text-2xl font-bold font-display text-ink">{selectedNode.label}</h2>
              <p className="text-xs font-bold opacity-70 uppercase tracking-wider mt-1 text-ink">
                X: {Math.round(selectedNode.x)}, Y: {Math.round(selectedNode.y)}
              </p>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-[#f8fafc] dark:bg-gray-900">
              <div className="mb-6">
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Context</label>
                <textarea 
                  value={selectedNode.description || ''}
                  onChange={async (e) => {
                    const val = e.target.value;
                    try {
                      await updateNode(selectedNode.id, { description: val });
                    } catch (err) {
                      console.error('Failed to update description:', err);
                    }
                  }}
                  className="w-full text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 p-3 rounded-xl border-2 border-ink/10 dark:border-gray-600 h-32 resize-none focus:border-primary focus:ring-0 shadow-sm"
                />
              </div>
              
              <div className="flex gap-2 mb-4">
                <NeoButton 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    if (selectedNode?.linkedNoteId && onOpenNote) {
                      onOpenNote(selectedNode.linkedNoteId);
                    } else if (onOpenNote) {
                      onOpenNote('new');
                    }
                  }}
                >
                  {selectedNode?.linkedNoteId ? 'Open Note' : 'Create Note'}
                </NeoButton>
                <NeoButton 
                  size="sm" 
                  variant="secondary" 
                  className="w-10 !px-0 flex items-center justify-center"
                  onClick={handleDeleteNode}
                >
                  <VicooIcon name="delete" size={14} />
                </NeoButton>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// 包装组件以提供 React Flow 上下文
export const GalaxyView: React.FC<GalaxyViewProps> = (props) => {
  return (
    <ReactFlowProvider>
      <GalaxyViewContent {...props} />
    </ReactFlowProvider>
  );
};

export default GalaxyView;
