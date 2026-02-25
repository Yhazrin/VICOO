"""
SDC - Sentient Desktop Companion
State Machine Module

Implements a 5-state Finite State Machine for the mascot
"""

from enum import Enum
from typing import Optional, Callable
from PyQt6.QtCore import QObject, pyqtSignal
import logging
import time
import os

class MascotState(Enum):
    """Mascot states - Extended with more scenarios"""
    # Basic states
    IDLE = "idle"
    WALKING = "walking"
    SLEEPING = "sleeping"
    LISTENING = "listening"
    THINKING = "thinking"

    # User interaction states
    GREETING = "greeting"       # Saying hello
    GOODBYE = "goodbye"        # Saying goodbye
    QUESTION = "question"        # Confused/questioning
    EXCITED = "excited"         # Very happy

    # Focus mode states
    MEDITATING = "meditating"   # Deep focus
    BREATHING = "breathing"     # Breathing exercise
    BREAK_TIME = "break_time"   # Taking a break

    # System states
    LOADING = "loading"         # Long loading
    ERROR = "error"             # Error state
    UPDATING = "updating"       # Updating

    # Action states
    CELEBRATING = "celebrating" # Achievement!
    SURPRISED = "surprised"    # Surprised
    SAD = "sad"                 # Sad

    # Collaboration states
    SHARING = "sharing"         # Sharing something
    RECEIVING = "receiving"    # Receiving something
    COLLABORATING = "collaborating"  # Working together


class StateTransition:
    """Represents a state transition"""
    def __init__(self, from_state: MascotState, to_state: MascotState):
        self.from_state = from_state
        self.to_state = to_state
        self.timestamp = time.time()


