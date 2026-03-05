const { Before, After, BeforeAll, AfterAll, Status, setDefaultTimeout } = require('@cucumber/cucumber');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

// Set default timeout to 120 seconds for all steps
setDefaultTimeout(120 * 1000);

// Ensure reports directory exists
BeforeAll(async function () {
  const reportsDir = path.join(process.cwd(), 'reports', 'screenshots');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  console.log('Test suite started');
});

// Before each scenario
Before(async function (scenario) {
  console.log(`\nStarting scenario: ${scenario.pickle.name}`);
  await this.initBrowser();
});

// After each scenario
After(async function (scenario) {
  // Take screenshot on failure
  if (scenario.result.status === Status.FAILED) {
    const screenshotName = `${scenario.pickle.name.replace(/\s+/g, '_')}_${Date.now()}`;
    const screenshotPath = path.join(process.cwd(), 'reports', 'screenshots', `${screenshotName}.png`);

    try {
      if (this.page) {
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved: ${screenshotPath}`);

        // Attach screenshot to report
        const screenshot = fs.readFileSync(screenshotPath);
        this.attach(screenshot, 'image/png');
      }
    } catch (error) {
      console.error('Failed to take screenshot:', error.message);
    }
  }

  // Close browser
  await this.closeBrowser();
  console.log(`Scenario completed: ${scenario.pickle.name} - ${scenario.result.status}`);
});

// After all scenarios
AfterAll(async function () {
  console.log('\nTest suite completed');
});
