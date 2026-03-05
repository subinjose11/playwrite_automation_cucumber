module.exports = {
  default: {
    require: [
      'src/hooks/world.js',
      'src/hooks/hooks.js',
      'src/test/steps/**/*.js'
    ],
    paths: ['src/test/features/**/*.feature'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    publishQuiet: true,
    worldParameters: {
      environment: 'staging'
    }
  }
};
