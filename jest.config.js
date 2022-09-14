/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30 * 1000, // Set timeout to 30 seconds to allow heroku enough time to start up
  testPathIgnorePatterns : [
    "<rootDir>/unleash-on-the-edge" 
  ]
};