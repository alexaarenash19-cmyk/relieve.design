import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      // Hallazgo "Falta eslint-plugin-jsx-a11y" (auditoría 10 ago 2026):
      // ninguno de los hallazgos de accesibilidad de esa misma auditoría
      // se habría detectado en CI sin esto. Verificado que corre bien bajo
      // eslint 10 pese a que el plugin solo declara soporte hasta eslint
      // ^9 en su package.json — ver el override en package.json.
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
];
