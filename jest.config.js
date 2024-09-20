/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  maxWorkers: '50%',
  testEnvironment: 'node',
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
};
