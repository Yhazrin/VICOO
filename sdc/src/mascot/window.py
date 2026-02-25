"""
SDC - Sentient Desktop Companion
Desktop Mascot Window

A transparent, always-on-top, draggable desktop mascot window with state machine
and LLM conversation support
"""

import asyncio
import logging
from PyQt6.QtCore import Qt, QTimer, QPoint, QDateTime, pyqtSignal, QRectF
from PyQt6.QtGui import QPainter, QCursor, QAction, QMouseEvent, QIcon, QPixmap
from PyQt6.QtWidgets import QWidget, QMenu, QApplication, QSystemTrayIcon

from .renderer import MascotRenderer
from .state_machine import MascotStateMachine, MascotState, setup_logging
from .llm import get_llm_client
from .conversation import ConversationWidget


class MascotWindow(QWidget):
    """
    Transparent, always-on-top, draggable desktop mascot window
    With integrated state machine and LLM conversation

    Signals:
        quit_requested: Emitted when user requests to quit
    """

    # Window configuration - 缩小三分之一
    WINDOW_WIDTH = 133  # 原200缩小到约1/3
    WINDOW_HEIGHT = 147  # 原220缩小到约1/3

    def __init__(self, parent=None):
        super().__init__(parent)

        # Initialize mascot renderer
        self._mascot = MascotRenderer(self)

        # Initialize state machine
        self._state_machine = MascotStateMachine(self)
        self._state_machine.stateChanged.connect(self._on_state_changed)

        # Initialize LLM client
        self._llm_client = get_llm_client()

        # Chat widget
        self._chat_widget = None

        # Setup window attributes
        self._setup_window()

        # Drag state
        self._is_dragging = False
        self._drag_offset = QPoint()
        self._click_count = 0
        self._click_timer = QTimer(self)
        self._click_timer.timeout.connect(self._reset_click)
        self._click_timer.setSingleShot(True)

        # Animation timer
        self._anim_timer = QTimer(self)
        self._anim_timer.timeout.connect(self._on_animation_tick)
        self._anim_timer.start(16)  # ~60 FPS
        self._last_tick = 0

        # Context menu (lazy create)
        self._context_menu = None

        # System tray icon
        self._tray_icon = None

        # Setup logging & module logger
        setup_logging()
        self._logger = logging.getLogger("sdc.window")
        self._logger.debug("MascotWindow initialized")

        # Setup system tray icon (任务栏右侧图标)
        self._setup_tray_icon()

    def _setup_tray_icon(self):
        """Create a system tray icon with basic menu"""
        if not QSystemTrayIcon.isSystemTrayAvailable():
            self._logger.warning("System tray not available on this system")
            return

        # Render current mascot skin into a small pixmap as tray icon
        pixmap = QPixmap(64, 64)
        pixmap.fill(Qt.GlobalColor.transparent)

        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        # 缩放/居中渲染到 64x64 区域
        base_size = 200.0  # renderer 默认坐标系大小
        scale = min(pixmap.width(), pixmap.height()) / base_size

        painter.translate(pixmap.width() / 2, pixmap.height() / 2)
        painter.scale(scale, scale)
        painter.translate(-base_size / 2, -base_size / 2)

        # 使用同一个渲染器绘制当前皮肤 & 状态
        self._mascot.set_skin("cat")
        self._mascot.set_state("idle")
        self._mascot.render(painter, QRectF(0, 0, base_size, base_size))

        painter.end()

        self._tray_icon = QSystemTrayIcon(QIcon(pixmap), self)

        # Tray menu
        tray_menu = QMenu()
        show_action = QAction("Show Mascot", tray_menu)
        hide_action = QAction("Hide Mascot", tray_menu)
        quit_action = QAction("Exit", tray_menu)

        show_action.triggered.connect(self._show_from_tray)
        hide_action.triggered.connect(self.hide)
        quit_action.triggered.connect(self._on_quit)

        tray_menu.addAction(show_action)
        tray_menu.addAction(hide_action)
        tray_menu.addSeparator()
        tray_menu.addAction(quit_action)

        self._tray_icon.setContextMenu(tray_menu)
        self._tray_icon.activated.connect(self._on_tray_activated)
        self._tray_icon.show()

        self._logger.info("System tray icon created")

    def _show_from_tray(self):
        """Show and focus the mascot window from tray"""
        self.show()
        self.raise_()
        self.activateWindow()

    def _on_tray_activated(self, reason):
        """Handle tray icon clicks (left click toggles show/hide)"""
        if reason == QSystemTrayIcon.ActivationReason.Trigger:
            if self.isVisible():
                self.hide()
            else:
                self._show_from_tray()

    @staticmethod
    def _get_global_pos(event: QMouseEvent):
        """
        兼容不同 PyQt6 版本的全局坐标获取：
        - 新版本使用 globalPosition().toPoint()
        - 旧版本使用 globalPos()
        """
        if hasattr(event, "globalPosition"):
            return event.globalPosition().toPoint()
        return event.globalPos()

    def _setup_window(self):
        """Configure window for transparent, always-on-top, frameless"""
        # Make window transparent
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)

        # Always on top
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint |
            Qt.WindowType.WindowStaysOnTopHint |
            Qt.WindowType.Tool
        )

        # Set window size
        self.resize(self.WINDOW_WIDTH, self.WINDOW_HEIGHT)

        # Move to bottom-right corner of screen
        screen = QApplication.primaryScreen().geometry()
        self.move(
            screen.width() - self.WINDOW_WIDTH - 20,
            screen.height() - self.WINDOW_HEIGHT - 20
        )

    def _create_context_menu(self):
        """Create right-click context menu"""
        self._context_menu = QMenu(self)

        # Status action
        self._status_action = QAction("Status: Idle", self)
        self._status_action.setEnabled(False)
        self._context_menu.addAction(self._status_action)

        self._context_menu.addSeparator()

        # State actions
        states = [
            ("Idle", "idle"),
            ("Walking", "walking"),
            ("Sleeping", "sleeping"),
            ("Listening", "listening"),
            ("Thinking", "thinking"),
        ]

        for label, state in states:
            action = QAction(label, self)
            action.triggered.connect(lambda checked, s=state: self.set_state(s))
            self._context_menu.addAction(action)

        self._context_menu.addSeparator()

        # Chat action
        chat_action = QAction("Open Chat", self)
        chat_action.triggered.connect(self._toggle_chat)
        self._context_menu.addAction(chat_action)

        # Clear conversation action
        clear_action = QAction("Clear Chat History", self)
        clear_action.triggered.connect(self._clear_conversation)
        self._context_menu.addAction(clear_action)

        self._context_menu.addSeparator()

        # Quit action
        self._quit_action = QAction("Exit", self)
        self._quit_action.triggered.connect(self._on_quit)
        self._context_menu.addAction(self._quit_action)

    def _on_quit(self):
        """Handle quit action"""
        self.quit_requested.emit()
        self.close()

    # Signals
    quit_requested = pyqtSignal()

    def set_state(self, state: str):
        """Set mascot state via state machine"""
        try:
            # Convert string to MascotState enum
            state_enum = MascotState(state.lower())
            if self._state_machine.transition(state_enum):
                self._mascot.state = state
                # Update status action if context menu exists
                if hasattr(self, '_context_menu') and self._context_menu is not None:
                    if hasattr(self, '_status_action') and self._status_action is not None:
                        self._status_action.setText(f"Status: {state.capitalize()}")
        except Exception as e:
            print(f"Set state error: {e}")

    def get_state(self) -> str:
        """Get current state"""
        return self._state_machine.current_state.value

    def _on_state_changed(self, state: str):
        """Handle state machine state change"""
        self._mascot.state = state
        # 当右键菜单尚未创建时，_status_action 可能不存在或为 None
        if hasattr(self, "_status_action") and self._status_action is not None:
            self._status_action.setText(f"Status: {state.capitalize()}")

    @property
    def state_machine(self) -> MascotStateMachine:
        """Get the state machine instance"""
        return self._state_machine

    def _toggle_chat(self):
        """Toggle chat widget visibility"""
        if self._chat_widget is None:
            # Top-level chat window so positioning uses global coordinates
            self._chat_widget = ConversationWidget(None)
            self._chat_widget.message_sent.connect(self._on_chat_message)
            self._chat_widget.close_requested.connect(self._close_chat)

            # Position chat widget near the mascot
            mascot_pos = self.pos()
            self._chat_widget.move(mascot_pos.x() - 280, mascot_pos.y())

        if self._chat_widget.isVisible():
            self._chat_widget.hide()
        else:
            self._chat_widget.show()
            self._chat_widget.raise_()
            self._chat_widget.activateWindow()

    def _close_chat(self):
        """Close chat widget"""
        if self._chat_widget:
            self._chat_widget.hide()

    def _on_chat_message(self, message: str):
        """Handle incoming chat message"""
        if not self._chat_widget:
            return

        # Add user message to chat
        self._chat_widget.add_user_message(message)

        # Set state to thinking (processing)
        previous_state = self.get_state()
        self.set_state("thinking")

        # Process message asynchronously
        asyncio.create_task(self._process_message(message))

    async def _process_message(self, message: str):
        """Process message with LLM"""
        try:
            # Get response from LLM
            response = await self._llm_client.chat(message)

            # Add response to chat
            if self._chat_widget:
                self._chat_widget.add_assistant_message(response)

            # Set state back to listening
            self.set_state("listening")

            # Auto-revert to idle after 3 seconds
            QTimer.singleShot(3000, lambda: self.set_state("idle"))

        except Exception as e:
            # Handle error
            if self._chat_widget:
                self._chat_widget.add_assistant_message(f"Oops! Something went wrong: {str(e)}")
            self.set_state("idle")

    def _clear_conversation(self):
        """Clear conversation history"""
        self._llm_client.clear_conversation()
        if self._chat_widget:
            self._chat_widget.clear()

    def paintEvent(self, event):
        """Paint the mascot"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        # Don't erase - let transparency show through
        # Just render the mascot

        # Render mascot centered in window
        from PyQt6.QtCore import QRectF
        rect = QRectF(0, 0, self.WINDOW_WIDTH, self.WINDOW_HEIGHT)
        self._mascot.render(painter, rect)

    def _on_animation_tick(self):
        """Animation timer tick"""
        # Calculate delta time
        current_time = QDateTime.currentMSecsSinceEpoch()

        if self._last_tick == 0:
            self._last_tick = current_time

        delta_time = (current_time - self._last_tick) / 1000.0  # Convert to seconds
        self._last_tick = current_time

        # Update mascot animation
        self._mascot.update_animation(delta_time)

        # Trigger repaint
        self.update()

    def _reset_click(self):
        """Reset click count"""
        self._click_count = 0

    def mousePressEvent(self, event: QMouseEvent):
        """Handle mouse press for dragging"""
        try:
            if event.button() == Qt.MouseButton.LeftButton:
                self._logger.debug("mousePressEvent: LeftButton")
                # Check for double-click (two clicks within 300ms)
                self._click_count += 1

                if self._click_count == 2:
                    # Double click detected
                    self._logger.info("Double click detected, toggling chat")
                    self._toggle_chat()
                    self._click_count = 0
                    self._click_timer.stop()
                    return
                else:
                    # Start drag
                    self._is_dragging = True
                    global_pos = self._get_global_pos(event)
                    self._drag_offset = global_pos - self.pos()
                    self._logger.info(
                        "Start dragging mascot at global=(%d,%d) offset=(%d,%d)",
                        global_pos.x(),
                        global_pos.y(),
                        self._drag_offset.x(),
                        self._drag_offset.y(),
                    )
                    self.setCursor(QCursor(Qt.CursorShape.ClosedHandCursor))
                    # Transition to walking (dragging) state
                    self.set_state("walking")
                    # Start timer for double-click detection
                    self._click_timer.start(300)

            elif event.button() == Qt.MouseButton.RightButton:
                self._logger.debug("mousePressEvent: RightButton (context menu)")
                # Create and show context menu
                if self._context_menu is None:
                    self._create_context_menu()
                global_pos = self._get_global_pos(event)
                self._context_menu.exec(global_pos)
        except Exception:
            if hasattr(self, "_logger"):
                self._logger.exception("Mouse press error")
            else:
                print("Mouse press error", flush=True)

    def mouseMoveEvent(self, event: QMouseEvent):
        """Handle mouse move for dragging"""
        try:
            if self._is_dragging:
                new_pos = self._get_global_pos(event) - self._drag_offset
                # Keep within screen bounds
                screen = QApplication.primaryScreen().geometry()
                new_pos.setX(max(0, min(new_pos.x(), screen.width() - self.width())))
                new_pos.setY(max(0, min(new_pos.y(), screen.height() - self.height())))
                self._logger.debug("Dragging move to (%d,%d)", new_pos.x(), new_pos.y())
                self.move(new_pos)

                # Move chat widget with mascot
                if self._chat_widget and self._chat_widget.isVisible():
                    self._chat_widget.move(new_pos.x() - 280, new_pos.y())
        except Exception:
            if hasattr(self, "_logger"):
                self._logger.exception("Mouse move error")
            else:
                print("Mouse move error", flush=True)

    def mouseReleaseEvent(self, event: QMouseEvent):
        """Handle mouse release"""
        try:
            if event.button() == Qt.MouseButton.LeftButton:
                self._is_dragging = False
                self.setCursor(QCursor(Qt.CursorShape.OpenHandCursor))
                # Revert to idle
                self.set_state("idle")
                self._logger.info(
                    "Stop dragging mascot at (%d,%d)", self.pos().x(), self.pos().y()
                )
        except Exception:
            if hasattr(self, "_logger"):
                self._logger.exception("Mouse release error")
            else:
                print("Mouse release error", flush=True)

    def enterEvent(self, event):
        """Handle mouse enter"""
        self.setCursor(QCursor(Qt.CursorShape.OpenHandCursor))

    def leaveEvent(self, event):
        """Handle mouse leave"""
        if not self._is_dragging:
            self.setCursor(QCursor(Qt.CursorShape.ArrowCursor))

    def closeEvent(self, event):
        """Handle window close"""
        # Close chat widget if open
        if self._chat_widget:
            self._chat_widget.close()
        # Hide tray icon on close
        if self._tray_icon:
            self._tray_icon.hide()
        super().closeEvent(event)
