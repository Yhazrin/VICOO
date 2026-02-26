// FocusModeScreen — Vicoo Mobile Pomodoro Timer
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { colors, shadows } from '../styles/theme';

export default function FocusModeScreen() {
  const [duration] = useState(25 * 60); // 25 min
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      Vibration.vibrate(1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, timeLeft]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = 1 - timeLeft / duration;

  return (
    <View style={s.container}>
      <Text style={s.title}>专注模式</Text>
      <View style={s.timerCard}>
        <Text style={s.timer}>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</Text>
        <View style={s.progressBg}><View style={[s.progressFill, { width: `${progress * 100}%` }]} /></View>
        <TouchableOpacity style={s.btn} onPress={() => { setIsActive(!isActive); if (timeLeft === 0) setTimeLeft(duration); }}>
          <Text style={s.btnText}>{timeLeft === 0 ? '重新开始' : isActive ? '暂停' : '开始专注'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.tip}>🍅 番茄工作法 · 25 分钟专注 + 5 分钟休息</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101010', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 32 },
  timerCard: { backgroundColor: '#1a1a1a', borderWidth: 3, borderColor: '#333', borderRadius: 24, padding: 40, alignItems: 'center', width: '100%', ...shadows.neo },
  timer: { fontSize: 64, fontWeight: '900', color: colors.primary, fontVariant: ['tabular-nums'], marginBottom: 20 },
  progressBg: { width: '100%', height: 8, backgroundColor: '#333', borderRadius: 4, overflow: 'hidden', marginBottom: 24 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  btn: { backgroundColor: colors.primary, borderWidth: 3, borderColor: '#fff', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40, ...shadows.neo },
  btnText: { fontSize: 16, fontWeight: '900', color: colors.ink },
  tip: { color: '#666', fontSize: 13, marginTop: 24, fontWeight: '600' },
});
