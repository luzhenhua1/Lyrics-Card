/**
 * 分享功能工具
 * 包含链接生成、数据编码解码等功能
 */

import { APP_VERSION, IMAGE_COMPRESSION_LIMIT } from '../utils/constants.js';

export class ShareUtils {
  // 编码分享数据到URL参数
  static encodeShareData(data) {
    try {
      const shareData = {
        lyrics: data.lyrics || '',
        song: data.song || '',
        artist: data.artist || '',
        album: data.album || '',
        cover: data.coverUrl || null,
        // 保存当前的渐变配置
        gradientColors: this.getCurrentGradientColors(),
        timestamp: Date.now(),
        version: APP_VERSION
      };

      // 压缩图片数据（如果是base64）
      if (shareData.cover && shareData.cover.startsWith('data:image/')) {
        shareData.cover = this.compressImage(shareData.cover);
      }

      // JSON转字符串，然后base64编码
      const jsonStr = JSON.stringify(shareData);
      const base64Str = btoa(encodeURIComponent(jsonStr));

      // 生成分享URL
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('share', base64Str);

      return currentUrl.toString();
    } catch (error) {
      return null;
    }
  }

  // 解码分享数据
  static decodeShareData() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const shareParam = urlParams.get('share');

      if (!shareParam) return null;

      // base64解码，然后解析JSON
      const jsonStr = decodeURIComponent(atob(shareParam));
      const shareData = JSON.parse(jsonStr);

      // 验证数据结构
      if (!shareData.version || !shareData.timestamp) {
        throw new Error('无效的分享数据格式');
      }

      return shareData;
    } catch (error) {
      return null;
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

  // 压缩图片（简单版本）
  static compressImage(base64Str, maxSize = IMAGE_COMPRESSION_LIMIT) {
    try {
      // 如果图片小于限制，直接返回
      if (base64Str.length < maxSize) return base64Str;

      // 简单的压缩：降低质量或尺寸
      // 这里可以后续用canvas进行更精细的压缩
      return base64Str; // 暂时返回原图
    } catch (error) {
      return base64Str;
    }
  }

  // 检查是否为分享模式
  static isShareMode() {
    return new URLSearchParams(window.location.search).has('share');
  }

  // 生成分享链接并复制到剪贴板
  static async generateAndCopyShareLink(data) {
    const shareUrl = this.encodeShareData(data);
    if (!shareUrl) {
      throw new Error('生成分享链接失败');
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      return shareUrl;
    } catch (error) {
      // 降级方案：手动复制
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return shareUrl;
    }
  }
}