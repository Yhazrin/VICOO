"""
Tests for SDC LLM Module
"""

import pytest
import sys
import os
import asyncio
import tempfile

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from mascot import ConversationContext, ConversationHistory, LLMClient, get_llm_client
from mascot.llm import Message


def test_message_creation():
    """Test message creation"""
    msg = Message(role="user", content="Hello")
    assert msg.role == "user"
    assert msg.content == "Hello"


def test_conversation_context():
    """Test conversation context"""
    ctx = ConversationContext()

    ctx.add_message("user", "Hello")
    ctx.add_message("assistant", "Hi there!")

    assert len(ctx.messages) == 2
    assert ctx.messages[0].role == "user"
    assert ctx.messages[1].role == "assistant"


def test_conversation_context_token_estimation():
    """Test token estimation"""
    ctx = ConversationContext()

    # ~25 tokens (100 chars / 4)
    ctx.add_message("user", "a" * 100)

    assert ctx.get_total_tokens() == 25


def test_conversation_context_compression():
    """Test conversation compression"""
    ctx = ConversationContext(max_tokens=100)

    # Add many messages
    for i in range(10):
        ctx.add_message("user", f"Message {i} " * 50)

    # Should compress
    ctx.compress_if_needed(keep_recent=4)

    # Should have fewer messages but keep recent ones
    assert len(ctx.messages) <= 5


def test_conversation_history():
    """Test conversation history"""
    with tempfile.TemporaryDirectory() as tmpdir:
        history = ConversationHistory(tmpdir)

        # Create messages
        messages = [
            Message(role="user", content="Hello"),
            Message(role="assistant", content="Hi there!"),
        ]

        # Save
        history.save_conversation("test_conv", messages)

        # Load
        loaded = history.load_conversation("test_conv")

        assert len(loaded) == 2
        assert loaded[0].content == "Hello"
        assert loaded[1].content == "Hi there!"


def test_conversation_history_list():
    """Test listing conversations"""
    with tempfile.TemporaryDirectory() as tmpdir:
        history = ConversationHistory(tmpdir)

        # Save multiple conversations
        history.save_conversation("conv1", [Message(role="user", content="Hi")])
        history.save_conversation("conv2", [Message(role="user", content="Hello")])

        # List
        conversations = history.list_conversations()

        assert len(conversations) == 2
        ids = [c["id"] for c in conversations]
        assert "conv1" in ids
        assert "conv2" in ids


def test_conversation_history_delete():
    """Test deleting conversations"""
    with tempfile.TemporaryDirectory() as tmpdir:
        history = ConversationHistory(tmpdir)

        # Save and delete
        history.save_conversation("test_conv", [Message(role="user", content="Hi")])
        assert history.delete_conversation("test_conv") is True

        # Should not exist anymore
        loaded = history.load_conversation("test_conv")
        assert len(loaded) == 0


@pytest.mark.asyncio
async def test_llm_client_chat():
    """Test LLM client chat"""
    with tempfile.TemporaryDirectory() as tmpdir:
        client = LLMClient(conversation_history=ConversationHistory(tmpdir))
        client.start_conversation("test")

        # Send a message
        response = await client.chat("Hello")

        assert isinstance(response, str)
        assert len(response) > 0


@pytest.mark.asyncio
async def test_llm_client_conversation_history():
    """Test LLM client saves conversation"""
    with tempfile.TemporaryDirectory() as tmpdir:
        client = LLMClient(conversation_history=ConversationHistory(tmpdir))
        client.start_conversation("test")

        # Send messages
        await client.chat("Hello")
        await client.chat("How are you?")

        # Check history
        history = client.get_conversation_history()

        assert len(history) == 4  # 2 user + 2 assistant


@pytest.mark.asyncio
async def test_llm_client_clear():
    """Test clearing conversation"""
    with tempfile.TemporaryDirectory() as tmpdir:
        client = LLMClient(conversation_history=ConversationHistory(tmpdir))
        client.start_conversation("test")

        # Add messages
        await client.chat("Hello")

        # Clear
        client.clear_conversation()

        # Should be empty
        history = client.get_conversation_history()
        assert len(history) == 0


def test_get_llm_client_singleton():
    """Test get_llm_client returns singleton"""
    client1 = get_llm_client()
    client2 = get_llm_client()

    assert client1 is client2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
