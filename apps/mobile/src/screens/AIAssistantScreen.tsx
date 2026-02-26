// AIAssistantScreen — Vicoo Mobile AI Chat
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { colors, fonts, shadows } from '../styles/theme';
import { apiClient } from '../services/api';

interface Message { role: 'user' | 'assistant'; content: string }

export default function AIAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好！我是 Vicoo 智能助手，有什么我可以帮你的吗？😊' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await apiClient.post('/api/ai/chat', { message: msg });
      let reply = res.data?.response || '抱歉，暂时无法回答。';
      reply = reply.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '网络错误，请重试。' }]);
    }
    setLoading(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={[s.bubble, item.role === 'user' ? s.userBubble : s.aiBubble]}>
            <Text style={[s.bubbleText, item.role === 'user' ? s.userText : s.aiText]}>{item.content}</Text>
          </View>
        )}
      />
      {loading && <ActivityIndicator color={colors.primary} style={{ marginBottom: 8 }} />}
      <View style={s.inputRow}>
        <TextInput style={s.input} value={input} onChangeText={setInput} placeholder="问点什么..."
          placeholderTextColor="#999" returnKeyType="send" onSubmitEditing={send} />
        <TouchableOpacity style={s.sendBtn} onPress={send}>
          <Text style={s.sendText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  list: { padding: 16, paddingBottom: 80 },
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 2, borderColor: colors.ink },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', ...shadows.neo },
  bubbleText: { fontSize: 15, lineHeight: 22, fontFamily: fonts.regular },
  userText: { color: colors.ink },
  aiText: { color: colors.ink },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 3, borderTopColor: colors.ink, backgroundColor: '#fff' },
  input: { flex: 1, height: 44, borderWidth: 2, borderColor: colors.ink, borderRadius: 12, paddingHorizontal: 14, fontSize: 15, fontFamily: fonts.regular, backgroundColor: colors.light },
  sendBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.secondary, borderWidth: 2, borderColor: colors.ink, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendText: { fontSize: 20, fontWeight: '800', color: colors.ink },
});
