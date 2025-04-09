module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: ["/node_modules/"],
  coverageReporters: ["json", "lcov", "text", "clover"],
  moduleFileExtensions: ['js', 'ts', 'json', 'node'],
  testEnvironment: "jest-environment-node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["@swc/jest", {
      jsc: {
        parser: {
          syntax: "typescript",
          tsx: false
        },
        target: "es2022"
      }
    }]
  },
  verbose: true,
  testTimeout: 10000,
  maxWorkers: "50%"
}