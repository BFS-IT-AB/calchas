module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/dev/tests"],
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
  collectCoverageFrom: [
    "js/**/*.js",
    "!js/vendor/**",
    "!service-worker.js",
    "!app.js",
  ],
  moduleFileExtensions: ["js", "json"],
  transform: {},
  testTimeout: 10000,
};
