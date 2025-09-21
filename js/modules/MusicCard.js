/**
 * 音乐卡片管理器
 * 负责卡片的显示、颜色处理、内容更新等功能
 */

import { ColorUtils } from './ColorUtils.js';
import { FALLBACK_PALETTE, DEFAULT_COVER } from '../utils/constants.js';
import { toRGB, buildAbsoluteUrl } from '../utils/helpers.js';

export class MusicCard {
  constructor(cardElement) {
    this.card = cardElement;
    this.colorThief = window.ColorThief ? new window.ColorThief() : null;
    this.init();
  }

  init() {
    this.updateCardWidth();
    this.applyGradientFromImage(DEFAULT_COVER);
    // 初始化时显示默认封面
    this.updateCornerCover(DEFAULT_COVER);
  }

  // 自适应卡片尺寸
  updateCardWidth() {
    // 临时移除固定尺寸，让卡片自然布局
    this.card.style.setProperty('--card-width', 'auto');

    // 强制重新计算布局
    this.card.offsetHeight;

    const { width, height } = this.card.getBoundingClientRect();
    const finalWidth = Math.max(270, Math.ceil(width));

    // 设置最终宽度
    this.card.style.setProperty('--card-width', `${finalWidth}px`);

    // 确保最小高度
    if (height < 270) {
      this.card.style.minHeight = '270px';
    } else {
      this.card.style.minHeight = 'auto';
    }
  }

  // 从调色板设置多层渐变（智能方向版）
  setGradientFromPalette(palette) {
    const rawColors = (palette && palette.length ? palette : FALLBACK_PALETTE);

    // 应用轻度颜色优化（保持原图特征）
    const harmonizedColors = ColorUtils.harmonizeColors(rawColors);

    // 智能分析最佳渐变方向
    const gradientInfo = ColorUtils.analyzeGradientDirection(harmonizedColors);

    // 保持原始颜色顺序
    const finalColors = harmonizedColors;

    // 转换为CSS格式
    const cssColors = finalColors.map(toRGB);

    // 生成智能渐变
    let linearGradient, radialGradient;

    if (gradientInfo.type === 'radial') {
      // 彩虹色彩使用径向渐变
      linearGradient = `radial-gradient(${gradientInfo.position}, ${cssColors.join(',')})`;
      radialGradient = `radial-gradient(ellipse at 70% 80%, ${cssColors[0]}60, transparent 70%)`;
    } else {
      // 线性渐变使用智能角度
      linearGradient = `linear-gradient(${gradientInfo.angle}deg, ${cssColors.join(',')})`;
      radialGradient = `radial-gradient(ellipse at 30% 20%, ${cssColors[0]}80, transparent 70%)`;
    }

    // 设置多层渐变变量
    this.card.style.setProperty('--g-linear', linearGradient);
    this.card.style.setProperty('--g-radial', radialGradient);
  }

  // 从图片提取颜色并应用渐变
  applyGradientFromImage(src, fallback = DEFAULT_COVER) {
    const url = buildAbsoluteUrl(src) || buildAbsoluteUrl(fallback);

    if (!url || !this.colorThief) {
      this.setGradientFromPalette(FALLBACK_PALETTE);
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = url;

    image.onload = () => {
      try {
        // 使用增强的颜色提取算法
        const palette = ColorUtils.extractEnhancedColors(image, 4);
        this.setGradientFromPalette(palette);
      } catch (error) {
        // 回退到原始ColorThief方法
        try {
          const backupPalette = this.colorThief.getPalette(image, 4) || FALLBACK_PALETTE;
          this.setGradientFromPalette(backupPalette);
        } catch (backupError) {
          this.setGradientFromPalette(FALLBACK_PALETTE);
        }
      }
    };

    image.onerror = () => {
      if (fallback && fallback !== src) {
        this.applyGradientFromImage(fallback, null);
      } else {
        this.setGradientFromPalette(FALLBACK_PALETTE);
      }
    };
  }

  // 更新卡片内容
  updateContent(data) {
    const { lyrics, song, artist, album, coverUrl } = data;

    // 更新歌词
    if (lyrics !== undefined) {
      const lyricsElement = this.card.querySelector('.lyrics');
      if (lyricsElement) {
        this.renderLyrics(lyricsElement, lyrics);
      }
    }

    // 更新歌曲信息
    if (song !== undefined) {
      const songElement = this.card.querySelector('.song');
      if (songElement) songElement.textContent = song;
    }

    if (artist !== undefined) {
      const artistElement = this.card.querySelector('.artist');
      if (artistElement) artistElement.textContent = artist;
    }

    if (album !== undefined) {
      const albumElement = this.card.querySelector('.album');
      if (albumElement) albumElement.textContent = album;
    }

    // 更新右下角封面显示
    if (coverUrl !== undefined) {
      this.updateCornerCover(coverUrl);
      this.applyGradientFromImage(coverUrl);
    }

    // 重新计算尺寸
    this.updateCardWidth();
  }

  // 更新右下角封面显示
  updateCornerCover(coverUrl) {
    console.log('updateCornerCover called with:', coverUrl);

    const cornerCover = this.card.querySelector('#cornerAlbumCover');
    const albumElement = this.card.querySelector('.album');

    if (!cornerCover || !albumElement) return;

    const placeholder = cornerCover.querySelector('.cover-placeholder');
    const image = cornerCover.querySelector('.cover-image');

    if (coverUrl) {
      console.log('Showing cover with URL:', coverUrl);
      // 有封面：显示封面，隐藏专辑名
      image.src = coverUrl;
      image.style.display = 'block';
      placeholder.style.display = 'none';
      cornerCover.style.display = 'block';
      albumElement.style.display = 'none';
    } else {
      console.log('Hiding cover, showing album name');
      // 无封面：隐藏封面，显示专辑名
      image.style.display = 'none';
      placeholder.style.display = 'flex';
      cornerCover.style.display = 'none';
      albumElement.style.display = 'block';
    }
  }

  // 渲染歌词（保持换行）
  renderLyrics(element, lyrics) {
    const lines = lyrics.split(/\r?\n/);
    element.innerHTML = '';

    lines.forEach((line, index, arr) => {
      element.append(document.createTextNode(line));
      if (index < arr.length - 1) {
        element.append(document.createElement('br'));
      }
    });

    // 歌词渲染后重新计算卡片尺寸
    setTimeout(() => {
      this.updateCardWidth();
    }, 50);
  }
}