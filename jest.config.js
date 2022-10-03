/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 90 * 1000, // Set timeout to 90 seconds
  testPathIgnorePatterns : [
    "<rootDir>/unleash-on-the-edge" 
  ]
};
