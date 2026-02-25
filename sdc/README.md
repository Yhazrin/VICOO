# Sentient Desktop Companion (SDC)

A desktop AI companion with a cute cyber cat mascot interface.

## Project Structure

```
sdc/
├── README.md           # This file
├── run.py              # Entry point
├── requirements.txt    # Dependencies
├── pytest.ini          # Test configuration
├── src/
│   ├── __init__.py     # Main entry point
│   └── mascot/
│       ├── __init__.py
│       ├── renderer.py      # SVG mascot renderer
│       ├── window.py        # Desktop window widget
│       ├── state_machine.py # 5-state FSM
│       ├── llm.py           # LLM client & conversation
│       └── conversation.py  # Chat widget
└── tests/
    ├── test_mascot.py  # Unit tests
    └── test_llm.py     # LLM tests
```

## Requirements

- Python 3.10+
- PyQt6

## Installation

```bash
pip install -r requirements.txt
pip install pytest pytest-asyncio
```

## Usage

```bash
python run.py
```

### Controls

- **Left-click + Drag**: Move the mascot
- **Double-click**: Open chat window
- **Right-click**: Context menu
  - Change state (Idle/Walking/Sleeping/Listening/Thinking/Greeting/Excited/Celebrating/etc.)
  - Open Chat
  - Clear Chat History
  - Exit

## Development Phases (7 Phases)

### Phase 1: Minimal Mascot Entity - ✅ COMPLETED
- Transparent, frameless window
- Always-on-top
- Draggable with mouse
- Cyber Cat mascot with SVG rendering
- Idle breathing animation (~60 FPS)
- Right-click context menu with Exit option

### Phase 2: State Machine System - ✅ COMPLETED (Extended!)
- **26-state FSM** (extended from 5 states):
  - Basic: Idle, Walking, Sleeping, Listening, Thinking
  - User Interaction: Greeting, Goodbye, Question, Excited
  - Focus Mode: Med Break Time
  - System: Loading, Erroritating, Breathing,, Updating
  - Actions: Celebrating, Surprised, Sad
  - Collaboration: Sharing, Receiving, Collaborating
- Each state has unique animations
- State transition logging
- Invalid transition prevention
- Unit test coverage

### Phase 3: LLM Conversation Integration - ✅ COMPLETED
- Multi-turn conversation support
- Local history storage (~/.sdc/conversations/)
- Context compression (auto-summarizes old messages)
- Chat widget (double-click to open)
- State integration:
  - Thinking: while processing
  - Listening: after response
  - Auto-revert to Idle after 3s

### Phase 4: Long-term Memory System - ⏳ NOT STARTED
- Vector storage for semantic memory
- Memory weight decay function (e^(-λt))
- User preference modeling
- Episodic memory (conversation history)
- Semantic memory (learned facts)

### Phase 5: Operation Agent - ⏳ NOT STARTED
- File system operations
- Application launching
- Web search capabilities
- Task automation

### Phase 6: Self-optimization - ⏳ NOT STARTED
- Code self-improvement
- Performance optimization
- Learning from interactions

### Phase 7: Plugin System - ⏳ NOT STARTED
- Plugin API for extensions
- Plugin manager
- Built-in plugins (weather, news, etc.)

## Testing

```bash
python -m pytest tests/ -v
```

## Configuration

### LLM API (Optional)

Set environment variables to use real LLM:

```bash
export OPENAI_API_KEY="your-key"
export OPENAI_BASE_URL="https://api.openai.com/v1"  # for custom endpoints
```

Or modify `src/mascot/llm.py` to use LiteLLM for local models.

## Next Steps

### Current Focus: Phase 4 - Long-term Memory System
Priority tasks:
- Implement vector storage for semantic memory
- Add memory weight decay function
- Build user preference modeling

### Future Phases
- Phase 5: Operation Agent
- Phase 6: Self-optimization
- Phase 7: Plugin System

---

## Architecture Notes

### State Machine

```
        +--------+
        |  IDLE  |
        +--------+
           |
     +-----+-----+-----+-----+
     |     |     |     |     |
     v     v     v     v     v
 WALK  SLEEP LISTEN THINK <- all can go back to IDLE
   |
   +-> (Walking is for dragging)
```

### Memory System (Upcoming)

```
MemoryEntry:
  - id: uuid
  - timestamp: unix
  - type: episodic | semantic | preference
  - content: str
  - embedding: list[float]
  - weight: float (1.0 initial, decays with e^(-λt))
  - source: str

Weight decay: weight(t) = initial × e^(-0.05 × Δdays)
```
