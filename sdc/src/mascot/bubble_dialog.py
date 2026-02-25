"""
SDC - Cute Floating Bubble Dialog
Kawaii speech bubbles that pop from the mascot with quick actions,
notifications, and mini-chat.
"""

import math
import time
from typing import Optional, List, Callable

from PyQt6.QtCore import Qt, QTimer, QPoint, QRectF, QPropertyAnimation, QEasingCurve, pyqtSignal, QSize, pyqtProperty
from PyQt6.QtGui import QPainter, QPainterPath, QColor, QPen, QBrush, QFont, QFontMetrics, QLinearGradient
from PyQt6.QtWidgets import QWidget, QApplication, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit, QGraphicsOpacityEffect


class BubbleNotification(QWidget):
    """
    Kawaii notification toast that pops above the mascot.
    Auto-dismisses after a few seconds with fade-out.
    """

    dismissed = pyqtSignal()

    def __init__(self, text: str, icon: str = "💬", duration_ms: int = 4000, parent=None):
        super().__init__(parent)
        self._text = text
        self._icon = icon
        self._opacity = 1.0
        self._show_progress = 0.0
        self._birth = time.time()

        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.WindowStaysOnTopHint
            | Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)

        fm = QFontMetrics(QFont("Segoe UI", 11))
        text_w = fm.horizontalAdvance(text) + 60
        w = max(160, min(text_w, 320))
        self.setFixedSize(w, 56)

        # Animate in
        self._anim_timer = QTimer(self)
        self._anim_timer.timeout.connect(self._tick)
        self._anim_timer.start(16)

        # Auto dismiss
        QTimer.singleShot(duration_ms, self._fade_out)

    def _tick(self):
        if self._show_progress < 1.0:
            self._show_progress = min(1.0, self._show_progress + 0.08)
        self.update()

    def _fade_out(self):
        self._fade_timer = QTimer(self)
        self._fade_step = 1.0
        def step():
            self._fade_step -= 0.05
            self._opacity = max(0, self._fade_step)
            self.update()
            if self._fade_step <= 0:
                self._fade_timer.stop()
                self.dismissed.emit()
                self.close()
        self._fade_timer.timeout.connect(step)
        self._fade_timer.start(16)

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        p.setOpacity(self._opacity)

        # Elastic pop-in scale
        scale = _elastic_out(self._show_progress)
        p.translate(self.width() / 2, self.height())
        p.scale(scale, scale)
        p.translate(-self.width() / 2, -self.height())

        # Bubble shape
        path = QPainterPath()
        bw, bh = self.width() - 4, self.height() - 14
        path.addRoundedRect(QRectF(2, 2, bw, bh), 14, 14)

        # Tail (little triangle pointing down)
        tail_x = self.width() / 2
        path.moveTo(tail_x - 8, bh + 2)
        path.lineTo(tail_x, bh + 12)
        path.lineTo(tail_x + 8, bh + 2)

        # Fill
        grad = QLinearGradient(0, 0, 0, bh)
        grad.setColorAt(0, QColor("#FFF8E7"))
        grad.setColorAt(1, QColor("#FFF3D0"))
        p.setBrush(QBrush(grad))
        p.setPen(QPen(QColor("#1a1a1a"), 2.5))
        p.drawPath(path)

        # Icon
        p.setFont(QFont("Segoe UI Emoji", 16))
        p.drawText(QRectF(10, 6, 30, bh - 4), Qt.AlignmentFlag.AlignVCenter, self._icon)

        # Text
        p.setPen(QPen(QColor("#1a1a1a")))
        p.setFont(QFont("Segoe UI", 11, QFont.Weight.Medium))
        p.drawText(QRectF(42, 6, bw - 50, bh - 4), Qt.AlignmentFlag.AlignVCenter, self._text)

        p.end()

    def mousePressEvent(self, event):
        self._fade_out()


