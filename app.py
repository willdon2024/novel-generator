from flask import Flask, render_template, request, jsonify
import openai
import os
from datetime import datetime

app = Flask(__name__)

class HistoricalFictionWriter:
    def __init__(self, api_key=None):
        self.api_key = api_key
        if not self.api_key:
            raise ValueError("API key is required")
        
        openai.api_key = self.api_key
        openai.api_base = "https://api.moonshot.cn/v1"
        
    def generate_outline(self, title):
        system_prompt = """你是一个专业的穿越历史小说策划。请根据小说标题，创作一个详细的故事大纲。
要求：
1. 提供故事背景设定
2. 主要人物介绍
3. 分为3-5章，每章2-3节
4. 每一节提供简短的内容概要
5. 确保故事情节连贯，具有历史真实感
6. 体现人物成长和情感发展"""

        outline_prompt = f"请为小说《{title}》创作详细大纲。"
        
        try:
            completion = openai.ChatCompletion.create(
                model="moonshot-v1-8k",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": outline_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            return completion.choices[0].message.content
        except Exception as e:
            return f"生成大纲时发生错误: {str(e)}"
        
    def generate_section_content(self, title, chapter_title, section_title, outline):
        system_prompt = """你是一个专业的穿越历史小说写手。请根据提供的信息，创作一节精彩的小说内容。
要求：
1. 字数根据情节需要来定，一般在2000-3000字之间，重要情节可以适当增加
2. 情节要符合大纲设定，注重细节描写
3. 要有细腻的人物刻画和情感描写
4. 注意与其他章节的连贯性
5. 融入适当的历史细节和时代特征
6. 分段落呈现，使用优美的中文写作
7. 重要场景可以适当放慢节奏，增加细节描写
8. 对话要自然，符合人物身份和性格"""

        content_prompt = f"""请根据以下信息创作小说内容：
小说名：《{title}》
章节名：{chapter_title}
小节名：{section_title}
故事大纲：{outline}

注意：对于重要情节和关键场景，可以适当增加字数，让故事更加生动详实。"""
        
        try:
            completion = openai.ChatCompletion.create(
                model="moonshot-v1-8k",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content_prompt}
                ],
                temperature=0.7,
                max_tokens=4000
            )
            return completion.choices[0].message.content
        except Exception as e:
            return f"生成内容时发生错误: {str(e)}"

# 创建全局的写手实例
writer = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/set_api_key', methods=['POST'])
def set_api_key():
    global writer
    api_key = request.json.get('api_key')
    try:
        writer = HistoricalFictionWriter(api_key)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/generate_outline', methods=['POST'])
def generate_outline():
    if not writer:
        return jsonify({"status": "error", "message": "请先设置 API Key"})
    
    title = request.json.get('title')
    if not title:
        return jsonify({"status": "error", "message": "请输入小说标题"})
    
    outline = writer.generate_outline(title)
    return jsonify({"status": "success", "outline": outline})

@app.route('/generate_content', methods=['POST'])
def generate_content():
    if not writer:
        return jsonify({"status": "error", "message": "请先设置 API Key"})
    
    data = request.json
    title = data.get('title')
    chapter_title = data.get('chapter_title')
    section_title = data.get('section_title')
    outline = data.get('outline')
    
    if not all([title, chapter_title, section_title, outline]):
        return jsonify({"status": "error", "message": "缺少必要的参数"})
    
    content = writer.generate_section_content(title, chapter_title, section_title, outline)
    return jsonify({"status": "success", "content": content})

if __name__ == '__main__':
    app.run(debug=True) 