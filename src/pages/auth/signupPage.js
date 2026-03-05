const BasePage = require('../basePage');

class SignupPage extends BasePage {
  constructor(page) {
    super(page);

    this.selectors = {
      // Header buttons
      signupFreeButton: 'button:has-text("Sign Up Free")',
      loginHeaderButton: 'button:has-text("Login")',

      // Modal
      signupDialog: 'dialog',
      signupHeading: 'h3:has-text("Sign up")',

      // Form fields
      firstNameInput: 'input[name="firstName"]',
      lastNameInput: 'input[name="lastName"]',
      emailInput: 'input[name="email"]',
      phoneInput: 'input[name="phone"]',
      passwordInput: 'input[name="password"]',

      // Buttons
      createAccountButton: 'button:has-text("Create account")',
      closeButton: 'button:has-text("Close")',

      // OTP verification page
      verificationHeading: 'h3:has-text("Almost done")',
      verifyButton: 'button:has-text("Verify")',

      // Success - login form appears after verification
      loginHeading: 'h3:has-text("Welcome back")',

      // Error messages
      invalidPhoneMessage: 'text=Invalid phone number'
    };
  }

  async navigateToSignup(url) {
    const baseUrl = url || process.env.BASE_URL;
    await this.navigate(baseUrl);
    await this.page.waitForLoadState('networkidle');
  }

  async openSignupModal() {
    const signupButton = this.page.getByRole('button', { name: 'Sign Up Free' });
    await signupButton.waitFor({ state: 'visible', timeout: 15000 });
    await signupButton.click();

    await this.page.getByRole('dialog').waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForSelector('h3:has-text("Sign up")', { timeout: 10000 });
  }

  async fillSignupForm(userData) {
    const dialog = this.page.getByRole('dialog');

    // Fill first name
    if (userData.firstName) {
      await dialog.locator('input[name="firstName"]').fill(userData.firstName);
    }

    // Fill last name
    if (userData.lastName) {
      await dialog.locator('input[name="lastName"]').fill(userData.lastName);
    }

    // Fill email - no name attribute, use position
    if (userData.email) {
      const emailInput = dialog.locator('input[type="text"]').nth(2);
      await emailInput.fill(userData.email);
    }

    // Fill phone number - must type slowly for proper formatting
    if (userData.phone) {
      const phoneInput = dialog.locator('input[type="tel"]');
      await phoneInput.click();
      await phoneInput.pressSequentially(userData.phone, { delay: 50 });
    }

    // Fill password - no name attribute, use type
    if (userData.password) {
      await dialog.locator('input[type="password"]').fill(userData.password);
    }

    await this.page.waitForTimeout(500);
  }

  async fillSignupFormPartial(userData) {
    const dialog = this.page.getByRole('dialog');

    // Fill first name (even if empty to clear field)
    await dialog.locator('input[name="firstName"]').fill(userData.firstName || '');

    // Fill last name
    await dialog.locator('input[name="lastName"]').fill(userData.lastName || '');

    // Fill email
    const emailInput = dialog.locator('input[type="text"]').nth(2);
    await emailInput.fill(userData.email || '');

    // Fill phone number
    if (userData.phone) {
      const phoneInput = dialog.locator('input[type="tel"]');
      await phoneInput.click();
      await phoneInput.pressSequentially(userData.phone, { delay: 50 });
    }

    // Fill password
    await dialog.locator('input[type="password"]').fill(userData.password || '');

    await this.page.waitForTimeout(500);
  }

  async submitSignupForm() {
    await this.page.getByRole('button', { name: 'Create account' }).click();

    // Wait for OTP page to appear
    try {
      await this.page.waitForSelector('h3:has-text("Almost done")', { timeout: 20000 });
    } catch (error) {
      // Check for validation errors
      const dialog = this.page.getByRole('dialog');
      const paragraphs = await dialog.locator('p').allTextContents();
      const validationErrors = paragraphs.filter(t =>
        t.includes('required') ||
        t.includes('Invalid') ||
        t.includes('already') ||
        t.includes('exist')
      );

      if (validationErrors.length > 0) {
        console.log('Form validation errors:', validationErrors);
        throw new Error(`Form submission failed: ${validationErrors.join(', ')}`);
      }

      throw error;
    }
  }

  async clickCreateAccountButton() {
    await this.page.getByRole('button', { name: 'Create account' }).click();
    await this.page.waitForTimeout(1000);
  }

  async isOnVerificationPage() {
    try {
      await this.page.waitForSelector('h3:has-text("Almost done")', { timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  async enterOTP(otp) {
    const digits = otp.toString().split('');
    const dialog = this.page.getByRole('dialog');
    const otpInputs = dialog.locator('input[type="text"]');
    const count = await otpInputs.count();

    for (let i = 0; i < digits.length && i < count; i++) {
      await otpInputs.nth(i).fill(digits[i]);
    }
  }

  async submitOTP() {
    await this.page.getByRole('button', { name: 'Verify' }).click();
    await this.page.waitForTimeout(2000);
  }

  async isSignupSuccessful() {
    try {
      await this.page.waitForSelector('h3:has-text("Welcome back")', { timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  async getErrorMessage() {
    try {
      const dialog = this.page.getByRole('dialog');
      const paragraphs = await dialog.locator('p').allTextContents();
      const errors = paragraphs.filter(text =>
        text.includes('Invalid') ||
        text.includes('required') ||
        text.includes('exist') ||
        text.includes('already') ||
        text.includes('weak') ||
        text.includes('password')
      );
      return errors.length > 0 ? errors.join(', ') : null;
    } catch {
      return null;
    }
  }

  async hasErrorMessage(expectedError) {
    try {
      const dialog = this.page.getByRole('dialog');
      const errorLocator = dialog.locator(`text=${expectedError}`);
      return await errorLocator.isVisible({ timeout: 5000 });
    } catch {
      return false;
    }
  }

  async hasOTPError() {
    try {
      const dialog = this.page.getByRole('dialog');
      const errorLocator = dialog.locator('text=/invalid|incorrect|wrong/i');
      return await errorLocator.isVisible({ timeout: 5000 });
    } catch {
      return false;
    }
  }

  async clickLink(linkText) {
    await this.page.getByText(linkText).click();
    await this.page.waitForTimeout(500);
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

  async isSignupModalVisible() {
    try {
      const heading = this.page.locator('h3:has-text("Sign up")');
      return await heading.isVisible();
    } catch {
      return false;
    }
  }
}

module.exports = SignupPage;
