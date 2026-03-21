export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/controllers/**/*.ts',
    'src/middleware/**/*.ts'
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 80
    }
  }
}