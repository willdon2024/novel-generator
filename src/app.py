from flask import Flask, request, jsonify, render_template
import os
from dotenv import load_dotenv
import openai

app = Flask(__name__)

# 加载环境变量
load_dotenv()

# 配置OpenAI
def configure_openai(api_key):
    openai.api_key = api_key
    openai.api_base = "https://api.moonshot.cn/v1"
    openai.api_version = None

# 获取当前进度
@app.route('/get_progress', methods=['POST'])
def get_progress():
    session_id = request.json.get('session_id')
    if not session_id:
        return jsonify({'status': 'error', 'message': '缺少session_id'})
    
    # 这里可以添加进度追踪逻辑
    return jsonify({'status': 'success', 'progress': 0})

# 设置API密钥
@app.route('/set_api_key', methods=['POST'])
def set_api_key():
    api_key = request.json.get('api_key')
    if not api_key:
        return jsonify({'status': 'error', 'message': '请提供API Key'})
    
    try:
        configure_openai(api_key)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

# 分阶段生成大纲
@app.route('/generate_outline_part', methods=['POST'])
def generate_outline_part():
    data = request.json
    title = data.get('title')
    genre = data.get('genre')
    stage = data.get('stage')
    session_id = data.get('session_id')

    if not all([title, genre, stage, session_id]):
        return jsonify({'status': 'error', 'message': '缺少必要参数'})

    try:
        # 根据不同阶段生成不同的提示词
        if stage == 'background':
            prompt = f"为{genre}小说《{title}》创作详细的背景设定和人物介绍。要求：\n1. 详细的时代背景\n2. 主要人物性格和背景\n3. 核心矛盾和故事主线"
            next_stage = 'part1'
        elif stage == 'part1':
            prompt = f"为{genre}小说《{title}》创作第1-6章节的详细大纲。每章节包含2-3个小节，并提供每节的内容概要。"
            next_stage = 'part2'
        elif stage == 'part2':
            prompt = f"为{genre}小说《{title}》创作第7-12章节的详细大纲。每章节包含2-3个小节，并提供每节的内容概要。"
            next_stage = 'part3'
        elif stage == 'part3':
            prompt = f"为{genre}小说《{title}》创作第13-15章节的详细大纲。每章节包含2-3个小节，并提供每节的内容概要。"
            next_stage = 'complete'
        else:
            return jsonify({'status': 'error', 'message': '无效的生成阶段'})

        # 调用API生成内容
        completion = openai.ChatCompletion.create(
            model="moonshot-v1-8k",
            messages=[
                {"role": "system", "content": "你是一个专业的小说策划，善于创作详细的故事大纲。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        content = completion.choices[0].message.content
        return jsonify({
            'status': 'success',
            'content': content,
            'next_stage': next_stage
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

# 生成章节内容
@app.route('/generate_content', methods=['POST'])
def generate_content():
    data = request.json
    title = data.get('title')
    genre = data.get('genre')
    chapter_title = data.get('chapter_title')
    section_title = data.get('section_title')
    outline = data.get('outline')

    if not all([title, genre, chapter_title, section_title, outline]):
        return jsonify({'status': 'error', 'message': '缺少必要参数'})

    try:
        prompt = f"""请根据以下信息创作小说内容：
标题：《{title}》
类型：{genre}
章节：{chapter_title}
小节：{section_title}
大纲：{outline}

要求：
1. 字数2000-3000字
2. 细腻的描写
3. 生动的对话
4. 符合类型特征
5. 情节连贯"""

        completion = openai.ChatCompletion.create(
            model="moonshot-v1-8k",
            messages=[
                {"role": "system", "content": "你是一个专业的小说写手，善于创作生动有趣的故事内容。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4000
        )
        
        content = completion.choices[0].message.content
        return jsonify({'status': 'success', 'content': content})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

# 根据建议重新生成内容
@app.route('/regenerate_with_suggestion', methods=['POST'])
def regenerate_with_suggestion():
    data = request.json
    content = data.get('content')
    suggestion = data.get('suggestion')

    if not all([content, suggestion]):
        return jsonify({'status': 'error', 'message': '缺少必要参数'})

    try:
        prompt = f"""请根据以下建议修改内容：

原内容：
{content}

修改建议：
{suggestion}

要求：
1. 保持原有故事框架
2. 根据建议优化内容
3. 确保情节连贯
4. 保持写作风格统一"""

        completion = openai.ChatCompletion.create(
            model="moonshot-v1-8k",
            messages=[
                {"role": "system", "content": "你是一个专业的小说编辑，善于根据建议优化故事内容。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4000
        )
        
        new_content = completion.choices[0].message.content
        return jsonify({'status': 'success', 'content': new_content})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

# 主页
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
