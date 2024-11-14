#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define EPSILON 1e-10

void printMatrix(double **matrix, double *constants, int n) {
    printf("当前矩阵状态:\n");
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            printf("%8.4f ", matrix[i][j]);
        }
        printf("| %8.4f\n", constants[i]);
    }
    printf("\n");
}

// 交换两行
void swapRows(double **matrix, double *constants, int row1, int row2, int n) {
    for (int j = 0; j < n; j++) {
        double temp = matrix[row1][j];
        matrix[row1][j] = matrix[row2][j];
        matrix[row2][j] = temp;
    }
    double temp = constants[row1];
    constants[row1] = constants[row2];
    constants[row2] = temp;
}

int main(int argc, char* argv[]) {
    if (argc != 2) {
        fprintf(stderr, "使用方法: %s <矩阵阶数>\n", argv[0]);
        return 1;
    }
    int n = atoi(argv[1]);
    if (n <= 0 || n > 10) {
        fprintf(stderr, "错误：矩阵阶数必须在1到10之间。\n");
        return 1;
    }
    // 分配内存
    double **matrix = (double **)malloc(n * sizeof(double *));
    double *constants = (double *)malloc(n * sizeof(double));
    double *results = (double *)malloc(n * sizeof(double));
    if (!matrix || !constants || !results) {
        fprintf(stderr, "内存分配失败\n");
        return 1;
    }
    for (int i = 0; i < n; i++) {
        matrix[i] = (double *)malloc(n * sizeof(double));
        if (!matrix[i]) {
            fprintf(stderr, "内存分配失败\n");
            return 1;
        }
    }

    // 读取提示信息
    char buffer[256];
    fgets(buffer, sizeof(buffer), stdin);

    // 读取矩阵
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (scanf("%lf", &matrix[i][j]) != 1) {
                fprintf(stderr, "错误：读取矩阵元素失败。\n");
                return 1;
            }
        }
    }

    // 读取提示信息
    fgets(buffer, sizeof(buffer), stdin);
    fgets(buffer, sizeof(buffer), stdin);

    // 读取常数项
    for (int i = 0; i < n; i++) {
        if (scanf("%lf", &constants[i]) != 1) {
            fprintf(stderr, "错误：读取常数项失败。\n");
            return 1;
        }
    }

    printf("\n初始增广矩阵：\n");
    printMatrix(matrix, constants, n);

    // 高斯消元（带简单的行交换）
    for (int i = 0; i < n; i++) {
        // 如果主对角线元素接近于0，尝试与下面的行交换
        if (fabs(matrix[i][i]) < EPSILON) {
            int found = 0;
            // 在当前行以下寻找该列不为0的行
            for (int k = i + 1; k < n; k++) {
                if (fabs(matrix[k][i]) > EPSILON) {
                    printf("交换第%d行和第%d行\n", i + 1, k + 1);
                    swapRows(matrix, constants, i, k, n);
                    printMatrix(matrix, constants, n);
                    found = 1;
                    break;
                }
            }
            // 如果没有找到合适的行进行交换，继续处理下一列
            if (!found) {
                continue;
            }
        }

        // 消元过程
        for (int k = i + 1; k < n; k++) {
            if (fabs(matrix[i][i]) < EPSILON) continue;
            
            double factor = matrix[k][i] / matrix[i][i];
            if (fabs(factor) < EPSILON) continue;

            printf("消去第%d行的第%d列，消元因子 = %.4f\n", k + 1, i + 1, factor);
            
            for (int j = i; j < n; j++) {
                matrix[k][j] -= factor * matrix[i][j];
                if (fabs(matrix[k][j]) < EPSILON) matrix[k][j] = 0;
            }
            constants[k] -= factor * constants[i];
            if (fabs(constants[k]) < EPSILON) constants[k] = 0;
            
            printMatrix(matrix, constants, n);
        }
    }

    // 检查解的情况
    for (int i = n-1; i >= 0; i--) {
        double sum = 0;
        for (int j = i+1; j < n; j++) {
            sum += fabs(matrix[i][j]);
        }
        // 如果一行的系数全为0，检查常数项
        if (fabs(matrix[i][i]) < EPSILON && sum < EPSILON) {
            if (fabs(constants[i]) > EPSILON) {
                printf("方程组无解。\n");
                return 0;
            }
        }
    }

    // 回代求解
    printf("\n开始回代求解...\n");
    for (int i = n - 1; i >= 0; i--) {
        results[i] = constants[i];
        for (int j = i + 1; j < n; j++) {
            results[i] -= matrix[i][j] * results[j];
        }
        
        // 如果主对角线元素接近0，但常数项不为0，说明无解
        if (fabs(matrix[i][i]) < EPSILON) {
            if (fabs(results[i]) > EPSILON) {
                printf("方程组无解。\n");
                return 0;
            }
            // 如果主对角线元素和常数项都接近0，说明有无穷多解
            results[i] = 0; // 取一个特解
            printf("警告：第%d行主对角线元素接近于0，方程组可能有无穷多解。\n", i + 1);
        } else {
            results[i] /= matrix[i][i];
        }
    }

    // 输出结果
    printf("\n方程组的解：\n");
    for (int i = 0; i < n; i++) {
        printf("x%d = %.6f\n", i + 1, results[i]);
    }

    // 释放内存
    for (int i = 0; i < n; i++) {
        free(matrix[i]);
    }
    free(matrix);
    free(constants);
    free(results);

    return 0;
}

