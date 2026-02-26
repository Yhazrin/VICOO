"""
SDC - Vicoo API Event Bridge
Deep integration between desktop pet and Vicoo knowledge management app.

Polls the Vicoo API for state changes and exposes helper methods
so the mascot can:
  - React to note creation / edits
  - Show AI processing status
  - Create notes, search, trigger focus mode from the pet
  - Display notification bubbles
"""

import json
import logging
import time
from typing import Optional, Dict, Any, List, Callable
from urllib.request import Request, urlopen
from urllib.error import URLError
from urllib.parse import urlencode

from PyQt6.QtCore import QObject, QTimer, pyqtSignal


_log = logging.getLogger("sdc.bridge")

DEFAULT_API = "http://localhost:8000"


class VicooEvent:
    """Lightweight event object emitted by the bridge."""
    __slots__ = ("kind", "data", "ts")

    def __init__(self, kind: str, data: Optional[Dict] = None):
        self.kind = kind
        self.data = data or {}
        self.ts = time.time()

    def __repr__(self):
        return f"VicooEvent({self.kind}, {self.data})"


class VicooBridge(QObject):
    """
    Async-free bridge (uses QTimer polling) to the Vicoo REST API.

    Signals
    -------
    connected / disconnected
        Fired when the API becomes reachable / unreachable.
    event_received(VicooEvent)
        Generic event signal.
    note_created(dict)
        A new note appeared since last poll.
    note_count_changed(int)
        Total note count changed.
    ai_status_changed(dict)
        AI provider status changed.
    """

    connected = pyqtSignal()
    disconnected = pyqtSignal()
    event_received = pyqtSignal(object)  # VicooEvent
    note_created = pyqtSignal(dict)
    note_count_changed = pyqtSignal(int)
    ai_status_changed = pyqtSignal(dict)

    def __init__(self, base_url: str = DEFAULT_API, poll_ms: int = 5000, parent=None):
        super().__init__(parent)
        self._base = base_url.rstrip("/")
        self._token: Optional[str] = None
        self._is_connected = False

        # Cached state for diff detection
        self._last_note_count = -1
        self._last_note_ids: set = set()

        # Poll timer
        self._poll_timer = QTimer(self)
        self._poll_timer.timeout.connect(self._poll)
        self._poll_interval = poll_ms

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start(self):
        """Begin polling the Vicoo API."""
        _log.info("Bridge starting, API=%s poll=%dms", self._base, self._poll_interval)
        self._ensure_token()
        self._poll_timer.start(self._poll_interval)
        # Immediate first poll
        QTimer.singleShot(500, self._poll)

    def stop(self):
        self._poll_timer.stop()

    @property
    def is_connected(self) -> bool:
        return self._is_connected

    # ------------------------------------------------------------------
    # HTTP helpers (stdlib only — no requests dependency)
    # ------------------------------------------------------------------

    def _get(self, path: str, timeout: float = 3) -> Optional[Dict]:
        url = f"{self._base}{path}"
        headers = {}
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        try:
            req = Request(url, headers=headers)
            with urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read())
        except Exception:
            return None

    def _post(self, path: str, body: Optional[Dict] = None, timeout: float = 10) -> Optional[Dict]:
        url = f"{self._base}{path}"
        headers = {"Content-Type": "application/json"}
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        data = json.dumps(body or {}).encode()
        try:
            req = Request(url, data=data, headers=headers, method="POST")
            with urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read())
        except Exception as exc:
            _log.debug("POST %s failed: %s", path, exc)
            return None

    def _ensure_token(self):
        """Obtain a dev-mode bearer token."""
        if self._token:
            return
        resp = self._post("/auth/dev-token")
        if resp and resp.get("data", {}).get("token"):
            self._token = resp["data"]["token"]
            _log.info("Obtained dev token")

    # ------------------------------------------------------------------
    # Poll loop
    # ------------------------------------------------------------------

    def _poll(self):
        # 1. Health check
        health = self._get("/health")
        was_connected = self._is_connected
        self._is_connected = bool(health and health.get("data", {}).get("ok"))

        if self._is_connected and not was_connected:
            _log.info("Connected to Vicoo API")
            self._ensure_token()
            self.connected.emit()
            self._emit(VicooEvent("connected"))
        elif not self._is_connected and was_connected:
            _log.warning("Disconnected from Vicoo API")
            self.disconnected.emit()
            self._emit(VicooEvent("disconnected"))

        if not self._is_connected:
            return

        # 2. Note list diff
        notes_resp = self._get("/api/notes?limit=50")
        if notes_resp:
            notes = notes_resp.get("data", [])
            total = notes_resp.get("meta", {}).get("total", len(notes))
            current_ids = {n["id"] for n in notes}

            if self._last_note_count >= 0 and total != self._last_note_count:
                self.note_count_changed.emit(total)
                self._emit(VicooEvent("note_count_changed", {"total": total}))

            if self._last_note_ids:
                new_ids = current_ids - self._last_note_ids
                for nid in new_ids:
                    note = next((n for n in notes if n["id"] == nid), None)
                    if note:
                        _log.info("New note detected: %s", note.get("title"))
                        self.note_created.emit(note)
                        self._emit(VicooEvent("note_created", note))

            self._last_note_count = total
            self._last_note_ids = current_ids

    def _emit(self, evt: VicooEvent):
        self.event_received.emit(evt)

    # ------------------------------------------------------------------
    # Actions (callable from mascot / dialog)
    # ------------------------------------------------------------------

    def create_note(self, title: str, body: str = "", tags: Optional[List[str]] = None) -> Optional[Dict]:
        """Create a note via the Vicoo API."""
        payload: Dict[str, Any] = {"title": title, "body": body}
        if tags:
            payload["tags"] = tags
        resp = self._post("/api/notes", payload)
        if resp and resp.get("data"):
            self._emit(VicooEvent("note_created_by_pet", resp["data"]))
            return resp["data"]
        return None

    def search_notes(self, query: str) -> List[Dict]:
        """Search notes."""
        resp = self._get(f"/api/search?q={query}&limit=5")
        if resp and resp.get("data"):
            return resp["data"]
        return []

    def ai_chat(self, message: str) -> Optional[str]:
        """Send a chat message to the AI assistant and return the response text."""
        resp = self._post("/api/ai/chat", {"message": message}, timeout=30)
        if resp and resp.get("success"):
            text = resp.get("response", "")
            # Strip <think> blocks
            import re
            text = re.sub(r"<think>[\s\S]*?</think>\s*", "", text).strip()
            return text
        return None

    def get_note_count(self) -> int:
        resp = self._get("/api/notes?limit=1")
        if resp:
            return resp.get("meta", {}).get("total", 0)
        return 0

    def get_focus_sessions(self) -> List[Dict]:
        resp = self._get("/api/focus?limit=3")
        if resp and resp.get("data"):
            return resp["data"]
        return []

    def generate_graph(self) -> Optional[Dict]:
        """Trigger knowledge graph generation."""
        resp = self._post("/api/graph/generate-from-notes", {"clearExisting": True}, timeout=60)
        if resp and resp.get("data"):
            return resp["data"]
        return None
