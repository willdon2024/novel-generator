// 进度管理器类
class ProgressManager {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.progress = {};
    }
    
    updateProgress(step, data) {
        this.progress[step] = data;
    }
    
    getProgress(step) {
        return this.progress[step];
    }
    
    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            return true;
        }
        return false;
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            return true;
        }
        return false;
    }
    
    getCurrentStep() {
        return this.currentStep;
    }
    
    reset() {
        this.currentStep = 1;
        this.progress = {};
    }
}

// 应用状态管理类
class AppState {
    constructor() {
        this.apiKey = null;
        this.currentNovel = null;
        this.progressManager = new ProgressManager();
        this.validAuthCodes = {
            'AUTH0011-2025': { user: '授权用户', activated: null }
        };
        this.isAuthorized = false;
        this.authCode = null;
        this.authExpiry = null;
    }
    
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('apiKey', key);
    }
    
    getApiKey() {
        return this.apiKey;
    }
    
    setCurrentNovel(novel) {
        this.currentNovel = novel;
    }
    
    getCurrentNovel() {
        return this.currentNovel;
    }

    verifyAuthCode(code) {
        console.log('验证授权码:', code);
        if (!code) {
            return { success: false, message: '请输入授权码' };
        }

        const authInfo = this.validAuthCodes[code];
        if (!authInfo) {
            return { success: false, message: '无效的授权码' };
        }

        // 检查是否已经激活
        const savedActivation = localStorage.getItem('authActivated');
        if (savedActivation) {
            const activated = new Date(savedActivation);
            const expiry = new Date(activated);
            expiry.setFullYear(expiry.getFullYear() + 1);
            
            if (new Date() <= expiry) {
                this.authCode = code;
                this.authExpiry = expiry;
                this.isAuthorized = true;
                
                // 自动填充并禁用输入框
                const authInput = document.getElementById('authCode');
                const verifyButton = document.getElementById('verifyAuth');
                if (authInput && verifyButton) {
                    authInput.value = code;
                    authInput.disabled = true;
                    verifyButton.disabled = true;
                }
                
                return { 
                    success: true, 
                    message: `授权码有效，剩余${Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24))}天`,
                    expiry: expiry
                };
            }
        }

        // 新激活授权码
        const now = new Date();
        const expiry = new Date(now);
        expiry.setFullYear(expiry.getFullYear() + 1);
        
        // 保存授权状态
        localStorage.setItem('authCode', code);
        localStorage.setItem('authActivated', now.toISOString());
        
        this.authCode = code;
        this.authExpiry = expiry;
        this.isAuthorized = true;
        
        // 自动填充并禁用输入框
        const authInput = document.getElementById('authCode');
        const verifyButton = document.getElementById('verifyAuth');
        if (authInput && verifyButton) {
            authInput.value = code;
            authInput.disabled = true;
            verifyButton.disabled = true;
        }
        
        return { 
            success: true, 
            message: '授权成功！有效期一年',
            expiry: expiry
        };
    }

    checkAuthStatus() {
        const savedAuthCode = localStorage.getItem('authCode');
        const savedActivation = localStorage.getItem('authActivated');
        
        if (savedAuthCode && savedActivation) {
            const activated = new Date(savedActivation);
            const expiry = new Date(activated);
            expiry.setFullYear(expiry.getFullYear() + 1);
            
            if (new Date() <= expiry) {
                this.authCode = savedAuthCode;
                this.authExpiry = expiry;
                this.isAuthorized = true;
                
                // 自动填充并禁用输入框
                const authInput = document.getElementById('authCode');
                const verifyButton = document.getElementById('verifyAuth');
                if (authInput && verifyButton) {
                    authInput.value = savedAuthCode;
                    authInput.disabled = true;
                    verifyButton.disabled = true;
                }
                
                // 显示主界面
                document.getElementById('authPanel').style.display = 'none';
                document.getElementById('mainContent').style.display = 'block';
                
                return true;
            }
        }
        
        // 清除无效的授权信息
        this.clearAuth();
        return false;
    }
    
    clearAuth() {
        this.authCode = null;
        this.authExpiry = null;
        this.isAuthorized = false;
        localStorage.removeItem('authCode');
        localStorage.removeItem('authActivated');
        
        // 重置输入框和按钮状态
        const authInput = document.getElementById('authCode');
        const verifyButton = document.getElementById('verifyAuth');
        if (authInput && verifyButton) {
            authInput.value = '';
            authInput.disabled = false;
            verifyButton.disabled = false;
        }
        
        // 显示验证界面
        document.getElementById('authPanel').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';
    }
    
    reset() {
        this.apiKey = null;
        this.currentNovel = null;
        this.progressManager.reset();
        this.clearAuth();
    }
}

