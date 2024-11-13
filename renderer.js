const { spawn } = require('child_process');
const path = require('path');

// 更新矩阵输入界面
function createMatrixInputs() {
    const size = parseInt(document.getElementById('size').value);
    const matrixInput = document.getElementById('matrix-input');
    matrixInput.innerHTML = '';
    
    const matrixContainer = document.createElement('div');
    matrixContainer.className = 'matrix-container fade-in';
    
    for (let i = 0; i < size; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'matrix-row';
        rowDiv.style.animationDelay = `${i * 0.1}s`;

        // 系数矩阵输入
        for (let j = 0; j < size; j++) {
            const inputWrapper = document.createElement('div');
            inputWrapper.className = 'input-wrapper';
            
            const input = document.createElement('input');
            input.type = 'number';
            input.id = `a${i}_${j}`;
            input.className = 'matrix-input';
            input.placeholder = `a${i+1}${j+1}`;
            input.step = 'any';
            
            // 添加输入验证和格式化
            input.addEventListener('input', function() {
                validateNumberInput(this);
            });
            
            // 添加键盘导航
            input.addEventListener('keydown', function(e) {
                handleMatrixNavigation(e, i, j, size);
            });
            
            // 添加焦点样式
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
            });

            inputWrapper.appendChild(input);
            rowDiv.appendChild(inputWrapper);
        }

        // 等号
        const equalsSign = document.createElement('span');
        equalsSign.className = 'equals-sign';
        equalsSign.textContent = '=';
        rowDiv.appendChild(equalsSign);

        // 常数项输入
        const bWrapper = document.createElement('div');
        bWrapper.className = 'input-wrapper';
        
        const bInput = document.createElement('input');
        bInput.type = 'number';
        bInput.id = `b${i}`;
        bInput.className = 'matrix-input';
        bInput.placeholder = `b${i+1}`;
        bInput.step = 'any';
        
        bInput.addEventListener('input', function() {
            validateNumberInput(this);
        });
        
        bInput.addEventListener('keydown', function(e) {
            handleConstantNavigation(e, i, size);
        });
        
        bInput.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        bInput.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });

        bWrapper.appendChild(bInput);
        rowDiv.appendChild(bWrapper);

        matrixContainer.appendChild(rowDiv);
    }
    
    matrixInput.appendChild(matrixContainer);
}

// 数字输入验证和格式化
function validateNumberInput(input) {
    let value = input.value.trim();
    
    // 允许负号和小数点
    if (value === '-' || value === '.') return;
    
    // 处理数值
    if (value !== '') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
            // 限制小数位数为6位
            input.value = parseFloat(num.toFixed(6));
        } else {
            input.value = '';
        }
    }
}

// 检查输入是否合法
function validateInput() {
    const size = parseInt(document.getElementById('size').value);
    if (size < 1 || size > 10) {
        showError('矩阵阶数必须在1到10之间');
        return false;
    }

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const input = document.getElementById(`a${i}_${j}`);
            if (!input.value) {
                showError(`请输入系数 a${i+1}${j+1}`);
                input.focus();
                return false;
            }
        }
        
        const bInput = document.getElementById(`b${i}`);
        if (!bInput.value) {
            showError(`请输入常数项 b${i+1}`);
            bInput.focus();
            return false;
        }
    }

    return true;
}