class QuickActionMenu(QWidget):
    """
    Cute floating menu with quick action buttons.
    Appears when clicking on the mascot.
    """

    action_triggered = pyqtSignal(str)  # action name
    close_requested = pyqtSignal()

    ACTIONS = [
        ("📝", "new_note", "快速笔记"),
        ("🔍", "search", "搜索知识"),
        ("🧠", "ai_chat", "问问 AI"),
        ("🌌", "gen_graph", "生成图谱"),
        ("🍅", "focus", "专注模式"),
        ("😴", "sleep", "休息一下"),
    ]

    def __init__(self, parent=None):
        super().__init__(parent)
        self._opacity = 0.0
        self._show_progress = 0.0

        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.WindowStaysOnTopHint
            | Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)

        cols = 3
        rows = (len(self.ACTIONS) + cols - 1) // cols
        btn_size = 68
        pad = 12
        self.setFixedSize(cols * btn_size + pad * 2, rows * btn_size + pad * 2 + 16)

        self._anim_timer = QTimer(self)
        self._anim_timer.timeout.connect(self._tick)
        self._anim_timer.start(16)

    def _tick(self):
        if self._show_progress < 1.0:
            self._show_progress = min(1.0, self._show_progress + 0.06)
            self._opacity = min(1.0, self._show_progress * 1.5)
        self.update()

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        p.setOpacity(self._opacity)

        scale = _elastic_out(self._show_progress)
        cx, cy = self.width() / 2, self.height()
        p.translate(cx, cy)
        p.scale(scale, scale)
        p.translate(-cx, -cy)

        # Background bubble
        bw, bh = self.width() - 4, self.height() - 16
        bg_path = QPainterPath()
        bg_path.addRoundedRect(QRectF(2, 2, bw, bh), 16, 16)
        tail_x = self.width() / 2
        bg_path.moveTo(tail_x - 10, bh + 2)
        bg_path.lineTo(tail_x, bh + 14)
        bg_path.lineTo(tail_x + 10, bh + 2)

        p.setBrush(QBrush(QColor("#FFFFFF")))
        p.setPen(QPen(QColor("#1a1a1a"), 2.5))
        p.drawPath(bg_path)

        # Action buttons
        cols = 3
        btn_size = 68
        pad = 12
        for i, (icon, action_id, label) in enumerate(self.ACTIONS):
            row, col = divmod(i, cols)
            x = pad + col * btn_size
            y = pad + row * btn_size

            # Button circle
            cx_b = x + btn_size / 2
            cy_b = y + 22
            p.setBrush(QBrush(QColor("#FFF8E7")))
            p.setPen(QPen(QColor("#E0D5C0"), 2))
            p.drawEllipse(QRectF(cx_b - 20, cy_b - 20, 40, 40))

            # Icon
            p.setFont(QFont("Segoe UI Emoji", 18))
            p.setPen(QColor("#1a1a1a"))
            p.drawText(QRectF(cx_b - 15, cy_b - 15, 30, 30), Qt.AlignmentFlag.AlignCenter, icon)

            # Label
            p.setFont(QFont("Segoe UI", 8))
            p.setPen(QColor("#666666"))
            p.drawText(QRectF(x, y + 44, btn_size, 16), Qt.AlignmentFlag.AlignHCenter, label)

        p.end()

    def mousePressEvent(self, event):
        cols = 3
        btn_size = 68
        pad = 12
        mx, my = event.position().x(), event.position().y()
        for i, (icon, action_id, label) in enumerate(self.ACTIONS):
            row, col = divmod(i, cols)
            cx = pad + col * btn_size + btn_size / 2
            cy = pad + row * btn_size + 22
            if (mx - cx) ** 2 + (my - cy) ** 2 < 20 ** 2:
                self.action_triggered.emit(action_id)
                QTimer.singleShot(200, self.close)
                return
        self.close_requested.emit()
        self.close()


class MiniChatBubble(QWidget):
    """
    Compact chat bubble with input field for quick AI questions.
    """

    message_sent = pyqtSignal(str)
    close_requested = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.WindowStaysOnTopHint
            | Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setFixedSize(300, 200)

        self._messages: List[tuple] = []  # (role, text)
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 20)
        layout.setSpacing(6)

        # Title
        title_row = QHBoxLayout()
        title = QLabel("🐱 问问 Vicoo")
        title.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        title.setStyleSheet("color: #1a1a1a; background: transparent;")
        close_btn = QPushButton("×")
        close_btn.setFixedSize(22, 22)
        close_btn.setStyleSheet("""
            QPushButton { background: #EF476F; color: white; border-radius: 11px;
                          font-size: 14px; font-weight: bold; border: none; }
            QPushButton:hover { background: #d63d5e; }
        """)
        close_btn.clicked.connect(lambda: (self.close_requested.emit(), self.close()))
        title_row.addWidget(title)
        title_row.addStretch()
        title_row.addWidget(close_btn)
        layout.addLayout(title_row)

        # Chat area
        self._chat_label = QLabel("")
        self._chat_label.setWordWrap(True)
        self._chat_label.setFont(QFont("Segoe UI", 10))
        self._chat_label.setStyleSheet("color: #333; background: transparent; padding: 4px;")
        self._chat_label.setMinimumHeight(80)
        self._chat_label.setAlignment(Qt.AlignmentFlag.AlignTop)
        layout.addWidget(self._chat_label)
        layout.addStretch()

        # Input row
        input_row = QHBoxLayout()
        self._input = QLineEdit()
        self._input.setPlaceholderText("问点什么...")
        self._input.setFont(QFont("Segoe UI", 10))
        self._input.setStyleSheet("""
            QLineEdit { border: 2px solid #1a1a1a; border-radius: 12px;
                        padding: 6px 12px; background: #FFF8E7; }
        """)
        self._input.returnPressed.connect(self._on_send)
        send_btn = QPushButton("→")
        send_btn.setFixedSize(32, 32)
        send_btn.setStyleSheet("""
            QPushButton { background: #0df259; color: #1a1a1a; border-radius: 16px;
                          font-size: 16px; font-weight: bold; border: 2px solid #1a1a1a; }
            QPushButton:hover { background: #06D6A0; }
        """)
        send_btn.clicked.connect(self._on_send)
        input_row.addWidget(self._input)
        input_row.addWidget(send_btn)
        layout.addLayout(input_row)

    def _on_send(self):
        text = self._input.text().strip()
        if text:
            self._input.clear()
            self.add_message("you", text)
            self.message_sent.emit(text)

    def add_message(self, role: str, text: str):
        self._messages.append((role, text))
        if len(self._messages) > 4:
            self._messages = self._messages[-4:]
        html = ""
        for r, t in self._messages:
            if r == "you":
                html += f'<p style="color:#118AB2"><b>你:</b> {t}</p>'
            else:
                html += f'<p style="color:#EF476F"><b>🐱:</b> {t}</p>'
        self._chat_label.setText(html)

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)

        bw, bh = self.width() - 4, self.height() - 16
        path = QPainterPath()
        path.addRoundedRect(QRectF(2, 2, bw, bh), 16, 16)
        tail_x = self.width() / 2
        path.moveTo(tail_x - 10, bh + 2)
        path.lineTo(tail_x, bh + 14)
        path.lineTo(tail_x + 10, bh + 2)

        p.setBrush(QBrush(QColor("#FFFFFF")))
        p.setPen(QPen(QColor("#1a1a1a"), 2.5))
        p.drawPath(path)
        p.end()