// 创建单例实例
const appState = new AppState();
const progressManager = appState.progressManager;

// 页面加载时检查授权状态
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成');
    
    // 检查授权状态
    if (appState.checkAuthStatus()) {
        // 显示剩余天数
        const remainingDays = Math.ceil((appState.authExpiry - new Date()) / (1000 * 60 * 60 * 24));
        console.log(`授权码有效，剩余${remainingDays}天`);
        
        // 恢复之前的状态
        restoreState();
    }
    
    // 绑定验证按钮点击事件
    const verifyButton = document.getElementById('verifyAuth');
    if (verifyButton) {
        verifyButton.addEventListener('click', function() {
            const authCode = document.getElementById('authCode').value.trim();
            const result = appState.verifyAuthCode(authCode);
            
            if (result.success) {
                document.getElementById('authPanel').style.display = 'none';
                document.getElementById('mainContent').style.display = 'block';
            }
            
            alert(result.message);
        });
        console.log('验证按钮事件已绑定');
    }
    
    // 绑定第二步的重新生成按钮
    const backgroundRegenerateBtn = document.querySelector('#step2 .regenerate-btn');
    if (backgroundRegenerateBtn) {
        backgroundRegenerateBtn.addEventListener('click', function() {
            console.log('点击重新生成背景按钮');
            generateBackground();
        });
    }
    
    // 绑定第二步的保存按钮
    const backgroundSaveBtn = document.querySelector('#step2 .save-btn');
    if (backgroundSaveBtn) {
        backgroundSaveBtn.addEventListener('click', function() {
            const backgroundText = document.getElementById('backgroundText');
            if (backgroundText && backgroundText.value.trim()) {
                alert('背景内容已保存！');
                saveCurrentState();
            }
        });
    }
    
    // 绑定第三步的重新生成按钮
    const outlineRegenerateBtn = document.querySelector('#step3 .regenerate-btn');
    if (outlineRegenerateBtn) {
        outlineRegenerateBtn.addEventListener('click', function() {
            console.log('点击重新生成大纲按钮');
            generateOutline();
        });
    }
    
    // 绑定第三步的保存按钮
    const outlineSaveBtn = document.querySelector('#step3 .save-btn');
    if (outlineSaveBtn) {
        outlineSaveBtn.addEventListener('click', function() {
            const outlineText = document.getElementById('outlineText');
            if (outlineText && outlineText.value.trim()) {
                alert('大纲内容已保存！');
                saveCurrentState();
            }
        });
    }
    
    // 绑定下一步按钮
    const nextButtons = document.querySelectorAll('.next-btn, .confirm-btn');
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('点击下一步按钮');
            const currentStep = parseInt(this.closest('.tab-pane').id.replace('step', ''));
            nextStep(currentStep);
        });
    });
    
    // 绑定上一步按钮
    const prevButtons = document.querySelectorAll('.prev-btn');
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('点击上一步按钮');
            const currentStep = parseInt(this.closest('.tab-pane').id.replace('step', ''));
            prevStep(currentStep);
        });
    });
    
    // 绑定快捷按钮事件
    const quickButtons = document.querySelectorAll('.quick-action-btn');
    quickButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.textContent.trim();
            const currentStep = parseInt(this.closest('.tab-pane').id.replace('step', ''));
            const textArea = document.getElementById(currentStep === 2 ? 'backgroundText' : 'outlineText');
            
            if (textArea) {
                const currentContent = textArea.value;
                switch(action) {
                    case '调整情节发展':
                        textArea.value = currentContent + '\n\n[调整后的情节发展...]';
                        break;
                    case '增加故事转折':
                        textArea.value = currentContent + '\n\n[新增的故事转折...]';
                        break;
                    case '优化结局设计':
                        textArea.value = currentContent + '\n\n[优化后的结局...]';
                        break;
                }
                saveCurrentState();
            }
        });
    });
    
    // 绑定导出Word按钮
    const exportWordBtns = document.querySelectorAll('.export-word-btn');
    exportWordBtns.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = parseInt(this.closest('.tab-pane').id.replace('step', ''));
            const textArea = document.getElementById(currentStep === 2 ? 'backgroundText' : 'outlineText');
            const title = document.getElementById('novelTitle').value || '小说';
            
            if (textArea && textArea.value.trim()) {
                const content = `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h1 style="text-align: center;">${title}</h1>
                    <div style="white-space: pre-wrap;">${textArea.value}</div>
                </div>`;
                const filename = `${title}_${currentStep === 2 ? '背景' : '大纲'}.doc`;
                exportToWord(content, filename);
            } else {
                alert('没有可导出的内容！');
            }
        });
    });
    
    // 绑定导出Text按钮
    const exportTextBtns = document.querySelectorAll('.export-text-btn');
    exportTextBtns.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = parseInt(this.closest('.tab-pane').id.replace('step', ''));
            const textArea = document.getElementById(currentStep === 2 ? 'backgroundText' : 'outlineText');
            const title = document.getElementById('novelTitle').value || '小说';
            
            if (textArea && textArea.value.trim()) {
                const filename = `${title}_${currentStep === 2 ? '背景' : '大纲'}.txt`;
                exportToText(textArea.value, filename);
            } else {
                alert('没有可导出的内容！');
            }
        });
    });
    
    // 绑定复制内容按钮
    const copyBtns = document.querySelectorAll('.copy-btn');
    copyBtns.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = parseInt(this.closest('.tab-pane').id.replace('step', ''));
            const textArea = document.getElementById(currentStep === 2 ? 'backgroundText' : 'outlineText');
            
            if (textArea && textArea.value.trim()) {
                copyToClipboard(textArea.value);
            } else {
                alert('没有可复制的内容！');
            }
        });
    });
});

