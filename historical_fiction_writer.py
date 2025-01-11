import openai
import os
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
from tkinter.font import Font
import json

class HistoricalFictionWriter:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("MOONSHOT_API_KEY")
        if not self.api_key:
            raise ValueError("API key is required. Please provide it through the constructor or set MOONSHOT_API_KEY environment variable.")
        
        # 更新 API 配置
        openai.api_key = self.api_key
        openai.api_base = "https://api.moonshot.cn/v1"
        openai.api_version = None
        
        # 定义不同类型小说的提示词
        self.novel_types = {
            "urban": {
                "name": "都市言情",
                "outline_prompt": """你是一个专业的都市言情小说策划。请根据小说标题，创作一个详细的故事大纲。
要求：
1. 提供现代都市背景设定
2. 主要人物性格特点和社会身份介绍
3. 分为3-5章，每章2-3节
4. 每一节提供简短的内容概要
5. 情节要包含事业与爱情的平衡
6. 突出人物情感冲突和成长""",
                "content_prompt": """你是一个专业的都市言情小说写手。请根据提供的信息，创作一节精彩的小说内容。
要求：
1. 字数2000-3000字
2. 细腻的情感描写
3. 生动的对话和内心独白
4. 都市生活场景细节
5. 人物性格鲜明"""
            },
            "yuri": {
                "name": "百合小说",
                "outline_prompt": """你是一个专业的百合小说策划。请根据小说标题，创作一个详细的故事大纲。
要求：
1. 提供故事背景设定
2. 主要人物性格特点介绍
3. 分为3-5章，每章2-3节
4. 每一节提供简短的内容概要
5. 注重人物之间感情的细腻发展
6. 突出人物的心理变化""",
                "content_prompt": """你是一个专业的百合小说写手。请根据提供的信息，创作一节精彩的小说内容。
要求：
1. 字数2000-3000字
2. 细腻的心理描写
3. 优美的场景描写
4. 自然的情感发展
5. 注重人物互动细节"""
            },
            "bl": {
                "name": "耽美小说",
                "outline_prompt": """你是一个专业的耽美小说策划。请根据小说标题，创作一个详细的故事大纲。
要求：
1. 提供故事背景设定
2. 主要人物性格特点介绍
3. 分为3-5章，每章2-3节
4. 每一节提供简短的内容概要
5. 注重感情发展的合理性
6. 突出人物性格的对比与吸引""",
                "content_prompt": """你是一个专业的耽美小说写手。请根据提供的信息，创作一节精彩的小说内容。
要求：
1. 字数2000-3000字
2. 细腻的心理描写
3. 合理的情感发展
4. 生动的人物互动
5. 优美的文字表达"""
            },
            "timeTravel": {
                "name": "穿越历史",
                "outline_prompt": """你是一个专业的穿越历史小说策划。请根据小说标题，创作一个详细的故事大纲。
要求：
1. 提供历史背景设定
2. 主要人物介绍
3. 分为3-5章，每章2-3节
4. 每一节提供简短的内容概要
5. 确保故事情节连贯，具有历史真实感
6. 体现人物成长和情感发展""",
                "content_prompt": """你是一个专业的穿越历史小说写手。请根据提供的信息，创作一节精彩的小说内容。
要求：
1. 字数2000-3000字
2. 注重历史细节
3. 人物对话符合时代特征
4. 情节要有历史真实感
5. 穿越者视角的独特观察"""
            },
            "romance": {
                "name": "纯爱小说",
                "outline_prompt": """你是一个专业的纯爱小说策划。请根据小说标题，创作一个详细的故事大纲。
要求：
1. 提供故事背景设定
2. 主要人物性格特点介绍
3. 分为3-5章，每章2-3节
4. 每一节提供简短的内容概要
5. 注重感情的纯粹与美好
6. 突出人物情感的升华""",
                "content_prompt": """你是一个专业的纯爱小说写手。请根据提供的信息，创作一节精彩的小说内容。
要求：
1. 字数2000-3000字
2. 温暖治愈的情节
3. 细腻的情感描写
4. 优美的场景烘托
5. 真挚的情感表达"""
            },
            "fantasy": {
                "name": "玄幻修真",
                "outline_prompt": """你是一个专业的玄幻修真小说策划。请根据小说标题，创作一个详细的故事大纲。
要求：
1. 提供修真世界观设定
2. 主要人物天赋和背景介绍
3. 分为3-5章，每章2-3节
4. 每一节提供简短的内容概要
5. 修炼体系要完整合理
6. 突出人物的修炼与成长""",
                "content_prompt": """你是一个专业的玄幻修真小说写手。请根据提供的信息，创作一节精彩的小说内容。
要求：
1. 字数2000-3000字
2. 修真世界的奇幻描写
3. 修炼场景的细节
4. 符合设定的功法战斗
5. 人物的修炼感悟"""
            },
            "scifi": {
                "name": "科幻小说",
                "outline_prompt": """你是一个专业的科幻小说策划。请根据小说标题，创作一个详细的故事大纲。
要求：
1. 提供未来科技背景设定
2. 主要人物背景和特点介绍
3. 分为3-5章，每章2-3节
4. 每一节提供简短的内容概要
5. 科技设定要合理
6. 突出人性与科技的思考""",
                "content_prompt": """你是一个专业的科幻小说写手。请根据提供的信息，创作一节精彩的小说内容。
要求：
1. 字数2000-3000字
2. 科技细节要合理
3. 未来场景的描写
4. 人与科技的互动
5. 深度的科幻思考"""
            },
            "mystery": {
                "name": "悬疑推理",
                "outline_prompt": """你是一个专业的悬疑推理小说策划。请根据小说标题，创作一个详细的故事大纲。
要求：
1. 提供案件背景设定
2. 主要人物背景和特点介绍
3. 分为3-5章，每章2-3节
4. 每一节提供简短的内容概要
5. 案件线索要环环相扣
6. 突出推理过程的严密性""",
                "content_prompt": """你是一个专业的悬疑推理小说写手。请根据提供的信息，创作一节精彩的小说内容。
要求：
1. 字数2000-3000字
2. 悬疑氛围的营造
3. 线索的巧妙设置
4. 推理过程的严密
5. 人物心理的刻画"""
            }
        }
        
    def generate_outline(self, title, novel_type="timeTravel"):
        if novel_type not in self.novel_types:
            raise ValueError(f"不支持的小说类型: {novel_type}")
            
        system_prompt = self.novel_types[novel_type]["outline_prompt"]
        outline_prompt = f"请为{self.novel_types[novel_type]['name']}《{title}》创作详细大纲。"
        
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
            error_msg = str(e)
            print(f"API Error: {error_msg}")
            return f"生成大纲时发生错误: {error_msg}"
        
    def generate_section_content(self, title, chapter_title, section_title, outline, novel_type="timeTravel"):
        if novel_type not in self.novel_types:
            raise ValueError(f"不支持的小说类型: {novel_type}")
            
        system_prompt = self.novel_types[novel_type]["content_prompt"]
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

class StoryGeneratorGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("穿越历史小说生成器")
        self.root.geometry("1200x800")
        
        # 设置样式
        self.style = ttk.Style()
        self.style.configure("Title.TLabel", font=("微软雅黑", 16, "bold"))
        self.style.configure("Header.TLabel", font=("微软雅黑", 12))
        self.style.configure("Custom.TButton", font=("微软雅黑", 10))
        
        # 设置API key
        self.api_key = "sk-mqdKNEH6jUY91H4EHsx8GpowBbkXHmJ7PwDvdAcJoRIgWhqD"
        self.writer = HistoricalFictionWriter(self.api_key)
        
        # 存储当前的大纲
        self.current_outline = ""
        self.is_outline_edited = False
        
        # 创建主框架
        self.create_main_frame()
        
    def create_main_frame(self):
        # 主框架
        self.main_frame = ttk.Frame(self.root, padding="10")
        self.main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 左侧面板 - 小说结构
        self.create_left_panel()
        
        # 右侧面板 - 内容显示
        self.create_right_panel()
        
        # 配置网格权重
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        self.main_frame.columnconfigure(1, weight=1)
        self.main_frame.rowconfigure(0, weight=1)
        
    def create_left_panel(self):
        left_frame = ttk.Frame(self.main_frame, padding="5")
        left_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 10))
        
        # 小说标题
        ttk.Label(left_frame, text="小说标题", style="Header.TLabel").grid(row=0, column=0, sticky=tk.W, pady=(0, 5))
        self.title_entry = ttk.Entry(left_frame, width=30)
        self.title_entry.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # 生成大纲按钮
        self.outline_button = ttk.Button(left_frame, text="生成大纲", style="Custom.TButton", command=self.generate_outline)
        self.outline_button.grid(row=2, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # 章节管理
        ttk.Label(left_frame, text="章节管理", style="Header.TLabel").grid(row=3, column=0, sticky=tk.W, pady=(0, 5))
        
        # 章节树状图
        self.chapter_tree = ttk.Treeview(left_frame, height=15)
        self.chapter_tree.grid(row=4, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        self.chapter_tree.heading("#0", text="章节结构", anchor=tk.W)
        
        # 添加章节按钮
        btn_frame = ttk.Frame(left_frame)
        btn_frame.grid(row=5, column=0, sticky=(tk.W, tk.E), pady=5)
        ttk.Button(btn_frame, text="添加章", style="Custom.TButton", command=self.add_chapter).pack(side=tk.LEFT, padx=2)
        ttk.Button(btn_frame, text="添加节", style="Custom.TButton", command=self.add_section).pack(side=tk.LEFT, padx=2)
        ttk.Button(btn_frame, text="删除", style="Custom.TButton", command=self.delete_item).pack(side=tk.LEFT, padx=2)
        
    def create_right_panel(self):
        right_frame = ttk.Frame(self.main_frame, padding="5")
        right_frame.grid(row=0, column=1, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 内容类型选择
        self.content_type = tk.StringVar(value="outline")
        ttk.Radiobutton(right_frame, text="大纲", variable=self.content_type, value="outline", command=self.switch_content).grid(row=0, column=0, sticky=tk.W)
        ttk.Radiobutton(right_frame, text="章节内容", variable=self.content_type, value="content", command=self.switch_content).grid(row=0, column=1, sticky=tk.W)
        
        # 内容显示区域
        self.content_text = scrolledtext.ScrolledText(right_frame, wrap=tk.WORD, width=70, height=35, font=("微软雅黑", 10))
        self.content_text.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=5)
        
        # 添加大纲编辑相关按钮
        btn_frame = ttk.Frame(right_frame)
        btn_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=5)
        
        self.save_outline_btn = ttk.Button(btn_frame, text="保存大纲修改", style="Custom.TButton", command=self.save_outline_changes)
        self.save_outline_btn.pack(side=tk.LEFT, padx=5)
        
        self.generate_button = ttk.Button(btn_frame, text="生成选中章节内容", style="Custom.TButton", command=self.generate_content)
        self.generate_button.pack(side=tk.LEFT, padx=5)
        
        # 绑定文本修改事件
        self.content_text.bind('<<Modified>>', self.on_text_modified)
        
    def on_text_modified(self, event=None):
        if self.content_type.get() == "outline":
            self.is_outline_edited = True
            self.save_outline_btn.configure(state='normal')
        self.content_text.edit_modified(False)
        
    def save_outline_changes(self):
        if self.content_type.get() == "outline":
            self.current_outline = self.content_text.get(1.0, tk.END).strip()
            self.is_outline_edited = False
            self.save_outline_btn.configure(state='disabled')
            messagebox.showinfo("成功", "大纲修改已保存！")
            
    def switch_content(self):
        if self.is_outline_edited:
            if messagebox.askyesno("提示", "大纲已被修改但未保存，是否保存更改？"):
                self.save_outline_changes()
        
        if self.content_type.get() == "outline":
            self.content_text.delete(1.0, tk.END)
            self.content_text.insert(tk.END, self.current_outline)
            self.save_outline_btn.configure(state='disabled' if not self.is_outline_edited else 'normal')
        else:
            selected = self.chapter_tree.selection()
            if selected:
                item = self.chapter_tree.item(selected[0])
                self.content_text.delete(1.0, tk.END)
                self.content_text.insert(tk.END, f"当前选中：{item['text']}\n\n")
            self.save_outline_btn.configure(state='disabled')
            
    def generate_outline(self):
        title = self.title_entry.get().strip()
        if not title:
            messagebox.showwarning("提示", "请输入小说标题！")
            return
            
        self.outline_button.configure(state='disabled')
        self.content_text.delete(1.0, tk.END)
        self.content_text.insert(tk.END, "正在生成大纲，请稍候...\n")
        self.root.update()
        
        self.current_outline = self.writer.generate_outline(title)
        self.content_text.delete(1.0, tk.END)
        self.content_text.insert(tk.END, self.current_outline)
        self.is_outline_edited = False
        self.save_outline_btn.configure(state='disabled')
        
        self.outline_button.configure(state='normal')
        
    def add_chapter(self):
        chapter_name = self.ask_input("添加章", "请输入章的标题：")
        if chapter_name:
            self.chapter_tree.insert("", "end", text=f"第{self.get_next_chapter_num()}章 {chapter_name}", tags=("chapter",))
            
    def add_section(self):
        selected = self.chapter_tree.selection()
        if not selected:
            messagebox.showwarning("提示", "请先选择一个章！")
            return
            
        parent = selected[0]
        if "section" in self.chapter_tree.item(parent)["tags"]:
            messagebox.showwarning("提示", "不能在节下添加子节！")
            return
            
        section_name = self.ask_input("添加节", "请输入节的标题：")
        if section_name:
            self.chapter_tree.insert(parent, "end", text=f"第{self.get_next_section_num(parent)}节 {section_name}", tags=("section",))
            
    def delete_item(self):
        selected = self.chapter_tree.selection()
        if selected:
            self.chapter_tree.delete(selected)
            
    def get_next_chapter_num(self):
        return len(self.chapter_tree.get_children()) + 1
        
    def get_next_section_num(self, chapter_id):
        return len(self.chapter_tree.get_children(chapter_id)) + 1
        
    def ask_input(self, title, prompt):
        dialog = tk.Toplevel(self.root)
        dialog.title(title)
        dialog.geometry("300x120")
        dialog.transient(self.root)
        
        ttk.Label(dialog, text=prompt).pack(pady=10)
        entry = ttk.Entry(dialog, width=40)
        entry.pack(pady=5)
        
        result = [None]
        
        def on_ok():
            result[0] = entry.get().strip()
            dialog.destroy()
            
        def on_cancel():
            dialog.destroy()
            
        btn_frame = ttk.Frame(dialog)
        btn_frame.pack(pady=10)
        ttk.Button(btn_frame, text="确定", command=on_ok).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="取消", command=on_cancel).pack(side=tk.LEFT, padx=5)
        
        dialog.wait_window()
        return result[0]
        
    def generate_content(self):
        selected = self.chapter_tree.selection()
        if not selected:
            messagebox.showwarning("提示", "请先选择要生成内容的章节！")
            return
            
        item = self.chapter_tree.item(selected[0])
        if "chapter" in item.get("tags", []):
            messagebox.showwarning("提示", "请选择具体的节来生成内容！")
            return
            
        # 获取章节信息
        section_id = selected[0]
        chapter_id = self.chapter_tree.parent(section_id)
        
        chapter_text = self.chapter_tree.item(chapter_id)["text"]
        section_text = item["text"]
        
        # 生成内容
        self.generate_button.configure(state='disabled')
        self.content_text.delete(1.0, tk.END)
        self.content_text.insert(tk.END, "正在生成内容，请稍候...\n")
        self.root.update()
        
        content = self.writer.generate_section_content(
            self.title_entry.get().strip(),
            chapter_text,
            section_text,
            self.current_outline  # 使用当前保存的大纲
        )
        
        self.content_text.delete(1.0, tk.END)
        self.content_text.insert(tk.END, content)
        
        self.generate_button.configure(state='normal')

def main():
    root = tk.Tk()
    app = StoryGeneratorGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main() 