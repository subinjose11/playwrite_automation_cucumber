const { setWorldConstructor, World } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');

class CustomWorld extends World {
  constructor(options) {
    super(options);

    // Test context storage
    this.testData = {};
    this.inbox = null;
    this.otp = null;
    this.credentials = null;

    // Page objects will be initialized in hooks
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Initialize browser with Playwright
   */
  async initBrowser() {
    const headless = process.env.HEADLESS === 'true';
    const slowMo = parseInt(process.env.SLOW_MO) || 0;

    this.browser = await chromium.launch({
      headless,
      slowMo
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: process.env.RECORD_VIDEO === 'true' ? { dir: 'reports/videos' } : undefined
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(parseInt(process.env.DEFAULT_TIMEOUT) || 30000);
  }

  /**
   * Close browser and cleanup
   */
  async closeBrowser() {
    if (this.page) {
      await this.page.close();
    }
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Store data for use across steps
   */
  storeData(key, value) {
    this.testData[key] = value;
  }

  /**
   * Retrieve stored data
   */
  getData(key) {
    return this.testData[key];
  }
}

setWorldConstructor(CustomWorld);

module.exports = CustomWorld;
