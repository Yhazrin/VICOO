import readline from 'readline';
import { fileURLToPath } from 'url';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function chat(msg) {
  try {
    const r = await fetch('http://localhost:8000/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const d = await r.json();
    console.log('\n🤖:', d.response || d.error);
  } catch (e) {
    console.log('\n❌ 错误:', e.message);
  }
  prompt();
}

function prompt() {
  rl.question('\n👤 ', (msg) => {
    if (msg.trim().toLowerCase() === 'exit') {
      console.log('\n再见！👋');
      process.exit(0);
    }
    chat(msg);
  });
}

console.log('=== Vicoo 智能助手 ===');
console.log('输入 exit 退出\n');
prompt();