class QuickNoteDialog(QWidget):
    """Quick note creation dialog."""

    note_created = pyqtSignal(str, str)  # title, body
    close_requested = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.WindowStaysOnTopHint
            | Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setFixedSize(280, 160)
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 20)
        layout.setSpacing(8)

        title = QLabel("📝 快速笔记")
        title.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        title.setStyleSheet("color: #1a1a1a; background: transparent;")
        layout.addWidget(title)

        self._title_input = QLineEdit()
        self._title_input.setPlaceholderText("标题...")
        self._title_input.setFont(QFont("Segoe UI", 10))
        self._title_input.setStyleSheet(
            "QLineEdit { border: 2px solid #1a1a1a; border-radius: 10px; padding: 5px 10px; background: #FFF8E7; }"
        )
        layout.addWidget(self._title_input)

        self._body_input = QLineEdit()
        self._body_input.setPlaceholderText("内容...")
        self._body_input.setFont(QFont("Segoe UI", 10))
        self._body_input.setStyleSheet(
            "QLineEdit { border: 2px solid #1a1a1a; border-radius: 10px; padding: 5px 10px; background: #FFF8E7; }"
        )
        self._body_input.returnPressed.connect(self._on_create)
        layout.addWidget(self._body_input)

        btn_row = QHBoxLayout()
        cancel_btn = QPushButton("取消")
        cancel_btn.setStyleSheet(
            "QPushButton { background: #f0f0f0; border: 2px solid #1a1a1a; border-radius: 10px; padding: 5px 14px; font-weight: bold; }"
        )
        cancel_btn.clicked.connect(lambda: (self.close_requested.emit(), self.close()))
        save_btn = QPushButton("保存 ✓")
        save_btn.setStyleSheet(
            "QPushButton { background: #0df259; border: 2px solid #1a1a1a; border-radius: 10px; padding: 5px 14px; font-weight: bold; }"
        )
        save_btn.clicked.connect(self._on_create)
        btn_row.addWidget(cancel_btn)
        btn_row.addWidget(save_btn)
        layout.addLayout(btn_row)

    def _on_create(self):
        t = self._title_input.text().strip()
        b = self._body_input.text().strip()
        if t:
            self.note_created.emit(t, b)
            self.close()

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        bw, bh = self.width() - 4, self.height() - 16
        path = QPainterPath()
        path.addRoundedRect(QRectF(2, 2, bw, bh), 16, 16)
        tail_x = self.width() / 2
        path.moveTo(tail_x - 10, bh + 2)
        path.lineTo(tail_x, bh + 14)
        path.lineTo(tail_x + 10, bh + 2)
        p.setBrush(QBrush(QColor("#FFFFFF")))
        p.setPen(QPen(QColor("#1a1a1a"), 2.5))
        p.drawPath(path)
        p.end()


# Shared easing helper
def _elastic_out(t: float) -> float:
    if t <= 0:
        return 0.0
    if t >= 1:
        return 1.0
    return pow(2, -10 * t) * math.sin((t - 0.075) * (2 * math.pi) / 0.3) + 1
