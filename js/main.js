/**
 * 主应用初始化
 * 负责应用启动、模式检测、组件实例化
 */

import { MusicCard } from './modules/MusicCard.js';
import { InputController } from './modules/InputController.js';
import { ShareUtils } from './modules/ShareUtils.js';
import { DEFAULT_COVER } from './utils/constants.js';

// ========== 初始化应用 ==========
document.addEventListener('DOMContentLoaded', () => {
  const cardElement = document.getElementById('card');
  if (!cardElement) {
    return;
  }

  // 检查是否为分享模式
  const shareData = ShareUtils.decodeShareData();
  const isShareMode = ShareUtils.isShareMode();

  if (isShareMode && shareData) {
    // 分享模式：隐藏输入面板，只显示卡片
    initShareMode(cardElement, shareData);
  } else {
    // 正常模式：完整应用
    initNormalMode(cardElement);
  }
});

// 正常模式初始化
function initNormalMode(cardElement) {
  // 创建卡片实例
  const musicCard = new MusicCard(cardElement);

  // 创建输入控制器
  const inputController = new InputController(musicCard);

  // 暴露到全局，方便外部调用和调试
  window.MusicCard = musicCard;
  window.InputController = inputController;

  // 动态加载html2canvas（用于导出功能）
  loadExportLibrary();
}

// 分享模式初始化
function initShareMode(cardElement, shareData) {
  // 隐藏输入面板，调整布局为单栏
  setupShareModeLayout();

  // 创建仅用于展示的卡片实例
  const musicCard = new MusicCard(cardElement);

  // 应用分享的数据
  musicCard.updateContent({
    lyrics: shareData.lyrics,
    song: shareData.song,
    artist: shareData.artist,
    album: shareData.album,
    coverUrl: shareData.cover
  });

  // 应用保存的渐变配置
  applySharedGradientColors(cardElement, shareData.gradientColors);

  // 在卡片下方添加"创建我的卡片"按钮
  addCreateMyCardButton();

  // 暴露到全局
  window.MusicCard = musicCard;
}

// 设置分享模式布局
function setupShareModeLayout() {
  const appContainer = document.querySelector('.app-container');
  const inputPanel = document.querySelector('.input-panel');
  const previewPanel = document.querySelector('.preview-panel');

  if (appContainer && inputPanel && previewPanel) {
    // 隐藏输入面板
    inputPanel.style.display = 'none';

    // 调整预览面板为全宽居中显示
    appContainer.style.gridTemplateColumns = '1fr';
    previewPanel.style.display = 'flex';
    previewPanel.style.alignItems = 'center';
    previewPanel.style.justifyContent = 'center';
    previewPanel.style.minHeight = '100vh';
  }
}

// 应用分享的渐变配置
function applySharedGradientColors(cardElement, gradientColors) {
  if (gradientColors) {
    if (gradientColors.linear) {
      cardElement.style.setProperty('--g-linear', gradientColors.linear);
    }
    if (gradientColors.radial) {
      cardElement.style.setProperty('--g-radial', gradientColors.radial);
    }
  }
}

// 添加"创建我的卡片"按钮
function addCreateMyCardButton() {
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
  `;

  const createButton = document.createElement('button');
  createButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M12 1v6m0 6v6"></path>
      <path d="M1 12h6m6 0h6"></path>
    </svg>
    Create My Card
  `;

  createButton.style.cssText = `
    padding: 16px 24px;
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
    backdrop-filter: blur(10px);
  `;

  // 添加悬停效果
  createButton.addEventListener('mouseenter', () => {
    createButton.style.transform = 'translateY(-2px)';
    createButton.style.boxShadow = '0 8px 24px rgba(0, 122, 255, 0.4)';
  });

  createButton.addEventListener('mouseleave', () => {
    createButton.style.transform = 'translateY(0)';
    createButton.style.boxShadow = '0 4px 16px rgba(0, 122, 255, 0.3)';
  });

  // 点击跳转到主页
  createButton.addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('share');
    window.location.href = url.toString();
  });

  buttonContainer.appendChild(createButton);
  document.body.appendChild(buttonContainer);
}

// 加载导出功能库
function loadExportLibrary() {
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js';
  script.async = true;
  document.head.appendChild(script);
}