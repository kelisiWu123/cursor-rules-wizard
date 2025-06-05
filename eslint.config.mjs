import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  // 基础 ESLint 推荐规则
  eslint.configs.recommended,

  // 全局忽略配置
  {
    ignores: [
      'out/**',
      'node_modules/**',
      '*.js',
      '*.d.ts',
      'resources/**',
      '.vscode-test/**',
    ],
  },

  // TypeScript 文件配置
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        // 启用类型感知检查 - 这是关键配置
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // 关键：禁用原生 ESLint 规则，避免冲突
      'no-unused-vars': 'off',

      // 使用 TypeScript ESLint 的 no-unused-vars 规则
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          // 处理枚举成员的配置
          // ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off',

      // 常规 ESLint 规则（移除格式化相关规则，交给 Prettier 处理）
      'no-console': 'off', // VSCode 插件开发中经常需要 console.log
      'no-debugger': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'eol-last': 'error',

      // VSCode 插件开发特定规则
      'no-restricted-globals': ['error', 'name', 'length'],
      'no-undef': 'off', // TypeScript 已处理此问题
    },
  },

  // 测试文件特殊配置（如果有的话）
  {
    files: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Prettier 配置 - 禁用与 Prettier 冲突的规则
  prettier,
];
