const { exec } = require('child_process');

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

    // 调用C程序进行解算
    exec(`echo "${matrixData}" | ./gaussian_solver ${size}`, (error, stdout, stderr) => {
        if (error) {
            document.getElementById('result').innerText = `Error: ${error.message}`;
            return;
        }
        if (stderr) {
            document.getElementById('result').innerText = `Stderr: ${stderr}`;
            return;
        }
        document.getElementById('result').innerText = stdout;
    });
}

// 动态生成矩阵输入框
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
