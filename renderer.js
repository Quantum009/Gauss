const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');
const { ipcRenderer } = require('electron');
const isDev = process.env.NODE_ENV === 'development';

// 矩阵管理类
class MatrixManager {
    static createInputs() {
        const size = validateIntegerInput(document.getElementById('size'), 1, 100);
        const matrixInput = document.getElementById('matrix-input');
        matrixInput.innerHTML = '';
        
        for (let i = 0; i < size; i++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'matrix-row';

            // 系数矩阵输入
            for (let j = 0; j < size; j++) {
                const input = document.createElement('input');
                input.type = 'number';
                input.id = `a${i}_${j}`;
                input.className = 'cell-input';
                input.placeholder = `a${i+1}${j+1}`;
                input.addEventListener('input', validateNumberInput);
                input.addEventListener('keydown', (e) => this.handleNavigation(e, i, j, size));
                rowDiv.appendChild(input);
            }

            // 常数项输入
            const bInput = document.createElement('input');
            bInput.type = 'number';
            bInput.id = `b${i}`;
            bInput.className = 'cell-input';
            bInput.placeholder = `b${i+1}`;
            bInput.addEventListener('input', validateNumberInput);
            bInput.addEventListener('keydown', (e) => this.handleConstantNavigation(e, i, size));

            rowDiv.appendChild(bInput);
            matrixInput.appendChild(rowDiv);
        }
    }

    static handleNavigation(event, i, j, size) {
        const keyActions = {
            'Enter': () => this.moveFocus(i, j, size, 'next'),
            'ArrowRight': () => this.moveFocus(i, j, size, 'right'),
            'ArrowLeft': () => this.moveFocus(i, j, size, 'left'),
            'ArrowDown': () => this.moveFocus(i, j, size, 'down'),
            'ArrowUp': () => this.moveFocus(i, j, size, 'up')
        };

        if (keyActions[event.key]) {
            event.preventDefault();
            keyActions[event.key]();
        }
    }

    static handleConstantNavigation(event, i, size) {
        const keyActions = {
            'Enter': () => i < size - 1 ? document.getElementById(`a${i+1}_0`).focus() : null,
            'ArrowLeft': () => document.getElementById(`a${i}_${size-1}`).focus(),
            'ArrowDown': () => i < size - 1 ? document.getElementById(`b${i+1}`).focus() : null,
            'ArrowUp': () => i > 0 ? document.getElementById(`b${i-1}`).focus() : null
        };

        if (keyActions[event.key]) {
            event.preventDefault();
            keyActions[event.key]();
        }
    }

    static moveFocus(i, j, size, direction) {
        const directionMap = {
            'next': () => j < size - 1 ? `a${i}_${j+1}` : `b${i}`,
            'right': () => j < size - 1 ? `a${i}_${j+1}` : `b${i}`,
            'left': () => j > 0 ? `a${i}_${j-1}` : null,
            'down': () => i < size - 1 ? `a${i+1}_${j}` : null,
            'up': () => i > 0 ? `a${i-1}_${j}` : null
        };

        const nextId = directionMap[direction]();
        if (nextId) {
            document.getElementById(nextId).focus();
        }
    }

    static generateRandom() {
        const size = validateIntegerInput(document.getElementById('size'), 1, 100);
        const min = parseFloat(document.getElementById('random-min').value);
        const max = parseFloat(document.getElementById('random-max').value);
        const decimals = validateIntegerInput(document.getElementById('decimal-places'), 0, 6);
        
        if (isNaN(min) || isNaN(max) || min >= max) {
            showError('请输入有效的随机数范围');
            return;
        }

        // 确保当前矩阵大小与选择的阶数匹配
        if (document.querySelectorAll('.matrix-row').length !== size) {
            this.createInputs();
        }

        // 生成随机矩阵
        for (let i = 0; i < size; i++) {
            let rowSum = 0;
            for (let j = 0; j < size; j++) {
                if (i !== j) {
                    const value = this.generateRandomNumber(min/2, max/2, decimals);
                    document.getElementById(`a${i}_${j}`).value = value;
                    rowSum += Math.abs(value);
                }
            }
            // 确保对角占优
            const diagValue = this.generateRandomNumber(rowSum * 1.5, rowSum * 2, decimals);
            document.getElementById(`a${i}_${i}`).value = diagValue;
            // 生成常数项
            document.getElementById(`b${i}`).value = this.generateRandomNumber(min, max, decimals);
        }
    }

