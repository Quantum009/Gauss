#include <stdio.h>
#include <stdlib.h>
#include <math.h>

void printMatrix(double matrix[100][100], double constants[100], int n) {
    printf("当前矩阵状态:\n");
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            printf("%.2f ", matrix[i][j]);
        }
        printf("| %.2f\n", constants[i]); // 输出常数项
    }
    printf("\n");
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        printf("请提供矩阵的阶数。\n");
        return 1;
    }

    int n = atoi(argv[1]); // 方程组的阶数
    if (n <= 0 || n > 100) {
        printf("矩阵阶数必须介于1和100之间。\n");
        return 1;
    }

    double matrix[100][100];
    double constants[100];
    double results[100];

    // 从标准输入读取系数矩阵
    printf("请输入 %d x %d 矩阵元素:\n", n, n);
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            scanf("%lf", &matrix[i][j]); // 读取系数矩阵
        }
    }

    // 从标准输入读取常数项
    printf("请输入常数项:\n");
    for (int i = 0; i < n; i++) {
        scanf("%lf", &constants[i]); // 读取常数项
    }

    // 打印输入的矩阵和常数项
    printf("输入的矩阵是:\n");
    printMatrix(matrix, constants, n);

    // 高斯消元法
    for (int i = 0; i < n; i++) {
        // 部分主元选取
        int maxRow = i;
        for (int k = i + 1; k < n; k++) {
            if (fabs(matrix[k][i]) > fabs(matrix[maxRow][i])) {
                maxRow = k;
            }
        }

        // 如果最大值为0，说明矩阵可能是奇异的，无法求解
        if (fabs(matrix[maxRow][i]) < 1e-10) {
            printf("矩阵是奇异的，无法求解。\n");
            return 1;
        }

        // 交换行
        printf("交换第 %d 行和第 %d 行:\n", i + 1, maxRow + 1);
        for (int k = i; k < n; k++) {
            double tmp = matrix[maxRow][k];
            matrix[maxRow][k] = matrix[i][k];
            matrix[i][k] = tmp;
        }
        double tmp = constants[maxRow];
        constants[maxRow] = constants[i];
        constants[i] = tmp;

        // 打印交换后的矩阵
        printMatrix(matrix, constants, n);

        // 高斯消元
        for (int k = i + 1; k < n; k++) {
            double factor = matrix[k][i] / matrix[i][i];
            printf("消去第 %d 行的第 %d 列，消元因子 = %.2f\n", k + 1, i + 1, factor);
            for (int j = i; j < n; j++) {
                matrix[k][j] -= factor * matrix[i][j];
            }
            constants[k] -= factor * constants[i];

            // 打印消元后的矩阵
            printMatrix(matrix, constants, n);
        }
    }

    // 回代求解
    printf("开始回代过程:\n");
    for (int i = n - 1; i >= 0; i--) {
        results[i] = constants[i];
        for (int j = i + 1; j < n; j++) {
            results[i] -= matrix[i][j] * results[j];
        }
        results[i] /= matrix[i][i];
        printf("x%d = %.2f\n", i + 1, results[i]);
    }

    // 输出结果
    printf("最终解向量为:\n");
    for (int i = 0; i < n; i++) {
        printf("x%d = %.2f\n", i + 1, results[i]);
    }

    return 0;
}
