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
    } else {
        console.error('找不到验证按钮元素');
    }
    
    // 绑定重新生成按钮
    const regenerateBtn = document.querySelector('.regenerate-btn');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', function() {
            generateBackground();
        });
    }
    
    // 绑定保存按钮
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const backgroundText = document.getElementById('backgroundText');
            if (backgroundText && backgroundText.value.trim()) {
                // 这里添加保存逻辑
                alert('内容已保存！');
            }
        });
    }
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