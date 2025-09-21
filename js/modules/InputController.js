/**
 * 输入控制器
 * 负责处理用户输入、文件上传、导出和分享功能
 */

import { debounce } from '../utils/debounce.js';
import { BackendShareUtils } from './BackendShareUtils.js';
import { DEFAULT_COVER } from '../utils/constants.js';

export class InputController {
  constructor(musicCard) {
    this.musicCard = musicCard;
    this.elements = this.getElements();
    this.currentCoverUrl = DEFAULT_COVER; // 初始化为默认封面
    this.init();
  }

  // 获取DOM元素
  getElements() {
    return {
      lyricsInput: document.getElementById('lyricsInput'),
      songInput: document.getElementById('songInput'),
      artistInput: document.getElementById('artistInput'),
      albumInput: document.getElementById('albumInput'),
      coverInput: document.getElementById('coverInput'),
      coverUploadArea: document.getElementById('coverUploadArea'),
      exportBtn: document.getElementById('exportBtn'),
      shareBtn: document.getElementById('shareBtn'),
    };
  }

  // 初始化事件监听器
  init() {
    this.bindInputEvents();
    this.bindCoverUpload();
    this.bindExportEvent();
    this.bindShareEvent();

    // 立即执行一次预览更新，确保默认封面显示
    this.updatePreview();
  }

  // 绑定输入事件
  bindInputEvents() {
    // 实时预览更新 - 使用Apple风格的防抖
    const updatePreview = debounce(() => {
      this.updatePreview();
    }, 200);

    // 歌词输入
    this.elements.lyricsInput?.addEventListener('input', updatePreview);

    // 歌曲信息输入
    this.elements.songInput?.addEventListener('input', updatePreview);
    this.elements.artistInput?.addEventListener('input', updatePreview);
    this.elements.albumInput?.addEventListener('input', updatePreview);

    // 添加Apple风格的焦点动效
    this.addFocusEffects();
  }

  // 添加焦点动效
  addFocusEffects() {
    const inputs = [
      this.elements.lyricsInput,
      this.elements.songInput,
      this.elements.artistInput,
      this.elements.albumInput,
    ].filter(Boolean);

    inputs.forEach(input => {
      input.addEventListener('focus', (e) => {
        e.target.style.transform = 'scale(1.02)';
      });

      input.addEventListener('blur', (e) => {
        e.target.style.transform = 'scale(1)';
      });
    });
  }

  // 更新预览
  updatePreview() {
    console.log('updatePreview called, currentCoverUrl:', this.currentCoverUrl);

    const data = {
      lyrics: this.elements.lyricsInput?.value || '',
      song: this.elements.songInput?.value || '',
      artist: this.elements.artistInput?.value || '',
      album: this.elements.albumInput?.value || '',
      coverUrl: this.currentCoverUrl,
    };

    console.log('updatePreview data:', data);
    this.musicCard.updateContent(data);
  }

  // 绑定封面上传
  bindCoverUpload() {
    if (!this.elements.coverInput || !this.elements.coverUploadArea) return;

    // 点击上传
    this.elements.coverUploadArea.addEventListener('click', () => {
      this.elements.coverInput.click();
    });

    // 文件选择
    this.elements.coverInput.addEventListener('change', (e) => {
      this.handleFileUpload(e.target.files[0]);
    });

    // 拖拽上传
    this.bindDragAndDrop();
  }

