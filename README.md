# PDF to PNG Converter

PDF逐页转换为PNG图像工具，提供命令行和Web界面两种使用方式。

## 功能

- 将PDF文件逐页转换为PNG格式
- **支持多种上传方式**：
  - 单个或多个PDF文件
  - 文件夹（自动识别其中所有PDF）
  - 压缩包（ZIP、RAR、7Z、TAR、GZ）
- 自动裁剪白色边框
- 支持自定义DPI设置
- 现代化Web界面，支持拖拽上传

## Docker 部署（推荐）

### 一键启动

```bash
chmod +x start.sh
./start.sh
```

### 手动启动

```bash
# 构建镜像
docker build -t pdf2png .

# 运行容器
docker run -d -p 2603:2603 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/outputs:/app/outputs \
  --name pdf2png-converter \
  --restart unless-stopped \
  pdf2png
```

### 常用命令

```bash
# 查看日志
docker logs -f pdf2png-converter

# 停止服务
docker stop pdf2png-converter

# 启动服务
docker start pdf2png-converter

# 删除容器
docker rm -f pdf2png-converter
```

启动后访问 **http://localhost:2603**

## 本地安装

### 依赖

```bash
pip install -r requirements.txt
```

系统需要安装poppler:
- Windows: 下载poppler并添加到PATH，或通过参数指定路径
- Linux: `sudo apt-get install poppler-utils`
- macOS: `brew install poppler`

> **注意**: RAR支持需要系统安装unrar工具

## Web界面使用（推荐）

```bash
python app.py
```

启动后访问 http://localhost:2603

Web界面功能：
- 拖拽上传PDF文件/文件夹/压缩包
- 点击选择文件或整个文件夹
- 实时预览转换结果
- 单个下载或批量下载ZIP
- 自定义DPI和裁剪选项

### 支持的文件格式

| 格式 | 说明 |
|------|------|
| .pdf | PDF文档 |
| .zip | ZIP压缩包 |
| .rar | RAR压缩包 |
| .7z | 7-Zip压缩包 |
| .tar | TAR归档 |
| .tar.gz / .tgz | Gzip压缩的TAR归档 |

## 命令行使用

```bash
python pdf2png.py <input_folder> <output_folder> [options]
```

### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| input | 输入PDF文件夹路径 | 必填 |
| output | 输出PNG文件夹路径 | 必填 |
| --dpi | 图像分辨率 | 600 |
| --no-crop | 禁用白色边框裁剪 | False |

### 示例

```bash
# 基本用法
python pdf2png.py ./pdfs ./output

# 指定DPI
python pdf2png.py ./pdfs ./output --dpi 300

# 保留白色边框
python pdf2png.py ./pdfs ./output --no-crop
```

## 输出命名规则

- 单页PDF: `{原文件名}.png`
- 多页PDF: `{原文件名}_page_1.png`, `{原文件名}_page_2.png`, ...

## 项目结构

```
pdf2png/
├── app.py              # Flask Web应用
├── pdf2png.py          # 命令行工具
├── Dockerfile          # Docker镜像配置
├── start.sh            # 一键启动脚本
├── requirements.txt    # 依赖列表
├── README.md           # 说明文档
├── templates/
│   └── index.html      # Web界面
├── static/
│   ├── style.css       # 样式文件
│   └── script.js       # 交互脚本
├── uploads/            # 临时上传目录
└── outputs/            # 输出目录
```