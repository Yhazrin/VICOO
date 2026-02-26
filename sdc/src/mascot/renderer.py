"""
SDC - Sentient Desktop Companion
Mascot Renderer Module - Rive-quality Dynamic Rendering

Multi-layer animation system:
  - Breathing (chest rise/fall)
  - Ear twitching
  - Tail wagging with physics
  - Blinking with variable frequency
  - Eye gaze following (attention parameter)
  - Smooth state blending via interpolation
"""

from PyQt6.QtCore import QObject, pyqtSignal, QTimer, Qt
from PyQt6.QtGui import QPainter, QPainterPath, QColor, QPen, QBrush, QFont, QTransform
import math
import time


def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def _ease_in_out(t: float) -> float:
    if t < 0.5:
        return 2 * t * t
    return -1 + (4 - 2 * t) * t


def _elastic_out(t: float) -> float:
    if t == 0 or t == 1:
        return t
    return pow(2, -10 * t) * math.sin((t - 0.075) * (2 * math.pi) / 0.3) + 1


class AnimParams:
    """Continuous animation parameters that drive motion amplitude/rhythm."""

    def __init__(self):
        self.fatigue = 0.0       # 0..1 slows breath, droops tail
        self.excitement = 0.0    # 0..1 faster breath, bigger bounce
        self.attention = 0.5     # 0..1 ear twitch freq, eye focus
        self.speed = 0.0         # 0..1 walk/translate speed

    def blend_toward(self, target: 'AnimParams', dt: float, rate: float = 3.0):
        t = min(1.0, dt * rate)
        self.fatigue = _lerp(self.fatigue, target.fatigue, t)
        self.excitement = _lerp(self.excitement, target.excitement, t)
        self.attention = _lerp(self.attention, target.attention, t)
        self.speed = _lerp(self.speed, target.speed, t)


# Target parameters per animation group
_GROUP_PARAMS = {
    "float":      AnimParams(),
    "squash":     type('', (), {'fatigue': 0, 'excitement': 0.8, 'attention': 0.7, 'speed': 0})(),
    "shiver":     type('', (), {'fatigue': 0.2, 'excitement': 0.3, 'attention': 0.9, 'speed': 0})(),
    "translate":  type('', (), {'fatigue': 0.1, 'excitement': 0.2, 'attention': 0.6, 'speed': 0.7})(),
    "wiggle":     type('', (), {'fatigue': 0, 'excitement': 0.9, 'attention': 1.0, 'speed': 0})(),
    "shiver_top": type('', (), {'fatigue': 0.6, 'excitement': 0.1, 'attention': 0.3, 'speed': 0})(),
    "bounce":     type('', (), {'fatigue': 0, 'excitement': 1.0, 'attention': 0.5, 'speed': 0})(),
    "pulse":      type('', (), {'fatigue': 0.1, 'excitement': 0.4, 'attention': 0.8, 'speed': 0.3})(),
}


