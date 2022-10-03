/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 60 * 1000, // Set timeout to 60 seconds
  testPathIgnorePatterns : [
    "<rootDir>/unleash-on-the-edge" 
  ]
};