class MascotStateMachine(QObject):
    """
    5-state Finite State Machine for the mascot

    States:
        - IDLE: Default state, breathing animation
        - WALKING: Moving around the screen
        - SLEEPING: Eyes closed, Zzz animation
        - LISTENING: Alert, ready to respond
        - THINKING: Processing, loading animation
    """

    # Signals
    stateChanged = pyqtSignal(str)
    transitionOccurred = pyqtSignal(str, str)

    # Valid transitions map - Extended with new states
    VALID_TRANSITIONS = {
        MascotState.IDLE: [
            MascotState.WALKING, MascotState.SLEEPING, MascotState.LISTENING, MascotState.THINKING,
            MascotState.GREETING, MascotState.GOODBYE, MascotState.QUESTION, MascotState.EXCITED,
            MascotState.MEDITATING, MascotState.BREATHING, MascotState.BREAK_TIME,
            MascotState.LOADING, MascotState.ERROR, MascotState.UPDATING,
            MascotState.CELEBRATING, MascotState.SURPRISED, MascotState.SAD,
            MascotState.SHARING, MascotState.RECEIVING, MascotState.COLLABORATING,
        ],
        MascotState.WALKING: [
            MascotState.IDLE, MascotState.SLEEPING, MascotState.LISTENING, MascotState.THINKING,
            MascotState.EXCITED, MascotState.CELEBRATING,
        ],
        MascotState.SLEEPING: [
            # 从睡眠状态只能回到空闲或监听
            MascotState.IDLE, MascotState.LISTENING,
        ],
        MascotState.LISTENING: [
            MascotState.IDLE, MascotState.THINKING, MascotState.WALKING,
            MascotState.QUESTION, MascotState.SURPRISED, MascotState.EXCITED,
        ],
        MascotState.THINKING: [
            MascotState.IDLE, MascotState.LISTENING,
            MascotState.EXCITED, MascotState.SAD, MascotState.CELEBRATING,
        ],
        # New states - can go back to IDLE or LISTENING
        MascotState.GREETING: [MascotState.IDLE, MascotState.LISTENING],
        MascotState.GOODBYE: [MascotState.IDLE],
        MascotState.QUESTION: [MascotState.IDLE, MascotState.THINKING, MascotState.LISTENING],
        MascotState.EXCITED: [MascotState.IDLE, MascotState.CELEBRATING, MascotState.LISTENING],
        MascotState.MEDITATING: [MascotState.IDLE, MascotState.BREATHING, MascotState.BREAK_TIME],
        MascotState.BREATHING: [MascotState.IDLE, MascotState.MEDITATING, MascotState.BREAK_TIME],
        MascotState.BREAK_TIME: [MascotState.IDLE, MascotState.MEDITATING],
        MascotState.LOADING: [MascotState.IDLE, MascotState.THINKING, MascotState.ERROR],
        MascotState.ERROR: [MascotState.IDLE, MascotState.SAD],
        MascotState.UPDATING: [MascotState.IDLE, MascotState.LOADING],
        MascotState.CELEBRATING: [MascotState.IDLE, MascotState.EXCITED, MascotState.LISTENING],
        MascotState.SURPRISED: [MascotState.IDLE, MascotState.LISTENING, MascotState.QUESTION],
        MascotState.SAD: [MascotState.IDLE, MascotState.THINKING, MascotState.LISTENING],
        MascotState.SHARING: [MascotState.IDLE, MascotState.LISTENING, MascotState.COLLABORATING],
        MascotState.RECEIVING: [MascotState.IDLE, MascotState.LISTENING, MascotState.COLLABORATING],
        MascotState.COLLABORATING: [MascotState.IDLE, MascotState.LISTENING, MascotState.THINKING],
    }

    def __init__(self, parent=None):
        super().__init__(parent)
        self._current_state = MascotState.IDLE
        self._previous_state: Optional[MascotState] = None
        self._transition_count = 0
        self._state_start_time = time.time()

        # Setup logging
        self._logger = logging.getLogger("sdc.state_machine")
        self._logger.setLevel(logging.INFO)

        # Log initial state
        self._logger.info(f"State machine initialized: {self._current_state.value}")

    @property
    def current_state(self) -> MascotState:
        return self._current_state

    @property
    def previous_state(self) -> Optional[MascotState]:
        return self._previous_state

    def can_transition(self, to_state: MascotState) -> bool:
        """Check if transition to target state is valid"""
        return to_state in self.VALID_TRANSITIONS.get(self._current_state, [])

    def transition(self, to_state: MascotState) -> bool:
        """
        Transition to a new state

        Returns:
            True if transition successful, False otherwise
        """
        if to_state == self._current_state:
            return True

        if not self.can_transition(to_state):
            self._logger.warning(
                f"Invalid transition: {self._current_state.value} -> {to_state.value}"
            )
            return False

        # Perform transition
        old_state = self._current_state
        self._previous_state = old_state
        self._current_state = to_state
        self._transition_count += 1
        self._state_start_time = time.time()

        # Log transition
        self._logger.info(
            f"Transition #{self._transition_count}: {old_state.value} -> {to_state.value}"
        )

        # Emit signals
        self.stateChanged.emit(to_state.value)
        self.transitionOccurred.emit(old_state.value, to_state.value)

        return True

    def get_state_duration(self) -> float:
        """Get duration in current state (seconds)"""
        return time.time() - self._state_start_time

    @property
    def transition_count(self) -> int:
        return self._transition_count

    # Convenience methods for common states
    def idle(self) -> bool:
        """Transition to IDLE state"""
        return self.transition(MascotState.IDLE)

    def walk(self) -> bool:
        """Transition to WALKING state"""
        return self.transition(MascotState.WALKING)

    def sleep(self) -> bool:
        """Transition to SLEEPING state"""
        return self.transition(MascotState.SLEEPING)

    def listen(self) -> bool:
        """Transition to LISTENING state"""
        return self.transition(MascotState.LISTENING)

    def think(self) -> bool:
        """Transition to THINKING state"""
        return self.transition(MascotState.THINKING)

    # New state convenience methods
    def greet(self) -> bool:
        """Transition to GREETING state"""
        return self.transition(MascotState.GREETING)

    def goodbye(self) -> bool:
        """Transition to GOODBYE state"""
        return self.transition(MascotState.GOODBYE)

    def question(self) -> bool:
        """Transition to QUESTION state"""
        return self.transition(MascotState.QUESTION)

    def excited(self) -> bool:
        """Transition to EXCITED state"""
        return self.transition(MascotState.EXCITED)

    def meditate(self) -> bool:
        """Transition to MEDITATING state"""
        return self.transition(MascotState.MEDITATING)

    def breathe(self) -> bool:
        """Transition to BREATHING state"""
        return self.transition(MascotState.BREATHING)

    def break_time(self) -> bool:
        """Transition to BREAK_TIME state"""
        return self.transition(MascotState.BREAK_TIME)

    def loading(self) -> bool:
        """Transition to LOADING state"""
        return self.transition(MascotState.LOADING)

    def error(self) -> bool:
        """Transition to ERROR state"""
        return self.transition(MascotState.ERROR)

    def updating(self) -> bool:
        """Transition to UPDATING state"""
        return self.transition(MascotState.UPDATING)

    def celebrate(self) -> bool:
        """Transition to CELEBRATING state"""
        return self.transition(MascotState.CELEBRATING)

    def surprised(self) -> bool:
        """Transition to SURPRISED state"""
        return self.transition(MascotState.SURPRISED)

    def sad(self) -> bool:
        """Transition to SAD state"""
        return self.transition(MascotState.SAD)

    def share(self) -> bool:
        """Transition to SHARING state"""
        return self.transition(MascotState.SHARING)

    def receive(self) -> bool:
        """Transition to RECEIVING state"""
        return self.transition(MascotState.RECEIVING)

    def collaborate(self) -> bool:
        """Transition to COLLABORATING state"""
        return self.transition(MascotState.COLLABORATING)

    # Animation parameters for each state - Extended with new states
    def get_animation_params(self) -> dict:
        """Get animation parameters for current state"""
        params = {
            MascotState.IDLE: {
                "breathing": True,
                "breath_speed": 2.0,
                "breath_amplitude": 3.0,
                "eyes": "normal",
                "tail_wag": False,
            },
            MascotState.WALKING: {
                "breathing": True,
                "breath_speed": 3.0,
                "breath_amplitude": 2.0,
                "eyes": "normal",
                "tail_wag": True,
                "bounce": True,
            },
            MascotState.SLEEPING: {
                "breathing": True,
                "breath_speed": 1.0,
                "breath_amplitude": 1.5,
                "eyes": "closed",
                "zzz": True,
                "tail_wag": False,
            },
            MascotState.LISTENING: {
                "breathing": False,
                "eyes": "wide",
                "ear_twitch": True,
                "tail_wag": True,
            },
            MascotState.THINKING: {
                "breathing": True,
                "breath_speed": 1.5,
                "breath_amplitude": 2.0,
                "eyes": "thinking",
                "loading_dots": True,
                "tail_wag": False,
            },
            # New states - User interaction
            MascotState.GREETING: {
                "breathing": False,
                "eyes": "happy",
                "tail_wag": True,
                "wave": True,
                "ear_twitch": True,
            },
            MascotState.GOODBYE: {
                "breathing": False,
                "eyes": "sad",
                "tail_wag": True,
                "wave": True,
            },
            MascotState.QUESTION: {
                "breathing": False,
                "eyes": "question",
                "head_tilt": True,
                "tail_wag": True,
            },
            MascotState.EXCITED: {
                "breathing": True,
                "breath_speed": 4.0,
                "breath_amplitude": 4.0,
                "eyes": "happy",
                "tail_wag": True,
                "bounce": True,
                "jump": True,
            },
            # Focus mode states
            MascotState.MEDITATING: {
                "breathing": True,
                "breath_speed": 0.5,
                "breath_amplitude": 2.0,
                "eyes": "closed",
                "tail_wag": False,
                "glow": True,
            },
            MascotState.BREATHING: {
                "breathing": True,
                "breath_speed": 0.8,
                "breath_amplitude": 5.0,
                "eyes": "closed",
                "tail_wag": False,
                "pulse": True,
            },
            MascotState.BREAK_TIME: {
                "breathing": True,
                "breath_speed": 1.5,
                "breath_amplitude": 3.0,
                "eyes": "happy",
                "stretch": True,
                "tail_wag": True,
            },
            # System states
            MascotState.LOADING: {
                "breathing": False,
                "eyes": "loading",
                "spinner": True,
                "tail_wag": False,
            },
            MascotState.ERROR: {
                "breathing": True,
                "breath_speed": 3.0,
                "breath_amplitude": 2.0,
                "eyes": "sad",
                "shake": True,
                "tail_wag": False,
            },
            MascotState.UPDATING: {
                "breathing": True,
                "breath_speed": 2.0,
                "eyes": "loading",
                "spinner": True,
                "glow": True,
                "tail_wag": False,
            },
            # Action states
            MascotState.CELEBRATING: {
                "breathing": True,
                "breath_speed": 5.0,
                "breath_amplitude": 5.0,
                "eyes": "happy",
                "tail_wag": True,
                "bounce": True,
                "jump": True,
                "confetti": True,
            },
            MascotState.SURPRISED: {
                "breathing": False,
                "eyes": "surprised",
                "tail_wag": True,
                "jump": True,
            },
            MascotState.SAD: {
                "breathing": True,
                "breath_speed": 1.0,
                "breath_amplitude": 1.0,
                "eyes": "sad",
                "tail_wag": False,
                "droop": True,
            },
            # Collaboration states
            MascotState.SHARING: {
                "breathing": False,
                "eyes": "normal",
                "tail_wag": True,
                "reach": True,
            },
            MascotState.RECEIVING: {
                "breathing": False,
                "eyes": "happy",
                "tail_wag": True,
                "reach": True,
            },
            MascotState.COLLABORATING: {
                "breathing": True,
                "breath_speed": 2.0,
                "eyes": "thinking",
                "tail_wag": True,
                "nod": True,
            },
        }
        return params.get(self._current_state, {})


# Logging configuration
def setup_logging(log_file: Optional[str] = None, level: int = logging.INFO):
    """
    Setup logging for SDC.

    如果设置了环境变量 SDC_DEBUG（1/true/yes/on），
    会自动把日志级别提升到 DEBUG，并在终端完整输出调试信息。
    """
    # Allow environment variable to override log level
    debug_env = os.getenv("SDC_DEBUG", "").lower()
    if debug_env in ("1", "true", "yes", "on"):
        level = logging.DEBUG

    root_logger = logging.getLogger()

    # If logging is already configured, just update level and return
    if root_logger.handlers:
        root_logger.setLevel(level)
        return

    handlers = [logging.StreamHandler()]

    if log_file:
        handlers.append(logging.FileHandler(log_file))

    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=handlers,
    )