// 提交计算
async function submitMatrix() {
    if (!validateInput()) {
        return;
    }

    const solveButton = document.getElementById('solve-button');
    const buttonText = solveButton.querySelector('span');
    const loading = solveButton.querySelector('.loading');
    buttonText.textContent = '计算中...';
    loading.style.display = 'inline-block';
    solveButton.disabled = true;

    try {
        const size = parseInt(document.getElementById('size').value);
        let inputString = '';

        // 首先添加矩阵元素提示语
        inputString += `请输入 ${size} x ${size} 矩阵元素:\n`;

        // 添加矩阵系数
        for (let i = 0; i < size; i++) {
            let rowString = '';
            for (let j = 0; j < size; j++) {
                const value = parseFloat(document.getElementById(`a${i}_${j}`).value) || 0;
                rowString += value + ' ';
            }
            inputString += rowString.trim() + '\n';
        }

        // 添加常数项提示语
        inputString += '请输入常数项:\n';

        // 添加常数项
        for (let i = 0; i < size; i++) {
            const value = parseFloat(document.getElementById(`b${i}`).value) || 0;
            inputString += value + '\n';
        }

        // 调用求解程序
        const exePath = path.join(__dirname, 'Gauss.exe');
        const args = [size.toString()];
        const resultArea = document.getElementById('result');
        resultArea.textContent = '计算中...\n';
        
        const cProgram = spawn(exePath, args);
        let output = '';
        let errorOutput = '';

        cProgram.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            resultArea.textContent = output;
            resultArea.scrollTop = resultArea.scrollHeight;
            
            // 添加高亮效果
            resultArea.classList.add('highlight');
            setTimeout(() => resultArea.classList.remove('highlight'), 300);
        });

        cProgram.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error('Error output:', errorOutput);
        });

        cProgram.on('error', (err) => {
            showError(`启动求解程序失败: ${err.message}`);
            buttonText.textContent = '求解';
            loading.style.display = 'none';
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
            
            buttonText.textContent = '求解';
            loading.style.display = 'none';
            solveButton.disabled = false;
        });

        // 写入输入数据
        cProgram.stdin.write(inputString);
        cProgram.stdin.end();

    } catch (error) {
        showError('程序执行出错：' + error.message);
        buttonText.textContent = '求解';
        loading.style.display = 'none';
        solveButton.disabled = false;
    }
}

// 错误提示
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message fade-in';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, document.getElementById('result').parentElement);
    
    setTimeout(() => {
        errorDiv.classList.add('fade-out');
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
}

// 填充示例数据
function fillExampleData() {
    const size = parseInt(document.getElementById('size').value);
    const examples = {
        2: {
            matrix: [[0, 1], [1, 0]],
            constants: [0, 1]
        },
        3: {
            matrix: [[2, 1, -1], [4, -1, 1], [-2, 3, 1]],
            constants: [2, 1, 3]
        },
        4: {
            matrix: [[4, -1, 0, 0], [-1, 4, -1, 0], [0, -1, 4, -1], [0, 0, -1, 3]],
            constants: [1, 0, 0, 1]
        }
    };

    if (!examples[size]) {
        showError(`暂无 ${size}x${size} 的示例数据`);
        return;
    }

    const example = examples[size];
    
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            setTimeout(() => {
                const input = document.getElementById(`a${i}_${j}`);
                input.value = example.matrix[i][j];
                input.classList.add('highlight');
                setTimeout(() => input.classList.remove('highlight'), 500);
            }, (i * size + j) * 100);
        }
        
        setTimeout(() => {
            const input = document.getElementById(`b${i}`);
            input.value = example.constants[i];
            input.classList.add('highlight');
            setTimeout(() => input.classList.remove('highlight'), 500);
        }, (i * size + size) * 100);
    }
}

// 清空输入
function clearInputs() {
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach((input, index) => {
        setTimeout(() => {
            input.value = '';
            input.classList.add('fade-out');
            setTimeout(() => input.classList.remove('fade-out'), 300);
        }, index * 50);
    });

    const resultArea = document.getElementById('result');
    resultArea.textContent = '';
    resultArea.classList.add('fade-out');
    setTimeout(() => resultArea.classList.remove('fade-out'), 300);
}

// 复制结果
function copyResults() {
    const resultArea = document.getElementById('result');
    const text = resultArea.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const notification = document.createElement('div');
        notification.className = 'copy-notification fade-in';
        notification.textContent = '已复制到剪贴板';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('fade-in');
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 1500);
    }).catch(err => {
        showError('复制失败：' + err.message);
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    createMatrixInputs();
    
    // 添加快捷键支持
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            submitMatrix();
        }
    });
});

// 在 renderer.js 底部添加以下代码
const { ipcRenderer } = require('electron');

// 处理菜单事件
ipcRenderer.on('new-matrix', () => {
    clearInputs();
});

ipcRenderer.on('clear-inputs', () => {
    clearInputs();
});

ipcRenderer.on('fill-example', () => {
    fillExampleData();
});

ipcRenderer.on('show-about', () => {
    alert('高斯消元法求解器 v1.0.0\n作者：Quantum\n');
});