  // 拖拽上传
  bindDragAndDrop() {
    const area = this.elements.coverUploadArea;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      area.addEventListener(eventName, this.preventDefaults);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      area.addEventListener(eventName, () => area.classList.add('dragover'));
    });

    ['dragleave', 'drop'].forEach(eventName => {
      area.addEventListener(eventName, () => area.classList.remove('dragover'));
    });

    area.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      this.handleFileUpload(files[0]);
    });
  }

  // 阻止默认事件
  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // 处理文件上传
  handleFileUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      this.showNotification('请选择有效的图片文件', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.showNotification('图片大小不能超过 10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentCoverUrl = e.target.result;
      this.updateCoverPreview(this.currentCoverUrl);
      this.musicCard.updateCornerCover(this.currentCoverUrl);
      this.musicCard.applyGradientFromImage(this.currentCoverUrl);
      this.showNotification('封面上传成功', 'success');
    };
    reader.readAsDataURL(file);
  }

  // 更新封面预览
  updateCoverPreview(url) {
    const content = this.elements.coverUploadArea.querySelector('.cover-upload-content');
    if (content) {
      content.innerHTML = `
        <div style="
          width: 60px;
          height: 60px;
          border-radius: 8px;
          background-image: url(${url});
          background-size: cover;
          background-position: center;
          border: 2px solid var(--color-accent);
          position: relative;
        ">
          <button class="remove-cover-btn" style="
            position: absolute;
            top: -8px;
            right: -8px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--color-accent);
            color: white;
            border: none;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          " title="清除封面">×</button>
        </div>
        <span class="upload-text">封面已上传</span>
        <span class="upload-hint">点击更换或删除</span>
      `;

      // 绑定删除按钮事件
      const removeBtn = content.querySelector('.remove-cover-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.clearCover();
        });
      }
    }
  }

  // 清除封面（保持当前渐变）
  clearCover() {
    this.currentCoverUrl = null;
    this.elements.coverInput.value = '';

    // 重置上传区域
    const content = this.elements.coverUploadArea.querySelector('.cover-upload-content');
    if (content) {
      content.innerHTML = `
        <svg class="upload-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7,10 12,15 17,10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span class="upload-text">Click to upload or drag and drop</span>
        <span class="upload-hint">PNG, JPG up to 10MB</span>
      `;
    }

    // 只更新显示状态，不改变渐变色
    this.musicCard.updateCornerCover(null);

    this.showNotification('封面已清除，渐变色已保留', 'success');
  }

  // 绑定导出事件
  bindExportEvent() {
    this.elements.exportBtn?.addEventListener('click', () => {
      this.exportCard();
    });
  }

  // 绑定分享事件
  bindShareEvent() {
    this.elements.shareBtn?.addEventListener('click', () => {
      this.shareCard();
    });
  }

  // 分享卡片 - 使用后端短链接
  async shareCard() {
    try {
      this.elements.shareBtn.textContent = '生成中...';
      this.elements.shareBtn.disabled = true;

      // 收集当前卡片数据
      const shareData = {
        lyrics: this.elements.lyricsInput?.value || '',
        song: this.elements.songInput?.value || '',
        artist: this.elements.artistInput?.value || '',
        album: this.elements.albumInput?.value || '',
        coverUrl: this.currentCoverUrl,
      };

      console.log('分享数据:', shareData);

      // 生成短链接
      const shareUrl = await BackendShareUtils.generateShareLink(shareData);

      // 复制到剪贴板
      const copySuccess = await BackendShareUtils.copyToClipboard(shareUrl);

      if (copySuccess) {
        // 显示成功通知，包含分享链接
        const notification = this.showNotification(
          `短链接已生成并复制到剪贴板！`,
          'success',
          8000
        );

        // 在通知中添加短链接显示
        const linkDisplay = document.createElement('div');
        linkDisplay.style.cssText = `
          margin-top: 8px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 13px;
          word-break: break-all;
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-weight: 600;
        `;
        linkDisplay.textContent = shareUrl;

        const content = notification.querySelector('.notification-content');
        content.appendChild(linkDisplay);

        // 添加打开链接按钮
        const openBtn = document.createElement('button');
        openBtn.textContent = '在新窗口中打开';
        openBtn.style.cssText = `
          margin-top: 8px;
          padding: 6px 12px;
          background: var(--color-accent);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          width: 100%;
          font-weight: 600;
          transition: background 0.15s ease;
        `;
        openBtn.addEventListener('mouseenter', () => {
          openBtn.style.background = '#0056b3';
        });
        openBtn.addEventListener('mouseleave', () => {
          openBtn.style.background = 'var(--color-accent)';
        });
        openBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.open(shareUrl, '_blank');
        });
        content.appendChild(openBtn);
      } else {
        this.showNotification('短链接生成成功，但复制到剪贴板失败，请手动复制：' + shareUrl, 'info', 10000);
      }

    } catch (error) {
      this.showNotification('分享失败：' + (error.message || '未知错误'), 'error');
      console.error('分享错误:', error);
    } finally {
      // 恢复按钮状态
      setTimeout(() => {
        this.elements.shareBtn.textContent = 'Share Link';
        this.elements.shareBtn.disabled = false;
      }, 1000);
    }
  }

  // 导出卡片
  async exportCard() {
    if (!window.html2canvas) {
      this.showNotification('导出功能加载中，请稍后再试', 'error');
      return;
    }

    try {
      this.elements.exportBtn.textContent = '导出中...';
      this.elements.exportBtn.disabled = true;

      const canvas = await html2canvas(this.musicCard.card, {
        backgroundColor: null,
        scale: 2, // 高清导出
        logging: false,
        useCORS: true,
      });

      // 创建下载链接
      const link = document.createElement('a');
      link.download = `lyrics-card-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      this.showNotification('导出成功', 'success');
    } catch (error) {
      this.showNotification('导出失败，请重试', 'error');
    } finally {
      this.elements.exportBtn.textContent = 'Export as Image';
      this.elements.exportBtn.disabled = false;
    }
  }

  // 显示通知
  showNotification(message, type = 'info', duration = 4000) {
    // 创建通知容器（如果不存在）
    let container = document.querySelector('.notification-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'notification-container';
      document.body.appendChild(container);
    }

    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // 根据类型设置图标
    const iconMap = {
      success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22,4 12,14.01 9,11.01"></polyline>
      </svg>`,
      error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`,
      info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>`
    };

    notification.innerHTML = `
      <div class="notification-icon">${iconMap[type] || iconMap.info}</div>
      <div class="notification-content">
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close">×</button>
    `;

    // 添加到容器
    container.appendChild(notification);

    // 绑定关闭事件
    const closeBtn = notification.querySelector('.notification-close');
    const closeNotification = () => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 200);
    };

    closeBtn.addEventListener('click', closeNotification);
    notification.addEventListener('click', closeNotification);

    // 显示动画
    setTimeout(() => {
      notification.classList.add('show');
    }, 50);

    // 自动关闭
    if (duration > 0) {
      setTimeout(closeNotification, duration);
    }

    return notification;
  }
}