"""
SDC - Sentient Desktop Companion
Conversation Widget

A floating chat widget for interacting with the LLM
"""

from PyQt6.QtCore import Qt, QSize, pyqtSignal
from PyQt6.QtGui import QPainter, QColor, QBrush, QPen, QFont, QFontMetrics
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTextEdit,
    QLineEdit, QPushButton, QLabel, QScrollArea
)
import asyncio


class ConversationWidget(QWidget):
    """
    A floating chat widget for conversation with the mascot
    """

    message_sent = pyqtSignal(str)
    close_requested = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)

        self.setFixedSize(300, 400)
        self._setup_ui()

    def _setup_ui(self):
        """Setup the user interface"""
        # Main layout
        layout = QVBoxLayout(self)
        layout.setContentsMargins(10, 10, 10, 10)
        layout.setSpacing(8)

        # Title bar
        title_layout = QHBoxLayout()
        title_label = QLabel("Chat with Kitty")
        title_label.setFont(QFont("Arial", 12, QFont.Weight.Bold))

        close_btn = QPushButton("×")
        close_btn.setFixedSize(24, 24)
        close_btn.clicked.connect(self.close_requested.emit)

        title_layout.addWidget(title_label)
        title_layout.addStretch()
        title_layout.addWidget(close_btn)

        layout.addLayout(title_layout)

        # Chat display area
        self.chat_display = QTextEdit()
        self.chat_display.setReadOnly(True)
        self.chat_display.setFont(QFont("Arial", 10))
        layout.addWidget(self.chat_display)

        # Input area
        input_layout = QHBoxLayout()

        self.input_field = QLineEdit()
        self.input_field.setPlaceholderText("Type a message...")
        self.input_field.returnPressed.connect(self._on_send)

        send_btn = QPushButton("Send")
        send_btn.clicked.connect(self._on_send)

        input_layout.addWidget(self.input_field)
        input_layout.addWidget(send_btn)

        layout.addLayout(input_layout)

    def _on_send(self):
        """Handle send button click"""
        message = self.input_field.text().strip()
        if message:
            self.input_field.clear()
            self.message_sent.emit(message)

    def add_user_message(self, message: str):
        """Add a user message to the chat"""
        self._add_message("You", message, QColor("#118AB2"))

    def add_assistant_message(self, message: str):
        """Add an assistant message to the chat"""
        self._add_message("Kitty", message, QColor("#EF476F"))

    def _add_message(self, sender: str, message: str, color: QColor):
        """Add a message to the display"""
        self.chat_display.append(f"<b><span style='color:{color.name()}'>{sender}:</span></b> {message}")

    def clear(self):
        """Clear chat display"""
        self.chat_display.clear()

    def paintEvent(self, event):
        """Custom paint for rounded corners"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        # Draw background with rounded corners
        painter.setBrush(QBrush(QColor("#ffffff")))
        painter.setPen(QPen(QColor("#1a1a1a"), 2))
        painter.drawRoundedRect(self.rect(), 10, 10)


class ChatBubble(QWidget):
    """Chat bubble widget for displaying messages"""

    def __init__(self, text: str, is_user: bool = True, parent=None):
        super().__init__(parent)
        self.text = text
        self.is_user = is_user
        self.setMinimumWidth(200)

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        if self.is_user:
            bg_color = QColor("#118AB2")
            text_color = QColor("#ffffff")
        else:
            bg_color = QColor("#EF476F")
            text_color = QColor("#ffffff")

        painter.setBrush(QBrush(bg_color))
        painter.setPen(Qt.PenStyle.NoPen)

        # Draw bubble
        painter.drawRoundedRect(self.rect(), 10, 10)

        # Draw text
        painter.setPen(QPen(text_color))
        painter.setFont(QFont("Arial", 10))
        painter.drawText(self.rect().adjusted(10, 10, -10, -10), Qt.TextFlag.TextWordWrap, self.text)
