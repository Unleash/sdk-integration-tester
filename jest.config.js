/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 100 * 1000, // Set timeout to 100 seconds
  testPathIgnorePatterns : [
    "<rootDir>/unleash-on-the-edge" 
  ]
};
