# AI小说生成器

一个基于Moonshot AI的智能小说生成工具，可以帮助作者快速生成小说大纲和章节内容。

## 功能特点

- 支持多种小说类型（都市情感、玄幻修真、科幻未来等）
- 智能生成小说大纲
- 自动生成章节内容
- 支持人工干预和修改建议
- 导出支持多种格式（TXT、Word）
- 本地保存授权信息和API密钥

## 技术栈

- 后端：Python + Flask
- 前端：HTML + JavaScript + Bootstrap
- AI：Moonshot AI API

## 安装和使用

1. 克隆仓库
```bash
git clone https://github.com/yourusername/novel-generator.git
cd novel-generator
```

2. 安装依赖
```bash
pip install -r requirements.txt
```

3. 运行应用
```bash
python app.py
```

4. 在浏览器中访问 `http://localhost:5001`

## 使用说明

1. 首次使用需要输入授权码和Moonshot API Key
2. 选择小说类型并输入标题
3. 生成大纲
4. 根据需要修改大纲
5. 生成章节内容
6. 导出成品

## 注意事项

- 需要有效的Moonshot AI API Key
- 授权码为一次性使用，不可在多设备上使用
- API Key和授权信息仅保存在本地浏览器中

## License

MIT License 