// 步骤切换函数
function nextStep(currentStepNumber) {
    console.log('切换到下一步:', currentStepNumber + 1);
    
    // 验证当前步骤的输入
    if (currentStepNumber === 1) {
        const title = document.getElementById('novelTitle').value;
        const genre = document.getElementById('novelGenre').value;
        if (!title || !genre) {
            alert('请填写小说标题和选择类型');
            return;
        }
        
        // 显示加载状态
        showLoading('正在生成故事背景...');
    }
    
    // 更新步骤指示器
    const currentStepItem = document.querySelector(`.step-item[data-step="${currentStepNumber}"]`);
    const nextStepItem = document.querySelector(`.step-item[data-step="${currentStepNumber + 1}"]`);
    if (currentStepItem && nextStepItem) {
        currentStepItem.classList.remove('active');
        currentStepItem.classList.add('completed');
        nextStepItem.classList.add('active');
    }
    
    // 切换内容显示
    const currentContent = document.getElementById(`step${currentStepNumber}`);
    const nextContent = document.getElementById(`step${currentStepNumber + 1}`);
    if (currentContent && nextContent) {
        currentContent.classList.remove('show', 'active');
        nextContent.classList.add('show', 'active');
        progressManager.nextStep();
        console.log('内容已切换到步骤:', currentStepNumber + 1);
        
        // 根据步骤显示不同的加载提示
        if (currentStepNumber === 1) {
            // 自动开始生成故事背景
            setTimeout(() => {
                const backgroundText = document.getElementById('backgroundText');
                if (backgroundText) {
                    backgroundText.value = '正在生成故事背景和人物关系，请稍候...';
                    generateBackground();
                }
            }, 100);
        }
        
        // 保存当前状态
        saveCurrentState();
    }
}

