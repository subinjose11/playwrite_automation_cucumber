const BasePage = require('../basePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);

    this.selectors = {
      // Header buttons
      loginHeaderButton: 'button:has-text("Login")',
      signupHeaderButton: 'button:has-text("Sign Up Free")',

      // Modal
      loginDialog: 'dialog',
      loginHeading: 'h3:has-text("Welcome back")',

      // Form fields
      emailInput: 'input[name="email"]',
      passwordInput: 'input[name="password"]',

      // Buttons
      loginButton: 'dialog button:has-text("Login")',
      closeButton: 'button:has-text("Close")',
      forgotPasswordLink: 'text=Forgot password?',
      signUpLink: 'text=Don\'t have account? Sign up',

      // Success indicators
      listFacilityLink: 'a:has-text("List your facility")',
      userAvatar: 'button[class*="rounded-full"]'
    };
  }

  async navigateToLogin(url) {
    const baseUrl = url || process.env.BASE_URL;
    await this.navigate(baseUrl);
    await this.page.waitForLoadState('networkidle');
  }

  async openLoginModal() {
    const loginButton = this.page.getByRole('button', { name: 'Login' }).first();
    await loginButton.waitFor({ state: 'visible', timeout: 15000 });
    await loginButton.click();

    await this.page.getByRole('dialog').waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForSelector('h3:has-text("Welcome back")', { timeout: 10000 });
  }

  async fillLoginForm(email, password) {
    const dialog = this.page.getByRole('dialog');
    await dialog.locator('input[type="text"]').fill(email);
    await dialog.locator('input[type="password"]').fill(password);
  }

  async fillEmailOnly(email) {
    const dialog = this.page.getByRole('dialog');
    await dialog.locator('input[type="text"]').fill(email);
  }

  async fillPasswordOnly(password) {
    const dialog = this.page.getByRole('dialog');
    await dialog.locator('input[type="password"]').fill(password);
  }

  async submitLoginForm() {
    await this.page.getByRole('dialog').getByRole('button', { name: 'Login' }).click();
    await this.page.waitForTimeout(2000);
  }

  async login(email, password) {
    await this.fillLoginForm(email, password);
    await this.submitLoginForm();
  }

  async loginFromSignupFlow(email, password) {
    await this.fillLoginForm(email, password);
    await this.submitLoginForm();
  }

  async clickForgotPassword() {
    await this.page.getByText('Forgot password?').click();
    await this.page.waitForTimeout(1000);
  }

  async clickSignUpLink() {
    await this.page.getByText("Don't have account? Sign up").click();
    await this.page.waitForTimeout(500);
  }

  async isLoggedIn() {
    try {
      await this.page.waitForSelector('a:has-text("List your facility")', { timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  async waitForLoginSuccess() {
    await this.page.waitForSelector('a:has-text("List your facility")', { timeout: 20000 });
  }

  async getErrorMessage() {
    try {
      // Check for various error patterns
      const dialog = this.page.getByRole('dialog');
      const paragraphs = await dialog.locator('p').allTextContents();
      const errors = paragraphs.filter(text =>
        text.includes('Invalid') ||
        text.includes('incorrect') ||
        text.includes('required') ||
        text.includes('wrong') ||
        text.includes('not found') ||
        text.includes('error')
      );

      if (errors.length > 0) {
        return errors.join(', ');
      }

      // Also check for inline error messages
      const errorLocator = this.page.locator('text=/Invalid|incorrect|error/i');
      if (await errorLocator.isVisible().catch(() => false)) {
        return await errorLocator.textContent();
      }

      return null;
    } catch {
      return null;
    }
  }

  async hasValidationErrors() {
    try {
      const dialog = this.page.getByRole('dialog');

      // Check for "required" error messages
      const requiredErrors = await dialog.locator('text=/required/i').count();
      if (requiredErrors > 0) return true;

      // Check HTML5 validation
      const emailInput = dialog.locator('input[type="text"]');
      const passwordInput = dialog.locator('input[type="password"]');

      const emailValid = await emailInput.evaluate((el) => el.validity.valid).catch(() => true);
      const passwordValid = await passwordInput.evaluate((el) => el.validity.valid).catch(() => true);

      return !emailValid || !passwordValid;
    } catch {
      return false;
    }
  }

  async hasEmailValidationError() {
    try {
      const dialog = this.page.getByRole('dialog');
      const emailError = await dialog.locator('text=/email.*required|invalid.*email/i').isVisible();
      return emailError;
    } catch {
      return false;
    }
  }

  async hasPasswordValidationError() {
    try {
      const dialog = this.page.getByRole('dialog');
      const passwordError = await dialog.locator('text=/password.*required/i').isVisible();
      return passwordError;
    } catch {
      return false;
    }
  }

  async hasRateLimitMessage() {
    try {
      const rateLimitLocator = this.page.locator('text=/too many|rate limit|locked|try again/i');
      return await rateLimitLocator.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  async isLoginModalVisible() {
    try {
      const heading = this.page.locator('h3:has-text("Welcome back")');
      return await heading.isVisible();
    } catch {
      return false;
    }
  }

  async isForgotPasswordVisible() {
    try {
      // Check for forgot password form/heading
      const forgotHeading = this.page.locator('text=/forgot|reset|recover/i');
      return await forgotHeading.isVisible({ timeout: 5000 });
    } catch {
      return false;
    }
  }

  async closeModal() {
    try {
      await this.page.getByRole('button', { name: 'Close' }).click();
      await this.page.waitForTimeout(500);
    } catch {
      // Modal might already be closed
    }
  }

  async isModalClosed() {
    try {
      const dialog = this.page.getByRole('dialog');
      return !(await dialog.isVisible());
    } catch {
      return true;
    }
  }

  async togglePasswordVisibility() {
    try {
      const dialog = this.page.getByRole('dialog');
      // Find the show/hide password button (usually an eye icon)
      const toggleButton = dialog.locator('button').filter({ has: this.page.locator('img') }).last();
      await toggleButton.click();
    } catch {
      console.log('Password toggle button not found');
    }
  }

  async isPasswordVisible() {
    try {
      const dialog = this.page.getByRole('dialog');
      const passwordInput = dialog.locator('input').nth(1);
      const inputType = await passwordInput.getAttribute('type');
      return inputType === 'text';
    } catch {
      return false;
    }
  }

  async checkRememberMe() {
    try {
      const rememberMeCheckbox = this.page.locator('input[type="checkbox"]');
      if (await rememberMeCheckbox.isVisible()) {
        await rememberMeCheckbox.check();
      }
    } catch {
      console.log('Remember me checkbox not found');
    }
  }
}

module.exports = LoginPage;
