"""
SDC - Sentient Desktop Companion
Desktop Mascot Window — Enhanced with Vicoo deep binding

Features:
  - Transparent, always-on-top, draggable mascot
  - Vicoo API event bridge (note events → mascot reactions)
  - Cute bubble notification / quick-action / mini-chat dialogs
  - Auto-behavior: idle roaming, random ear twitches, self-driven state changes
  - System tray integration
"""

import logging
import math
import random
import time

from PyQt6.QtCore import Qt, QTimer, QPoint, QDateTime, QRectF, pyqtSignal
from PyQt6.QtGui import QPainter, QCursor, QAction, QMouseEvent, QIcon, QPixmap
from PyQt6.QtWidgets import QWidget, QMenu, QApplication, QSystemTrayIcon

from .renderer import MascotRenderer
from .state_machine import MascotStateMachine, MascotState, setup_logging
from .llm import get_llm_client
from .vicoo_bridge import VicooBridge, VicooEvent
from .bubble_dialog import (
    BubbleNotification,
    QuickActionMenu,
    MiniChatBubble,
    QuickNoteDialog,
)


class MascotWindow(QWidget):
    """
    Transparent, always-on-top, draggable desktop mascot with deep Vicoo binding.
    """

    WINDOW_WIDTH = 133
    WINDOW_HEIGHT = 147
    quit_requested = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)

        setup_logging()
        self._logger = logging.getLogger("sdc.window")

        # Core components
        self._mascot = MascotRenderer(self)
        self._state_machine = MascotStateMachine(self)
        self._state_machine.stateChanged.connect(self._on_state_changed)
        self._llm_client = get_llm_client()

        # Vicoo API bridge
        self._bridge = VicooBridge(parent=self)
        self._bridge.connected.connect(self._on_vicoo_connected)
        self._bridge.disconnected.connect(self._on_vicoo_disconnected)
        self._bridge.note_created.connect(self._on_note_created)
        self._bridge.note_count_changed.connect(self._on_note_count_changed)

        # UI state
        self._is_dragging = False
        self._drag_offset = QPoint()
        self._click_count = 0
        self._click_timer = QTimer(self)
        self._click_timer.timeout.connect(self._reset_click)
        self._click_timer.setSingleShot(True)

        # Active dialogs (one at a time)
        self._active_dialog: QWidget | None = None
        self._notification_queue: list[BubbleNotification] = []

        # Animation
        self._anim_timer = QTimer(self)
        self._anim_timer.timeout.connect(self._on_animation_tick)
        self._anim_timer.start(16)
        self._last_tick = 0

        # Auto-behavior
        self._auto_timer = QTimer(self)
        self._auto_timer.timeout.connect(self._auto_behavior)
        self._auto_timer.start(8000)
        self._idle_since = time.time()

        # Window setup
        self._setup_window()
        self._context_menu = None
        self._tray_icon = None
        self._setup_tray_icon()

        # Start bridge
        self._bridge.start()

        self._logger.info("MascotWindow initialized with Vicoo bridge")

    # ------------------------------------------------------------------
    # Window setup
    # ------------------------------------------------------------------

    def _setup_window(self):
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.WindowStaysOnTopHint
            | Qt.WindowType.Tool
        )
        self.resize(self.WINDOW_WIDTH, self.WINDOW_HEIGHT)
        screen = QApplication.primaryScreen().geometry()
        self.move(screen.width() - self.WINDOW_WIDTH - 20,
                  screen.height() - self.WINDOW_HEIGHT - 60)

    def _setup_tray_icon(self):
        if not QSystemTrayIcon.isSystemTrayAvailable():
            return
        pixmap = QPixmap(64, 64)
        pixmap.fill(Qt.GlobalColor.transparent)
        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        scale = 64.0 / 200.0
        painter.translate(32, 32)
        painter.scale(scale, scale)
        painter.translate(-100, -100)
        self._mascot.render(painter, QRectF(0, 0, 200, 200))
        painter.end()
        self._tray_icon = QSystemTrayIcon(QIcon(pixmap), self)
        tray_menu = QMenu()
        tray_menu.addAction("显示桌宠", self._show_from_tray)
        tray_menu.addAction("隐藏桌宠", self.hide)
        tray_menu.addSeparator()
        tray_menu.addAction("退出", self._on_quit)
        self._tray_icon.setContextMenu(tray_menu)
        self._tray_icon.activated.connect(self._on_tray_activated)
        self._tray_icon.show()

    def _show_from_tray(self):
        self.show(); self.raise_(); self.activateWindow()

    def _on_tray_activated(self, reason):
        if reason == QSystemTrayIcon.ActivationReason.Trigger:
            self._show_from_tray() if not self.isVisible() else self.hide()

    # ------------------------------------------------------------------
    # State management
    # ------------------------------------------------------------------

    def set_state(self, state: str):
        try:
            state_enum = MascotState(state.lower())
            if self._state_machine.transition(state_enum):
                self._mascot.state = state
        except Exception as e:
            self._logger.debug("set_state(%s) failed: %s", state, e)

    def get_state(self) -> str:
        return self._state_machine.current_state.value

    def _on_state_changed(self, state: str):
        self._mascot.state = state
        self._idle_since = time.time()

    @property
    def state_machine(self) -> MascotStateMachine:
        return self._state_machine

    # ------------------------------------------------------------------
    # Vicoo bridge event handlers
    # ------------------------------------------------------------------

    def _on_vicoo_connected(self):
        self.set_state("greeting")
        self._show_notification("🟢 已连接 Vicoo！", icon="🔗")
        QTimer.singleShot(2500, lambda: self.set_state("idle"))

    def _on_vicoo_disconnected(self):
        self.set_state("sad")
        self._show_notification("🔴 Vicoo 连接断开", icon="⚠️")
        QTimer.singleShot(3000, lambda: self.set_state("idle"))

    def _on_note_created(self, note: dict):
        title = note.get("title", "新笔记")
        self.set_state("celebrating")
        self._show_notification(f"新笔记: {title}", icon="📝")
        QTimer.singleShot(3000, lambda: self.set_state("idle"))

    def _on_note_count_changed(self, count: int):
        self._logger.info("Note count: %d", count)

    # ------------------------------------------------------------------
    # Auto-behavior system
    # ------------------------------------------------------------------

    def _auto_behavior(self):
        """Self-driven state transitions when idle."""
        current = self.get_state()
        if current != "idle":
            return

        idle_dur = time.time() - self._idle_since
        roll = random.random()

        if idle_dur > 300:
            # Sleepy after 5 minutes idle
            if roll < 0.3:
                self.set_state("sleeping")
                QTimer.singleShot(15000, lambda: self.set_state("idle"))
                return

        if idle_dur > 60:
            # Occasional yawn/stretch
            if roll < 0.15:
                self.set_state("breathing")
                QTimer.singleShot(5000, lambda: self.set_state("idle"))
                return

        # Random micro-actions
        if roll < 0.08:
            self.set_state("listening")
            QTimer.singleShot(2000, lambda: self.set_state("idle"))
        elif roll < 0.12:
            self.set_state("question")
            QTimer.singleShot(2000, lambda: self.set_state("idle"))

        # Occasional helpful tips
        if roll < 0.03 and self._bridge.is_connected:
            tips = [
                "点我可以快速创建笔记哦～",
                "双击我可以和AI聊天！",
                "试试用 Galaxy View 看看知识图谱？",
                "记得给笔记添加标签～",
            ]
            self._show_notification(random.choice(tips), icon="💡")

    # ------------------------------------------------------------------
    # Dialogs
    # ------------------------------------------------------------------

    def _show_notification(self, text: str, icon: str = "💬", duration: int = 4000):
        """Show a kawaii notification bubble above the mascot."""
        notif = BubbleNotification(text, icon=icon, duration_ms=duration)
        pos = self.pos()
        notif.move(pos.x() + self.width() // 2 - notif.width() // 2,
                   pos.y() - notif.height() - 4)
        notif.show()

    def _show_quick_actions(self):
        """Show the quick action menu."""
        if self._active_dialog:
            self._active_dialog.close()
            self._active_dialog = None
            return
        menu = QuickActionMenu()
        menu.action_triggered.connect(self._on_quick_action)
        pos = self.pos()
        menu.move(pos.x() + self.width() // 2 - menu.width() // 2,
                  pos.y() - menu.height() - 4)
        menu.show()
        self._active_dialog = menu

    def _on_quick_action(self, action_id: str):
        self._active_dialog = None
        if action_id == "new_note":
            self._show_quick_note()
        elif action_id == "ai_chat":
            self._show_mini_chat()
        elif action_id == "search":
            self._show_mini_chat()  # reuse chat for search
        elif action_id == "gen_graph":
            self.set_state("thinking")
            self._show_notification("正在生成知识图谱…", icon="🌌")
            QTimer.singleShot(500, self._do_generate_graph)
        elif action_id == "focus":
            self.set_state("meditating")
            self._show_notification("进入专注模式 🧘", icon="🍅")
            QTimer.singleShot(25 * 60 * 1000, lambda: (
                self.set_state("celebrating"),
                self._show_notification("专注时间结束！休息一下吧 ☕", icon="🎉"),
            ))
        elif action_id == "sleep":
            self.set_state("sleeping")
            self._show_notification("晚安～ 💤", icon="😴")
            QTimer.singleShot(10000, lambda: self.set_state("idle"))

    def _show_quick_note(self):
        dlg = QuickNoteDialog()
        dlg.note_created.connect(self._on_quick_note_create)
        pos = self.pos()
        dlg.move(pos.x() + self.width() // 2 - dlg.width() // 2,
                 pos.y() - dlg.height() - 4)
        dlg.show()
        self._active_dialog = dlg

    def _on_quick_note_create(self, title: str, body: str):
        self._active_dialog = None
        self.set_state("saving")
        result = self._bridge.create_note(title, body)
        if result:
            self.set_state("saved")
            self._show_notification(f"已保存: {title}", icon="✅")
        else:
            self.set_state("error")
            self._show_notification("保存失败…", icon="❌")
        QTimer.singleShot(2000, lambda: self.set_state("idle"))

    def _show_mini_chat(self):
        chat = MiniChatBubble()
        chat.message_sent.connect(self._on_mini_chat_send)
        chat.close_requested.connect(lambda: setattr(self, '_active_dialog', None))
        pos = self.pos()
        chat.move(pos.x() + self.width() // 2 - chat.width() // 2,
                  pos.y() - chat.height() - 4)
        chat.show()
        self._active_dialog = chat

    def _on_mini_chat_send(self, message: str):
        self.set_state("thinking")
        # Run in background to avoid blocking
        QTimer.singleShot(100, lambda: self._do_ai_chat(message))

    def _do_ai_chat(self, message: str):
        response = self._bridge.ai_chat(message)
        if response and self._active_dialog and isinstance(self._active_dialog, MiniChatBubble):
            self._active_dialog.add_message("ai", response)
            self.set_state("happy")
        else:
            if self._active_dialog and isinstance(self._active_dialog, MiniChatBubble):
                self._active_dialog.add_message("ai", "抱歉，暂时无法回答…")
            self.set_state("sad")
        QTimer.singleShot(2000, lambda: self.set_state("idle"))

    def _do_generate_graph(self):
        result = self._bridge.generate_graph()
        if result:
            nc = result.get("summary", {}).get("nodesCreated", 0)
            lc = result.get("summary", {}).get("linksCreated", 0)
            self.set_state("celebrating")
            self._show_notification(f"图谱完成! {nc}节点 {lc}关联", icon="🌌")
        else:
            self.set_state("error")
            self._show_notification("图谱生成失败", icon="❌")
        QTimer.singleShot(3000, lambda: self.set_state("idle"))

    # ------------------------------------------------------------------
    # Context menu
    # ------------------------------------------------------------------

    def _create_context_menu(self):
        self._context_menu = QMenu(self)
        self._status_action = QAction("状态: Idle", self)
        self._status_action.setEnabled(False)
        self._context_menu.addAction(self._status_action)
        self._context_menu.addSeparator()

        for label, state_val in [
            ("空闲", "idle"), ("行走", "walking"), ("睡觉", "sleeping"),
            ("聆听", "listening"), ("思考", "thinking"), ("开心", "happy"),
            ("冥想", "meditating"), ("庆祝", "celebrating"),
        ]:
            act = QAction(label, self)
            act.triggered.connect(lambda checked, s=state_val: self.set_state(s))
            self._context_menu.addAction(act)

        self._context_menu.addSeparator()
        self._context_menu.addAction("快速操作…", self._show_quick_actions)
        self._context_menu.addAction("AI 聊天…", self._show_mini_chat)
        self._context_menu.addAction("快速笔记…", self._show_quick_note)
        self._context_menu.addSeparator()

        conn_label = "✅ Vicoo 已连接" if self._bridge.is_connected else "❌ Vicoo 未连接"
        conn_act = QAction(conn_label, self)
        conn_act.setEnabled(False)
        self._context_menu.addAction(conn_act)

        self._context_menu.addSeparator()
        self._context_menu.addAction("退出", self._on_quit)

    def _on_quit(self):
        self._bridge.stop()
        self.quit_requested.emit()
        self.close()

    # ------------------------------------------------------------------
    # Painting
    # ------------------------------------------------------------------

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        rect = QRectF(0, 0, self.WINDOW_WIDTH, self.WINDOW_HEIGHT)
        self._mascot.render(painter, rect)

    def _on_animation_tick(self):
        current_time = QDateTime.currentMSecsSinceEpoch()
        if self._last_tick == 0:
            self._last_tick = current_time
        self._last_tick = current_time
        self.update()

    # ------------------------------------------------------------------
    # Mouse interaction
    # ------------------------------------------------------------------

    @staticmethod
    def _get_global_pos(event: QMouseEvent):
        if hasattr(event, "globalPosition"):
            return event.globalPosition().toPoint()
        return event.globalPos()

    def _reset_click(self):
        self._click_count = 0

    def mousePressEvent(self, event: QMouseEvent):
        try:
            if event.button() == Qt.MouseButton.LeftButton:
                self._click_count += 1
                if self._click_count == 2:
                    self._click_count = 0
                    self._click_timer.stop()
                    self._show_quick_actions()
                    return
                self._is_dragging = True
                self._drag_offset = self._get_global_pos(event) - self.pos()
                self.setCursor(QCursor(Qt.CursorShape.ClosedHandCursor))
                self.set_state("walking")
                self._click_timer.start(300)
            elif event.button() == Qt.MouseButton.RightButton:
                if self._context_menu is None:
                    self._create_context_menu()
                self._context_menu.exec(self._get_global_pos(event))
        except Exception:
            self._logger.exception("Mouse press error")

    def mouseMoveEvent(self, event: QMouseEvent):
        try:
            if self._is_dragging:
                new_pos = self._get_global_pos(event) - self._drag_offset
                screen = QApplication.primaryScreen().geometry()
                new_pos.setX(max(0, min(new_pos.x(), screen.width() - self.width())))
                new_pos.setY(max(0, min(new_pos.y(), screen.height() - self.height())))
                self.move(new_pos)
                if self._active_dialog and self._active_dialog.isVisible():
                    self._active_dialog.move(
                        new_pos.x() + self.width() // 2 - self._active_dialog.width() // 2,
                        new_pos.y() - self._active_dialog.height() - 4)
        except Exception:
            self._logger.exception("Mouse move error")

    def mouseReleaseEvent(self, event: QMouseEvent):
        try:
            if event.button() == Qt.MouseButton.LeftButton:
                self._is_dragging = False
                self.setCursor(QCursor(Qt.CursorShape.OpenHandCursor))
                self.set_state("idle")
        except Exception:
            self._logger.exception("Mouse release error")

    def enterEvent(self, event):
        self.setCursor(QCursor(Qt.CursorShape.OpenHandCursor))

    def leaveEvent(self, event):
        if not self._is_dragging:
            self.setCursor(QCursor(Qt.CursorShape.ArrowCursor))

    def closeEvent(self, event):
        self._bridge.stop()
        if self._active_dialog:
            self._active_dialog.close()
        if self._tray_icon:
            self._tray_icon.hide()
        super().closeEvent(event)
