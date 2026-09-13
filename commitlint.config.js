const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'ui',
        'models',
        'filters',
        'search',
        'layout',
        'theme',
        'data',
        'types',
        'hooks',
        'config',
        'deps',
      ],
    ],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [1, 'always', 100],
  },
};

export default config;
