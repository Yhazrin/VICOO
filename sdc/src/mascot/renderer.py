"""
SDC - Sentient Desktop Companion
Mascot Renderer Module - Web-style Dynamic Rendering

完全参考 web 端的实现方式，根据状态动态渲染不同的 SVG 元素
"""

from PyQt6.QtCore import QObject, pyqtSignal, QTimer
from PyQt6.QtGui import QPainter, QPainterPath, QColor, QPen, QBrush, QFont, QTransform
from PyQt6.QtSvg import QSvgRenderer
import math
import time


class MascotRenderer(QObject):
    """
    动态渲染桌宠 - 参考 web 端实现
    根据状态渲染不同的 SVG 元素和动画
    """

    # 状态到动画类的映射
    STATE_ANIMATIONS = {
        # 开心组
        "happy": "squash",
        "celebrating": "squash",
        "search_found": "squash",
        "synced": "squash",
        "saved": "squash",
        "connected": "squash",
        "excited": "squash",

        # 思考组
        "thinking": "shiver",
        "search_empty": "shiver",
        "navigating": "shiver",
        "question": "shiver",

        # 工作组
        "working": "translate",
        "typing": "translate",
        "saving": "translate",
        "file_reading": "translate",
        "file_writing": "translate",
        "command_running": "translate",
        "syncing": "translate",
        "dragging": "translate",
        "loading": "translate",
        "updating": "translate",

        # 惊讶组
        "surprised": "wiggle",
        "focus_enter": "wiggle",

        # 悲伤组
        "sad": "shiver_top",
        "error": "shiver_top",
        "sync_error": "shiver_top",
        "disconnected": "shiver_top",
        "goodbye": "shiver_top",

        # 弹跳组
        "dropped": "bounce",

        # 脉冲组
        "searching": "pulse",
        "connecting": "pulse",
        "focus_exit": "pulse",
        "listening": "pulse",

        # 默认待机
        "idle": "float",
        "sleeping": "float",
        "meditating": "float",
        "breathing": "float",
        "break_time": "float",
        "greeting": "float",
        "receiving": "float",
        "collaborating": "float",
        "sharing": "float",
    }

    def __init__(self, parent=None):
        super().__init__(parent)
        self._state = "idle"
        self._skin = "cat"  # 支持 bot, cat, orb
        self._time = 0
        self._last_update = time.time()

        # 动画定时器
        self._timer = QTimer()
        self._timer.timeout.connect(self._on_timer)
        self._timer.start(16)  # ~60 FPS

    def _on_timer(self):
        """定时更新动画时间"""
        current_time = time.time()
        delta = current_time - self._last_update
        self._last_update = current_time
        self._time += delta

    def get_state(self) -> str:
        return self._state

    def set_state(self, state: str):
        """设置状态"""
        if state != self._state:
            self._state = state
            self.stateChanged.emit(state)

    state = property(get_state, set_state)
    stateChanged = pyqtSignal(str)

    def set_skin(self, skin: str):
        """设置皮肤"""
        self._skin = skin

    def get_skin(self) -> str:
        return self._skin

    def render(self, painter: QPainter, rect):
        """根据状态动态渲染桌宠"""
        # 保存画笔状态
        painter.save()

        # 计算动画偏移
        offset_y = self._calculate_animation_offset()

        # 应用变换
        transform = QTransform()
        transform.translate(0, offset_y)
        painter.setTransform(transform)

        # 根据皮肤渲染
        if self._skin == "cat":
            self._render_cat(painter, rect)
        elif self._skin == "bot":
            self._render_bot(painter, rect)
        elif self._skin == "orb":
            self._render_orb(painter, rect)
        else:
            self._render_cat(painter, rect)

        # 恢复画笔状态
        painter.restore()

    def _calculate_animation_offset(self) -> float:
        """根据状态计算动画偏移"""
        anim = self.STATE_ANIMATIONS.get(self._state, "float")

        if anim == "float":
            return math.sin(self._time * 2) * 3
        elif anim == "squash":
            return abs(math.sin(self._time * 8)) * 5
        elif anim == "shiver":
            return math.sin(self._time * 30) * 2
        elif anim == "shiver_top":
            return math.sin(self._time * 15) * 1.5
        elif anim == "bounce":
            return abs(math.sin(self._time * 10)) * 8
        elif anim == "pulse":
            return math.sin(self._time * 4) * 2
        elif anim == "wiggle":
            return math.sin(self._time * 8) * 3
        elif anim == "translate":
            return math.sin(self._time * 3) * 1
        else:
            return math.sin(self._time * 2) * 3

    def _render_cat(self, painter: QPainter, rect):
        """渲染 Cyber Cat - 参考 web 端 cat 皮肤"""
        state = self._state

        # 阴影
        shadow_y = 190 + math.sin(self._time * 2) * 2
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor(0, 0, 0, 51)))
        painter.drawEllipse(100 - 60, int(shadow_y) - 10, 120, 20)

        # 身体
        body_color = QColor("#ffffff")
        if state in ["thinking", "searching", "navigating"]:
            body_color = QColor("#118AB2")

        painter.setBrush(QBrush(body_color))
        painter.setPen(QPen(QColor("#1a1a1a"), 6))
        self._draw_cat_body(painter)

        # 尾巴
        self._draw_cat_tail(painter)

        # 耳朵
        self._draw_cat_ears(painter)

        # 脸部表情 - 根据状态渲染不同表情
        self._draw_cat_face(painter)

    def _draw_cat_body(self, painter: QPainter):
        """绘制猫的身体"""
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

    def _draw_cat_tail(self, painter: QPainter):
        """绘制尾巴 - 根据状态动画"""
        state = self._state

        # 尾巴摇摆动画
        tail_wag = 0
        if state in ["happy", "celebrating", "excited", "listening", "greeting", "receiving"]:
            tail_wag = math.sin(self._time * 5) * 20
        elif state in ["question", "thinking"]:
            tail_wag = math.sin(self._time * 3) * 10

        painter.setPen(QPen(QColor("#1a1a1a"), 8))
        painter.setBrush(Qt.BrushStyle.NoBrush)

        # 绘制尾巴曲线
        path = QPainterPath()
        path.moveTo(160, 160)
        path.quadTo(190 + tail_wag, 140, 180 + tail_wag, 110)
        painter.drawPath(path)

    def _draw_cat_ears(self, painter: QPainter):
        """绘制耳朵"""
        painter.setBrush(QBrush(QColor("#EF476F")))
        painter.setPen(QPen(QColor("#1a1a1a"), 6))

        # 左耳
        path = QPainterPath()
        path.moveTo(40, 70)
        path.lineTo(30, 30)
        path.lineTo(70, 50)
        path.closeSubpath()
        painter.drawPath(path)

        # 右耳
        path = QPainterPath()
        path.moveTo(160, 70)
        path.lineTo(170, 30)
        path.lineTo(130, 50)
        path.closeSubpath()
        painter.drawPath(path)

    def _draw_cat_face(self, painter: QPainter):
        """绘制猫的脸 - 根据状态渲染不同表情"""
        state = self._state

        painter.setPen(QPen(QColor("#1a1a1a"), 3))
        painter.setBrush(Qt.BrushStyle.NoBrush)

        # 绘制胡须
        painter.drawLine(20, 120, 40, 125)
        painter.drawLine(20, 130, 40, 130)
        painter.drawLine(180, 120, 160, 125)
        painter.drawLine(180, 130, 160, 130)

        # 根据状态绘制眼睛和嘴巴
        if state in ["idle", "dragging", "dropped", "walking", "listening"]:
            self._draw_face_idle(painter)
        elif state in ["happy", "celebrating", "synced", "saved", "connected", "excited", "receiving"]:
            self._draw_face_happy(painter)
        elif state in ["thinking", "searching", "navigating", "search_empty", "question", "loading", "updating"]:
            self._draw_face_thinking(painter)
        elif state in ["working", "typing", "saving", "file_reading", "file_writing", "command_running", "syncing"]:
            self._draw_face_working(painter)
        elif state in ["surprised", "focus_enter"]:
            self._draw_face_surprised(painter)
        elif state in ["sad", "error", "sync_error", "disconnected", "goodbye"]:
            self._draw_face_sad(painter)
        elif state in ["searching", "connecting", "focus_exit"]:
            self._draw_face_searching(painter)
        else:
            self._draw_face_idle(painter)

    def _draw_face_idle(self, painter: QPainter):
        """绘制空闲表情 - 眨眼"""
        # 眨眼动画
        blink = 1.0
        if int(self._time / 4) % 2 == 0:
            blink = 0.1

        painter.setBrush(QBrush(QColor("#1a1a1a")))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(
            int(70 - 6 * blink),
            int(110 - 3 * blink),
            int(12 * blink),
            int(12 * blink),
        )
        painter.drawEllipse(
            int(130 - 6 * blink),
            int(110 - 3 * blink),
            int(12 * blink),
            int(12 * blink),
        )

        # 嘴巴
        painter.setPen(QPen(QColor("#1a1a1a"), 3))
        path = QPainterPath()
        path.moveTo(90, 130)
        path.quadTo(100, 135, 110, 130)
        painter.drawPath(path)

    def _draw_face_happy(self, painter: QPainter):
        """绘制开心表情"""
        # 眼睛 - 弯弯的
        painter.setPen(QPen(QColor("#1a1a1a"), 4))
        path = QPainterPath()
        path.moveTo(60, 110)
        path.quadTo(70, 100, 80, 110)
        painter.drawPath(path)
        path = QPainterPath()
        path.moveTo(120, 110)
        path.quadTo(130, 100, 140, 110)
        painter.drawPath(path)

        # 嘴巴 - 大微笑
        painter.setPen(QPen(QColor("#1a1a1a"), 4))
        path = QPainterPath()
        path.moveTo(85, 125)
        path.quadTo(100, 145, 115, 125)
        painter.drawPath(path)

        # 腮红
        painter.setBrush(QBrush(QColor(255, 182, 193, 150)))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(50, 120, 15, 10)
        painter.drawEllipse(135, 120, 15, 10)

    def _draw_face_thinking(self, painter: QPainter):
        """绘制思考表情"""
        # 眼睛 - 黄色思考圈
        painter.setBrush(QBrush(QColor("#FFD166")))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(70 - 8, 110 - 8, 16, 16)
        painter.drawEllipse(130 - 8, 110 - 8, 16, 16)

        # 嘴巴 - 小圆形
        painter.setBrush(QBrush(QColor("#1a1a1a")))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(100 - 4, 130, 8, 8)

        # 思考气泡动画
        bubble_offset = math.sin(self._time * 3) * 3
        painter.setBrush(QBrush(QColor("#ffffff")))
        painter.setPen(QPen(QColor("#1a1a1a"), 2))
        painter.drawEllipse(160 + bubble_offset, 70, 15, 15)
        painter.drawEllipse(170 + bubble_offset, 60, 10, 10)

    def _draw_face_working(self, painter: QPainter):
        """绘制工作表情 - 戴眼镜"""
        # 眼镜
        painter.setBrush(QBrush(QColor("#1a1a1a")))
        painter.setPen(QPen(QColor("#1a1a1a"), 3))
        painter.drawRect(50, 100, 100, 25)

        # 眼镜上的扫描线
        scan_y = (self._time * 20) % 25
        painter.setPen(QPen(QColor("#0df259"), 2))
        painter.drawLine(50, 100 + scan_y, 150, 100 + scan_y)

        # 眼睛在眼镜后移动
        eye_x = 70 + math.sin(self._time * 3) * 5
        painter.setBrush(QBrush(QColor("#1a1a1a")))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(eye_x - 4, 108, 8, 8)
        painter.drawEllipse(130 + eye_x - 70 - 4, 108, 8, 8)

    def _draw_face_surprised(self, painter: QPainter):
        """绘制惊讶表情"""
        # 大眼睛
        painter.setBrush(QBrush(QColor("#1a1a1a")))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(70 - 10, 110 - 10, 20, 20)
        painter.drawEllipse(130 - 10, 110 - 10, 20, 20)

        # 高光
        painter.setBrush(QBrush(QColor("#ffffff")))
        painter.drawEllipse(68, 108, 4, 4)
        painter.drawEllipse(128, 108, 4, 4)

        # 嘴巴 - O 形
        painter.setBrush(QBrush(QColor("#1a1a1a")))
        painter.drawEllipse(100 - 8, 125, 16, 20)

    def _draw_face_sad(self, painter: QPainter):
        """绘制悲伤表情"""
        # 眼睛
        painter.setBrush(QBrush(QColor("#1a1a1a")))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(70 - 5, 112, 10, 10)
        painter.drawEllipse(130 - 5, 112, 10, 10)

        # 眉毛 - 向下
        painter.setPen(QPen(QColor("#EF476F"), 2))
        painter.drawLine(60, 100, 80, 105)
        painter.drawLine(140, 100, 120, 105)

        # 嘴巴 - 皱眉
        painter.setPen(QPen(QColor("#1a1a1a"), 3))
        path = QPainterPath()
        path.moveTo(85, 140)
        path.quadTo(100, 125, 115, 140)
        painter.drawPath(path)

    def _draw_face_searching(self, painter: QPainter):
        """绘制搜索中表情 - 脉冲动画"""
        pulse = 0.8 + math.sin(self._time * 4) * 0.2

        # 眼睛
        painter.setBrush(QBrush(QColor("#1a1a1a")))
        painter.setPen(Qt.PenStyle.NoPen)
        eye_r = 6 * pulse
        painter.drawEllipse(
            int(70 - eye_r / 2),
            int(110 - eye_r / 2),
            int(eye_r),
            int(eye_r),
        )
        painter.drawEllipse(
            int(130 - eye_r / 2),
            int(110 - eye_r / 2),
            int(eye_r),
            int(eye_r),
        )

        # 嘴巴
        painter.setPen(QPen(QColor("#1a1a1a"), 3))
        path = QPainterPath()
        path.moveTo(90, 130)
        path.quadTo(100, 132, 110, 130)
        painter.drawPath(path)

    def _render_bot(self, painter: QPainter, rect):
        """渲染 Bot 皮肤"""
        state = self._state

        # 阴影
        shadow_rx = 50 if state != "happy" else 60
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor(0, 0, 0, 51)))
        painter.drawEllipse(100 - shadow_rx, 195 - 5, shadow_rx * 2, 10)

        # 身体
        body_color = QColor("#ffffff")
        if state in ["thinking", "searching", "navigating"]:
            body_color = QColor("#FFFBEB")

        painter.setBrush(QBrush(body_color))
        painter.setPen(QPen(QColor("#1a1a1a"), 6))
        painter.drawRoundedRect(40, 50, 120, 130, 45, 45)

        # 屏幕
        screen_color = QColor("#f5f8f6") if state not in ["thinking", "searching", "navigating"] else QColor("#1a1a1a")
        painter.setBrush(QBrush(screen_color))
        painter.setPen(QPen(QColor("#1a1a1a"), 4))
        painter.drawRoundedRect(55, 70, 90, 70, 20, 20)

        # 天线
        antenna_color = self._get_antenna_color(state)
        antenna_y = self._get_antenna_y(state)
        antenna_r = self._get_antenna_r(state)

        painter.setPen(QPen(QColor("#1a1a1a"), 6))
        painter.drawLine(100, 50, 100, antenna_y)

        painter.setBrush(QBrush(antenna_color))
        painter.setPen(QPen(QColor("#1a1a1a"), 4))
        painter.drawEllipse(100 - antenna_r, antenna_y - antenna_r, antenna_r * 2, antenna_r * 2)

        # 腿部
        leg_offset = 0
        if state == "walking":
            leg_offset = math.sin(self._time * 8) * 5

        painter.setPen(QPen(QColor("#1a1a1a"), 8))
        painter.drawLine(70, 170 + leg_offset, 70, 200)
        painter.drawLine(130, 170 - leg_offset, 130, 200)

        # 脸部表情
        self._draw_bot_face(painter, state)

    def _get_antenna_color(self, state: str) -> QColor:
        """获取天线颜色"""
        if state in ["thinking", "searching", "navigating", "search_empty"]:
            return QColor("#EF476F")
        elif state in ["happy", "celebrating", "synced", "saved", "connected", "excited"]:
            return QColor("#0df259")
        elif state in ["sad", "error", "sync_error", "disconnected"]:
            return QColor("#EF476F")
        elif state in ["surprised", "focus_enter"]:
            return QColor("#FFD166")
        elif state in ["working", "typing", "saving", "syncing", "dragging", "loading"]:
            return QColor("#118AB2")
        else:
            return QColor("#0df259")

    def _get_antenna_y(self, state: str) -> int:
        """获取天线高度"""
        if state in ["thinking", "searching", "navigating", "search_empty", "question"]:
            return 15
        elif state in ["surprised", "focus_enter"]:
            return 10
        else:
            return 25

    def _get_antenna_r(self, state: str) -> int:
        """获取天线圆球半径"""
        if state in ["thinking", "searching", "navigating", "search_empty"]:
            return 12
        elif state in ["surprised", "focus_enter"]:
            return 14
        else:
            return 10

    def _draw_bot_face(self, painter: QPainter, state: str):
        """绘制 Bot 脸部"""
        if state in ["idle", "dragging", "dropped", "walking"]:
            painter.setBrush(QBrush(QColor("#1a1a1a")))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(80 - 5, 100 - 5, 10, 10)
            painter.drawEllipse(120 - 5, 100 - 5, 10, 10)
            painter.setPen(QPen(QColor("#1a1a1a"), 3))
            path = QPainterPath()
            path.moveTo(90, 120)
            path.quadTo(100, 125, 110, 120)
            painter.drawPath(path)
        elif state in ["happy", "celebrating", "synced", "saved", "connected", "excited"]:
            painter.setPen(QPen(QColor("#1a1a1a"), 4))
            path = QPainterPath()
            path.moveTo(75, 105)
            path.lineTo(85, 95)
            path.lineTo(95, 105)
            painter.drawPath(path)
            path = QPainterPath()
            path.moveTo(105, 105)
            path.lineTo(115, 95)
            path.lineTo(125, 105)
            painter.drawPath(path)
            path = QPainterPath()
            path.moveTo(85, 120)
            path.quadTo(100, 135, 115, 120)
            painter.drawPath(path)
        elif state in ["thinking", "searching", "navigating", "question"]:
            painter.setPen(QPen(QColor("#0df259"), 4))
            painter.drawLine(75, 100, 95, 100)
            painter.drawLine(115, 100, 135, 100)
            painter.setPen(QPen(QColor("#0df259"), 3))
            path = QPainterPath()
            path.moveTo(95, 120)
            path.quadTo(105, 125, 115, 120)
            painter.drawPath(path)
        else:
            # 默认
            painter.setBrush(QBrush(QColor("#1a1a1a")))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(80, 100, 8, 8)
            painter.drawEllipse(120, 100, 8, 8)

    def _render_orb(self, painter: QPainter, rect):
        """渲染 Orb 皮肤"""
        state = self._state

        # 阴影/能量场
        shadow_pulse = 0.8 + math.sin(self._time * 3) * 0.2
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor(17, 138, 178, 77)))
        painter.drawEllipse(100 - 40*shadow_pulse, 175 - 10*shadow_pulse, 80*shadow_pulse, 20*shadow_pulse)

        # 外环旋转
        rotation = self._time * 45  # 45度/秒

        # 主体球
        body_color = QColor("#ffffff") if state not in ["working", "typing", "saving"] else QColor("#1a1a1a")
        painter.setBrush(QBrush(body_color))
        painter.setPen(QPen(QColor("#1a1a1a"), 4))
        painter.drawEllipse(100 - 50, 100 - 50, 100, 100)

        # 眼睛/核心
        if state == "idle":
            self._draw_orb_eye_idle(painter)
        elif state in ["thinking", "question"]:
            self._draw_orb_eye_thinking(painter)
        elif state in ["happy", "celebrating", "excited"]:
            self._draw_orb_eye_happy(painter)
        elif state in ["working", "typing", "saving", "syncing"]:
            self._draw_orb_eye_working(painter)
        else:
            self._draw_orb_eye_idle(painter)

    def _draw_orb_eye_idle(self, painter: QPainter):
        """绘制 Orb 待机眼睛"""
        glow = 15 + math.sin(self._time * 2) * 3
        painter.setBrush(QBrush(QColor("#118AB2")))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(100 - glow, 100 - glow, glow * 2, glow * 2)

    def _draw_orb_eye_thinking(self, painter: QPainter):
        """绘制 Orb 思考眼睛"""
        rotation = self._time * 180
        painter.save()
        painter.translate(100, 100)
        painter.rotate(rotation)

        painter.setBrush(QBrush(QColor("#FFD166")))
        painter.setPen(QPen(QColor("#1a1a1a"), 3))
        painter.drawRect(-15, -15, 30, 30)
        painter.setBrush(QBrush(QColor("#1a1a1a")))
        painter.drawEllipse(-5, -5, 10, 10)

        painter.restore()

    def _draw_orb_eye_happy(self, painter: QPainter):
        """绘制 Orb 开心眼睛"""
        # 嘴巴
        painter.setPen(QPen(QColor("#EF476F"), 5))
        path = QPainterPath()
        path.moveTo(85, 110)
        path.quadTo(100, 120, 115, 110)
        painter.drawPath(path)

        # 腮红
        painter.setBrush(QBrush(QColor("#EF476F")))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(80, 95, 10, 10)
        painter.drawEllipse(110, 95, 10, 10)

    def _draw_orb_eye_working(self, painter: QPainter):
        """绘制 Orb 工作眼睛"""
        # 发光
        painter.setBrush(QBrush(QColor(13, 242, 89, 128)))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(100 - 15, 100 - 15, 30, 30)

        painter.setBrush(QBrush(QColor("#0df259")))
        painter.drawEllipse(100 - 10, 100 - 10, 20, 20)

        # 光芒线条
        painter.setPen(QPen(QColor("#0df259"), 2))
        for i in range(4):
            angle = i * 90 + self._time * 100
            rad = angle * math.pi / 180
            x1 = 100 + 25 * math.cos(rad)
            y1 = 100 + 25 * math.sin(rad)
            x2 = 100 + 40 * math.cos(rad)
            y2 = 100 + 40 * math.sin(rad)
            painter.drawLine(int(x1), int(y1), int(x2), int(y2))

    def update_animation(self, delta_time: float):
        """
        兼容旧版接口的动画更新函数。
        当前实现的动画时间推进完全由内部 QTimer 驱动，
        这里保持空实现以兼容 `MascotWindow._on_animation_tick` 的调用。
        """
        # 旧版本通过 delta_time 驱动动画，这里已经由 _on_timer 更新 self._time，
        # 因此不需要重复累加，保持空实现即可。
        return


# 导入需要的 Qt 枚举
from PyQt6.QtCore import Qt
