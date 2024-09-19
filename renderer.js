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
    
    const rows = document.querySelectorAll('.matrix-row');
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            matrixData += `${input.value} `;
        });
        matrixData += '\n';
    });

    // 调用C程序
    const gaussianSolver = spawn('./gaussian_solver', [size]);

    // 将用户输入的数据传递给C程序
    gaussianSolver.stdin.write(matrixData);
    gaussianSolver.stdin.end();

    // 处理C程序的输出
    gaussianSolver.stdout.on('data', (data) => {
        document.getElementById('result').innerText = `C程序输出:\n${data}`;
    });

    // 捕捉C程序的错误
    gaussianSolver.stderr.on('data', (data) => {
        document.getElementById('result').innerText = `标准错误:\n${data}`;
    });

    // 监听子进程关闭事件
    gaussianSolver.on('close', (code) => {
        console.log(`C程序退出，退出码: ${code}`);
    });
}
