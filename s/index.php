<?php
/**
 * 短链接访问页面
 * 处理 /s/abc123 格式的短链接
 */

// 获取ID参数
$id = '';
$requestUri = $_SERVER['REQUEST_URI'];

// 解析ID: /s/abc123 或 /s/?id=abc123
if (preg_match('/\/s\/([a-z0-9]+)/', $requestUri, $matches)) {
    $id = $matches[1];
} elseif (isset($_GET['id'])) {
    $id = $_GET['id'];
}

// 验证ID格式
if (!$id || !preg_match('/^[a-z0-9]{6}$/', $id)) {
    showError('无效的分享链接');
    exit;
}

// 加载数据
$dataDir = __DIR__ . '/../api/data';
$jsonPath = "$dataDir/$id.json";

if (!file_exists($jsonPath)) {
    showError('分享链接不存在或已过期');
    exit;
}

$shareData = json_decode(file_get_contents($jsonPath), true);
if (!$shareData) {
    showError('数据解析失败');
    exit;
}

// 检查图片文件
$imagePath = null;
$imageUrl = null;
if ($shareData['hasImage']) {
    $ext = $shareData['imageExtension'] ?? 'jpg';
    $imagePath = "$dataDir/$id.$ext";
    if (file_exists($imagePath)) {
        $imageUrl = "../api/data/$id.$ext";
    }
}
?>
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($shareData['song'] . ' - ' . $shareData['artist']); ?> | Lyrics Card</title>
    <link rel="stylesheet" href="../style.css">
    <style>
        /* 分享页面专用样式 */
        .share-page {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xl);
            background: var(--color-bg);
        }

        .share-header {
            text-align: center;
            margin-bottom: var(--spacing-xl);
            color: var(--color-text-secondary);
        }

        .share-header h1 {
            font-size: 24px;
            font-weight: 700;
            color: var(--color-text-primary);
            margin-bottom: var(--spacing-sm);
        }

        .share-footer {
            margin-top: var(--spacing-xl);
            text-align: center;
        }

        .create-btn {
            padding: var(--spacing-md) var(--spacing-xl);
            background: var(--color-accent);
            color: white;
            border: none;
            border-radius: var(--radius-lg);
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: var(--spacing-sm);
            transition: all var(--transition-standard);
            box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
        }

        .create-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 122, 255, 0.4);
        }
    </style>
</head>
<body>
    <div class="share-page">
        <div class="share-header">
            <h1>Lyrics Card</h1>
            <p>由朋友分享的歌词卡片</p>
        </div>

        <!-- 卡片预览 -->
        <div class="card" id="sharedCard" style="<?php echo generateCardStyle($shareData); ?>">
            <div class="lyrics">
                <?php echo nl2br(htmlspecialchars($shareData['lyrics'])); ?>
            </div>

            <div class="infobar">
                <div class="left">
                    <div class="titleArtist">
                        <div class="song"><?php echo htmlspecialchars($shareData['song']); ?></div>
                        <div class="artist"><?php echo htmlspecialchars($shareData['artist']); ?></div>
                    </div>

                    <div class="brand">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16.365 13.17c-.026-2.785 2.28-4.12 2.387-4.19-1.305-1.91-3.337-2.174-4.056-2.203-1.725-.176-3.37 1.014-4.244 1.014-.89 0-2.23-.993-3.676-.964-1.89.028-3.64 1.097-4.609 2.786-1.979 3.427-.506 8.49 1.423 11.27.944 1.36 2.06 2.89 3.53 2.84 1.43-.058 1.97-.914 3.7-.914 1.72 0 2.23.914 3.72.886 1.54-.03 2.52-1.38 3.46-2.74 1.09-1.6 1.53-3.16 1.55-3.24-.034-.016-2.98-1.144-3.185-4.24z" />
                            <path d="M13.77 5.27c.77-.93 1.29-2.23 1.15-3.53-1.11.05-2.45.74-3.24 1.66-.71.83-1.34 2.16-1.17 3.43 1.24.1 2.5-.63 3.26-1.56z" />
                        </svg>
                        <span>Music</span>
                    </div>
                </div>

                <div class="album" <?php echo $imageUrl ? 'style="display: none;"' : ''; ?>>
                    <?php echo htmlspecialchars($shareData['album']); ?>
                </div>
            </div>

            <!-- 封面图片 -->
            <?php if ($imageUrl): ?>
            <div class="corner-album-cover">
                <img src="<?php echo $imageUrl; ?>" alt="Album Cover" class="cover-image" style="display: block;">
            </div>
            <?php endif; ?>
        </div>

        <div class="share-footer">
            <a href="../" class="create-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6"></path>
                    <path d="M1 12h6m6 0h6"></path>
                </svg>
                创建我的卡片
            </a>
        </div>
    </div>
</body>
</html>

<?php
/**
 * 生成卡片样式
 */
function generateCardStyle($shareData) {
    $styles = [];

    // 应用保存的渐变配置
    if (!empty($shareData['gradientColors'])) {
        $colors = $shareData['gradientColors'];
        if (!empty($colors['linear'])) {
            $styles[] = "--g-linear: {$colors['linear']}";
        }
        if (!empty($colors['radial'])) {
            $styles[] = "--g-radial: {$colors['radial']}";
        }
    }

    return implode('; ', $styles);
}

/**
 * 显示错误页面
 */
function showError($message) {
    ?>
    <!DOCTYPE html>
    <html lang="zh">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>分享链接错误</title>
        <link rel="stylesheet" href="../style.css">
        <style>
            .error-page {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: var(--spacing-xl);
                background: var(--color-bg);
                color: var(--color-text-primary);
            }
            .error-icon {
                font-size: 48px;
                margin-bottom: var(--spacing-lg);
                opacity: 0.6;
            }
            .error-message {
                font-size: 18px;
                margin-bottom: var(--spacing-xl);
                color: var(--color-text-secondary);
            }
            .back-btn {
                padding: var(--spacing-md) var(--spacing-xl);
                background: var(--color-accent);
                color: white;
                border: none;
                border-radius: var(--radius-lg);
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="error-page">
            <div class="error-icon">😞</div>
            <div class="error-message"><?php echo htmlspecialchars($message); ?></div>
            <a href="../" class="back-btn">返回首页</a>
        </div>
    </body>
    </html>
    <?php
}
?>