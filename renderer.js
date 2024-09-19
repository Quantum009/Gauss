const { spawn } = require('child_process');

// 监听阶数的变化，动态生成矩阵输入框
document.getElementById('size').addEventListener('change', function () {
    const size = this.value;
    const matrixInput = document.getElementById('matrix-input');
    matrixInput.innerHTML = '';

    for (let i = 0; i < size; i++) {
        const row = document.createElement('div');
        row.classList.add('matrix-row');

        for (let j = 0; j < size; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.placeholder = `a${i+1}${j+1}`;
            row.appendChild(input);
        }

        const constant = document.createElement('input');
        constant.type = 'number';
        constant.placeholder = `b${i+1}`;
        row.appendChild(constant);

        matrixInput.appendChild(row);
    }
});

function submitMatrix() {
    const size = document.getElementById('size').value;
    const matrixInput = document.getElementById('matrix-input');
    let matrixData = '';
    let matrixDisplay = '';  // 用于在页面上显示矩阵
    
    const rows = document.querySelectorAll('.matrix-row');
    rows.forEach((row, rowIndex) => {
        const inputs = row.querySelectorAll('input');
        let rowData = '';
        
        inputs.forEach((input, colIndex) => {
            matrixData += `${input.value} `;
            rowData += `${input.value} `; // 用于格式化展示的行数据
        });

        matrixDisplay += rowData.trim() + '\n';  // 添加每行的矩阵输入
        matrixData += '\n';
    });

    // 在提交前展示输入的矩阵
    document.getElementById('result').innerText = `输入的矩阵是:\n${matrixDisplay}`;

    // 调用C程序
    const gaussianSolver = spawn('./gaussian_solver', [size]);

    // 将用户输入的数据传递给C程序
    gaussianSolver.stdin.write(matrixData);
    gaussianSolver.stdin.end();

    // 处理C程序的输出
    gaussianSolver.stdout.on('data', (data) => {
        document.getElementById('result').innerText += `\nC程序输出:\n${data}`;
    });

    // 捕捉C程序的错误
    gaussianSolver.stderr.on('data', (data) => {
        document.getElementById('result').innerText += `\n标准错误:\n${data}`;
    });

    // 监听子进程关闭事件
    gaussianSolver.on('close', (code) => {
        console.log(`C程序退出，退出码: ${code}`);
    });
}
