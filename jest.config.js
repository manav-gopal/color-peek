module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  transform: {
      '^.+\\.jsx?$': 'babel-jest', // Add this line
      '^.+\\.tsx?$': 'ts-jest', // Ensure TypeScript files are transformed
  },
};