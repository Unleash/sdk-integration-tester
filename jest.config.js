/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  transform: {
      "^.+\\.tsx?$": [
        "@swc/jest"
      ]
    }
  testEnvironment: 'node',
  testTimeout: 100 * 1000, // Set timeout to 100 seconds
  testPathIgnorePatterns : [
    "<rootDir>/unleash-on-the-edge" 
  ]
};
