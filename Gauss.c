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

    // 高斯消元法（不进行主元选取和行交换）
    for (int i = 0; i < n; i++) {
        // 检查主对角线元素是否为零
        if (fabs(matrix[i][i]) < 1e-10) {
            printf("主对角线元素为零，无法继续计算。\n");
            return 1;
        }

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
