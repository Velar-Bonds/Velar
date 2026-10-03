import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import { sharedRules, sharedIgnores } from '@velar/config/eslint/rules';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  { ignores: [...sharedIgnores, 'next-env.d.ts'] },
  {
    rules: {
      // Shared across the monorepo (from @velar/config).
      ...sharedRules,
      // apps/web (Next + React) specific.
      'react/no-unescaped-entities': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      '@next/next/no-html-link-for-pages': 'warn',
    },
  },
];

export default eslintConfig;
