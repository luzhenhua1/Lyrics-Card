<?php
/**
 * 分享数据保存API
 * 接收前端数据，生成短ID，存储文件
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 只接受POST请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // 准备数据目录
    $dataDir = __DIR__ . '/data';
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }

    // 收集文本数据
    $textData = [
        'lyrics' => $_POST['lyrics'] ?? '',
        'song' => $_POST['song'] ?? '',
        'artist' => $_POST['artist'] ?? '',
        'album' => $_POST['album'] ?? '',
        'gradientColors' => json_decode($_POST['gradientColors'] ?? '{}', true),
        'created' => date('Y-m-d H:i:s'),
        'hasImage' => false
    ];

    // 检查是否已存在相同的分享
    $existingId = findExistingShare($textData, $dataDir, isset($_FILES['image']));

    if ($existingId) {
        // 返回已存在的分享链接
        $baseUrl = getBaseUrl();
        $shareUrl = "$baseUrl/s/?id=$existingId";

        echo json_encode([
            'success' => true,
            'id' => $existingId,
            'url' => $shareUrl,
            'cached' => true,
            'message' => '使用已存在的分享链接'
        ]);
        exit;
    }

    // 生成新的短ID
    $id = generateShortId();

    // 处理图片上传
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadFile = $_FILES['image'];

        // 验证图片
        $imageInfo = getimagesize($uploadFile['tmp_name']);
        if ($imageInfo === false) {
            throw new Exception('无效的图片文件');
        }

        // 检查文件大小 (最大5MB)
        if ($uploadFile['size'] > 5 * 1024 * 1024) {
            throw new Exception('图片文件过大，请选择小于5MB的图片');
        }

        // 保存图片
        $imageExtension = getImageExtension($imageInfo['mime']);
        $imagePath = "$dataDir/$id.$imageExtension";

        if (!move_uploaded_file($uploadFile['tmp_name'], $imagePath)) {
            throw new Exception('图片保存失败');
        }

        $textData['hasImage'] = true;
        $textData['imageExtension'] = $imageExtension;
    }

    // 保存文本数据
    $jsonPath = "$dataDir/$id.json";
    $jsonData = json_encode($textData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    if (file_put_contents($jsonPath, $jsonData) === false) {
        throw new Exception('数据保存失败');
    }

    // 生成分享URL
    $baseUrl = getBaseUrl();
    $shareUrl = "$baseUrl/s/?id=$id";

    // 返回成功结果
    echo json_encode([
        'success' => true,
        'id' => $id,
        'url' => $shareUrl,
        'cached' => false,
        'data' => $textData
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * 查找已存在的相同分享
 */
function findExistingShare($textData, $dataDir, $hasImage) {
    // 只检查7天内的文件，避免性能问题
    $cutoffTime = time() - (7 * 24 * 60 * 60);

    $files = glob("$dataDir/*.json");
    foreach ($files as $file) {
        // 检查文件时间
        if (filemtime($file) < $cutoffTime) {
            continue;
        }

        $existingData = json_decode(file_get_contents($file), true);
        if (!$existingData) {
            continue;
        }

        // 比较关键字段
        if (
            $existingData['lyrics'] === $textData['lyrics'] &&
            $existingData['song'] === $textData['song'] &&
            $existingData['artist'] === $textData['artist'] &&
            $existingData['album'] === $textData['album'] &&
            $existingData['hasImage'] === $hasImage
        ) {
            // 如果有图片，还需要检查渐变色
            if ($hasImage) {
                $existingGradient = json_encode($existingData['gradientColors'] ?? []);
                $newGradient = json_encode($textData['gradientColors'] ?? []);
                if ($existingGradient !== $newGradient) {
                    continue;
                }
            }

            // 找到匹配的分享，返回ID
            return basename($file, '.json');
        }
    }

    return null;
}

/**
 * 生成短ID
 */
function generateShortId($length = 6) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyz';
    $id = '';
    for ($i = 0; $i < $length; $i++) {
        $id .= $characters[random_int(0, strlen($characters) - 1)];
    }
    return $id;
}

/**
 * 根据MIME类型获取图片扩展名
 */
function getImageExtension($mimeType) {
    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp'
    ];

    return $extensions[$mimeType] ?? 'jpg';
}

/**
 * 获取基础URL
 */
function getBaseUrl() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'];
    $path = dirname(dirname($_SERVER['REQUEST_URI'])); // 去掉 /api 部分

    // 确保路径以/结尾，但不要双斜杠
    $path = rtrim($path, '/');

    return $protocol . $host . $path;
}
?>