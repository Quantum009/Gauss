#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define MAX_ITER 1000
#define EPSILON 1e-6  // 默认精度

// 打印当前解向量
void printSolution(double *solution, int n, int iter) {
    printf("第 %d 次迭代结果: ", iter);
    for (int i = 0; i < n; i++) {
        printf("x%d = %.6f ", i + 1, solution[i]);
    }
    printf("\n");
}

// 高斯-赛达尔迭代法
void gaussSeidel(double **matrix, double *constants, double *solution, int n, int max_iter, double epsilon) {
    double *old_solution = (double *)malloc(n * sizeof(double));
    if (!old_solution) {
        fprintf(stderr, "内存分配失败\n");
        exit(EXIT_FAILURE);
    }

    for (int i = 0; i < n; i++) {
        solution[i] = 0.0; // 初始解设为0
        old_solution[i] = 0.0;
    }

    int iter = 0;
    while (iter < max_iter) {
        for (int i = 0; i < n; i++) old_solution[i] = solution[i];

        for (int i = 0; i < n; i++) {
            double sum = constants[i];
            for (int j = 0; j < n; j++) {
                if (i != j) sum -= matrix[i][j] * solution[j];
            }
            solution[i] = sum / matrix[i][i];
        }

        // 检查收敛
        double max_error = 0.0;
        for (int i = 0; i < n; i++) {
            double error = fabs(solution[i] - old_solution[i]);
            if (error > max_error) max_error = error;
        }

        printSolution(solution, n, iter + 1);

        if (max_error < epsilon) {
            printf("收敛于第 %d 次迭代，最大误差 = %.6f\n", iter + 1, max_error);
            free(old_solution);
            return;
        }

        iter++;
    }

    printf("未能在 %d 次迭代内收敛，最大误差 = %.6f\n", max_iter, fabs(solution[0] - old_solution[0]));
    free(old_solution);
}

int main() {
    int n, max_iter;
    double epsilon;

    printf("输入方程组的阶数: ");
    if (scanf("%d", &n) != 1 || n <= 0) {
        fprintf(stderr, "输入错误：方程组阶数必须是正整数。\n");
        return EXIT_FAILURE;
    }

    printf("输入最大迭代次数: ");
    if (scanf("%d", &max_iter) != 1 || max_iter <= 0) {
        fprintf(stderr, "输入错误：最大迭代次数必须是正整数。\n");
        return EXIT_FAILURE;
    }

    printf("输入误差阈值: ");
    if (scanf("%lf", &epsilon) != 1 || epsilon <= 0) {
        fprintf(stderr, "输入错误：误差阈值必须是正数。\n");
        return EXIT_FAILURE;
    }

    // 动态分配内存
    double **matrix = (double **)malloc(n * sizeof(double *));
    double *constants = (double *)malloc(n * sizeof(double));
    double *solution = (double *)malloc(n * sizeof(double));

    if (!matrix || !constants || !solution) {
        fprintf(stderr, "内存分配失败。\n");
        free(constants);
        free(solution);
        if (matrix) {
            for (int i = 0; i < n; i++) free(matrix[i]);
        }
        free(matrix);
        return EXIT_FAILURE;
    }

    for (int i = 0; i < n; i++) {
        matrix[i] = (double *)malloc(n * sizeof(double));
        if (!matrix[i]) {
            fprintf(stderr, "内存分配失败。\n");
            for (int j = 0; j < i; j++) free(matrix[j]);
            free(matrix);
            free(constants);
            free(solution);
            return EXIT_FAILURE;
        }
    }

    // 输入矩阵和常数项
    printf("输入矩阵元素:\n");
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (scanf("%lf", &matrix[i][j]) != 1) {
                fprintf(stderr, "输入错误：无效的矩阵元素。\n");
                goto cleanup;
            }
        }
    }

    printf("输入常数项:\n");
    for (int i = 0; i < n; i++) {
        if (scanf("%lf", &constants[i]) != 1) {
            fprintf(stderr, "输入错误：无效的常数项。\n");
            goto cleanup;
        }
    }

    // 执行高斯-赛达尔法
    gaussSeidel(matrix, constants, solution, n, max_iter, epsilon);

    printf("\n最终解:\n");
    for (int i = 0; i < n; i++) printf("x%d = %.6f\n", i + 1, solution[i]);

cleanup:
    // 释放内存
    for (int i = 0; i < n; i++) free(matrix[i]);
    free(matrix);
    free(constants);
    free(solution);

    return 0;
}
