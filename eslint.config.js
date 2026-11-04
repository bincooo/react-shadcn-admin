import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

/**
 * ESLint 扁平配置（ESLint 9+）。
 * 规则集：JS 推荐 + TS 推荐 + React + Hooks + Fast Refresh，样式类规则交给 Prettier。
 */
export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      '.agents/**',
      'agent/**',
      'coverage',
      'src/components/ui/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      // React 17+ 的 JSX 转换不再需要导入 React
      'react/prop-types': 'off',

      // 只导出组件（+ 少量常量/hook）以保住 HMR 边界
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // 统一使用 `import type`，避免仅类型导入进运行时产物
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // 空接口没有存在价值：分页信封这类「只固定元素类型」的场景改为
      // 直接在调用处写 `get<PageResult<T>>(...)`，不再定义具名空接口。
      '@typescript-eslint/no-empty-object-type': 'error',

      // 常见坏味道
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
    },
  },
  // 配置文件、mock 服务端与本地脚本运行在 Node 侧
  {
    files: ['*.config.{js,ts}', 'build/**/*.ts', 'scripts/**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off' },
  },
  prettier,
)
