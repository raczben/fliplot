module.exports = {
  transformIgnorePatterns: ['node_modules/(?!(sucrase)/)'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',
  },
  setupFiles: [ "<rootDir>/js/test/test-env.js" ],
  testEnvironment: "jsdom" // https://stackoverflow.com/a/69228464/2506522
};