/* eslint-disable */
export default {
  displayName: 'services-cli-login',
  preset: '../../../../jest.preset.cjs',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../../coverage/packages/services/cli/login',
};