function prevStep(currentStepNumber) {
    console.log('返回上一步:', currentStepNumber - 1);
    
    // 更新步骤指示器
    const currentStepItem = document.querySelector(`.step-item[data-step="${currentStepNumber}"]`);
    const prevStepItem = document.querySelector(`.step-item[data-step="${currentStepNumber - 1}"]`);
    if (currentStepItem && prevStepItem) {
        currentStepItem.classList.remove('active');
        prevStepItem.classList.remove('completed');
        prevStepItem.classList.add('active');
    }
    
    // 切换内容显示
    const currentContent = document.getElementById(`step${currentStepNumber}`);
    const prevContent = document.getElementById(`step${currentStepNumber - 1}`);
    if (currentContent && prevContent) {
        currentContent.classList.remove('show', 'active');
        prevContent.classList.add('show', 'active');
        progressManager.prevStep();
        console.log('内容已切换到步骤:', currentStepNumber - 1);
        
        // 保存当前状态
        saveCurrentState();
    }
}

// 显示加载状态
function showLoading(message) {
    const progressDiv = document.querySelector('.generation-progress');
    const loadingText = progressDiv.querySelector('.loading-text');
    const progressBar = progressDiv.querySelector('.progress-bar');
    
    if (progressDiv && loadingText && progressBar) {
        progressDiv.style.display = 'block';
        loadingText.innerHTML = `${message}<br><small class="text-muted">预计需要1-2分钟，请耐心等待...</small>`;
        progressBar.style.width = '0%';
        
        // 添加动画效果
        loadingText.classList.add('loading-animation');
        
        // 模拟进度，每3秒更新一次状态
        let progress = 0;
        const messages = [
            '正在分析故事背景...',
            '正在构建人物关系...',
            '正在完善故事细节...',
            '即将完成生成...'
        ];
        let messageIndex = 0;
        
        const interval = setInterval(() => {
            progress += 5;
            if (progress > 90) {
                clearInterval(interval);
            }
            progressBar.style.width = `${progress}%`;
            
            // 每25%更新一次提示消息
            if (progress % 25 === 0 && messageIndex < messages.length) {
                loadingText.innerHTML = `${messages[messageIndex]}<br><small class="text-muted">已完成 ${progress}%，请继续等待...</small>`;
                messageIndex++;
            }
        }, 3000); // 每3秒更新一次进度
    }
}

// 隐藏加载状态
function hideLoading() {
    const progressDiv = document.querySelector('.generation-progress');
    if (progressDiv) {
        progressDiv.style.display = 'none';
    }
}

