#include <stdio.h>
#include <stdlib.h>

// 输入矩阵和常数项
void input_matrix(double matrix[][100], double constants[], int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            scanf("%lf", &matrix[i][j]);
        }
    }
    for (int i = 0; i < n; i++) {
        scanf("%lf", &constants[i]);
    }
}

// 消元过程
void gaussian_elimination(double matrix[][100], double constants[], int n) {
    for (int i = 0; i < n; i++) {
        for (int k = i + 1; k < n; k++) {
            double factor = matrix[k][i] / matrix[i][i];
            for (int j = i; j < n; j++) {
                matrix[k][j] -= factor * matrix[i][j];
            }
            constants[k] -= factor * constants[i];
        }
    }
}

// 回代求解
void back_substitution(double matrix[][100], double constants[], double results[], int n) {
    for (int i = n - 1; i >= 0; i--) {
        results[i] = constants[i];
        for (int j = i + 1; j < n; j++) {
            results[i] -= matrix[i][j] * results[j];
        }
        results[i] /= matrix[i][i];
    }
}

// 输出解
void output_results(double results[], int n) {
    for (int i = 0; i < n; i++) {
        printf("x%d = %.2f\n", i + 1, results[i]);
    }
}

// 主函数
int main(int argc, char* argv[]) {
    int n = atoi(argv[1]); // 获取方程组的阶数
    double matrix[100][100];
    double constants[100];
    double results[100];

    // 读取矩阵和常数项
    input_matrix(matrix, constants, n);

    // 执行高斯消元
    gaussian_elimination(matrix, constants, n);

    // 执行回代求解
    back_substitution(matrix, constants, results, n);

    // 输出结果
    output_results(results, n);

    return 0;
}
