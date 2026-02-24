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

  // Material Icons 别名 (映射到可用的图标)
  'edit_note': 'vicoo_06_code_editor.svg',     // 编辑笔记
  'account_tree': 'vicoo_23_tree.svg',         // 知识树
  'history': 'nav_publish_history.svg',        // 历史
  'auto_awesome': 'ai_stars.svg',              // AI 之星
  'bolt': 'vicoo_08_inspiration.svg',         // 灵感
  'public': 'vicoo_18_graph.svg',              // 公开/图谱
  'schedule': 'nav_schedule.svg',              // 日程
  'build': 'sys_plugins.svg',                  // 构建/维护
  'arrow_forward': 'link.svg',                 // 前进
  'stream': 'data_trend.svg',                  // 数据流
  'travel_explore': 'ai_generate.svg',        // 探索
  'add_circle': 'add.svg',                     // 添加
  'send': 'link.svg',                          // 发送
  'format_bold': 'vicoo_06_code_editor.svg',  // 粗体
  'format_italic': 'vicoo_05_vibe_coding.svg', // 斜体
  'code': 'vicoo_06_code_editor.svg',          // 代码
  'check': 'confirm.svg',                      // 检查
  'check_circle': 'confirm.svg',               // 完成
  'stars': 'ai_stars.svg',                     // 星星
  'hub': 'vicoo_18_graph.svg',                 // 中心
  'palette': 'vicoo_10_template.svg',         // 调色板/模板
  'radar': 'data_monitor.svg',                 // 雷达/监控
  'format_list_bulleted': 'nav_draft_box.svg', // 列表
  'image': 'media_image.svg',                  // 图片
  'format_quote': 'vicoo_04_prompt.svg',      // 引用
  'title': 'vicoo_27_library.svg',             // 标题
  'calendar_today': 'nav_schedule.svg',        // 日历
  'person': 'sys_profile.svg',                 // 个人
  'group': 'sys_team.svg',                     // 团队
  'tag': 'vicoo_17_tag.svg',                   // 标签
  'label': 'vicoo_16_category.svg',            // 分类
  'flag': 'vicoo_21_favorite.svg',             // 标记
  'bookmark': 'vicoo_29_bookmark.svg',         // 书签
  'push_pin': 'pin.svg',                       // 图钉
  'archive': 'vicoo_22_archive.svg',           // 归档
  'more_vert': 'more.svg',                     // 更多
  'menu': 'more.svg',                          // 菜单
  'expand_more': 'expand.svg',                 // 展开
  'expand_less': 'collapse.svg',               // 收起
  'chevron_left': 'collapse.svg',              // 左箭头
  'chevron_right': 'expand.svg',               // 右箭头
  'arrow_back': 'collapse.svg',                // 返回
  'arrow_upward': 'vicoo_25_stack.svg',        // 上升
  'arrow_downward': 'vicoo_24_cluster.svg',    // 下降
  'close_fullscreen': 'collapse.svg',          // 退出全屏
  'fullscreen': 'expand.svg',                  // 全屏
  'open_in_full': 'expand.svg',                // 打开全屏
  'filter_list': 'filter.svg',                 // 筛选列表
  'sort': 'sort.svg',                          // 排序
  'search': 'search.svg',                      // 搜索
  'mic': 'media_audio.svg',                    // 麦克风
  'mic_off': 'media_audio.svg',                // 静音
  'volume_up': 'media_music.svg',              // 音量
  'volume_off': 'media_music.svg',             // 静音
  'play_arrow': 'media_video.svg',             // 播放
  'pause': 'media_video.svg',                  // 暂停
  'stop': 'status_error.svg',                  // 停止
  'skip_next': 'nav_sync.svg',                 // 下一首
  'skip_previous': 'nav_sync.svg',             // 上一首
  'replay': 'redo.svg',                        // 重播
  'shuffle': 'sort.svg',                      // 随机
  'repeat': 'redo.svg',                        // 重复
  'lightbulb': 'ai_brain.svg',                 // 灯泡/想法
  'psychology': 'ai_brain.svg',                // 心理/思维
  'auto_fix_high': 'ai_wand.svg',              // AI 修复
  'spellcheck': 'ai_proofread.svg',            // 拼写检查
  'translate': 'ai_summarize.svg',             // 翻译
  'text_fields': 'ai_rewrite.svg',             // 文本字段
  'format_size': 'vicoo_06_code_editor.svg',  // 字号
  'format_color_text': 'ai_expand.svg',        // 文字颜色
  'format_color_fill': 'ai_extract.svg',       // 填充颜色
  'border_color': 'ai_structure.svg',          // 边框颜色
  'format_align_left': 'vicoo_23_tree.svg',   // 左对齐
  'format_align_center': 'vicoo_18_graph.svg',// 居中
  'format_align_right': 'vicoo_20_connection.svg',// 右对齐
  'format_list_numbered': 'nav_draft_box.svg', // 数字列表
  'format_indent_increase': 'expand.svg',     // 增加缩进
  'format_indent_decrease': 'collapse.svg',    // 减少缩进
  'horizontal_rule': 'connection.svg',         // 水平线
  'link_off': 'unlink.svg',                    // 取消链接
  'attach_file': 'link.svg',                   // 附件
  'insert_comment': 'vicoo_04_prompt.svg',     // 插入评论
  'insert_drive_file': 'media_document.svg',    // 插入文件
  'folder_open': 'folder.svg',                 // 打开文件夹
  'create_new_folder': 'folder.svg',            // 新建文件夹
  'file_upload': 'upload.svg',                 // 上传文件
  'file_download': 'download.svg',             // 下载文件
  'cloud_upload': 'upload.svg',                // 云上传
  'cloud_download': 'download.svg',            // 云下载
  'drive_file_move': 'move.svg',               // 移动文件
  'content_copy': 'copy.svg',                   // 复制
  'content_cut': 'cut.svg',                     // 剪切
  'content_paste': 'paste.svg',                 // 粘贴
  'delete_outline': 'delete.svg',               // 删除轮廓
  'delete_forever': 'delete.svg',               // 永久删除
  'restore': 'reset.svg',                       // 恢复
  'autorenew': 'refresh.svg',                   // 自动刷新
  'sync': 'refresh.svg',                        // 同步
  'cached': 'refresh.svg',                      // 缓存
  'settings': 'sys_settings.svg',              // 设置
  'help_outline': 'sys_help.svg',               // 帮助
  'info': 'sys_help.svg',                       // 信息
  'warning': 'status_warning.svg',              // 警告
  'error': 'status_error.svg',                  // 错误
  'done': 'status_done.svg',                    // 完成
  'hourglass_empty': 'status_loading.svg',      // 沙漏
  'hourglass_full': 'status_syncing.svg',       // 沙漏满
  'timer': 'focus_timer.svg',                   // 计时器
  'alarm': 'focus_timer.svg',                   // 闹钟
  'schedule': 'focus_timer.svg',                // 定时
  'today': 'focus_target.svg',                  // 今天
  'date_range': 'nav_schedule.svg',             // 日期范围
  'calendar_month': 'nav_schedule.svg',         // 月历
  'access_time': 'focus_timer.svg',             // 时间
  'watch_later': 'archive.svg',                 // 待会看
  'flight_takeoff': 'ai_generate.svg',          // 起飞
  'flight': 'ai_generate.svg',                   // 飞行
  'wifi': 'data_monitor.svg',                   // WiFi
  'wifi_off': 'status_error.svg',               // WiFi 关闭
  'signal_cellular_alt': 'data_trend.svg',      // 信号
  'location_on': 'map.svg',                     // 位置
  'location_off': 'map.svg',                    // 位置关闭
  'pin_drop': 'pin.svg',                        // 标记位置
  'phone': 'media_audio.svg',                   // 电话
  'phone_disabled': 'media_audio.svg',          // 电话禁用
  'message': 'chat.svg',                        // 消息
  'mail': 'chat.svg',                           // 邮件
  'mail_outline': 'chat.svg',                   // 邮件轮廓
  'inbox': 'vicoo_11_inbox.svg',                // 收件箱
  'markunread': 'nav_draft_box.svg',            // 未读
  'drafts': 'nav_draft_box.svg',                // 草稿
  'send': 'link.svg',                           // 发送
  'archive': 'vicoo_22_archive.svg',            // 归档
  'unarchive': 'vicoo_22_archive.svg',          // 取消归档
  'delete_sweep': 'delete.svg',                // 删除扫描
  'outbox_box': 'upload.svg',                   // 发件箱
  'mark_email_read': 'status_done.svg',         // 标记已读
  'mark_email_unread': 'nav_draft_box.svg',    // 标记未读
  'note_add': 'add.svg',                        // 添加笔记
  'post_add': 'add.svg',                        // 添加帖子
  'create': 'edit.svg',                         // 创建
  'add_box': 'add.svg',                         // 添加盒子
  'vertical_align_top': 'vicoo_25_stack.svg',  // 顶部对齐
  'vertical_align_bottom': 'vicoo_24_cluster.svg', // 底部对齐
  'vertical_align_center': 'vicoo_18_graph.svg', // 居中
  'wrap_text': 'vicoo_23_tree.svg',            // 换行
  'text_format': 'vicoo_06_code_editor.svg',    // 文本格式
  'monetization_on': 'data_growth.svg',        // 货币
  'attach_money': 'data_growth.svg',            // 金钱
  'local_offer': 'tag.svg',                     // 优惠
  'shopping_cart': 'data_ranking.svg',          // 购物车
  'credit_card': 'data_bar_chart.svg',          // 信用卡
  'payment': 'data_bar_chart.svg',              // 支付
  'account_balance': 'data_bar_chart.svg',     // 账户余额
  'trending_up': 'data_growth.svg',             // 上升趋势
  'trending_down': 'data_trend.svg',            // 下降趋势
  'trending_flat': 'data_line_chart.svg',       // 平稳趋势

  // 更多 Material Icons 别名
  'tune': 'sys_settings.svg',                   // 调谐/设置
  'music_note': 'media_music.svg',              // 音乐
  'terminal': 'vicoo_06_code_editor.svg',       // 终端
  'psychology': 'ai_brain.svg',                 // 心理/AI
  'smart_toy': 'ai_robot.svg',                  // 机器人
  'construction': 'sys_extensions.svg',         // 建设/构建
  'dark_mode': 'sys_settings.svg',              // 暗色模式
  'library_music': 'media_music.svg',           // 音乐库
  'light_mode': 'ai_stars.svg',                 // 亮色模式
  'auto_awesome': 'ai_wand.svg',               // 自动/AI
  'tips_and_updates': 'ai_generate.svg',       // 提示
  'integration_instructions': 'link.svg',       // 集成说明
  'api': 'sys_api.svg',                         // API
  'key': 'lock.svg',                           // 密钥
  'cloud': 'upload.svg',                       // 云
  'security': 'lock.svg',                      // 安全
  'language': 'vicoo_04_prompt.svg',           // 语言
  'palette': 'vicoo_10_template.svg',          // 调色板
  'font_download': 'vicoo_06_code_editor.svg', // 字体下载
  'storage': 'vicoo_25_stack.svg',             // 存储
  'backup': 'download.svg',                     // 备份
  'restore': 'reset.svg',                      // 恢复
  'delete_forever': 'delete.svg',              // 永久删除
  'logout': 'unlock.svg',                      // 登出
  'login': 'lock.svg',                         // 登录
  'account_circle': 'sys_profile.svg',         // 账户
  'person': 'sys_profile.svg',                 // 个人
  'group': 'sys_team.svg',                     // 团队
  'notifications': 'sys_notifications.svg',    // 通知
  'notifications_off': 'sys_notifications.svg',// 关闭通知
  'email': 'chat.svg',                         // 邮件
  'phone_android': 'media_audio.svg',          // 手机
  'computer': 'vicoo_06_code_editor.svg',       // 电脑
  'cloud_sync': 'sync.svg',                    // 云同步
  'sync': 'refresh.svg',                        // 同步
  'backup': 'download.svg',                    // 备份
  'restore': 'reset.svg',                      // 恢复
  'delete_sweep': 'delete.svg',                // 清除
  'cleaning_services': 'delete.svg',           // 清洁服务
  'fact_check': 'confirm.svg',                 // 事实核查
  'policy': 'lock.svg',                        // 策略
  'admin_panel_settings': 'sys_permissions.svg', // 管理面板
  'supervised_user_circle': 'sys_team.svg',    // 监督用户
  'manage_accounts': 'sys_profile.svg',        // 管理账户
  'account_box': 'sys_profile.svg',            // 账户盒子
  'assignment': 'nav_draft_box.svg',           // 分配
  'assignment_turned_in': 'confirm.svg',        // 已完成
  'assignment_late': 'status_warning.svg',     // 延迟
  'assignment_ind': 'nav_draft_box.svg',       // 进行中
  'drag_indicator': 'move.svg',                 // 拖动指示
  'rule': 'filter.svg',                        // 规则
  'block': 'lock.svg',                        // 阻止
  'hourglass_empty': 'status_loading.svg',     // 沙漏空
  'hourglass_full': 'status_syncing.svg',      // 沙漏满
  'miscellaneous_services': 'more.svg',        // 其他服务
  'model_training': 'ai_brain.svg',            // 模型训练
  'smart_button': 'ai_wand.svg',               // 智能按钮
  'quick_reference': 'vicoo_04_prompt.svg',    // 快速参考
  'keyboard_command_key': 'vicoo_06_code_editor.svg', // 命令键
  'keyboard': 'vicoo_06_code_editor.svg',      // 键盘
  'extension': 'sys_extensions.svg',           // 扩展
  'extension_off': 'sys_extensions.svg',      // 关闭扩展
  'power': 'status_done.svg',                  // 电源
  'power_settings_new': 'sys_settings.svg',    // 电源设置
  'shield': 'lock.svg',                        // 盾牌
  'security_update': 'sys_settings.svg',       // 安全更新
  'verified_user': 'confirm.svg',              // 验证用户
  'vpn_key': 'lock.svg',                      // VPN 密钥
  'remove_circle': 'delete.svg',               // 删除圆圈
  'check_circle': 'confirm.svg',               // 检查圆圈
  'cancel': 'close.svg',                      // 取消
  'pending': 'status_loading.svg',            // 待定
  'pending_actions': 'status_loading.svg',     // 待定操作
  'reorder': 'sort.svg',                      // 重新排序
  'dns': 'vicoo_18_graph.svg',                // DNS
  'category': 'vicoo_16_category.svg',        // 分类
  'inventory': 'vicoo_25_stack.svg',           // 库存
  'shopping_bag': 'data_ranking.svg',         // 购物袋
  'local_offer': 'tag.svg',                    // 优惠
  'confirmation_number': 'confirm.svg',       // 确认号
  'card_membership': 'sys_team.svg',          // 会员卡
  'schedule_send': 'nav_schedule.svg',         // 定时发送
  'send_and_archive': 'archive.svg',          // 发送并归档
  'drafts': 'nav_draft_box.svg',              // 草稿
  'markunread': 'nav_draft_box.svg',          // 未读标记
  'inbox': 'vicoo_11_inbox.svg',              // 收件箱
  'file_copy': 'copy.svg',                    // 文件复制
  'content_cut': 'copy.svg',                  // 剪切内容
  'link_off': 'unlink.svg',                  // 链接关闭
  'attachment': 'link.svg',                   // 附件
  'cloud_upload': 'upload.svg',               // 云上传
  'cloud_download': 'download.svg',            // 云下载
  'cloud_queue': 'vicoo_25_stack.svg',        // 云队列
  'folder': 'vicoo_15_folder.svg',            // 文件夹
  'folder_open': 'folder.svg',                 // 打开文件夹
  'create_new_folder': 'folder.svg',          // 新建文件夹
  'folder_special': 'favorite.svg',           // 特殊文件夹
  'drive_file_move': 'move.svg',              // 移动文件
  'drive_file_rename': 'edit.svg',           // 重命名
  'drive_file_delete': 'delete.svg',          // 删除文件
  'search': 'search.svg',                     // 搜索
  'search_off': 'search.svg',                 // 关闭搜索
  'zoom_in': 'expand.svg',                    // 放大
  'zoom_out': 'collapse.svg',                 // 缩小
  'fullscreen': 'expand.svg',                 // 全屏
  'fullscreen_exit': 'collapse.svg',          // 退出全屏
  'filter_alt': 'filter.svg',                 // 筛选
  'filter_alt_off': 'filter.svg',             // 关闭筛选
  'sort': 'sort.svg',                         // 排序
  'import_export': 'import.svg',              // 导入导出
  'apps': 'more.svg',                         // 应用
  'more_horiz': 'more.svg',                   // 更多水平
  'more_vert': 'more.svg',                    // 更多垂直
  'layers': 'vicoo_25_stack.svg',             // 图层
  'layers_clear': 'vicoo_25_stack.svg',        // 清除图层
  'tile': 'vicoo_16_category.svg',            // 瓦片
  'dashboard_customize': 'data_dashboard.svg', // 自定义仪表盘
  'view_sidebar': 'collapse.svg',             // 查看侧边栏
  'view_stream': 'data_trend.svg',           // 查看流
  'view_week': 'nav_schedule.svg',            // 查看周
  'view_agenda': 'nav_schedule.svg',          // 查看议程
  'view_list': 'nav_draft_box.svg',           // 查看列表
  'view_module': 'vicoo_25_stack.svg',         // 查看模块
  'view_quilt': 'vicoo_24_cluster.svg',       // 查看被子
  'table_chart': 'data_bar_chart.svg',        // 表格图表
  'bar_chart': 'data_bar_chart.svg',         // 柱状图
  'pie_chart': 'data_ranking.svg',           // 饼图
  'show_chart': 'data_line_chart.svg',       // 显示图表
  'stacked_line_chart': 'data_line_chart.svg', // 堆叠折线图
  'multiline_chart': 'data_line_chart.svg',  // 多线图
  'timeline': 'sys_timeline.svg',             // 时间线
  'table_rows': 'vicoo_23_tree.svg',         // 表格行
  'table_rows_locked': 'lock.svg',            // 锁定行
  'replay': 'redo.svg',                       // 重播
  'shuffle': 'sort.svg',                     // 随机
  'skip_next': 'nav_sync.svg',                // 下一个
  'skip_previous': 'nav_sync.svg',            // 上一个
  'play_arrow': 'media_video.svg',            // 播放
  'pause': 'media_video.svg',                 // 暂停
  'stop': 'status_error.svg',                 // 停止
  'forward_10': 'nav_sync.svg',               // 快进
  'replay_10': 'redo.svg',                   // 后退
  'fast_forward': 'nav_sync.svg',             // 快进
  'fast_rewind': 'redo.svg',                  // 快退
  'volume_up': 'media_music.svg',             // 音量调高
  'volume_down': 'media_music.svg',           // 音量调低
  'volume_mute': 'media_music.svg',           // 静音
  'volume_off': 'media_music.svg',            // 关闭音量
  'loop': 'redo.svg',                         // 循环
  'queue_music': 'media_music.svg',          // 队列音乐
  'queue': 'nav_draft_box.svg',               // 队列
  'airplay': 'media_video.svg',               // 投屏
  'video_library': 'media_video.svg',         // 视频库
  'video_call': 'media_video.svg',            // 视频通话
  'call': 'media_audio.svg',                  // 通话
  'call_end': 'media_audio.svg',              // 结束通话
  'mic': 'media_audio.svg',                   // 麦克风
  'mic_off': 'media_audio.svg',               // 关闭麦克风
  'camera_alt': 'media_image.svg',            // 相机
  'photo_camera': 'media_image.svg',          // 照片相机
  'image': 'media_image.svg',                 // 图像
  'image_search': 'search.svg',               // 搜索图片
  'collections': 'vicoo_28_collection.svg',  // 集合
  'collections_bookmark': 'vicoo_29_bookmark.svg', // 书签集合
  'photo_library': 'vicoo_27_library.svg',   // 照片库
  'brush': 'vicoo_10_template.svg',           // 画笔
  'palette': 'vicoo_10_template.svg',         // 调色板
  'format_paint': 'vicoo_10_template.svg',    // 格式油漆
  'gradient': 'data_trend.svg',               // 渐变
  'colorize': 'vicoo_10_template.svg',         // 着色
  'format_shapes': 'vicoo_16_category.svg',  // 形状
  'pentagon': 'vicoo_18_graph.svg',          // 五边形
  'hexagon': 'vicoo_18_graph.svg',           // 六边形
  'square': 'vicoo_24_cluster.svg',           // 方形
  'change_history': 'data_trend.svg',        // 更改历史
  'architecture': 'vicoo_30_structure.svg',  // 架构
  'architecture': 'vicoo_30_structure.svg',  // 建筑/结构
  'engineering': 'vicoo_06_code_editor.svg',  // 工程
  'science': 'ai_brain.svg',                  // 科学
  'calculate': 'data_bar_chart.svg',         // 计算
  'functions': 'vicoo_06_code_editor.svg',   // 函数
  'hexagon': 'vicoo_18_graph.svg',           // 六边形
  'update': 'refresh.svg',                    // 更新
  'warning': 'status_warning.svg',            // 警告
  'error': 'status_error.svg',               // 错误
  'report_problem': 'status_warning.svg',     // 报告问题
  'checklist': 'confirm.svg',                // 检查清单
  'edit': 'edit.svg',                        // 编辑
  'groups': 'sys_team.svg',                   // 群组
  'lightbulb': 'ai_brain.svg',               // 灯泡/想法
  'article': 'vicoo_06_code_editor.svg',    // 文章
  'local_fire_department': 'data_growth.svg', // 火焰/热度
  'waves': 'data_trend.svg',                  // 波浪
  'analytics': 'data_analytics.svg',          // 分析
  'restart_alt': 'refresh.svg',               // 重启
  'play_arrow': 'media_video.svg',           // 播放
  'pause': 'media_video.svg',                // 暂停
  'surround_sound': 'media_audio.svg',       // 环绕声
  'expand_more': 'expand.svg',               // 展开更多
  'volume_down': 'media_music.svg',          // 降低音量
  'volume_up': 'media_music.svg',            // 提高音量
  'skip_previous': 'nav_sync.svg',           // 上一首
  'skip_next': 'nav_sync.svg',               // 下一首
  'library_books': 'vicoo_27_library.svg',  // 图书馆/搜索
  'content_copy': 'copy.svg',               // 复制内容
  'thumb_up': 'confirm.svg',                // 点赞
  'library_music': 'media_music.svg',       // 音乐库
  'arrow_downward': 'vicoo_24_cluster.svg', // 向下箭头
  'arrow_upward': 'vicoo_25_stack.svg',    // 向上箭头
  'error_outline': 'status_error.svg',      // 错误轮廓
  'filter_none': 'filter.svg',             // 筛选无
  'share': 'share.svg',                    // 分享
  'note': 'vicoo_06_code_editor.svg',      // 笔记
  'search_off': 'search.svg',              // 搜索关闭
  'upload_file': 'upload.svg',              // 上传文件
  'chevron_right': 'expand.svg',           // 右箭头
  'description': 'media_document.svg',     // 描述
  'folder': 'vicoo_15_folder.svg',         // 文件夹
  'people': 'sys_team.svg',               // 人群
  'note_add': 'add.svg',                 // 添加笔记
  'video_file': 'media_video.svg',        // 视频文件
  'qr_code': 'link.svg',                 // 二维码
  'account_circle': 'sys_profile.svg',    // 账户
  'rocket_launch': 'ai_generate.svg',     // 发射
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
