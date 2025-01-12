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

        if (authInfo.activated) {
            return { success: false, message: '此授权码已被使用' };
        }

        // 激活授权码
        authInfo.activated = new Date().toISOString();
        this.isAuthorized = true;
        
        // 保存授权状态
        localStorage.setItem('authCode', code);
        localStorage.setItem('authActivated', authInfo.activated);
        
        return { success: true, message: '验证成功！' };
    }

    checkAuthStatus() {
        const savedAuthCode = localStorage.getItem('authCode');
        const savedAuthActivated = localStorage.getItem('authActivated');
        
        if (savedAuthCode && savedAuthActivated) {
            const authInfo = this.validAuthCodes[savedAuthCode];
            if (authInfo && authInfo.activated === savedAuthActivated) {
                this.isAuthorized = true;
                return true;
            }
            // 清除无效的授权信息
            localStorage.removeItem('authCode');
            localStorage.removeItem('authActivated');
        }
        return false;
    }
    
    reset() {
        this.apiKey = null;
        this.currentNovel = null;
        this.progressManager.reset();
        this.isAuthorized = false;
        localStorage.removeItem('authCode');
        localStorage.removeItem('authActivated');
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
        document.getElementById('authPanel').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        console.log('已恢复授权状态');
    }
    
    // 绑定验证按钮点击事件
    const verifyButton = document.getElementById('verifyAuth');
    if (verifyButton) {
        verifyButton.addEventListener('click', function() {
            const authCode = document.getElementById('authCode').value.trim();
            const result = appState.verifyAuthCode(authCode);
            alert(result.message);
            
            if (result.success) {
                document.getElementById('authPanel').style.display = 'none';
                document.getElementById('mainContent').style.display = 'block';
            }
        });
        console.log('验证按钮事件已绑定');
    } else {
        console.error('找不到验证按钮元素');
    }
}); 

// 生成背景内容
function generateBackground() {
    const progressBar = document.querySelector('#step2 .progress-bar');
    const loadingText = document.querySelector('#step2 .loading-text');
    const backgroundContent = document.getElementById('backgroundContent');
    
    // 显示进度条和加载文本
    document.querySelector('#step2 .generation-progress').style.display = 'block';
    progressBar.style.width = '0%';
    
    // 模拟生成过程
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            // 隐藏进度条
            setTimeout(() => {
                document.querySelector('#step2 .generation-progress').style.display = 'none';
            }, 500);
        }
    }, 100);
}

// 生成大纲内容
function generateOutline() {
    const progressBar = document.querySelector('#step3 .progress-bar');
    const loadingText = document.querySelector('#step3 .loading-text');
    const outlineContent = document.getElementById('outlineContent');
    
    // 显示进度条和加载文本
    document.querySelector('#step3 .generation-progress').style.display = 'block';
    progressBar.style.width = '0%';
    
    // 模拟生成过程
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            // 隐藏进度条
            setTimeout(() => {
                document.querySelector('#step3 .generation-progress').style.display = 'none';
            }, 500);
        }
    }, 100);
}

// 重新生成背景
function regenerateBackground() {
    generateBackground();
}

// 重新生成大纲
function regenerateOutline() {
    generateOutline();
}

// 保存内容
function saveContent() {
    alert('内容已保存！');
}

// 导出为 Word
function exportWord() {
    alert('正在导出 Word 文件...');
}

// 导出为 Text
function exportText() {
    alert('正在导出 Text 文件...');
}

// 复制内容
function copyContent() {
    alert('内容已复制到剪贴板！');
} 