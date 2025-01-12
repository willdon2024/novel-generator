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
    
    // 首先检查授权状态
    if (appState.checkAuthStatus()) {
        // 显示剩余天数
        const remainingDays = Math.ceil((appState.authExpiry - new Date()) / (1000 * 60 * 60 * 24));
        console.log(`授权码有效，剩余${remainingDays}天`);
        
        // 显示主界面
        document.getElementById('authPanel').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        
        // 恢复之前的状态
        setTimeout(() => {
            restoreState();
        }, 100);
    } else {
        // 未授权或授权过期，显示授权界面
        document.getElementById('authPanel').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';
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
    
    // 重新绑定第三步的重新生成按钮
    const outlineRegenerateBtn = document.querySelector('#step3 .regenerate-btn');
    if (outlineRegenerateBtn) {
        outlineRegenerateBtn.addEventListener('click', function() {
            console.log('点击重新生成大纲按钮');
            generateOutline();
        });
    }
    
    // 重新绑定第三步的保存按钮
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
    
    // 重新绑定快捷按钮事件
    const quickButtons = document.querySelectorAll('.quick-action-btn');
    quickButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('点击快捷按钮:', this.textContent.trim());
            const action = this.textContent.trim();
            const currentStep = parseInt(this.closest('.tab-pane').id.replace('step', ''));
            const textArea = document.getElementById(currentStep === 2 ? 'backgroundText' : 'outlineText');
            
            if (textArea) {
                const currentContent = textArea.value;
                switch(action) {
                    case '调整情节发展':
                        textArea.value = currentContent + '\n\n[调整后的情节发展...]\n';
                        break;
                    case '增加故事转折':
                        textArea.value = currentContent + '\n\n[新增的故事转折...]\n';
                        break;
                    case '优化结局设计':
                        textArea.value = currentContent + '\n\n[优化后的结局...]\n';
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
    
    // 重新绑定编辑按钮
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = parseInt(this.closest('.tab-pane').id.replace('step', ''));
            const textArea = document.getElementById(currentStep === 2 ? 'backgroundText' : 'outlineText');
            
            if (textArea) {
                textArea.disabled = !textArea.disabled;
                this.textContent = textArea.disabled ? '编辑内容' : '完成编辑';
                if (!textArea.disabled) {
                    textArea.focus();
                }
                console.log(`${currentStep === 2 ? '背景' : '大纲'}文本框编辑状态: ${!textArea.disabled}`);
            }
        });
    });
    
    // 绑定API Key验证按钮点击事件
    const apiKeyConfirmBtn = document.querySelector('.api-key-confirm');
    if (apiKeyConfirmBtn) {
        apiKeyConfirmBtn.addEventListener('click', function() {
            console.log('点击API Key确认按钮');
            const apiKeyInput = document.querySelector('input[type="password"]');
            if (apiKeyInput) {
                const apiKey = apiKeyInput.value.trim();
                if (apiKey) {
                    // 保存API Key
                    appState.setApiKey(apiKey);
                    
                    // 禁用输入框和按钮
                    apiKeyInput.disabled = true;
                    this.disabled = true;
                    
                    // 显示成功提示
                    const successTip = document.createElement('div');
                    successTip.className = 'alert alert-success mt-2';
                    successTip.innerHTML = '<strong>✓ API Key已保存！</strong>';
                    apiKeyInput.parentNode.appendChild(successTip);
                    
                    // 3秒后自动进入下一步
                    setTimeout(() => {
                        const currentStep = progressManager.currentStep;
                        nextStep(currentStep);
                    }, 1500);
                } else {
                    alert('请输入API Key');
                }
            }
        });
        console.log('API Key确认按钮事件已绑定');
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
    console.log('开始生成故事背景');
    const backgroundText = document.getElementById('backgroundText');
    const regenerateBtn = document.querySelector('#step2 .regenerate-btn');
    const editBtn = document.querySelector('#step2 .edit-btn');
    
    if (backgroundText && regenerateBtn) {
        // 禁用重新生成按钮
        regenerateBtn.disabled = true;
        regenerateBtn.innerHTML = '生成中...';
        
        // 禁用文本框编辑
        backgroundText.disabled = true;
        backgroundText.style.opacity = '0.7';
        backgroundText.value = '正在生成故事背景和人物关系，请稍候...';
        
        // 显示加载状态
        showLoading('正在生成故事背景...');
        
        // 获取小说类型
        const genre = document.getElementById('novelGenre').value;
        
        // 根据类型生成不同的背景模板
        let backgroundTemplate = '';
        if (genre === '都市生活') {
            backgroundTemplate = generateUrbanLifeBackground();
        } else if (genre === '玄幻修仙') {
            backgroundTemplate = generateFantasyBackground();
        } else {
            backgroundTemplate = generateGeneralBackground();
        }
        
        // 模拟生成过程
        setTimeout(() => {
            if (backgroundText) {
                // 生成完成后的效果
                backgroundText.style.opacity = '1';
                backgroundText.disabled = true; // 默认不可编辑
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
                                <li>点击"编辑内容"开始修改</li>
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
}

// 生成都市生活类型的背景
function generateUrbanLifeBackground() {
    const templates = [
        `故事背景：
现代都市商业社会，一线城市的金融中心。

主要人物：
1. 林志远（男主）：28岁，投资公司分析师，事业心强，理性果断
2. 苏梦琪（女主）：26岁，新媒体创业者，独立坚韧，充满创意
3. 陈天明（对手）：35岁，投资公司总监，城府深，表面谦和
4. 张雨晴（闺蜜）：27岁，广告公司主管，热心开朗，为人仗义

人物关系：
- 林志远和苏梦琪在一次创业路演中相识，产生好感
- 陈天明暗中觊觎苏梦琪的创业项目，对林志远心生嫉妒
- 张雨晴是苏梦琪的闺蜜，也是林志远的创业顾问

核心矛盾：
商业与爱情的双重考验，职场阴谋与个人成长的碰撞。`,

        `故事背景：
魔都浦东，一座充满机遇与挑战的现代化都市。

主要人物：
1. 秦明（男主）：30岁，互联网公司技术总监，低调内敛，技术过人
2. 李雨欣（女主）：25岁，海归创业者，开朗自信，富有远见
3. 王博（竞争对手）：32岁，行业独角兽CEO，野心勃勃，手段强硬
4. 赵小婷（助手）：28岁，项目经理，能力出众，忠诚可靠

人物关系：
- 秦明和李雨欣因一次技术合作结缘，暗生情愫
- 王博觊觎李雨欣的创新技术，试图恶意收购
- 赵小婷是秦明的得力助手，帮助两人对抗商业阴谋

核心矛盾：
创业梦想与商业现实的碰撞，纯粹技术与资本角逐的较量。`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
}

// 生成玄幻修仙类型的背景
function generateFantasyBackground() {
    const templates = [
        `故事背景：
九天仙界，一个充满灵力与神秘的修真世界。

主要人物：
1. 叶青云（男主）：天赋异禀的散修，身怀神秘血脉
2. 洛仙儿（女主）：仙门大族嫡女，冰雪聪明，性格清冷
3. 魔尊白泽（反派）：上古魔门之主，实力通天，野心勃勃
4. 道玄真人（师尊）：隐世高人，收男主为徒，深藏不露

人物关系：
- 叶青云与洛仙儿因机缘相识，命运相连
- 魔尊白泽觊觎叶青云体内的神秘血脉
- 道玄真人暗中指引，守护众人命运

核心矛盾：
修真大道与情感羁绊的抉择，正道与魔道的终极对决。`,

        `故事背景：
太虚界，一方广袤无垠的修仙世界。

主要人物：
1. 林逸（男主）：废材少年，觉醒上古传承
2. 姜雪（女主）：丹宗圣女，医毒双绝，性格孤傲
3. 玄阴老祖（大反派）：远古魔头，图谋不轨
4. 青云子（神秘人）：世外高人，暗中相助

人物关系：
- 林逸与姜雪因丹药结缘，渐生情愫
- 玄阴老祖觊觎林逸的上古传承，欲夺舍重生
- 青云子是林逸前世好友，转世后暗中守护

核心矛盾：
修仙之路与情感抉择，守护苍生与个人追求的平衡。`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
}

// 生成通用类型的背景
function generateGeneralBackground() {
    const templates = [
        `故事背景：
现代都市与奇幻元素交织的世界。

主要人物：
1. 主角：25岁，普通上班族，意外获得特殊能力
2. 女主：23岁，神秘组织成员，性格独特
3. 反派：身份成谜，具有强大力量
4. 引路人：主角的神秘长辈，知晓许多秘密

人物关系：
- 主角和女主因特殊事件相识
- 反派与主角有着不解之缘
- 引路人暗中保护主角成长

核心矛盾：
能力觉醒后的人生抉择，正与邪的较量。`,

        `故事背景：
架空历史世界，科技与玄学并存。

主要人物：
1. 男主：20岁，普通学生，意外卷入大事件
2. 女主：19岁，特殊组织成员，身手不凡
3. 对手：组织高层，表面正义，暗藏阴谋
4. 导师：神秘老者，教导主角成长

人物关系：
- 男女主因任务相识，共同成长
- 对手处处针对主角，图谋不轨
- 导师是主角命运的引路人

核心矛盾：
个人成长与世界真相的探索，正义与邪恶的对抗。`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
}

// 生成小说大纲
function generateOutline() {
    console.log('开始生成小说大纲');
    const outlineText = document.getElementById('outlineText');
    const regenerateBtn = document.querySelector('#step3 .regenerate-btn');
    
    if (outlineText && regenerateBtn) {
        // 禁用重新生成按钮
        regenerateBtn.disabled = true;
        regenerateBtn.innerHTML = '生成中...';
        
        // 禁用文本框编辑
        outlineText.disabled = true;
        outlineText.style.opacity = '0.7';
        outlineText.value = '正在生成小说大纲，请稍候...';
        
        // 显示加载状态
        showLoading('正在生成小说大纲...');
        
        // 获取小说类型和背景
        const genre = document.getElementById('novelGenre').value;
        const background = document.getElementById('backgroundText').value;
        
        // 根据类型生成不同的大纲模板
        let outlineTemplate = '';
        if (genre === '都市生活') {
            outlineTemplate = `第一章：都市新人
1. 主角李好初入职场，展现出色的业务能力
2. 与同事和上级的初步互动，建立人际关系
3. 发现公司内部存在的一些问题

第二章：职场挑战
1. 接手一个重要项目
2. 遭遇项目合作方的刁难
3. 通过智慧和努力解决困境

第三章：感情纠葛
1. 与青梅竹马重逢
2. 工作中结识新的异性朋友
3. 感情与事业的平衡

第四章：事业转折
1. 公司内部重组
2. 面临升职机会
3. 竞争对手的明争暗斗

第五章：危机与机遇
1. 项目出现重大危机
2. 团队分裂与重组
3. 寻找解决方案的过程

第六章：逆境翻盘
1. 找到项目漏洞的关键
2. 成功化解危机
3. 得到公司高层认可

第七章：情感抉择
1. 理清感情脉络
2. 做出人生选择
3. 获得成长与领悟

第八章：成功蜕变
1. 事业取得重大突破
2. 个人成长总结
3. 展望美好未来

尾声：
主角在经历职场与感情的双重考验后，最终实现了自我价值，找到了真爱，完成了从职场新人到独当一面的蜕变。`;
        } else if (genre === '玄幻修仙') {
            outlineTemplate = `第一卷：凡尘起步
第一章：灵根觉醒
1. 主角发现自身特殊灵根
2. 拜入仙门
3. 初识修仙界规则

第二章：修炼之路
1. 学习基础功法
2. 结识同门师兄弟
3. 展现修炼天赋

第三章：首次历练
1. 参与门派任务
2. 遭遇危险
3. 获得机缘

第二卷：宗门风云
第四章：宗门大比
1. 参加内门选拔
2. 展示实力
3. 获得重要传承

第五章：仙缘际会
1. 获得上古秘籍
2. 突破修为瓶颈
3. 结识重要人物

第三卷：天地大劫
第六章：劫难降临
1. 发现惊天阴谋
2. 宗门遭遇危机
3. 奋起抗敌

第七章：逆天改命
1. 突破修为境界
2. 力挽狂澜
3. 拯救宗门

第八章：飞升在望
1. 飞升之路显现
2. 完成最后突破
3. 实现终极目标

第九章：道法自然
1. 悟道成真
2. 羽化登仙
3. 位列仙班

终章：
主角历经重重磨难，最终悟得真道，完成了从凡人到仙人的蜕变，实现了最终的飞升梦想。`;
        } else {
            outlineTemplate = `第一章：开篇
1. 背景介绍
2. 主要人物登场
3. 初始矛盾埋下

第二章：矛盾展开
1. 冲突加剧
2. 人物关系发展
3. 故事线索延伸

第三章：高潮迭起
1. 关键事件发生
2. 人物性格显现
3. 矛盾升级

第四章：危机显现
1. 重大转折
2. 人物抉择
3. 局势变化

第五章：结局
1. 矛盾解决
2. 人物成长
3. 故事升华

尾声：
总结故事主题，展现人物最终命运。`;
        }
        
        // 模拟生成过程
        setTimeout(() => {
            if (outlineText) {
                // 生成完成后的效果
                outlineText.style.opacity = '1';
                outlineText.disabled = true; // 默认不可编辑
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
                                <li>点击"编辑内容"开始修改</li>
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
}

// 添加防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 使用防抖优化的保存状态函数
const debouncedSaveState = debounce(function() {
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
}, 1000); // 1秒后执行保存

// 修改事件监听，使用防抖的保存函数
document.addEventListener('input', function(e) {
    if (['novelTitle', 'novelGenre', 'backgroundText', 'outlineText'].includes(e.target.id)) {
        debouncedSaveState();
    }
});

// 修改状态恢复函数，确保在DOM完全加载后执行
function restoreState() {
    // 确保DOM已经完全加载
    if (!document.getElementById('novelTitle') || 
        !document.getElementById('novelGenre') || 
        !document.getElementById('backgroundText') || 
        !document.getElementById('outlineText')) {
        console.log('DOM元素未完全加载，延迟恢复状态');
        setTimeout(restoreState, 100);
        return;
    }

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
            if (backgroundText) {
                backgroundText.value = state.backgroundText;
                backgroundText.disabled = true; // 确保文本框默认是禁用的
            }
        }
        
        // 恢复大纲内容
        if (state.outlineText) {
            const outlineText = document.getElementById('outlineText');
            if (outlineText) {
                outlineText.value = state.outlineText;
                outlineText.disabled = true; // 确保文本框默认是禁用的
            }
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