    static generateRandomNumber(min, max, decimals) {
        const num = Math.random() * (max - min) + min;
        return Number(num.toFixed(decimals));
    }
}

// 文件处理类
class FileHandler {
    static async handleFileInput(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const lines = text.trim().split('\n');
            const data = lines.map(line => line.trim().split(/[,\s]+/).map(Number));
            
            if (data.length === 0) throw new Error('文件为空');
            const n = data.length;
            if (!data.every(row => row.length === n + 1)) {
                throw new Error('矩阵格式不正确，每行应该包含n个系数和1个常数项');
            }

            document.getElementById('size').value = n;
            MatrixManager.createInputs();

            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    document.getElementById(`a${i}_${j}`).value = data[i][j];
                }
                document.getElementById(`b${i}`).value = data[i][n];
            }
        } catch (error) {
            showError(`读取文件失败: ${error.message}`);
        }
    }
}

// 求解管理类
class SolverManager {
    static async submitMatrix() {
        if (!this.validateInput()) return;

        const size = parseInt(document.getElementById('size').value);
        const method = document.getElementById('solve-method').value;
        
        if (method === '0' && size > 10) {
            if (!confirm('对于大规模方程组（>10），建议使用高斯-赛德尔法。是否继续使用高斯消元法？')) {
                return;
            }
        }

        const solveButton = document.getElementById('solve-button');
        solveButton.disabled = true;
        const resultArea = document.getElementById('result');
        resultArea.textContent = '计算中...\n';

        try {
            const inputString = this.generateInputString(size);
            const exePath = isDev ? 
                path.join(__dirname, 'Gauss.exe') : 
                path.join(process.resourcesPath, 'Gauss.exe');

            const args = [size.toString(), method];
            console.log('执行命令:', exePath, args);

            const cProgram = spawn(exePath, args);
            let output = '';
            let errorOutput = '';

            cProgram.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                resultArea.textContent = output;
                resultArea.scrollTop = resultArea.scrollHeight;
            });

            cProgram.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.error('Error output:', errorOutput);
            });

            cProgram.on('error', (err) => {
                showError(`启动求解程序失败: ${err.message}\n路径: ${exePath}`);
                console.error('启动错误:', err);
                solveButton.disabled = false;
            });

            cProgram.on('close', (code) => {
                if (code === 0) {
                    if (!output.trim()) {
                        showError('计算完成但没有输出结果');
                    }
                } else {
                    showError(`计算过程出错 (错误代码: ${code})\n${errorOutput}`);
                }
                solveButton.disabled = false;
            });

            cProgram.stdin.write(inputString);
            cProgram.stdin.end();

        } catch (error) {
            showError('程序执行出错：' + error.message);
            solveButton.disabled = false;
        }
    }

    static validateInput() {
        const size = validateIntegerInput(document.getElementById('size'), 1, 100);

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const input = document.getElementById(`a${i}_${j}`);
                if (!input.value.trim()) {
                    showError(`请输入系数 a${i+1}${j+1}`);
                    input.focus();
                    return false;
                }
            }
            
            const bInput = document.getElementById(`b${i}`);
            if (!bInput.value.trim()) {
                showError(`请输入常数项 b${i+1}`);
                bInput.focus();
                return false;
            }
        }

        return true;
    }

    static generateInputString(size) {
        let inputString = `请输入 ${size} x ${size} 矩阵元素:\n`;

        for (let i = 0; i < size; i++) {
            let rowString = '';
            for (let j = 0; j < size; j++) {
                const value = parseFloat(document.getElementById(`a${i}_${j}`).value) || 0;
                rowString += value + ' ';
            }
            inputString += rowString.trim() + '\n';
        }

        inputString += '请输入常数项:\n';

        for (let i = 0; i < size; i++) {
            const value = parseFloat(document.getElementById(`b${i}`).value) || 0;
            inputString += value + '\n';
        }

        return inputString;
    }
}