class MascotRenderer(QObject):
    """
    Rive-quality mascot renderer with multi-layer animation blending.
    """

    STATE_ANIMATIONS = {
        "happy": "squash", "celebrating": "squash", "search_found": "squash",
        "synced": "squash", "saved": "squash", "connected": "squash", "excited": "squash",
        "thinking": "shiver", "search_empty": "shiver", "navigating": "shiver", "question": "shiver",
        "working": "translate", "typing": "translate", "saving": "translate",
        "file_reading": "translate", "file_writing": "translate", "command_running": "translate",
        "syncing": "translate", "dragging": "translate", "loading": "translate", "updating": "translate",
        "surprised": "wiggle", "focus_enter": "wiggle",
        "sad": "shiver_top", "error": "shiver_top", "sync_error": "shiver_top",
        "disconnected": "shiver_top", "goodbye": "shiver_top",
        "dropped": "bounce",
        "searching": "pulse", "connecting": "pulse", "focus_exit": "pulse", "listening": "pulse",
        "walking": "translate",
        "idle": "float", "sleeping": "float", "meditating": "float", "breathing": "float",
        "break_time": "float", "greeting": "float", "receiving": "float",
        "collaborating": "float", "sharing": "float",
    }

    stateChanged = pyqtSignal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self._state = "idle"
        self._prev_state = "idle"
        self._skin = "cat"
        self._time = 0.0
        self._last_update = time.time()

        # Transition blending
        self._transition_progress = 1.0  # 1.0 = fully in current state
        self._transition_speed = 6.0     # blend rate (< 100 ms at 60 FPS)

        # Continuous parameters
        self._params = AnimParams()
        self._blink_timer = 0.0
        self._blink_closed = False
        self._next_blink = 3.0 + 1.5  # random-ish initial

        # 60 FPS tick
        self._timer = QTimer()
        self._timer.timeout.connect(self._on_timer)
        self._timer.start(16)

    def _on_timer(self):
        now = time.time()
        dt = now - self._last_update
        self._last_update = now
        self._time += dt

        # Blend transition
        if self._transition_progress < 1.0:
            self._transition_progress = min(1.0, self._transition_progress + dt * self._transition_speed)

        # Blend params toward target
        group = self.STATE_ANIMATIONS.get(self._state, "float")
        target = _GROUP_PARAMS.get(group, _GROUP_PARAMS["float"])
        target_p = AnimParams()
        target_p.fatigue = getattr(target, 'fatigue', 0)
        target_p.excitement = getattr(target, 'excitement', 0)
        target_p.attention = getattr(target, 'attention', 0.5)
        target_p.speed = getattr(target, 'speed', 0)
        self._params.blend_toward(target_p, dt)

        # Blink logic
        self._blink_timer += dt
        if self._blink_closed:
            if self._blink_timer > 0.12:
                self._blink_closed = False
                self._blink_timer = 0.0
                att = max(0.1, self._params.attention)
                self._next_blink = 2.0 / att + math.sin(self._time * 0.7) * 1.5
        else:
            if self._blink_timer > self._next_blink:
                self._blink_closed = True
                self._blink_timer = 0.0

    # --- Properties ---

    def get_state(self) -> str:
        return self._state

    def set_state(self, state: str):
        if state != self._state:
            self._prev_state = self._state
            self._state = state
            self._transition_progress = 0.0
            self.stateChanged.emit(state)

    state = property(get_state, set_state)

    def set_skin(self, skin: str):
        self._skin = skin

    def get_skin(self) -> str:
        return self._skin

    # --- Main render ---

    def render(self, painter: QPainter, rect):
        painter.save()

        # Compute blended body offset
        offset_y = self._body_offset()
        transform = QTransform()
        transform.translate(0, offset_y)
        painter.setTransform(transform)

        if self._skin == "cat":
            self._render_cat(painter, rect)
        elif self._skin == "bot":
            self._render_bot(painter, rect)
        elif self._skin == "orb":
            self._render_orb(painter, rect)
        else:
            self._render_cat(painter, rect)

        painter.restore()

    def _body_offset(self) -> float:
        """Blend between prev and current state offsets."""
        prev_off = self._calc_offset(self._prev_state)
        cur_off = self._calc_offset(self._state)
        t = _ease_in_out(self._transition_progress)
        base = _lerp(prev_off, cur_off, t)

        # Layer: breathing
        breath_speed = 2.0 * (1.0 - self._params.fatigue * 0.5) + self._params.excitement * 2.0
        breath_amp = 2.0 + self._params.excitement * 2.0 - self._params.fatigue * 1.0
        breath = math.sin(self._time * breath_speed) * breath_amp

        return base + breath

    def _calc_offset(self, state_name: str) -> float:
        anim = self.STATE_ANIMATIONS.get(state_name, "float")
        t = self._time
        if anim == "float":
            return math.sin(t * 1.5) * 2
        elif anim == "squash":
            return abs(math.sin(t * 6)) * 4
        elif anim == "shiver":
            return math.sin(t * 25) * 1.5
        elif anim == "shiver_top":
            return math.sin(t * 12) * 1.2
        elif anim == "bounce":
            return -abs(math.sin(t * 8)) * 6
        elif anim == "pulse":
            return math.sin(t * 3) * 1.5
        elif anim == "wiggle":
            return math.sin(t * 6) * 2.5
        elif anim == "translate":
            return math.sin(t * 2) * 0.8
        return math.sin(t * 1.5) * 2

    # --- Cat Skin ---

    def _render_cat(self, painter: QPainter, rect):
        state = self._state
        t = self._time
        p = self._params

        # Shadow
        shadow_breathe = math.sin(t * 2) * 2
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor(0, 0, 0, 40)))
        painter.drawEllipse(40, int(185 + shadow_breathe), 120, 16)

        # Tail
        self._draw_cat_tail(painter, t, p, state)

        # Body
        body_color = QColor("#ffffff")
        if state in ("thinking", "searching", "navigating", "question"):
            body_color = QColor("#118AB2")
        elif state in ("sad", "error", "sync_error", "disconnected"):
            body_color = QColor("#f0f0f0")
        painter.setBrush(QBrush(body_color))
        painter.setPen(QPen(QColor("#1a1a1a"), 5))

        path = QPainterPath()
        path.moveTo(40, 180)
        path.lineTo(160, 180)
        path.quadTo(170, 180, 170, 150)
        path.lineTo(170, 120)
        path.quadTo(170, 60, 100, 60)
        path.quadTo(30, 60, 30, 120)
        path.lineTo(30, 150)
        path.quadTo(30, 180, 40, 180)
        painter.drawPath(path)

        # Ears with micro-twitch
        self._draw_cat_ears(painter, t, p)

        # Whiskers
        painter.setPen(QPen(QColor("#1a1a1a"), 2))
        whisker_y = math.sin(t * 3) * 1.5
        painter.drawLine(15, int(120 + whisker_y), 45, 125)
        painter.drawLine(15, int(132 + whisker_y), 45, 130)
        painter.drawLine(185, int(120 - whisker_y), 155, 125)
        painter.drawLine(185, int(132 - whisker_y), 155, 130)

        # Face
        self._draw_cat_face(painter, state, t, p)

    def _draw_cat_tail(self, painter: QPainter, t: float, p: AnimParams, state: str):
        wag_speed = 3.0 + p.excitement * 4.0
        wag_amp = 8.0 + p.excitement * 15.0
        if state in ("sleeping", "meditating"):
            wag_amp = 3.0
            wag_speed = 1.0
        wag = math.sin(t * wag_speed) * wag_amp

        painter.setPen(QPen(QColor("#1a1a1a"), 7, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        painter.setBrush(Qt.BrushStyle.NoBrush)
        path = QPainterPath()
        path.moveTo(160, 160)
        path.cubicTo(180 + wag * 0.3, 145, 190 + wag, 120, 175 + wag * 0.7, 95)
        painter.drawPath(path)

    def _draw_cat_ears(self, painter: QPainter, t: float, p: AnimParams):
        twitch = math.sin(t * (5 + p.attention * 8)) * (1.5 + p.attention * 2.5)

        painter.setBrush(QBrush(QColor("#EF476F")))
        painter.setPen(QPen(QColor("#1a1a1a"), 5))

        # Left ear
        lp = QPainterPath()
        lp.moveTo(45, 72)
        lp.lineTo(30 + twitch, 28)
        lp.lineTo(72, 52)
        lp.closeSubpath()
        painter.drawPath(lp)

        # Right ear
        rp = QPainterPath()
        rp.moveTo(155, 72)
        rp.lineTo(170 - twitch, 28)
        rp.lineTo(128, 52)
        rp.closeSubpath()
        painter.drawPath(rp)

        # Inner ear
        painter.setBrush(QBrush(QColor(239, 71, 111, 120)))
        painter.setPen(Qt.PenStyle.NoPen)
        lip = QPainterPath()
        lip.moveTo(50, 68)
        lip.lineTo(38 + twitch, 40)
        lip.lineTo(65, 56)
        lip.closeSubpath()
        painter.drawPath(lip)
        rip = QPainterPath()
        rip.moveTo(150, 68)
        rip.lineTo(162 - twitch, 40)
        rip.lineTo(135, 56)
        rip.closeSubpath()
        painter.drawPath(rip)

    def _draw_cat_face(self, painter: QPainter, state: str, t: float, p: AnimParams):
        if state in ("happy", "celebrating", "synced", "saved", "connected", "excited", "receiving", "search_found"):
            self._cat_face_happy(painter, t, p)
        elif state in ("thinking", "searching", "navigating", "search_empty", "question", "loading", "updating"):
            self._cat_face_thinking(painter, t, p)
        elif state in ("working", "typing", "saving", "file_reading", "file_writing", "command_running", "syncing"):
            self._cat_face_working(painter, t, p)
        elif state in ("surprised", "focus_enter"):
            self._cat_face_surprised(painter, t)
        elif state in ("sad", "error", "sync_error", "disconnected", "goodbye"):
            self._cat_face_sad(painter, t)
        elif state in ("sleeping", "meditating"):
            self._cat_face_sleeping(painter, t)
        else:
            self._cat_face_idle(painter, t, p)

    def _cat_face_idle(self, painter: QPainter, t: float, p: AnimParams):
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor("#1a1a1a")))

        blink_scale = 0.15 if self._blink_closed else 1.0
        eye_r = 6
        painter.drawEllipse(int(70 - eye_r), int(110 - eye_r * blink_scale), eye_r * 2, int(eye_r * 2 * blink_scale))
        painter.drawEllipse(int(130 - eye_r), int(110 - eye_r * blink_scale), eye_r * 2, int(eye_r * 2 * blink_scale))

        # Subtle eye gaze shift
        gaze_x = math.sin(t * 0.4) * 2 * p.attention
        if not self._blink_closed:
            painter.setBrush(QBrush(QColor("#ffffff")))
            painter.drawEllipse(int(72 + gaze_x), 108, 3, 3)
            painter.drawEllipse(int(132 + gaze_x), 108, 3, 3)

        # Mouth
        painter.setPen(QPen(QColor("#1a1a1a"), 3))
        painter.setBrush(Qt.BrushStyle.NoBrush)
        mp = QPainterPath()
        mp.moveTo(90, 130)
        mp.quadTo(100, 135, 110, 130)
        painter.drawPath(mp)

    def _cat_face_happy(self, painter: QPainter, t: float, p: AnimParams):
        painter.setPen(QPen(QColor("#1a1a1a"), 4, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        painter.setBrush(Qt.BrushStyle.NoBrush)

        # Happy curved eyes
        lp = QPainterPath(); lp.moveTo(58, 112); lp.quadTo(70, 100, 82, 112)
        painter.drawPath(lp)
        rp = QPainterPath(); rp.moveTo(118, 112); rp.quadTo(130, 100, 142, 112)
        painter.drawPath(rp)

        # Big smile
        painter.setPen(QPen(QColor("#1a1a1a"), 4))
        sp = QPainterPath()
        smile = math.sin(t * 4) * 3
        sp.moveTo(82, 125)
        sp.quadTo(100, 145 + smile, 118, 125)
        painter.drawPath(sp)

        # Blush
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor(255, 180, 190, 130)))
        painter.drawEllipse(48, 118, 16, 10)
        painter.drawEllipse(136, 118, 16, 10)

    def _cat_face_thinking(self, painter: QPainter, t: float, p: AnimParams):
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor("#FFD166")))
        pulse = 0.85 + math.sin(t * 3) * 0.15
        r = int(8 * pulse)
        painter.drawEllipse(70 - r, 110 - r, r * 2, r * 2)
        painter.drawEllipse(130 - r, 110 - r, r * 2, r * 2)

        # Mouth - small O
        painter.setBrush(QBrush(QColor("#1a1a1a")))
        painter.drawEllipse(97, 130, 6, 6)

        # Thought bubbles
        for i, (dx, dy, br) in enumerate([(155, 78, 6), (165, 65, 9), (172, 48, 12)]):
            alpha = int((0.5 + math.sin(t * 2.5 + i * 0.8) * 0.5) * 200)
            painter.setBrush(QBrush(QColor(255, 255, 255, alpha)))
            painter.setPen(QPen(QColor("#1a1a1a"), 1.5))
            painter.drawEllipse(int(dx + math.sin(t * 1.2 + i) * 3), int(dy), br, br)

    def _cat_face_working(self, painter: QPainter, t: float, p: AnimParams):
        # Cyber glasses
        painter.setBrush(QBrush(QColor("#1a1a1a")))
        painter.setPen(QPen(QColor("#1a1a1a"), 2))
        painter.drawRoundedRect(48, 100, 104, 22, 5, 5)

        # Scan line
        scan_y = int((t * 30) % 22)
        painter.setPen(QPen(QColor("#0df259"), 2))
        painter.drawLine(50, 100 + scan_y, 150, 100 + scan_y)

        # Eyes behind glasses
        gaze = math.sin(t * 2.5) * 4
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor("#0df259")))
        painter.drawEllipse(int(72 + gaze), 108, 5, 5)
        painter.drawEllipse(int(128 + gaze), 108, 5, 5)

        # Mouth
        painter.setPen(QPen(QColor("#1a1a1a"), 3))
        painter.setBrush(Qt.BrushStyle.NoBrush)
        mp = QPainterPath(); mp.moveTo(88, 132); mp.lineTo(112, 132)
        painter.drawPath(mp)

    def _cat_face_surprised(self, painter: QPainter, t: float):
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor("#1a1a1a")))
        scale = 1.0 + abs(math.sin(t * 8)) * 0.15
        r = int(10 * scale)
        painter.drawEllipse(70 - r, 108 - r, r * 2, r * 2)
        painter.drawEllipse(130 - r, 108 - r, r * 2, r * 2)

        # Highlights
        painter.setBrush(QBrush(QColor("#ffffff")))
        painter.drawEllipse(67, 105, 5, 5)
        painter.drawEllipse(127, 105, 5, 5)

        # O-mouth
        painter.setBrush(QBrush(QColor("#1a1a1a")))
        painter.drawEllipse(92, 125, 16, 18)

    def _cat_face_sad(self, painter: QPainter, t: float):
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor("#1a1a1a")))
        painter.drawEllipse(65, 112, 10, 10)
        painter.drawEllipse(125, 112, 10, 10)

        # Sad eyebrows
        painter.setPen(QPen(QColor("#EF476F"), 2.5, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        painter.drawLine(58, 100, 78, 106)
        painter.drawLine(142, 100, 122, 106)

        # Frown
        painter.setPen(QPen(QColor("#1a1a1a"), 3, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        painter.setBrush(Qt.BrushStyle.NoBrush)
        fp = QPainterPath()
        fp.moveTo(85, 138)
        fp.quadTo(100, 126, 115, 138)
        painter.drawPath(fp)

        # Tear drop
        tear_y = (t * 15) % 30
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor(100, 180, 255, int(180 - tear_y * 6))))
        painter.drawEllipse(72, int(122 + tear_y), 4, 5)

    def _cat_face_sleeping(self, painter: QPainter, t: float):
        # Closed eyes (curved lines)
        painter.setPen(QPen(QColor("#1a1a1a"), 3, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        painter.setBrush(Qt.BrushStyle.NoBrush)
        lp = QPainterPath(); lp.moveTo(60, 112); lp.quadTo(70, 118, 80, 112)
        painter.drawPath(lp)
        rp = QPainterPath(); rp.moveTo(120, 112); rp.quadTo(130, 118, 140, 112)
        painter.drawPath(rp)

        # Peaceful mouth
        mp = QPainterPath(); mp.moveTo(92, 130); mp.quadTo(100, 134, 108, 130)
        painter.drawPath(mp)

        # Z's
        for i in range(3):
            alpha = int((0.5 + math.sin(t * 1.5 + i * 1.2) * 0.5) * 200)
            painter.setPen(QPen(QColor(100, 100, 200, alpha), 2))
            size = 8 + i * 3
            y_off = -10 - i * 18 + math.sin(t * 1.2 + i) * 4
            x_off = 155 + i * 8 + math.sin(t * 0.8 + i * 0.5) * 5
            painter.drawText(int(x_off), int(80 + y_off), f"{'z' if i == 0 else 'Z'}")

    # --- Bot Skin (simplified, keeping existing structure) ---

    def _render_bot(self, painter: QPainter, rect):
        state = self._state
        t = self._time
        p = self._params

        shadow_rx = 50 if state != "happy" else 60
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor(0, 0, 0, 40)))
        painter.drawEllipse(100 - shadow_rx, 190, shadow_rx * 2, 12)

        body_color = QColor("#ffffff")
        if state in ("thinking", "searching"):
            body_color = QColor("#FFFBEB")
        painter.setBrush(QBrush(body_color))
        painter.setPen(QPen(QColor("#1a1a1a"), 5))
        painter.drawRoundedRect(40, 50, 120, 130, 45, 45)

        # Screen
        screen_color = QColor("#f5f8f6") if state not in ("thinking",) else QColor("#1a1a1a")
        painter.setBrush(QBrush(screen_color))
        painter.setPen(QPen(QColor("#1a1a1a"), 3))
        painter.drawRoundedRect(55, 70, 90, 70, 20, 20)

        # Antenna
        ant_y = 15 if state in ("thinking", "searching") else 25
        ant_r = 12 if state in ("thinking",) else 10
        ant_color = QColor("#0df259")
        if state in ("thinking",):
            ant_color = QColor("#EF476F")
        elif state in ("happy", "celebrating"):
            ant_color = QColor("#0df259")
        elif state in ("sad", "error"):
            ant_color = QColor("#EF476F")

        painter.setPen(QPen(QColor("#1a1a1a"), 5))
        painter.drawLine(100, 50, 100, ant_y)
        painter.setBrush(QBrush(ant_color))
        painter.setPen(QPen(QColor("#1a1a1a"), 3))
        painter.drawEllipse(100 - ant_r, ant_y - ant_r, ant_r * 2, ant_r * 2)

        # Legs
        leg_off = math.sin(t * 6) * 4 if state == "walking" else 0
        painter.setPen(QPen(QColor("#1a1a1a"), 7, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        painter.drawLine(70, int(175 + leg_off), 70, 200)
        painter.drawLine(130, int(175 - leg_off), 130, 200)
        painter.drawLine(60, 200, 80, 200)
        painter.drawLine(120, 200, 140, 200)

        # Face
        blink = 0.15 if self._blink_closed else 1.0
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor("#1a1a1a")))
        er = 7
        painter.drawEllipse(int(80 - er), int(100 - er * blink), er * 2, int(er * 2 * blink))
        painter.drawEllipse(int(120 - er), int(100 - er * blink), er * 2, int(er * 2 * blink))

        painter.setPen(QPen(QColor("#1a1a1a"), 3))
        painter.setBrush(Qt.BrushStyle.NoBrush)
        mp = QPainterPath(); mp.moveTo(90, 120); mp.quadTo(100, 125, 110, 120)
        painter.drawPath(mp)

    # --- Orb Skin (simplified) ---

    def _render_orb(self, painter: QPainter, rect):
        t = self._time
        state = self._state

        painter.setPen(Qt.PenStyle.NoPen)
        pulse = 0.8 + math.sin(t * 3) * 0.2
        painter.setBrush(QBrush(QColor(17, 138, 178, 60)))
        painter.drawEllipse(int(100 - 40 * pulse), int(175 - 10 * pulse), int(80 * pulse), int(20 * pulse))

        body_color = QColor("#ffffff") if state not in ("working",) else QColor("#1a1a1a")
        painter.setBrush(QBrush(body_color))
        painter.setPen(QPen(QColor("#1a1a1a"), 3))
        painter.drawEllipse(50, 50, 100, 100)

        glow = 15 + math.sin(t * 2) * 3
        core_color = QColor("#118AB2") if state == "idle" else QColor("#FFD166") if state == "thinking" else QColor("#0df259")
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(core_color))
        painter.drawEllipse(int(100 - glow), int(100 - glow), int(glow * 2), int(glow * 2))

    def update_animation(self, delta_time: float):
        pass
