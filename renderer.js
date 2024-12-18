const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');
const isDev = process.env.NODE_ENV === 'development';

// 创建矩阵输入界面
function createMatrixInputs() {
    const size = parseInt(document.getElementById('size').value);
    if (size < 1 || size > 20) {
        showError('矩阵阶数必须在1到20之间');
        return;
    }

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
            input.step = 'any';
            input.addEventListener('input', validateNumberInput);
            input.addEventListener('keydown', (e) => handleMatrixNavigation(e, i, j, size));
            rowDiv.appendChild(input);
        }

        // 常数项输入
        const bInput = document.createElement('input');
        bInput.type = 'number';
        bInput.id = `b${i}`;
        bInput.className = 'cell-input';
        bInput.placeholder = `b${i+1}`;
        bInput.step = 'any';
        bInput.addEventListener('input', validateNumberInput);
        bInput.addEventListener('keydown', (e) => handleConstantNavigation(e, i, size));

        rowDiv.appendChild(bInput);
        matrixInput.appendChild(rowDiv);
    }
}

// 验证数字输入
function validateNumberInput(event) {
    const input = event.target;
    let value = input.value.trim();
    
    if (value === '-' || value === '.') return;
    
    if (value !== '') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
            input.value = parseFloat(num.toFixed(6));
        } else {
            input.value = '';
        }
    }
}

// 矩阵输入导航
function handleMatrixNavigation(event, i, j, size) {
    if (event.key === 'Enter' || event.key === 'ArrowRight') {
        event.preventDefault();
        if (j < size - 1) {
            document.getElementById(`a${i}_${j+1}`).focus();
        } else {
            document.getElementById(`b${i}`).focus();
        }
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (j > 0) {
            document.getElementById(`a${i}_${j-1}`).focus();
        }
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (i < size - 1) {
            document.getElementById(`a${i+1}_${j}`).focus();
        }
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (i > 0) {
            document.getElementById(`a${i-1}_${j}`).focus();
        }
    }
}

// 常数项导航
function handleConstantNavigation(event, i, size) {
    if (event.key === 'Enter') {
        event.preventDefault();
        if (i < size - 1) {
            document.getElementById(`a${i+1}_0`).focus();
        }
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        document.getElementById(`a${i}_${size-1}`).focus();
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (i < size - 1) {
            document.getElementById(`b${i+1}`).focus();
        }
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (i > 0) {
            document.getElementById(`b${i-1}`).focus();
        }
    }
}

// 验证输入
function validateInput() {
    const size = parseInt(document.getElementById('size').value);
    if (size < 1 || size > 20) {
        showError('矩阵阶数必须在1到20之间');
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

// 提交求解
async function submitMatrix() {
    if (!validateInput()) return;

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
        const inputString = generateInputString(size);
        const exePath = isDev ? 
            path.join(__dirname, 'Gauss.exe') : 
            path.join(process.resourcesPath, 'Gauss.exe');

        const args = [size.toString(), method];
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
            showError(`启动求解程序失败: ${err.message}`);
            solveButton.disabled = false;
        });

        cProgram.on('close', (code) => {
            if (code === 0) {
                if (!output.trim()) {
                    showError('计算完成但没有输出结果');
                }
            }
            else {
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

// 生成输入字符串
function generateInputString(size) {
    let inputString = '';
    
    // 矩阵元素提示语
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

    // 常数项提示语
    inputString += '请输入常数项:\n';

    // 添加常数项
    for (let i = 0; i < size; i++) {
        const value = parseFloat(document.getElementById(`b${i}`).value) || 0;
        inputString += value + '\n';
    }

    return inputString;
}

// 错误提示
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

// 填充示例数据
function fillExampleData() {
    const size = parseInt(document.getElementById('size').value);
    const examples = {
        2: {
            matrix: [[2, -1], [-1, 2]],
            constants: [1, 1]
        },
        3: {
            matrix: [[4, -1, 0], [-1, 4, -1], [0, -1, 4]],
            constants: [1, 5, 2]
        },
        4: {
            matrix: [
                [10, -1, 2, 0],
                [-1, 11, -1, 3],
                [2, -1, 10, -1],
                [0, 3, -1, 8]
            ],
            constants: [6, 25, -11, 15]
        }
    };

    const example = examples[size];
    if (!example) {
        showError(`暂无 ${size}x${size} 的示例数据`);
        return;
    }

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const input = document.getElementById(`a${i}_${j}`);
            input.value = example.matrix[i][j];
        }
        const input = document.getElementById(`b${i}`);
        input.value = example.constants[i];
    }
}

// 清空输入
function clearInputs() {
    const inputs = document.querySelectorAll('.cell-input');
    inputs.forEach(input => {
        input.value = '';
    });
    document.getElementById('result').textContent = '';
}

// 复制结果
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
    createMatrixInputs();
    
    // 监听矩阵大小变化
    document.getElementById('size').addEventListener('change', () => {
        createMatrixInputs();
    });

    // 添加快捷键支持
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            submitMatrix();
        }
    });
});

// 处理菜单事件
const { ipcRenderer } = require('electron');

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
    const version = '1.0.0';
    const message = `线性方程组求解器 v${version}\n\n` +
                   '支持方法：\n' +
                   '- 高斯消元法\n' +
                   '- 高斯-赛德尔迭代法\n\n' +
                   '适用范围：\n' +
                   '- 1-20阶线性方程组\n' +
                   '- 对于大规模方程组(>10)建议使用高斯-赛德尔法\n\n' +
                   '快捷键：\n' +
                   'Ctrl+Enter: 求解\n' +
                   'Ctrl+N: 新建\n' +
                   'Ctrl+Delete: 清空';
    
    const { dialog } = require('@electron/remote');
    dialog.showMessageBox({
        type: 'info',
        title: '关于',
        message: message,
        buttons: ['确定']
    });
});