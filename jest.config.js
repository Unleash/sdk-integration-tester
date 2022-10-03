/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 45 * 1000, // Set timeout to 45 seconds
  testPathIgnorePatterns : [
    "<rootDir>/unleash-on-the-edge" 
  ]
};