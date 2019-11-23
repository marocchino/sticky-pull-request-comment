module.exports = function(wallaby) {
  return {
    files: ["src/**/*.js?(x)", "!src/**/*.spec.ts?(x)"],
    tests: ["__tests__/**/*.test.ts?(x)"],

    env: {
      type: "node",
      runner: "node"
    },

    testFramework: "jest",

    debug: true
  };
};
