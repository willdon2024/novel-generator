from flask import Flask, render_template, request, jsonify
import openai
import os
from datetime import datetime
import time

app = Flask(__name__)

class NovelWriter:
    def __init__(self, api_key=None):
        self.api_key = api_key
        self.current_progress = {}  # 用于存储生成进度
        if not self.api_key:
            raise ValueError("API key is required")
        
        openai.api_key = self.api_key
        openai.api_base = "https://api.moonshot.cn/v1"
    
    def get_progress(self, session_id):
        return self.current_progress.get(session_id, {})
    
    def set_progress(self, session_id, stage, content):
        if session_id not in self.current_progress:
            self.current_progress[session_id] = {
                'stage': stage,
                'content': content,
                'timestamp': datetime.now()
            }
        else:
            self.current_progress[session_id].update({
                'stage': stage,
                'content': content,
                'timestamp': datetime.now()
            })
    
    def clear_progress(self, session_id):
        if session_id in self.current_progress:
            del self.current_progress[session_id]
    
    def generate_outline_part(self, title, genre, session_id, stage):
        try:
            current_progress = self.get_progress(session_id)
            
            if stage == 'background':
                # 生成背景和人物设定
                background = self._generate_background(title, genre)
                self.set_progress(session_id, 'background', background)
                return {'status': 'success', 'content': background, 'next_stage': 'part1'}
            
            elif stage == 'part1':
                # 生成第1-6章
                background = current_progress.get('content', '')
                outline_first = self._generate_first_part(title, genre, background)
                self.set_progress(session_id, 'part1', outline_first)
                return {'status': 'success', 'content': outline_first, 'next_stage': 'part2'}
            
            elif stage == 'part2':
                # 生成第7-12章
                outline_first = current_progress.get('content', '')
                outline_second = self._generate_second_part(title, genre, outline_first)
                self.set_progress(session_id, 'part2', outline_second)
                return {'status': 'success', 'content': outline_second, 'next_stage': 'part3'}
            
            elif stage == 'part3':
                # 生成第13-15章
                outline_second = current_progress.get('content', '')
                outline_third = self._generate_third_part(title, genre, outline_second)
                self.set_progress(session_id, 'part3', outline_third)
                
                # 组合完整内容
                complete_outline = self._combine_all_parts(session_id)
                self.clear_progress(session_id)  # 清理进度数据
                return {'status': 'success', 'content': complete_outline, 'next_stage': 'complete'}
            
            else:
                return {'status': 'error', 'message': '无效的生成阶段'}
                
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def _generate_background(self, title, genre):
        background_prompt = f"""请为{genre}小说《{title}》创作背景设定和人物介绍。
要求：
1. 详细的故事背景设定（至少500字）
2. 主要人物介绍（包括性格特点和人物关系，每个主要人物至少200字）
3. 列出3个重要的故事转折点，并说明这些转折点分别发生在第几章
4. 【重要】故事结构按照"序章-发展-高潮-结局"四个阶段展开，每个阶段3-4章
格式：
- 故事背景：
- 主要人物：
- 重要转折点：
- 故事结构规划："""

        completion = openai.ChatCompletion.create(
            model="moonshot-v1-8k",
            messages=[
                {"role": "system", "content": "你是一个专业的小说策划，专注于创作背景设定和人物塑造。"},
                {"role": "user", "content": background_prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        return completion.choices[0].message.content
    
    def _generate_first_part(self, title, genre, background):
        outline_first_prompt = f"""请为{genre}小说《{title}》创作第1章到第6章的详细大纲。这是小说的序章和发展阶段。
背景信息：
{background}

要求：
1. 必须生成1-6章的内容，每章4-5节
2. 每节提供300-500字的详细内容概要
3. 按照以下格式输出：
第1章 序章名
  第1节 节标题：（详细概要）
  第2节 节标题：（详细概要）
  ...（确保每章至少4节）
第2章 章节名
  ...（以此类推直到第6章）"""

        completion = openai.ChatCompletion.create(
            model="moonshot-v1-8k",
            messages=[
                {"role": "system", "content": "你是一个专业的小说策划，专注于创作详细的章节大纲。"},
                {"role": "user", "content": outline_first_prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        return completion.choices[0].message.content
    
    def _generate_second_part(self, title, genre, outline_first):
        outline_second_prompt = f"""请为{genre}小说《{title}》创作第7章到第12章的详细大纲。这是小说的高潮和高潮延续阶段。
已有内容：
{outline_first}

要求：
1. 必须生成7-12章的内容，每章4-5节
2. 每节提供300-500字的详细内容概要
3. 确保情节连贯，并与前6章的内容衔接
4. 按照以下格式输出：
第7章 章节名
  第1节 节标题：（详细概要）
  第2节 节标题：（详细概要）
  ...（确保每章至少4节）
第8章 章节名
  ...（以此类推直到第12章）"""

        completion = openai.ChatCompletion.create(
            model="moonshot-v1-8k",
            messages=[
                {"role": "system", "content": "你是一个专业的小说策划，专注于创作详细的章节大纲。"},
                {"role": "user", "content": outline_second_prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        return completion.choices[0].message.content
    
    def _generate_third_part(self, title, genre, outline_second):
        outline_third_prompt = f"""请为{genre}小说《{title}》创作第13章到第15章的详细大纲。这是小说的结局阶段。
前文概要：
{outline_second}

要求：
1. 必须生成13-15章的内容，每章4-5节
2. 每节提供300-500字的详细内容概要
3. 确保完整的故事闭环，所有伏笔和情节都得到合理的解决
4. 按照以下格式输出：
第13章 章节名
  第1节 节标题：（详细概要）
  第2节 节标题：（详细概要）
  ...（确保每章至少4节）
第14章 章节名
  ...（以此类推直到第15章）"""

        completion = openai.ChatCompletion.create(
            model="moonshot-v1-8k",
            messages=[
                {"role": "system", "content": "你是一个专业的小说策划，专注于创作详细的章节大纲。"},
                {"role": "user", "content": outline_third_prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        return completion.choices[0].message.content
    
    def _combine_all_parts(self, session_id):
        progress = self.get_progress(session_id)
        background = progress.get('background', '')
        part1 = progress.get('part1', '')
        part2 = progress.get('part2', '')
        part3 = progress.get('part3', '')
        
        return f"""# 小说整体规划
{background}

# 详细章节大纲
## 第一部分：序章与发展（第1-6章）
{part1}

## 第二部分：高潮发展（第7-12章）
{part2}

## 第三部分：结局篇章（第13-15章）
{part3}"""

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
        writer = NovelWriter(api_key)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/generate_outline_part', methods=['POST'])
def generate_outline_part():
    if not writer:
        return jsonify({"status": "error", "message": "请先设置 API Key"})
    
    data = request.json
    title = data.get('title')
    genre = data.get('genre', '')
    session_id = data.get('session_id')
    stage = data.get('stage', 'background')
    
    if not all([title, session_id]):
        return jsonify({"status": "error", "message": "缺少必要的参数"})

    try:
        # 根据不同阶段生成内容
        if stage == 'background':
            # 生成背景和人物设定
            background_prompt = f"""请为{genre}小说《{title}》创作背景设定和人物介绍。
要求：
1. 详细的故事背景设定（至少500字）
2. 主要人物介绍（包括性格特点和人物关系，每个主要人物至少200字）
3. 列出3个重要的故事转折点，并说明这些转折点分别发生在第几章
4. 【重要】故事结构按照"序章-发展-高潮-结局"四个阶段展开，每个阶段3-4章
格式：
- 故事背景：
- 主要人物：
- 重要转折点：
- 故事结构规划："""

            completion = openai.ChatCompletion.create(
                model="moonshot-v1-8k",
                messages=[
                    {"role": "system", "content": "你是一个专业的小说策划，专注于创作背景设定和人物塑造。"},
                    {"role": "user", "content": background_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            content = completion.choices[0].message.content
            return jsonify({"status": "success", "content": content, "next_stage": "part1"})

        elif stage == 'part1':
            # 生成第1-6章
            outline_first_prompt = f"""请为{genre}小说《{title}》创作第1章到第6章的详细大纲。这是小说的序章和发展阶段。
要求：
1. 必须生成1-6章的内容，每章4-5节
2. 每节提供300-500字的详细内容概要
3. 按照以下格式输出：
第1章 序章名
  第1节 节标题：（详细概要）
  第2节 节标题：（详细概要）
  ...（确保每章至少4节）
第2章 章节名
  ...（以此类推直到第6章）"""

            completion = openai.ChatCompletion.create(
                model="moonshot-v1-8k",
                messages=[
                    {"role": "system", "content": "你是一个专业的小说策划，专注于创作详细的章节大纲。"},
                    {"role": "user", "content": outline_first_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            content = completion.choices[0].message.content
            return jsonify({"status": "success", "content": content, "next_stage": "part2"})

        elif stage == 'part2':
            # 生成第7-12章
            outline_second_prompt = f"""请为{genre}小说《{title}》创作第7章到第12章的详细大纲。这是小说的高潮和高潮延续阶段。
要求：
1. 必须生成7-12章的内容，每章4-5节
2. 每节提供300-500字的详细内容概要
3. 确保情节连贯
4. 按照以下格式输出：
第7章 章节名
  第1节 节标题：（详细概要）
  第2节 节标题：（详细概要）
  ...（确保每章至少4节）
第8章 章节名
  ...（以此类推直到第12章）"""

            completion = openai.ChatCompletion.create(
                model="moonshot-v1-8k",
                messages=[
                    {"role": "system", "content": "你是一个专业的小说策划，专注于创作详细的章节大纲。"},
                    {"role": "user", "content": outline_second_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            content = completion.choices[0].message.content
            return jsonify({"status": "success", "content": content, "next_stage": "part3"})

        elif stage == 'part3':
            # 生成第13-15章
            outline_third_prompt = f"""请为{genre}小说《{title}》创作第13章到第15章的详细大纲。这是小说的结局阶段。
要求：
1. 必须生成13-15章的内容，每章4-5节
2. 每节提供300-500字的详细内容概要
3. 确保完整的故事闭环，所有伏笔和情节都得到合理的解决
4. 按照以下格式输出：
第13章 章节名
  第1节 节标题：（详细概要）
  第2节 节标题：（详细概要）
  ...（确保每章至少4节）
第14章 章节名
  ...（以此类推直到第15章）"""

            completion = openai.ChatCompletion.create(
                model="moonshot-v1-8k",
                messages=[
                    {"role": "system", "content": "你是一个专业的小说策划，专注于创作详细的章节大纲。"},
                    {"role": "user", "content": outline_third_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            content = completion.choices[0].message.content
            return jsonify({"status": "success", "content": content, "next_stage": "complete"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/generate_content', methods=['POST'])
def generate_content():
    if not writer:
        return jsonify({"status": "error", "message": "请先设置 API Key"})
    
    data = request.json
    title = data.get('title')
    chapter_title = data.get('chapter_title')
    section_title = data.get('section_title')
    outline = data.get('outline')
    genre = data.get('genre', '')
    
    if not all([title, chapter_title, section_title, outline]):
        return jsonify({"status": "error", "message": "缺少必要的参数"})
    
    try:
        system_prompt = f"""你是一个专业的{genre}小说写手。请根据提供的信息，创作一节精彩的小说内容。
要求：
1. 字数在4000-6000字之间，重要情节可以突破这个限制
2. 情节要符合大纲设定，注重细节描写
3. 要有细腻的人物刻画和情感描写
4. 注意与其他章节的连贯性
5. 根据{genre}小说的特点，融入相应的元素和细节
6. 分段落呈现，使用优美的中文写作
7. 重要场景要放慢节奏，增加细节描写
8. 对话要自然，符合人物身份和性格
9. 注重环境和氛围的营造
10. 适当运用各种写作手法，如白描、细描、心理描写等"""

        content_prompt = f"""请根据以下信息创作小说内容：
小说名：《{title}》
类型：{genre}
章节名：{chapter_title}
小节名：{section_title}
故事大纲：{outline}

要求：
1. 创作长度至少4000字，重要情节可以更长
2. 场景细节要丰富
3. 人物对话要生动
4. 确保与整体故事情节连贯"""

        completion = openai.ChatCompletion.create(
            model="moonshot-v1-8k",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content_prompt}
            ],
            temperature=0.7,
            max_tokens=8000
        )
        content = completion.choices[0].message.content
        return jsonify({"status": "success", "content": content})
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 