// 工具函数
function validateNumberInput(event) {
    const input = event.target;
    let value = input.value.trim();
    
    if (value === '-' || value === '.' || value === '-.') return;
    
    if (value !== '') {
        const num = parseFloat(value);
        if (isNaN(num)) {
            input.value = '';
        }
    }
}

function validateIntegerInput(input, min, max) {
    let value = parseInt(input.value);
    if (isNaN(value)) value = min;
    value = Math.max(min, Math.min(value, max));
    input.value = value;
    return value;
}

function showError(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const matrixContainer = document.querySelector('.matrix-container');
    matrixContainer.insertBefore(errorDiv, matrixContainer.firstChild);

    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function clearInputs() {
    document.querySelectorAll('.cell-input').forEach(input => {
        input.value = '';
    });
    document.getElementById('result').textContent = '';
}

function copyResults() {
    const resultArea = document.getElementById('result');
    const text = resultArea.textContent;
    
    if (!text.trim()) {
        showError('没有可复制的结果');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        const originalText = resultArea.textContent;
        resultArea.textContent = '结果已复制到剪贴板\n' + originalText;
        setTimeout(() => {
            resultArea.textContent = originalText;
        }, 1500);
    }).catch(err => {
        showError('复制失败：' + err.message);
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 创建初始矩阵
    MatrixManager.createInputs();
    
    // 监听矩阵大小变化
    document.getElementById('size').addEventListener('input', () => {
        MatrixManager.createInputs();
    });

    // 监听输入方式切换
    document.getElementById('input-method').addEventListener('change', (e) => {
        const fileSection = document.getElementById('file-input-section');
        const randomSection = document.getElementById('random-input-section');
        const manualInputs = document.getElementById('matrix-input');
        
        switch(e.target.value) {
            case 'file':
                fileSection.style.display = 'block';
                randomSection.style.display = 'none';
                manualInputs.style.opacity = '0.5';
                break;
            case 'random':
                fileSection.style.display = 'none';
                randomSection.style.display = 'block';
                manualInputs.style.opacity = '1';
                break;
            default:
                fileSection.style.display = 'none';
                randomSection.style.display = 'none';
                manualInputs.style.opacity = '1';
        }
    });

    // 监听文件选择
    document.getElementById('file-input').addEventListener('change', FileHandler.handleFileInput);

    // 监听快捷键
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            SolverManager.submitMatrix();
        }
    });
});

// 全局函数导出
window.submitMatrix = () => SolverManager.submitMatrix();
window.generateRandomMatrix = () => MatrixManager.generateRandom();
window.clearInputs = clearInputs;
window.copyResults = copyResults;

// IPC 事件处理
ipcRenderer.on('new-matrix', clearInputs);
ipcRenderer.on('clear-inputs', clearInputs);
ipcRenderer.on('fill-example', () => MatrixManager.generateRandom());
ipcRenderer.on('show-about', () => {
    const version = '0.2.0';
    const message = `线性方程组求解器 v${version}

支持方法：
- 高斯消元法
- 高斯-赛德尔迭代法

适用范围：
- 1-100阶线性方程组
- 对于大规模方程组(>10)建议使用高斯-赛德尔法

输入方式：
- 手动输入
- 文件导入 (CSV/TXT)
- 随机生成

快捷键：
Ctrl+Enter: 求解
Ctrl+N: 新建
Ctrl+Delete: 清空
F12: 开发者工具`;
    
    const { dialog } = require('@electron/remote');
    dialog.showMessageBox({
        type: 'info',
        title: '关于',
        message: message,
        buttons: ['确定']
    });
});