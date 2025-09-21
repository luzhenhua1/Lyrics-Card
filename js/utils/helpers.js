/**
 * 通用工具函数
 */

// RGB颜色转换为CSS字符串
export const toRGB = (values) => `rgb(${values.join(',')})`;

// 构建绝对URL
export const buildAbsoluteUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;

  const basePath = (() => {
    const path = window.location.pathname;
    if (path.endsWith('/')) return path;
    return path.replace(/[^/]*$/, '');
  })();

  const normalized = String(value).replace(/^\/+/, '');
  return new URL(normalized, window.location.origin + basePath).toString();
};

// 图片压缩函数
export const compressImage = (file, options = {}) => {
  const config = {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.7,
    format: 'jpeg',
    ...options
  };

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 计算压缩尺寸
      const scale = Math.min(
        config.maxWidth / img.width,
        config.maxHeight / img.height,
        1 // 不放大图片
      );

      canvas.width = Math.floor(img.width * scale);
      canvas.height = Math.floor(img.height * scale);

      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 转换为Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('图片压缩失败'));
          }
        },
        `image/${config.format}`,
        config.quality
      );
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    // 支持File对象、Blob对象和Data URL
    if (file instanceof File || file instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else if (typeof file === 'string') {
      img.src = file;
    } else {
      reject(new Error('不支持的文件类型'));
    }
  });
};