// 生成故事背景
function generateBackground() {
    const title = document.getElementById('novelTitle').value;
    const genre = document.getElementById('novelGenre').value;
    const backgroundText = document.getElementById('backgroundText');
    const regenerateBtn = document.querySelector('.regenerate-btn');
    
    // 禁用重新生成按钮
    if (regenerateBtn) {
        regenerateBtn.disabled = true;
        regenerateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 生成中...';
    }
    
    // 显示初始状态
    if (backgroundText) {
        backgroundText.value = '系统正在构思故事情节，请稍候...';
        backgroundText.style.opacity = '0.7';
        backgroundText.disabled = true;
    }
    
    // 显示加载状态
    showLoading('正在启动生成引擎...');
    
    // 生成示例内容
    console.log('生成故事背景:', { title, genre });
    
    // 根据不同类型生成不同的背景模板
    let backgroundTemplate = '';
    switch(genre) {
        case '都市生活':
            backgroundTemplate = `《${title}》是一部现代都市生活小说，故事发生在繁华的大都市中。

故事背景：
故事设定在当代中国一线城市，主要围绕着年轻人的职场与生活展开。城市的快节奏、高压力的工作环境，以及不断变化的人际关系构成了故事的基本背景。

主要人物：
1. 主角：李好，28岁，某互联网公司的产品经理。性格开朗但内心敏感，工作能力强但常常陷入理想与现实的矛盾中。

2. 男主角：陈远，32岁，创业公司CEO。事业心强，性格沉稳，但在感情方面显得有些笨拙。

3. 竞争对手：张明，30岁，同公司市场部经理。表面热情，实则处处与主角竞争。

4. 闺蜜：王小美，27岁，时尚博主。开朗活泼，是主角的知心好友和情感顾问。

人物关系：
- 李好与陈远在一次产品发布会上相识，两人因工作多次接触，产生好感
- 张明暗中觊觎李好的项目，同时对她也有好感，形成三角关系
- 王小美作为李好的闺蜜，在她职场和感情问题上都给予支持和建议
- 各人物之间的关系随着职场竞争和感情发展而变得复杂

故事核心冲突：
主角在追求事业成功与个人幸福之间寻找平衡，同时面临职场竞争、创业机遇和感情抉择的多重考验。`;
            break;
        case '玄幻修仙':
            backgroundTemplate = `《${title}》是一部东方玄幻修仙小说，故事背景设定在一个充满灵力的修真世界。

世界背景：
这是一个被称为"九州大陆"的神秘世界，灵气充沛，修真者可以通过修炼提升境界，追求长生之道。世界分为凡境、灵境、仙境三大境界，每个境界又分为九重天。

主要人物：
1. 主角：叶天，18岁，灵根天赋极高但出身低微的少年。性格坚韧，意志坚定，拥有神秘的传承。

2. 师尊：云霄真人，千年修为的大能，性格古怪但心怀慈悲，收主角为徒。

3. 对手：司马云，世家大族继承人，天赋横溢，与主角既是对手又有暗中联系。

4. 女主：林月，仙门大族千金，医毒双绝，性格清冷但内心善良。

势力分布：
- 九大仙门：青云门、御剑宗、丹鼎派等
- 四大世家：司马、林、洛、姜
- 魔道势力：幽冥教、血魔宗

人物关系：
- 叶天拜入青云门，成为云霄真人关门弟子
- 与司马云在各大比试中多次交手，既有竞争又有惺惺相惜
- 在一次历练中救下林月，两人渐生情愫
- 身世之谜与各大势力都有着千丝万缕的联系

核心矛盾：
主角在追求长生大道的同时，需要解开自身身世之谜，同时面对正邪势力的明争暗斗。`;
            break;
        default:
            backgroundTemplate = `《${title}》是一部${genre}小说。

故事背景：
[这里是根据类型自动生成的详细背景描述...]

主要人物：
1. [主角姓名]：[年龄]，[身份]，[性格特点]
2. [重要配角]：[简要描述]
3. [对手/竞争者]：[简要描述]
4. [其他关键人物]：[简要描述]

人物关系：
- [主要人物之间的关系描述]
- [次要人物之间的关系描述]
- [潜在的矛盾点]

核心冲突：
[故事的主要矛盾和冲突]`;
    }
    
    // 模拟生成过程
    setTimeout(() => {
        if (backgroundText) {
            // 生成完成后的效果
            backgroundText.style.opacity = '1';
            backgroundText.disabled = false;
            backgroundText.value = backgroundTemplate;
            
            // 移除旧的提示
            const oldTip = document.querySelector('.alert-info');
            if (oldTip) {
                oldTip.remove();
            }
            
            // 添加编辑提示
            const editTip = document.createElement('div');
            editTip.className = 'alert alert-info mt-2';
            editTip.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>✓ 背景故事已生成完成！</strong><br>
                        <small>您可以：</small>
                        <ul class="mb-0">
                            <li>直接编辑上方文本框修改内容</li>
                            <li>点击"重新生成"尝试新的版本</li>
                            <li>点击"保存内容"保存当前版本</li>
                        </ul>
                    </div>
                </div>
            `;
            backgroundText.parentNode.appendChild(editTip);
            
            // 恢复重新生成按钮
            if (regenerateBtn) {
                regenerateBtn.disabled = false;
                regenerateBtn.innerHTML = '重新生成';
            }
        }
        hideLoading();
    }, 12000);
}

// 生成小说大纲
function generateOutline() {
    const title = document.getElementById('novelTitle').value;
    const genre = document.getElementById('novelGenre').value;
    const backgroundText = document.getElementById('backgroundText').value;
    const outlineText = document.getElementById('outlineText');
    const regenerateBtn = document.querySelector('#step3 .regenerate-btn');
    
    // 禁用重新生成按钮
    if (regenerateBtn) {
        regenerateBtn.disabled = true;
        regenerateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 生成中...';
    }
    
    // 显示初始状态
    if (outlineText) {
        outlineText.value = '系统正在构思大纲，请稍候...';
        outlineText.style.opacity = '0.7';
        outlineText.disabled = true;
    }
    
    // 显示加载状态
    showLoading('正在生成小说大纲...');
    
    // 根据不同类型生成不同的大纲模板
    let outlineTemplate = '';
    switch(genre) {
        case '都市生活':
            outlineTemplate = `《${title}》小说大纲

第一章：初入职场
- 李好入职互联网公司，初次见到陈远
- 接手重要项目，与张明产生第一次冲突
- 王小美给出建议，帮助李好度过难关

第二章：项目危机
- 项目进展不顺，面临deadline压力
- 陈远伸出援手，两人共同加班
- 张明从中作梗，项目陷入困境

第三章：转机与情愫
- 李好灵光一现，找到项目突破口
- 陈远对李好刮目相看，暗生情愫
- 张明嫉妒，开始暗中使绊子

第四章：创业契机
- 陈远提出创业计划，邀请李好加入
- 王小美支持李好放手一搏
- 张明得知后，散布不利谣言

第五章：感情抉择
- 李好在事业与感情间徘徊
- 陈远表明心意，但时机不恰当
- 王小美从旁调解，点醒李好

第六章：危机与转机
- 创业遭遇资金链危机
- 张明趁机挖角核心团队
- 李好临危不乱，展现领导才能

第七章：柳暗花明
- 项目获得重要投资
- 陈远与李好关系更进一步
- 张明阴谋败露，遭到惩罚

第八章：成功在望
- 公司走上正轨，团队凝聚力增强
- 李好与陈远终成眷属
- 王小美见证好友的成长与幸福

尾声：
- 一年后的公司年会
- 李好回顾创业历程的得失
- 对未来的展望与期待`;
            break;
        case '玄幻修仙':
            outlineTemplate = `《${title}》小说大纲

第一卷：灵根觉醒
第一章：平凡少年
- 叶天发现自己拥有超强灵根
- 被云霄真人收为关门弟子
- 初入青云门，结识同门师兄弟

第二章：修炼之路
- 习得基础功法，展现超强悟性
- 与司马云首次较量，不分胜负
- 救助受伤的林月，结下善缘

第二卷：宗门风云
第三章：宗门大比
- 参加青云门内门弟子选拔
- 施展独特功法，技惊四座
- 获得重要传承机缘

第四章：危机四伏
- 发现宗门内有奸细
- 林月遭遇暗算，叶天相救
- 司马云暗中相助，化解危机

第三卷：世家争锋
第五章：世家较量
- 四大世家会武开始
- 叶天代表青云门出战
- 与司马云再次对决，平分秋色

第六章：身世之谜
- 神秘高手现身，点破叶天身世
- 身具上古血脉，引发各方觊觎
- 林月相助，躲过追杀

第四卷：正邪之战
第七章：邪道入侵
- 幽冥教掀起滔天血浪
- 叶天临危受命，率队迎敌
- 发现幽冥教与身世有关

第八章：真相大白
- 身世之谜水落石出
- 与幽冥教决战，重创敌首
- 司马云相助，共同守护正道

第五卷：飞升之路
第九章：突破桎梏
- 突破灵境，踏入仙境
- 与林月情定三生
- 携手共踏长生路

终章：道法自然
- 飞升在即，处理世俗牵绊
- 与挚爱道侣共赴仙途
- 展望无尽的修真大道`;
            break;
        default:
            outlineTemplate = `《${title}》小说大纲

第一章：引子
- [开篇情节]
- [主要人物登场]
- [初始矛盾埋伏]

第二章：矛盾起
- [主要冲突展开]
- [人物关系发展]
- [情节推进要点]

第三章：波折
- [第一个转折点]
- [矛盾升级]
- [人物成长]

第四章：高潮
- [主要冲突爆发]
- [关键抉择]
- [重要转折]

第五章：结局
- [矛盾解决]
- [人物结局]
- [主题升华]

[根据具体类型补充更多章节内容...]`;
    }
    
    // 模拟生成过程
    setTimeout(() => {
        if (outlineText) {
            // 生成完成后的效果
            outlineText.style.opacity = '1';
            outlineText.disabled = false;
            outlineText.value = outlineTemplate;
            
            // 移除旧的提示
            const oldTip = document.querySelector('#step3 .alert-info');
            if (oldTip) {
                oldTip.remove();
            }
            
            // 添加编辑提示
            const editTip = document.createElement('div');
            editTip.className = 'alert alert-info mt-2';
            editTip.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>✓ 小说大纲已生成完成！</strong><br>
                        <small>您可以：</small>
                        <ul class="mb-0">
                            <li>直接编辑上方文本框修改内容</li>
                            <li>点击"重新生成"尝试新的版本</li>
                            <li>点击"保存内容"保存当前版本</li>
                        </ul>
                    </div>
                </div>
            `;
            outlineText.parentNode.appendChild(editTip);
            
            // 恢复重新生成按钮
            if (regenerateBtn) {
                regenerateBtn.disabled = false;
                regenerateBtn.innerHTML = '重新生成';
            }
        }
        hideLoading();
    }, 12000);
}

