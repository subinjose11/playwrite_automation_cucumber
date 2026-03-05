class BasePage {
  constructor(page) {
    this.page = page;
    this.timeout = parseInt(process.env.DEFAULT_TIMEOUT) || 30000;
  }

  async navigate(url) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: this.timeout });
  }

  async click(selector) {
    await this.page.locator(selector).click();
  }

  async fill(selector, text) {
    await this.page.locator(selector).fill(text);
  }

  async getText(selector) {
    return await this.page.locator(selector).textContent();
  }

  async isVisible(selector) {
    return await this.page.locator(selector).isVisible();
  }

  async waitForSelector(selector, options = {}) {
    await this.page.locator(selector).waitFor({
      state: 'visible',
      timeout: options.timeout || this.timeout
    });
  }

  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name) {
    await this.page.screenshot({ path: `reports/screenshots/${name}.png` });
  }

  async getInputValue(selector) {
    return await this.page.locator(selector).inputValue();
  }

  async selectOption(selector, value) {
    await this.page.locator(selector).selectOption(value);
  }

  async waitForURL(urlPattern, options = {}) {
    await this.page.waitForURL(urlPattern, {
      timeout: options.timeout || this.timeout
    });
  }
}

module.exports = BasePage;
