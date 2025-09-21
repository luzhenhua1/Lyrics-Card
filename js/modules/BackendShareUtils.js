/**
 * 后端分享工具类
 * 使用PHP后端存储，生成短链接
 */

import { compressImage } from '../utils/helpers.js';

export class BackendShareUtils {
  static apiBase = './api'; // PHP API路径

  // 生成分享链接
  static async generateShareLink(shareData) {
    try {
      // 创建FormData
      const formData = new FormData();

      // 添加文本数据
      formData.append('lyrics', shareData.lyrics || '');
      formData.append('song', shareData.song || '');
      formData.append('artist', shareData.artist || '');
      formData.append('album', shareData.album || '');

      // 获取并保存当前渐变配置
      const gradientColors = this.getCurrentGradientColors();
      if (gradientColors) {
        formData.append('gradientColors', JSON.stringify(gradientColors));
      }

      // 处理图片
      if (shareData.coverUrl) {
        if (shareData.coverUrl.startsWith('data:image/')) {
          // 处理base64图片
          const compressedBlob = await this.compressImageData(shareData.coverUrl);
          formData.append('image', compressedBlob, 'cover.jpg');
        } else {
          // 处理文件路径（如默认封面）
          try {
            const response = await fetch(shareData.coverUrl);
            if (response.ok) {
              const blob = await response.blob();
              const filename = shareData.coverUrl.split('/').pop() || 'cover.jpg';
              formData.append('image', blob, filename);
            }
          } catch (error) {
            console.warn('无法获取封面文件:', shareData.coverUrl, error);
          }
        }
      }

      // 发送到后端
      const response = await fetch(`${this.apiBase}/save.php`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '保存失败');
      }

      return result.url;

    } catch (error) {
      console.error('生成分享链接失败:', error);
      throw error;
    }
  }

  // 压缩图片数据
  static async compressImageData(dataUrl) {
    try {
      // 直接使用Data URL进行压缩
      const compressedBlob = await compressImage(dataUrl);
      return compressedBlob;
    } catch (error) {
      console.error('图片压缩失败:', error);
      throw error;
    }
  }

  // 获取当前渐变颜色配置
  static getCurrentGradientColors() {
    if (window.MusicCard && window.MusicCard.card) {
      const style = window.MusicCard.card.style;
      return {
        linear: style.getPropertyValue('--g-linear'),
        radial: style.getPropertyValue('--g-radial')
      };
    }
    return null;
  }

  // 复制链接到剪贴板
  static async copyToClipboard(url) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (error) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  }
}