// 保存当前状态到 localStorage
function saveCurrentState() {
    const state = {
        currentStep: progressManager.currentStep,
        novelTitle: document.getElementById('novelTitle')?.value || '',
        novelGenre: document.getElementById('novelGenre')?.value || '',
        backgroundText: document.getElementById('backgroundText')?.value || '',
        outlineText: document.getElementById('outlineText')?.value || '',
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('novelGeneratorState', JSON.stringify(state));
    console.log('状态已保存:', state);
}

// 从 localStorage 恢复状态
function restoreState() {
    const savedState = localStorage.getItem('novelGeneratorState');
    if (savedState) {
        const state = JSON.parse(savedState);
        console.log('恢复状态:', state);
        
        // 恢复标题和类型
        if (state.novelTitle) {
            const titleInput = document.getElementById('novelTitle');
            if (titleInput) titleInput.value = state.novelTitle;
        }
        if (state.novelGenre) {
            const genreSelect = document.getElementById('novelGenre');
            if (genreSelect) genreSelect.value = state.novelGenre;
        }
        
        // 恢复背景内容
        if (state.backgroundText) {
            const backgroundText = document.getElementById('backgroundText');
            if (backgroundText) backgroundText.value = state.backgroundText;
        }
        
        // 恢复大纲内容
        if (state.outlineText) {
            const outlineText = document.getElementById('outlineText');
            if (outlineText) outlineText.value = state.outlineText;
        }
        
        // 恢复到正确的步骤
        if (state.currentStep > 1) {
            // 首先显示主界面
            if (appState.isAuthorized) {
                document.getElementById('authPanel').style.display = 'none';
                document.getElementById('mainContent').style.display = 'block';
            }
            
            // 然后恢复到正确的步骤
            for (let i = 1; i < state.currentStep; i++) {
                const currentStepItem = document.querySelector(`.step-item[data-step="${i}"]`);
                const nextStepItem = document.querySelector(`.step-item[data-step="${i + 1}"]`);
                if (currentStepItem && nextStepItem) {
                    currentStepItem.classList.remove('active');
                    currentStepItem.classList.add('completed');
                    nextStepItem.classList.add('active');
                }
                
                const currentContent = document.getElementById(`step${i}`);
                const nextContent = document.getElementById(`step${i + 1}`);
                if (currentContent && nextContent) {
                    currentContent.classList.remove('show', 'active');
                    nextContent.classList.add('show', 'active');
                }
            }
            progressManager.currentStep = state.currentStep;
        }
    }
}

// 在内容变化时保存状态
document.addEventListener('input', function(e) {
    if (['novelTitle', 'novelGenre', 'backgroundText', 'outlineText'].includes(e.target.id)) {
        saveCurrentState();
    }
});

// 导出Word文档
function exportToWord(content, filename) {
    const header = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">';
    const footer = '</html>';
    const sourceHTML = header + content + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = filename;
    fileDownload.click();
    document.body.removeChild(fileDownload);
}

// 导出Text文件
function exportToText(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = url;
    fileDownload.download = filename;
    fileDownload.click();
    document.body.removeChild(fileDownload);
    window.URL.revokeObjectURL(url);
}

// 复制内容到剪贴板
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            alert('内容已复制到剪贴板！');
        }).catch(() => {
            alert('复制失败，请手动复制。');
        });
    } else {
        // 降级方案
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert('内容已复制到剪贴板！');
        } catch (err) {
            alert('复制失败，请手动复制。');
        }
        document.body.removeChild(textArea);
    }
} 