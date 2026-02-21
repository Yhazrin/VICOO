// Vicoo Desktop Entry
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@web/App';

// 等待 DOM 加载完成
const waitForDOM = () => {
  return new Promise<void>((resolve) => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', () => resolve());
    }
  });
};

// 注入 Tailwind 和样式
const injectStyles = async () => {
  // 等待 DOM 准备好
  await waitForDOM();

  // 1. 首先注入 Tailwind CSS CDN
  const tailwindScript = document.createElement('script');
  tailwindScript.src = 'https://cdn.tailwindcss.com';
  document.head.appendChild(tailwindScript);

  // 2. 等待 Tailwind 脚本加载完成
  await new Promise<void>((resolve) => {
    tailwindScript.onload = () => resolve();
    // 超时保护
    setTimeout(resolve, 3000);
  });

  // 3. 注入 Tailwind 配置 - 完全匹配 Web 端
  const tailwindConfig = document.createElement('script');
  tailwindConfig.textContent = `
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Plus Jakarta Sans', 'sans-serif'],
            display: ['Space Grotesk', 'sans-serif'],
          },
          colors: {
            primary: '#FFD166',
            secondary: '#0df259',
            accent: '#EF476F',
            info: '#118AB2',
            dark: '#101010',
            light: '#f8f9fa',
            ink: '#1a1a1a',
          },
          boxShadow: {
            'neo': '4px 4px 0px 0px #1a1a1a',
            'neo-sm': '2px 2px 0px 0px #1a1a1a',
            'neo-lg': '6px 6px 0px 0px #1a1a1a',
            'neo-hover': '8px 8px 0px 0px #1a1a1a',
          },
          borderWidth: {
            '3': '3px',
          },
          animation: {
            'float': 'float 6s ease-in-out infinite',
            'float-delayed': 'float 6s ease-in-out 3s infinite',
            'bounce-slow': 'bounce 3s infinite',
            'blink': 'blink 4s infinite',
            'wiggle': 'wiggle 2s ease-in-out infinite',
            'pop': 'pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            'spin-slow': 'spin 10s linear infinite',
            'orbit': 'orbit 8s linear infinite',
          },
          keyframes: {
            float: {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-10px)' },
            },
            blink: {
              '0%, 96%, 100%': { transform: 'scaleY(1)' },
              '98%': { transform: 'scaleY(0.1)' },
            },
            wiggle: {
              '0%, 100%': { transform: 'rotate(-3deg)' },
              '50%': { transform: 'rotate(3deg)' },
            },
            pop: {
              '0%': { transform: 'scale(0)', opacity: '0' },
              '100%': { transform: 'scale(1)', opacity: '1' },
            },
            orbit: {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            }
          }
        },
      },
    }
  `;
  document.head.appendChild(tailwindConfig);

  // 4. 注入字体
  const fontLink1 = document.createElement('link');
  fontLink1.rel = 'stylesheet';
  fontLink1.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap';
  document.head.appendChild(fontLink1);

  const fontLink2 = document.createElement('link');
  fontLink2.rel = 'stylesheet';
  fontLink2.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Round';
  document.head.appendChild(fontLink2);

  // 5. 注入自定义样式
  const customStyles = document.createElement('style');
  customStyles.textContent = `
    * {
      box-sizing: border-box;
    }

    html, body, #root {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #f8f9fa;
      color: #1a1a1a;
      font-family: 'Plus Jakarta Sans', sans-serif;
      overflow: hidden;
    }

    /* Dark mode */
    .dark {
      color-scheme: dark;
    }
    
    .dark body {
      background-color: #101010;
      color: #ffffff;
    }

    /* Neo-brutalism 组件 */
    .btn-neo {
      background-color: #FFD166;
      border: 3px solid #1a1a1a;
      box-shadow: 4px 4px 0px 0px #1a1a1a;
      border-radius: 12px;
      padding: 12px 24px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.1s ease;
    }
    
    .btn-neo:hover {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0px 0px #1a1a1a;
    }
    
    .btn-neo:active {
      transform: translate(2px, 2px);
      box-shadow: 0px 0px 0px 0px #1a1a1a;
    }

    /* Card neo style */
    .card-neo {
      background-color: #ffffff;
      border: 3px solid #1a1a1a;
      border-radius: 16px;
      box-shadow: 4px 4px 0px 0px #1a1a1a;
    }

    .dark .card-neo {
      background-color: #1a1a1a;
      border-color: #ffffff;
      box-shadow: 4px 4px 0px 0px rgba(255, 255, 255, 0.2);
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 5px;
      border: 2px solid #f8f9fa;
    }
    .dark ::-webkit-scrollbar-thumb {
      background: #475569;
      border-color: #101010;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    /* Dot pattern */
    .bg-dot-pattern {
      background-image: radial-gradient(#1a1a1a 1px, transparent 1px);
      background-size: 24px 24px;
      opacity: 0.1;
    }
    .dark .bg-dot-pattern {
      opacity: 0.05;
    }
  `;
  document.head.appendChild(customStyles);

  // 6. 强制 Tailwind 重新扫描
  if (typeof window !== 'undefined' && (window as any).tailwind) {
    (window as any).tailwind.reScan?.();
  }
};

// 显示加载画面
const showLoader = () => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #FFD166; font-family: 'Space Grotesk', sans-serif;">
        <div style="font-size: 64px; font-weight: 900; color: #1a1a1a; margin-bottom: 24px; animation: float 3s ease-in-out infinite;">vicoo</div>
        <div style="width: 200px; height: 8px; background-color: #e5e7eb; border-radius: 4px; overflow: hidden; border: 2px solid #1a1a1a;">
          <div style="height: 100%; background-color: #FFD166; animation: wiggle 1s ease-in-out infinite; width: 50%;"></div>
        </div>
        <style>
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          @keyframes wiggle { 0%, 100% { transform: scaleX(0.3); } 50% { transform: scaleX(0.7); } }
        </style>
      </div>
    `;
  }
};

// 初始化
const init = async () => {
  showLoader();
  await injectStyles();
  
  // 渲染 React 应用
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

init();
