# Lyrics Card Generator

一个仿 Apple Music 风格的歌词卡片生成器，灵感来源于 iMessage 中分享歌词时的精美卡片样式。

## ✨ 特性

- 🎨 **Apple Music 风格设计** - 高度还原 Apple Music 的视觉风格
- 🌈 **动态渐变背景** - 支持多种颜色渐变和动画效果
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🖼️ **专辑封面支持** - 可上传自定义专辑封面
- 💾 **多种导出格式** - 支持导出为图片
- 🔗 **在线分享** - 生成分享链接（需 PHP 环境）

## 🚀 在线体验

访问：https://card.luzhenhua.cn/

## 📦 部署

### 静态部署（推荐）
支持部署到 Vercel、Cloudflare Pages、EdgeOne Pages 等静态托管平台：

- **框架预设**：Other 或 None
- **根目录**：`./`
- **输出目录**：`.`
- **构建命令**：留空
- **安装命令**：留空

### 完整功能部署
如需分享功能，需要 PHP 环境支持。

## 🛠️ 本地运行

```bash
# 克隆仓库
git clone https://github.com/luzhenhua1/LyricsCard.git

# 进入目录
cd LyricsCard

# 使用任意 HTTP 服务器运行
# 例如 Python
python -m http.server 8000

# 或者 Node.js
npx serve .
```

## 📝 使用说明

1. 在左侧输入歌词、歌曲信息
2. 可选择上传专辑封面图片
3. 实时预览右侧的卡片效果
4. 点击"导出图片"保存卡片

## 🎯 项目灵感

使用 Apple Music 在 iMessage 中分享歌词时，发现那个卡片设计特别精美，于是萌生了做一个类似工具的想法。感谢 ikuncode 提供的 Claude Code 镜像，让开发过程更加顺畅。

## 📄 许可证

MIT License

## 🤝 贡献

这是我的第一个开源项目，欢迎提交 Issue 和 Pull Request！

---

如果这个项目对你有帮助，请给个 ⭐️ 支持一下！
