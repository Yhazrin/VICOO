"""
SDC - Sentient Desktop Companion
LLM Integration Module

Provides multi-turn conversation with local history and context compression
"""

from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
import json
import os
import time
import logging
from pathlib import Path


@dataclass
class Message:
    """Chat message"""
    role: str  # "user" or "assistant"
    content: str
    timestamp: float = field(default_factory=time.time)


@dataclass
class ConversationContext:
    """Conversation context with compression support"""
    messages: List[Message] = field(default_factory=list)
    max_tokens: int = 4000
    compression_threshold: float = 0.8

    def add_message(self, role: str, content: str):
        """Add a message to the conversation"""
        self.messages.append(Message(role=role, content=content))

    def get_messages(self) -> List[Dict[str, str]]:
        """Get messages as dict list for API"""
        return [{"role": m.role, "content": m.content} for m in self.messages]

    def estimate_tokens(self, text: str) -> int:
        """Rough token estimation (~4 chars per token)"""
        return len(text) // 4

    def get_total_tokens(self) -> int:
        """Get total tokens in conversation"""
        return sum(self.estimate_tokens(m.content) for m in self.messages)

    def compress_if_needed(self, keep_recent: int = 6):
        """Compress conversation if exceeding token limit"""
        total = self.get_total_tokens()
        max_allowed = self.max_tokens * self.compression_threshold

        if total > max_allowed and len(self.messages) > keep_recent:
            self._compress(keep_recent)

    def _compress(self, keep_recent: int):
        """Compress by keeping recent messages and summarizing older ones"""
        if len(self.messages) <= keep_recent:
            return

        # Keep system prompt if exists, and recent messages
        recent = self.messages[-keep_recent:]

        # Create summary of older messages
        older = self.messages[:-keep_recent]
        summary_text = self._create_summary(older)

        # Replace older messages with summary
        self.messages = [Message(
            role="system",
            content=f"[Previous conversation summary: {summary_text}]"
        )] + recent

    def _create_summary(self, messages: List[Message]) -> str:
        """Create a brief summary of older messages"""
        if not messages:
            return "No previous messages"

        user_msgs = [m.content for m in messages if m.role == "user"]
        assistant_msgs = [m.content for m in messages if m.role == "assistant"]

        summary_parts = []
        if user_msgs:
            summary_parts.append(f"{len(user_msgs)} user messages")
        if assistant_msgs:
            summary_parts.append(f"{len(assistant_msgs)} assistant responses")

        return "; ".join(summary_parts)

    def clear(self):
        """Clear conversation history"""
        self.messages.clear()


