/**
 * GalaxyNode - 自定义节点组件用于 React Flow
 * 保留原有的 Neubrutalism 风格设计
 */

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AnimatedPlanet } from './AnimatedPlanet';

interface GalaxyNodeData {
  label: string;
  icon: string;
  color: string;
  description?: string;
  selected?: boolean;
}

export const GalaxyNode = memo(({ data, selected }: NodeProps<GalaxyNodeData>) => {
  return (
    <div className="relative">
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-ink !border-2 !border-white !opacity-0 hover:!opacity-100 transition-opacity"
      />
      
      <AnimatedPlanet
        color={data.color}
        icon={data.icon}
        label={data.label}
        size={100}
        className={`
          transition-all duration-300
          ${selected ? 'scale-125 drop-shadow-2xl' : 'hover:scale-110'}
        `}
      />
      
      {/* 选中指示器 */}
      {selected && (
        <div className="absolute inset-0 -m-4 border-2 border-dashed border-[#EF476F] rounded-full animate-spin-slow pointer-events-none" />
      )}
      
      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-ink !border-2 !border-white !opacity-0 hover:!opacity-100 transition-opacity"
      />
    </div>
  );
});

GalaxyNode.displayName = 'GalaxyNode';

export default GalaxyNode;
