from flask import Flask, render_template, request, jsonify
import openai
import os
from datetime import datetime
import time
import re

app = Flask(__name__)

class NovelWriter:
    def __init__(self, api_key=None):
        self.api_key = api_key
        self.current_progress = {}  # 用于存储生成进度
        self.chapters = {}  # 用于存储章节和小节内容
        self.story_context = {}  # 用于存储故事上下文信息
        if not self.api_key:
            raise ValueError("API key is required")
        
        openai.api_key = self.api_key
        openai.api_base = "https://api.moonshot.cn/v1"
    
    def initialize_story_context(self, session_id, title, genre, background):
        """初始化故事上下文"""
        self.story_context[session_id] = {
            'title': title,
            'genre': genre,
            'background': background,
            'characters': {},  # 存储人物信息
            'plot_lines': [],  # 存储主要情节线索
            'chapter_summaries': {},  # 存储每章概要
            'total_chapters': 0  # 当前总章节数
        }
    
    def analyze_story_structure(self, session_id):
        """分析故事结构，规划章节分布"""
        context = self.story_context.get(session_id, {})
        genre = context.get('genre', '')
        background = context.get('background', '')

        structure_prompt = f"""请分析这个{genre}小说的故事结构并规划章节分布。

背景信息：
{background}

要求：
1. 总章节数不超过30章
2. 按照"引子-铺垫-发展-高潮-结局"五个阶段规划
3. 明确每个阶段的章节数量
4. 为每个阶段设定明确的情节目标
5. 规划主要人物的成长弧线
6. 设计故事的主要转折点
7. 安排伏笔和线索的埋设点

请按以下格式输出：
- 总体结构：
- 各阶段章节分布：
- 主要情节线索：
- 人物成长规划：
- 重要转折点：
- 伏笔安排："""

        completion = openai.ChatCompletion.create(
            model="moonshot-v1-8k",
            messages=[
                {"role": "system", "content": "你是一个专业的小说策划，专注于故事结构设计和情节规划。"},
                {"role": "user", "content": structure_prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        # 保存分析结果到上下文
        analysis = completion.choices[0].message.content
        self.story_context[session_id]['structure_analysis'] = analysis
        return analysis

    def generate_section(self, title, genre, chapter_title, section_number, background, outline):
        """生成小节内容，加入更多上下文信息"""
        section_prompt = f"""请为{genre}小说《{title}》的{chapter_title}生成第{section_number}节的详细内容。

背景信息：
{background}

章节大纲：
{outline}

要求：
1. 字数在3000-4000字之间
2. 场景描写要具体细腻，调动多种感官
3. 人物对话要体现性格特点和情感变化
4. 注重环境氛围的营造
5. 细节描写要为情节服务
6. 保持人物性格的一致性和成长性
7. 注意伏笔的埋设和呼应
8. 确保与其他小节的情节连贯
9. 运用恰当的写作手法
10. 节奏把控要合理，重要场景要细致
11. 通过细节体现人物性格
12. 适当加入象征性的意象

格式要求：
1. 分段要合理，段落长度适中
2. 重要对话和场景要单独成段
3. 适当使用空行区分场景转换"""

        completion = openai.ChatCompletion.create(
            model="moonshot-v1-8k",
            messages=[
                {"role": "system", "content": "你是一个专业的小说写手，专注于创作精彩的章节内容。"},
                {"role": "user", "content": section_prompt}
            ],
            temperature=0.7,
            max_tokens=3000
        )
        return completion.choices[0].message.content

    def update_story_progress(self, session_id, chapter_number, content):
        """更新故事进度，分析新内容对整体的影响"""
        if session_id not in self.story_context:
            return
        
        # 更新章节概要
        self.story_context[session_id]['chapter_summaries'][chapter_number] = {
            'content': content,
            'timestamp': datetime.now()
        }
        
        # 更新总章节数
        self.story_context[session_id]['total_chapters'] = max(
            self.story_context[session_id]['total_chapters'],
            chapter_number
        )

    def get_story_status(self, session_id):
        """获取当前故事的状态信息"""
        if session_id not in self.story_context:
            return None
        
        context = self.story_context[session_id]
        return {
            'total_chapters': context['total_chapters'],
            'completed_sections': len(context['chapter_summaries']),
            'structure_analysis': context.get('structure_analysis', ''),
            'plot_lines': context['plot_lines']
        }
    
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
    
    def get_chapter_sections(self, session_id, chapter_number):
        return self.chapters.get(session_id, {}).get(chapter_number, [])
    
    def save_section(self, session_id, chapter_number, section_number, title, content):
        if session_id not in self.chapters:
            self.chapters[session_id] = {}
        if chapter_number not in self.chapters[session_id]:
            self.chapters[session_id][chapter_number] = []
        
        # 确保小节列表有足够的空间
        while len(self.chapters[session_id][chapter_number]) < section_number:
            self.chapters[session_id][chapter_number].append(None)
        
        self.chapters[session_id][chapter_number][section_number - 1] = {
            'title': title,
            'content': content
        }
    
    def export_novel(self, session_id, format='txt'):
        """导出小说全文
        format: 'txt' 或 'docx'
        """
        content = []
        background = self.get_progress(session_id).get('content', '')
        content.append("# 小说背景\n")
        content.append(background)
        content.append("\n\n# 正文\n")
        
        for chapter_num in sorted(self.chapters.get(session_id, {}).keys()):
            sections = self.chapters[session_id][chapter_num]
            for section_num, section in enumerate(sections, 1):
                if section:
                    content.append(f"\n## 第{chapter_num}章 第{section_num}节 {section['title']}\n")
                    content.append(section['content'])
        
        if format == 'txt':
            return '\n'.join(content)
        elif format == 'docx':
            # TODO: 实现docx格式导出
            raise NotImplementedError("DOCX format not implemented yet")
        
        return None

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

@app.route('/generate_section', methods=['POST'])
def generate_section():
    if not writer:
        return jsonify({"status": "error", "message": "请先设置 API Key"})
    
    data = request.json
    title = data.get('title')
    genre = data.get('genre')
    chapter_title = data.get('chapter_title')
    chapter_number = data.get('chapter_number')
    section_number = data.get('section_number')
    session_id = data.get('session_id')
    background = data.get('background')
    outline = data.get('outline')
    
    if not all([title, genre, chapter_title, chapter_number, section_number, session_id, background, outline]):
        return jsonify({"status": "error", "message": "缺少必要的参数"})
    
    try:
        content = writer.generate_section(title, genre, chapter_title, section_number, background, outline)
        writer.save_section(session_id, chapter_number, section_number, chapter_title, content)
        return jsonify({
            "status": "success",
            "content": content
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/export_novel', methods=['POST'])
def export_novel():
    if not writer:
        return jsonify({"status": "error", "message": "请先设置 API Key"})
    
    data = request.json
    session_id = data.get('session_id')
    format = data.get('format', 'txt')
    
    if not session_id:
        return jsonify({"status": "error", "message": "缺少必要的参数"})
    
    try:
        content = writer.export_novel(session_id, format)
        if content:
            return jsonify({
                "status": "success",
                "content": content
            })
        else:
            return jsonify({"status": "error", "message": "导出失败"})
    except NotImplementedError as e:
        return jsonify({"status": "error", "message": str(e)})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/initialize_story', methods=['POST'])
def initialize_story():
    if not writer:
        return jsonify({"status": "error", "message": "请先设置 API Key"})
    
    data = request.json
    title = data.get('title')
    genre = data.get('genre')
    background = data.get('background')
    session_id = data.get('session_id')
    
    if not all([title, genre, background, session_id]):
        return jsonify({"status": "error", "message": "缺少必要的参数"})
    
    try:
        writer.initialize_story_context(session_id, title, genre, background)
        analysis = writer.analyze_story_structure(session_id)
        return jsonify({
            "status": "success",
            "analysis": analysis
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/get_story_status', methods=['POST'])
def get_story_status():
    if not writer:
        return jsonify({"status": "error", "message": "请先设置 API Key"})
    
    data = request.json
    session_id = data.get('session_id')
    
    if not session_id:
        return jsonify({"status": "error", "message": "缺少必要的参数"})
    
    try:
        status = writer.get_story_status(session_id)
        if status:
            return jsonify({
                "status": "success",
                "data": status
            })
        else:
            return jsonify({"status": "error", "message": "未找到故事信息"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 