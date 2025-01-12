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
        backgroundText.disabled = true; // 生成过程中禁用编辑
    }
    
    // 显示加载状态
    showLoading('正在启动生成引擎...');
    
    // 这里添加实际的生成逻辑
    console.log('生成故事背景:', { title, genre });
    
    // 模拟生成过程
    setTimeout(() => {
        if (backgroundText) {
            // 生成完成后的效果
            backgroundText.style.opacity = '1';
            backgroundText.disabled = false; // 允许编辑
            backgroundText.value = `《${title}》是一部${genre}小说...\n\n这里是生成的故事背景和人物关系...`;
            
            // 移除旧的提示（如果存在）
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
    }, 12000); // 设置较长的等待时间以模拟实际生成过程
} 