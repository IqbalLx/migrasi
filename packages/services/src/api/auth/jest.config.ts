/* eslint-disable */
export default {
  displayName: 'services-api-auth',
  preset: '../../../../../jest.preset.cjs',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../../../coverage/packages/services/src/api/auth',
  testEnvironment: 'node',
};