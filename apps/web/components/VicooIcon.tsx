import React from 'react';

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

// 映射 slug 到 SVG 文件名
const ICON_MAP: Record<string, string> = {
  // 核心导航图标 (vicoo_xx)
  'write': 'vicoo_01_write.svg',
  'ai_assistant': 'vicoo_02_ai_assistant.svg',
  'chat': 'vicoo_03_chat.svg',
  'prompt': 'vicoo_04_prompt.svg',
  'vibe_coding': 'vicoo_05_vibe_coding.svg',
  'code_editor': 'vicoo_06_code_editor.svg',
  'focus': 'vicoo_07_focus.svg',
  'inspiration': 'vicoo_08_inspiration.svg',
  'draft': 'vicoo_09_draft.svg',
  'template': 'vicoo_10_template.svg',
  'inbox': 'vicoo_11_inbox.svg',
  'knowledge': 'vicoo_12_knowledge.svg',
  'project': 'vicoo_13_project.svg',
  'kanban': 'vicoo_14_kanban.svg',
  'folder': 'vicoo_15_folder.svg',
  'category': 'vicoo_16_category.svg',
  'tag': 'vicoo_17_tag.svg',
  'graph': 'vicoo_18_graph.svg',
  'node': 'vicoo_19_node.svg',
  'connection': 'vicoo_20_connection.svg',
  'favorite': 'vicoo_21_favorite.svg',
  'archive': 'vicoo_22_archive.svg',
  'tree': 'vicoo_23_tree.svg',
  'cluster': 'vicoo_24_cluster.svg',
  'stack': 'vicoo_25_stack.svg',
  'map': 'vicoo_26_map.svg',
  'library': 'vicoo_27_library.svg',
  'collection': 'vicoo_28_collection.svg',
  'bookmark': 'vicoo_29_bookmark.svg',
  'structure': 'vicoo_30_structure.svg',

  // 通用操作图标
  'add': 'add.svg',
  'close': 'close.svg',
  'collapse': 'collapse.svg',
  'confirm': 'confirm.svg',
  'copy': 'copy.svg',
  'delete': 'delete.svg',
  'download': 'download.svg',
  'edit': 'edit.svg',
  'expand': 'expand.svg',
  'export': 'export.svg',
  'filter': 'filter.svg',
  'import': 'import.svg',
  'link': 'link.svg',
  'lock': 'lock.svg',
  'more': 'more.svg',
  'move': 'move.svg',
  'open_in_new': 'open_in_new.svg',
  'paste': 'paste.svg',
  'pin': 'pin.svg',
  'redo': 'redo.svg',
  'refresh': 'refresh.svg',
  'reset': 'reset.svg',
  'save': 'save.svg',
  'search': 'search.svg',
  'share': 'share.svg',
  'sort': 'sort.svg',
  'undo': 'undo.svg',
  'unlink': 'unlink.svg',
  'unlock': 'unlock.svg',
  'upload': 'upload.svg',

  // 导航图标 (nav_)
  'publish_center': 'nav_publish_center.svg',
  'upload_nav': 'nav_upload.svg',
  'schedule': 'nav_schedule.svg',
  'publish_history': 'nav_publish_history.svg',
  'account_manage': 'nav_account_manage.svg',
  'platform_select': 'nav_platform_select.svg',
  'draft_box': 'nav_draft_box.svg',
  'version_manage': 'nav_version_manage.svg',
  'sync': 'nav_sync.svg',

  // 数据分析 (data_)
  'dashboard': 'data_dashboard.svg',
  'analytics': 'data_analytics.svg',
  'trend': 'data_trend.svg',
  'line_chart': 'data_line_chart.svg',
  'bar_chart': 'data_bar_chart.svg',
  'monitor': 'data_monitor.svg',
  'ranking': 'data_ranking.svg',
  'growth': 'data_growth.svg',
  'heat': 'data_heat.svg',
  'feedback': 'data_feedback.svg',

  // 系统 (sys_)
  'timeline': 'sys_timeline.svg',
  'notifications': 'sys_notifications.svg',
  'settings': 'sys_settings.svg',
  'permissions': 'sys_permissions.svg',
  'team': 'sys_team.svg',
  'profile': 'sys_profile.svg',
  'api': 'sys_api.svg',
  'plugins': 'sys_plugins.svg',
  'extensions': 'sys_extensions.svg',
  'help': 'sys_help.svg',
  'audit': 'sys_audit.svg',

  // AI 功能 (ai_)
  'ai_expand': 'ai_expand.svg',
  'ai_extract': 'ai_extract.svg',
  'ai_generate': 'ai_generate.svg',
  'ai_memory': 'ai_memory.svg',
  'ai_optimize': 'ai_optimize.svg',
  'ai_proofread': 'ai_proofread.svg',
  'ai_rewrite': 'ai_rewrite.svg',
  'ai_structure': 'ai_structure.svg',
  'ai_summarize': 'ai_summarize.svg',
  'ai_brain': 'ai_brain.svg',
  'ai_robot': 'ai_robot.svg',
  'ai_wand': 'ai_wand.svg',
  'ai_stars': 'ai_stars.svg',

  // 平台图标 (platform_)
  'platform_douyin': 'platform_douyin.svg',
  'platform_xhs': 'platform_xhs.svg',
  'platform_bilibili': 'platform_bilibili.svg',
  'platform_kuaishou': 'platform_kuaishou.svg',
  'platform_shipinhao': 'platform_shipinhao.svg',
  'platform_tiktok': 'platform_tiktok_global.svg',
  'platform_twitter': 'platform_twitter_x.svg',
  'platform_youtube': 'platform_youtube.svg',
  'platform_instagram': 'platform_instagram.svg',

  // 品牌图标 (brand_)
  'brand_logo': 'brand_vicoo_logo.svg',
  'brand_symbol': 'brand_symbol_mark.svg',

  // 状态图标 (status_)
  'status_done': 'status_done.svg',
  'status_error': 'status_error.svg',
  'status_success': 'status_success.svg',
  'status_warning': 'status_warning.svg',
  'status_loading': 'status_loading.svg',
  'status_syncing': 'status_syncing.svg',

  // 专注模式 (focus_)
  'focus_timer': 'focus_timer.svg',
  'focus_target': 'focus_target.svg',
  'focus_dnd': 'focus_dnd.svg',

  // 媒体图标 (media_)
  'media_video': 'media_video.svg',
  'media_image': 'media_image.svg',
  'media_audio': 'media_audio.svg',
  'media_music': 'media_music.svg',
  'media_document': 'media_document.svg',
};

// 缓存已加载的 SVG
const svgCache: Record<string, string> = {};

export const VicooIcon: React.FC<IconProps> = ({ name, className = '', size = 24 }) => {
  const fileName = ICON_MAP[name];

  if (!fileName) {
    // 如果找不到对应的图标，返回 null
    console.warn(`Icon "${name}" not found in vicoo-icons`);
    return null;
  }

  const [svgContent, setSvgContent] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadSvg = async () => {
      if (svgCache[fileName]) {
        setSvgContent(svgCache[fileName]);
        return;
      }

      try {
        const response = await fetch(`/icons/vicoo-icons/${fileName}`);
        const text = await response.text();
        svgCache[fileName] = text;
        setSvgContent(text);
      } catch (error) {
        console.error(`Failed to load icon: ${fileName}`, error);
      }
    };

    loadSvg();
  }, [fileName]);

  if (!svgContent) {
    return <span className={className} style={{ width: size, height: size, display: 'inline-block' }} />;
  }

  return (
    <span
      className={className}
      style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

// 便捷导出
export default VicooIcon;
