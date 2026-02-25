"""
Tests for SDC Mascot Module
"""

import pytest
import sys
import os
import logging

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

# Import after path setup
from mascot import MascotRenderer
from mascot import MascotWindow
from mascot import MascotStateMachine, MascotState
from PyQt6.QtWidgets import QApplication


@pytest.fixture(scope="session")
def qapp():
    """Create QApplication for tests"""
    app = QApplication.instance()
    if app is None:
        app = QApplication([])
    yield app
    app.quit()


def test_svg_renderer():
    """Test that the SVG is valid"""
    renderer = MascotRenderer()
    assert renderer._svg_renderer.isValid()


def test_mascot_state_transitions(qapp):
    """Test mascot state transitions with valid 5 states"""
    mascot = MascotRenderer()
    assert mascot.state == "idle"

    # Test all valid states
    mascot.state = "thinking"
    assert mascot.state == "thinking"

    mascot.state = "walking"
    assert mascot.state == "walking"

    mascot.state = "sleeping"
    assert mascot.state == "sleeping"

    mascot.state = "listening"
    assert mascot.state == "listening"

    mascot.state = "idle"
    assert mascot.state == "idle"


def test_animation_update(qapp):
    """Test animation update"""
    mascot = MascotRenderer()
    initial_offset = mascot._breath_offset

    # Update animation
    mascot.update_animation(0.1)
    assert mascot._breath_offset != initial_offset


def test_mascot_window_creation(qapp):
    """Test mascot window creation"""
    window = MascotWindow()
    assert window is not None
    assert window.WINDOW_WIDTH == 200
    assert window.WINDOW_HEIGHT == 220
    window.close()


def test_window_state_change(qapp):
    """Test window state change"""
    window = MascotWindow()
    window.set_state("thinking")
    assert window._mascot.state == "thinking"
    window.close()


def test_state_machine_initialization():
    """Test state machine initialization"""
    sm = MascotStateMachine()
    assert sm.current_state == MascotState.IDLE
    assert sm.previous_state is None
    assert sm.transition_count == 0


def test_state_machine_valid_transitions():
    """Test valid state machine transitions"""
    sm = MascotStateMachine()

    # Test valid transitions
    assert sm.transition(MascotState.THINKING) is True
    assert sm.current_state == MascotState.THINKING

    assert sm.transition(MascotState.IDLE) is True
    assert sm.current_state == MascotState.IDLE

    assert sm.transition(MascotState.WALKING) is True
    assert sm.current_state == MascotState.WALKING


def test_state_machine_invalid_transitions():
    """Test invalid state machine transitions"""
    sm = MascotStateMachine()

    # Sleeping can only go to Idle or Listening
    sm.transition(MascotState.SLEEPING)
    assert sm.current_state == MascotState.SLEEPING

    # Invalid: Sleeping -> Walking should fail
    assert sm.transition(MascotState.WALKING) is False
    assert sm.current_state == MascotState.SLEEPING

    # Valid: Sleeping -> Listening
    assert sm.transition(MascotState.LISTENING) is True
    assert sm.current_state == MascotState.LISTENING


def test_state_machine_convenience_methods():
    """Test state machine convenience methods"""
    sm = MascotStateMachine()

    assert sm.idle() is True
    assert sm.current_state == MascotState.IDLE

    assert sm.walk() is True
    assert sm.current_state == MascotState.WALKING

    assert sm.sleep() is True
    assert sm.current_state == MascotState.SLEEPING

    assert sm.listen() is True
    assert sm.current_state == MascotState.LISTENING

    assert sm.think() is True
    assert sm.current_state == MascotState.THINKING


def test_state_machine_animation_params():
    """Test state machine animation parameters"""
    sm = MascotStateMachine()

    # Test each state's animation params
    params = sm.get_animation_params()
    assert params["breathing"] is True

    sm.transition(MascotState.WALKING)
    params = sm.get_animation_params()
    assert params["bounce"] is True
    assert params["tail_wag"] is True

    sm.transition(MascotState.SLEEPING)
    params = sm.get_animation_params()
    assert params["eyes"] == "closed"
    assert params["zzz"] is True

    sm.transition(MascotState.LISTENING)
    params = sm.get_animation_params()
    assert params["breathing"] is False
    assert params["tail_wag"] is True

    sm.transition(MascotState.THINKING)
    params = sm.get_animation_params()
    assert params["eyes"] == "thinking"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
