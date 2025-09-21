/**
 * 颜色处理工具函数
 * 包含颜色转换、提取、分析等功能
 */

import { FALLBACK_PALETTE } from '../utils/constants.js';

export class ColorUtils {
  // RGB转HSL
  static rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // 无色
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  }

  // HSL转RGB
  static hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    if (s === 0) {
      return [l * 255, l * 255, l * 255]; // 灰色
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    const r = hue2rgb(p, q, h + 1/3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1/3);

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  // 增强的颜色提取算法
  static extractEnhancedColors(image, colorCount = 4) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 设置合适的采样尺寸 - 太大影响性能，太小丢失细节
    const maxSize = 200;
    const scale = Math.min(maxSize / image.width, maxSize / image.height);
    canvas.width = Math.floor(image.width * scale);
    canvas.height = Math.floor(image.height * scale);

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // 1. 颜色频率统计 + 权重分析
    const colorMap = new Map();
    const totalPixels = pixels.length / 4;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      // 跳过透明像素
      if (a < 128) continue;

      // 跳过过于接近黑色和白色的像素（通常是背景或噪点）
      const [, s, l] = this.rgbToHsl(r, g, b);
      if (l < 5 || l > 95 || s < 10) continue;

      // 颜色量化 - 减少相似颜色的分散
      const quantR = Math.round(r / 16) * 16;
      const quantG = Math.round(g / 16) * 16;
      const quantB = Math.round(b / 16) * 16;
      const key = `${quantR}-${quantG}-${quantB}`;

      // 计算位置权重 - 中心区域的颜色更重要
      const x = (i / 4) % canvas.width;
      const y = Math.floor((i / 4) / canvas.width);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
      const positionWeight = 1 - (distance / maxDistance) * 0.3; // 中心权重多30%

      // 饱和度权重 - 高饱和度颜色更重要
      const saturationWeight = 1 + (s / 100) * 0.5; // 高饱和度额外50%权重

      const totalWeight = positionWeight * saturationWeight;

      if (colorMap.has(key)) {
        colorMap.set(key, colorMap.get(key) + totalWeight);
      } else {
        colorMap.set(key, totalWeight);
      }
    }

    // 2. 按权重排序并转换回RGB
    const sortedColors = Array.from(colorMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, colorCount * 2) // 取更多候选色
      .map(([colorKey, weight]) => {
        const [r, g, b] = colorKey.split('-').map(Number);
        return { rgb: [r, g, b], weight, hsl: this.rgbToHsl(r, g, b) };
      });

    // 3. 颜色去重和多样性优化选择
    const finalColors = [];

    // 第一步：选择主色调（权重最高的颜色）
    if (sortedColors.length > 0) {
      finalColors.push(sortedColors[0]);
    }

    // 第二步：智能选择多样性颜色
    for (const color of sortedColors.slice(1)) {
      if (finalColors.length >= colorCount) break;

      const [h1, s1, l1] = color.hsl;

      // 检查颜色多样性 - 更严格的差异要求
      const hasGoodDiversity = finalColors.every(existing => {
        const [h2, s2, l2] = existing.hsl;

        // 色相差异 - 避免相似色调
        const hueDiff = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));

        // 亮度差异 - 确保明暗对比
        const lightDiff = Math.abs(l1 - l2);

        // 饱和度差异 - 避免都是灰色或都是鲜艳色
        const satDiff = Math.abs(s1 - s2);

        // 多样性要求：色相差异>40度 OR 亮度差异>30 OR 饱和度差异>25
        return hueDiff > 40 || lightDiff > 30 || satDiff > 25;
      });

      if (hasGoodDiversity) {
        finalColors.push(color);
      }
    }

    // 第三步：如果颜色不够多样，强制添加对比色
    if (finalColors.length < 2 && sortedColors.length >= 2) {
      // 寻找与主色调差异最大的颜色
      const mainColor = finalColors[0];
      const [mainH, mainS, mainL] = mainColor.hsl;

      let mostDifferent = null;
      let maxDifference = 0;

      for (const candidate of sortedColors.slice(1)) {
        const [candidateH, candidateS, candidateL] = candidate.hsl;
        const hueDiff = Math.min(Math.abs(mainH - candidateH), 360 - Math.abs(mainH - candidateH));
        const lightDiff = Math.abs(mainL - candidateL);
        const satDiff = Math.abs(mainS - candidateS);

        // 综合差异度评分
        const totalDiff = hueDiff * 0.5 + lightDiff * 0.3 + satDiff * 0.2;

        if (totalDiff > maxDifference) {
          maxDifference = totalDiff;
          mostDifferent = candidate;
        }
      }

      if (mostDifferent && !finalColors.includes(mostDifferent)) {
        finalColors.push(mostDifferent);
      }
    }

    // 4. 如果颜色不够，用ColorThief补充并确保多样性
    if (finalColors.length < colorCount && window.ColorThief) {
      try {
        const colorThief = new window.ColorThief();
        const backupColors = colorThief.getPalette(image, colorCount * 2) || [];

        for (const backupColor of backupColors) {
          if (finalColors.length >= colorCount) break;

          const backupHsl = this.rgbToHsl(...backupColor);
          const [h1, s1, l1] = backupHsl;

          // 检查与现有颜色的多样性
          const hasGoodDiversity = finalColors.every(existing => {
            const [h2, s2, l2] = existing.hsl;
            const hueDiff = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
            const lightDiff = Math.abs(l1 - l2);
            const satDiff = Math.abs(s1 - s2);

            // 补充颜色的多样性要求可以稍微宽松一些
            return hueDiff > 35 || lightDiff > 25 || satDiff > 20;
          });

          if (hasGoodDiversity) {
            finalColors.push({
              rgb: backupColor,
              weight: 0,
              hsl: backupHsl
            });
          }
        }
      } catch (error) {
        // ColorThief补充失败，继续
      }
    }

    // 5. 最后保底：如果还是只有1种颜色，人工生成对比色
    if (finalColors.length < 2 && finalColors.length > 0) {
      const mainColor = finalColors[0];
      const [mainH, mainS, mainL] = mainColor.hsl;

      // 生成互补色或对比色
      let contrastH = (mainH + 180) % 360; // 互补色相
      let contrastS = mainS > 50 ? mainS - 30 : mainS + 30; // 调整饱和度
      let contrastL = mainL > 50 ? mainL - 40 : mainL + 40; // 调整亮度

      // 确保数值在合理范围内
      contrastS = Math.max(20, Math.min(80, contrastS));
      contrastL = Math.max(20, Math.min(80, contrastL));

      const contrastRgb = this.hslToRgb(contrastH, contrastS, contrastL);
      finalColors.push({
        rgb: contrastRgb,
        weight: 0,
        hsl: [contrastH, contrastS, contrastL]
      });
    }

    // 6. 返回RGB数组
    const result = finalColors.map(color => color.rgb);

    return result.length > 0 ? result : FALLBACK_PALETTE;
  }

  // 智能渐变方向分析（简化版 - 纯视觉导向）
  static analyzeGradientDirection(rgbColors) {
    const hslColors = rgbColors.map(([r, g, b]) => ({
      rgb: [r, g, b],
      hsl: this.rgbToHsl(r, g, b)
    }));

    // 1. 亮度分析 - 核心决策因子
    const lightnesses = hslColors.map(color => color.hsl[2]);
    const lightnessDiff = Math.max(...lightnesses) - Math.min(...lightnesses);
    const firstLight = lightnesses[0];
    const lastLight = lightnesses[lightnesses.length - 1];

    // 2. 色相跨度分析 - 决定是否使用径向渐变
    const hues = hslColors.map(color => color.hsl[0]);
    const hueSpread = this.calculateHueSpread(hues);

    // 3. 基于纯视觉规律的角度选择
    let angle = 135; // 默认：左上到右下（自然舒适）

    // 强亮度对比：遵循视觉习惯
    if (lightnessDiff > 25) {
      if (firstLight > lastLight) {
        // 颜色序列：亮→暗，使用自然下降方向
        angle = 135; // 左上到右下
      } else {
        // 颜色序列：暗→亮，使用上升方向
        angle = 45;  // 左下到右上
      }
    } else {
      // 低对比度：使用水平方向，更平和
      angle = 90; // 垂直渐变，简洁稳定
    }

    // 色相跨度大：使用径向渐变，更好展现色彩丰富性
    if (hueSpread > 100) {
      return {
        type: 'radial',
        angle: 0,
        position: 'circle at 40% 30%',
        reasoning: {
          hueSpread,
          decision: '色彩丰富，采用径向渐变'
        }
      };
    }

    return {
      type: 'linear',
      angle: angle,
      reasoning: {
        lightnessDiff,
        direction: firstLight > lastLight ? '亮到暗' : '暗到亮',
        decision: `${lightnessDiff > 25 ? '高对比' : '低对比'}，使用${angle}°线性渐变`
      }
    };
  }

  // 计算色相跨度
  static calculateHueSpread(hues) {
    if (hues.length < 2) return 0;

    // 处理色相环的特殊性 (0° = 360°)
    const sortedHues = [...hues].sort((a, b) => a - b);
    let maxSpread = 0;

    for (let i = 0; i < sortedHues.length - 1; i++) {
      const diff = sortedHues[i + 1] - sortedHues[i];
      maxSpread = Math.max(maxSpread, diff);
    }

    // 检查跨越0°的情况
    const wrapAroundSpread = (360 - sortedHues[sortedHues.length - 1]) + sortedHues[0];
    maxSpread = Math.max(maxSpread, wrapAroundSpread);

    return maxSpread;
  }

  // 分析颜色和谐度并优化（保持原图特征）
  static harmonizeColors(rgbColors) {
    // 转换为HSL
    const hslColors = rgbColors.map(([r, g, b]) => ({
      rgb: [r, g, b],
      hsl: this.rgbToHsl(r, g, b),
      original: true
    }));

    // 分析主色调（保持原图特征）
    const dominantColor = hslColors[0]; // 主色调
    const [dominantH] = dominantColor.hsl;

    // 轻度优化策略：保持原图色调，只做必要调整
    const harmonizedColors = hslColors.map((color, index) => {
      let [h, s, l] = color.hsl;

      // 1. 轻微饱和度调整：保持原色调特征
      if (s < 20) s = Math.min(s + 15, 60); // 仅提升极低饱和度
      if (s > 95) s = Math.max(s - 5, 85); // 仅降低极高饱和度

      // 2. 亮度微调：确保可读性，但保持原色调
      if (l < 15) l = Math.max(l + 10, 20); // 避免过暗
      if (l > 85) l = Math.min(l - 10, 80); // 避免过亮

      // 3. 色相保持：只在原色调范围内微调
      const hueVariation = 15; // 最多15度的色相变化
      const baseHue = dominantH;
      if (index > 0) {
        // 在主色调周围创建轻微变化
        h = baseHue + (index - hslColors.length / 2) * (hueVariation / hslColors.length);
        h = (h + 360) % 360;
      }

      return this.hslToRgb(h, s, l);
    });

    return harmonizedColors;
  }

  // 根据亮度智能排序颜色
  static sortColorsByLightness(rgbColors) {
    return rgbColors
      .map(color => ({
        rgb: color,
        lightness: this.rgbToHsl(...color)[2]
      }))
      .sort((a, b) => b.lightness - a.lightness) // 从亮到暗
      .map(item => item.rgb);
  }
}