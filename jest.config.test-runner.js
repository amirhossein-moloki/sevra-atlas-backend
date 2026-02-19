const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  collectCoverage: true,
  coverageDirectory: '/test-results/coverage',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '/test-results',
        outputName: 'junit.xml',
      },
    ],
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
