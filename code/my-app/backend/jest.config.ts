export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/src/tests/setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    // ✅ เฉพาะไฟล์ที่มี test แล้ว
  'src/controllers/authController.ts',
  'src/controllers/complaintController.ts',
  'src/controllers/notificationController.ts',
  'src/controllers/notificationSettingsController.ts',
  'src/controllers/profileController.ts',
  'src/controllers/surveyController.ts',
  'src/middleware/authMiddleware.ts',
],
  coverageDirectory: 'coverage-reports',
  coverageReporters: ['text', 'html'],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 80
    }
  }
}