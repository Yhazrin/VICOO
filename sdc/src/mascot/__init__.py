"""
SDC Mascot Module — with Vicoo deep binding
"""

from .renderer import MascotRenderer
from .window import MascotWindow
from .state_machine import MascotStateMachine, MascotState, setup_logging
from .llm import LLMClient, ConversationHistory, ConversationContext, get_llm_client
from .vicoo_bridge import VicooBridge, VicooEvent
from .bubble_dialog import (
    BubbleNotification,
    QuickActionMenu,
    MiniChatBubble,
    QuickNoteDialog,
)

__all__ = [
    'MascotRenderer',
    'MascotWindow',
    'MascotStateMachine',
    'MascotState',
    'setup_logging',
    'LLMClient',
    'ConversationHistory',
    'ConversationContext',
    'get_llm_client',
    'VicooBridge',
    'VicooEvent',
    'BubbleNotification',
    'QuickActionMenu',
    'MiniChatBubble',
    'QuickNoteDialog',
]
