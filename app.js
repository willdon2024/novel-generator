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
});

// 步骤切换函数
function nextStep(currentStepNumber) {
    // 验证当前步骤的输入
    if (currentStepNumber === 1) {
        const title = document.getElementById('novelTitle').value;
        const genre = document.getElementById('novelGenre').value;
        if (!title || !genre) {
            alert('请填写小说标题和选择类型');
            return;
        }
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
        currentContent.classList.remove('active');
        nextContent.classList.add('active');
        progressManager.nextStep();
    }
}

function prevStep(currentStepNumber) {
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
        currentContent.classList.remove('active');
        prevContent.classList.add('active');
        progressManager.prevStep();
    }
} 