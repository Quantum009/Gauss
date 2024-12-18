#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define EPSILON 1e-10
#define MAX_ITERATIONS 1000
#define GAUSS_ELIMINATION 0
#define GAUSS_SEIDEL 1

// 打印矩阵的当前状态
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

// 检查矩阵是否适合高斯-赛德尔迭代
int isConvergent(double **matrix, int n) {
    for (int i = 0; i < n; i++) {
        double sum = 0;
        for (int j = 0; j < n; j++) {
            if (i != j) {
                sum += fabs(matrix[i][j]);
            }
        }
        if (fabs(matrix[i][i]) <= sum) {
            return 0;
        }
    }
    return 1;
}

// 高斯消元法
int gaussElimination(double **matrix, double *constants, double *results, int n) {
    printf("\n开始高斯消元...\n");
    
    // 消元过程
    for (int i = 0; i < n; i++) {
        // 如果主对角线元素接近于0，尝试与下面的行交换
        if (fabs(matrix[i][i]) < EPSILON) {
            int found = 0;
            for (int k = i + 1; k < n; k++) {
                if (fabs(matrix[k][i]) > EPSILON) {
                    printf("交换第%d行和第%d行\n", i + 1, k + 1);
                    swapRows(matrix, constants, i, k, n);
                    printMatrix(matrix, constants, n);
                    found = 1;
                    break;
                }
            }
            if (!found) continue;
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
        
        if (fabs(matrix[i][i]) < EPSILON) {
            if (fabs(results[i]) > EPSILON) {
                printf("方程组无解。\n");
                return 0;
            }
            results[i] = 0;
            printf("警告：第%d行主对角线元素接近于0，方程组可能有无穷多解。\n", i + 1);
        } else {
            results[i] /= matrix[i][i];
        }
    }
    
    return 1;
}

// 高斯-赛德尔迭代法
int gaussSeidel(double **matrix, double *constants, double *results, int n) {
    printf("\n开始高斯-赛德尔迭代求解...\n");
    
    // 初始化结果向量
    for (int i = 0; i < n; i++) {
        results[i] = 0.0;
    }

    // 检查收敛条件
    if (!isConvergent(matrix, n)) {
        printf("警告：矩阵可能不满足收敛条件，但仍将尝试求解。\n\n");
    }

    int iterations = 0;
    double maxDiff;
    double *oldResults = (double *)malloc(n * sizeof(double));
    if (!oldResults) {
        printf("内存分配失败\n");
        return 0;
    }

    do {
        // 保存上一次的结果
        for (int i = 0; i < n; i++) {
            oldResults[i] = results[i];
        }

        // 进行一次迭代
        for (int i = 0; i < n; i++) {
            double sum = constants[i];
            
            for (int j = 0; j < n; j++) {
                if (j != i) {
                    sum -= matrix[i][j] * results[j];
                }
            }
            
            if (fabs(matrix[i][i]) < EPSILON) {
                printf("错误：第%d个对角线元素接近于0，无法继续迭代。\n", i + 1);
                free(oldResults);
                return 0;
            }
            
            results[i] = sum / matrix[i][i];
        }

        // 计算最大差值
        maxDiff = 0.0;
        for (int i = 0; i < n; i++) {
            double diff = fabs(results[i] - oldResults[i]);
            if (diff > maxDiff) {
                maxDiff = diff;
            }
        }

        iterations++;
        
        // 每10次迭代输出一次中间结果
        if (iterations % 10 == 0 || iterations == 1) {
            printf("第%d次迭代，最大误差：%.10f\n", iterations, maxDiff);
            printf("当前解：");
            for (int i = 0; i < n; i++) {
                printf("x%d = %.6f ", i + 1, results[i]);
            }
            printf("\n\n");
        }

    } while (maxDiff > EPSILON && iterations < MAX_ITERATIONS);

    free(oldResults);

    if (iterations >= MAX_ITERATIONS) {
        printf("警告：达到最大迭代次数 %d，可能未收敛到足够精确的解。\n", MAX_ITERATIONS);
        return 0;
    }

    printf("迭代完成！共进行 %d 次迭代\n", iterations);
    printf("最终误差：%.10f\n\n", maxDiff);
    return 1;
}

int main(int argc, char* argv[]) {
    if (argc != 3) {
        fprintf(stderr, "使用方法: %s <矩阵阶数> <求解方法>\n", argv[0]);
        return 1;
    }
    
    int n = atoi(argv[1]);
    int method = atoi(argv[2]); // 0: 高斯消元法, 1: 高斯-赛德尔法
    
    if (n <= 0 || n > 20) {
        fprintf(stderr, "错误：矩阵阶数必须在1到20之间。\n");
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

    // 根据选择的方法求解
    int success;
    if (method == GAUSS_ELIMINATION) {
        success = gaussElimination(matrix, constants, results, n);
    } else {
        success = gaussSeidel(matrix, constants, results, n);
    }

    // 如果求解成功，输出结果
    if (success) {
        printf("\n方程组的解：\n");
        for (int i = 0; i < n; i++) {
            printf("x%d = %.6f\n", i + 1, results[i]);
        }
    }

    // 释放内存
    for (int i = 0; i < n; i++) {
        free(matrix[i]);
    }
    free(matrix);
    free(constants);
    free(results);

    return !success;
}