class ConversationHistory:
    """Persistent conversation history storage"""

    def __init__(self, storage_path: Optional[str] = None):
        if storage_path is None:
            # Default to user's home directory
            home = Path.home()
            self.storage_dir = home / ".sdc" / "conversations"
        else:
            self.storage_dir = Path(storage_path)

        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self._logger = logging.getLogger("sdc.llm.history")

    def save_conversation(self, conversation_id: str, messages: List[Message]):
        """Save conversation to file"""
        file_path = self.storage_dir / f"{conversation_id}.json"

        data = {
            "id": conversation_id,
            "timestamp": time.time(),
            "messages": [
                {
                    "role": m.role,
                    "content": m.content,
                    "timestamp": m.timestamp
                }
                for m in messages
            ]
        }

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        self._logger.info(f"Saved conversation {conversation_id} with {len(messages)} messages")

    def load_conversation(self, conversation_id: str) -> List[Message]:
        """Load conversation from file"""
        file_path = self.storage_dir / f"{conversation_id}.json"

        if not file_path.exists():
            self._logger.warning(f"Conversation {conversation_id} not found")
            return []

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        messages = [
            Message(
                role=m["role"],
                content=m["content"],
                timestamp=m.get("timestamp", 0)
            )
            for m in data.get("messages", [])
        ]

        self._logger.info(f"Loaded conversation {conversation_id} with {len(messages)} messages")
        return messages

    def list_conversations(self) -> List[Dict[str, Any]]:
        """List all saved conversations"""
        conversations = []

        for file_path in self.storage_dir.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    conversations.append({
                        "id": data.get("id", file_path.stem),
                        "timestamp": data.get("timestamp", 0),
                        "message_count": len(data.get("messages", []))
                    })
            except Exception as e:
                self._logger.error(f"Error loading {file_path}: {e}")

        # Sort by timestamp descending
        conversations.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        return conversations

    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation"""
        file_path = self.storage_dir / f"{conversation_id}.json"

        if file_path.exists():
            file_path.unlink()
            self._logger.info(f"Deleted conversation {conversation_id}")
            return True

        return False


class LLMClient:
    """
    LLM Client with multi-turn conversation support

    Note: This is a placeholder that simulates LLM responses.
    Replace with actual LiteLLM integration for production.
    """

    def __init__(
        self,
        model: str = "gpt-3.5-turbo",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        conversation_history: Optional[ConversationHistory] = None
    ):
        self.model = model
        self.api_key = api_key
        self.base_url = base_url
        self.conversation_history = conversation_history or ConversationHistory()

        # Current conversation
        self.current_conversation_id: Optional[str] = None
        self.context = ConversationContext()

        self._logger = logging.getLogger("sdc.llm")

    def start_conversation(self, conversation_id: Optional[str] = None) -> str:
        """Start a new conversation or resume existing one"""
        if conversation_id is None:
            conversation_id = f"conv_{int(time.time())}"

        self.current_conversation_id = conversation_id
        self.context = ConversationContext()

        # Try to load existing conversation
        existing = self.conversation_history.load_conversation(conversation_id)
        if existing:
            self.context.messages = existing

        self._logger.info(f"Started conversation {conversation_id}")
        return conversation_id

    async def chat(self, message: str) -> str:
        """
        Send a message and get response

        This is a placeholder - replace with actual LLM API call
        """
        # Add user message
        self.context.add_message("user", message)

        # Compress if needed
        self.context.compress_if_needed()

        # TODO: Replace with actual LLM API call
        # For now, return a placeholder response
        response = await self._simulate_response(message)

        # Add assistant message
        self.context.add_message("assistant", response)

        # Save conversation
        if self.current_conversation_id:
            self.conversation_history.save_conversation(
                self.current_conversation_id,
                self.context.messages
            )

        return response

    async def _simulate_response(self, message: str) -> str:
        """Try Vicoo API first, fall back to local responses."""
        try:
            from .vicoo_bridge import VicooBridge
            bridge = VicooBridge()
            response = bridge.ai_chat(message)
            if response:
                return response
        except Exception as exc:
            self._logger.debug("Vicoo AI chat failed: %s", exc)

        message_lower = message.lower()
        if any(w in message_lower for w in ["你好", "hello", "hi", "hey"]):
            return "喵～ 你好呀！我是你的桌面小伙伴 Vicoo 🐱 有什么我可以帮你的吗？"
        elif any(w in message_lower for w in ["笔记", "note"]):
            return "想创建笔记吗？双击我然后选择 📝 快速笔记就行啦～"
        elif any(w in message_lower for w in ["搜索", "search", "找"]):
            return "我可以帮你搜索知识库！告诉我你想找什么？"
        elif "?" in message or "？" in message:
            return "好问题！让我想想… 🤔 你可以通过 AI 助手获得更详细的回答哦！"
        else:
            return "喵～ 我听到了！还想聊些什么呢？ 😸"

    def get_conversation_history(self) -> List[Dict[str, str]]:
        """Get current conversation history"""
        return self.context.get_messages()

    def clear_conversation(self):
        """Clear current conversation"""
        if self.current_conversation_id:
            self.conversation_history.delete_conversation(self.current_conversation_id)

        self.context.clear()
        self._logger.info("Cleared conversation")

    def list_past_conversations(self) -> List[Dict[str, Any]]:
        """List all past conversations"""
        return self.conversation_history.list_conversations()


# Default client instance
_default_client: Optional[LLMClient] = None


def get_llm_client(
    model: str = "gpt-3.5-turbo",
    api_key: Optional[str] = None,
    base_url: Optional[str] = None
) -> LLMClient:
    """Get or create default LLM client"""
    global _default_client

    if _default_client is None:
        _default_client = LLMClient(
            model=model,
            api_key=api_key,
            base_url=base_url
        )
        _default_client.start_conversation()

    return _default_client
