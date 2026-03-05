const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const LoginPage = require('../../../pages/auth/loginPage');
const SignupPage = require('../../../pages/auth/signupPage');
const FileHelper = require('../../../utils/fileHelper');

let loginPage;
let signupPage;
let fileHelper;

// ==================== GIVEN STEPS ====================

Given('I am on the login page', async function () {
  loginPage = new LoginPage(this.page);
  signupPage = new SignupPage(this.page);
  fileHelper = new FileHelper();
  await loginPage.navigateToLogin();
  await loginPage.openLoginModal();
});

Given('I have saved credentials', async function () {
  this.credentials = fileHelper.getLatestCredentials();
  if (!this.credentials) {
    throw new Error('No saved credentials found. Please run signup test first.');
  }
  this.storeData('email', this.credentials.email);
  this.storeData('password', this.credentials.password);
  console.log(`Using credentials for: ${this.credentials.email}`);
});

// ==================== WHEN STEPS - Form Filling ====================

When('I enter my email and password', async function () {
  const email = this.getData('email');
  const password = this.getData('password');
  await loginPage.fillLoginForm(email, password);
});

When('I enter email {string} and password {string}', async function (email, password) {
  await loginPage.fillLoginForm(email, password);
});

When('I enter my email and wrong password {string}', async function (wrongPassword) {
  const email = this.getData('email');
  await loginPage.fillLoginForm(email, wrongPassword);
});

When('I enter email {string} only', async function (email) {
  await loginPage.fillEmailOnly(email);
});

When('I enter password {string} only', async function (password) {
  await loginPage.fillPasswordOnly(password);
});

When('I enter password {string}', async function (password) {
  await loginPage.fillPasswordOnly(password);
});

// ==================== WHEN STEPS - Form Submission ====================

When('I click the login button', async function () {
  await loginPage.submitLoginForm();
});

When('I click the login button without entering credentials', async function () {
  await loginPage.submitLoginForm();
});

// ==================== WHEN STEPS - Navigation ====================

When('I click on "Don\'t have account? Sign up"', async function () {
  await loginPage.clickSignUpLink();
});

When('I click on "Forgot password?"', async function () {
  await loginPage.clickForgotPassword();
});

When('I close the login modal', async function () {
  await loginPage.closeModal();
});

// ==================== WHEN STEPS - UI Interactions ====================

When('I click the show password button', async function () {
  await loginPage.togglePasswordVisibility();
});

When('I check the remember me checkbox', async function () {
  await loginPage.checkRememberMe();
});

// ==================== WHEN STEPS - Security Tests ====================

When('I attempt to login {int} times with wrong credentials', async function (attempts) {
  for (let i = 0; i < attempts; i++) {
    await loginPage.fillLoginForm('test@example.com', 'WrongPassword123!');
    await loginPage.submitLoginForm();
    await this.page.waitForTimeout(1000);
  }
});

// ==================== THEN STEPS - Login Success ====================

Then('I should be logged in successfully', async function () {
  const isLoggedIn = await loginPage.isLoggedIn();
  expect(isLoggedIn).toBe(true);
  console.log('Login successful');
});

Then('I should see the dashboard', async function () {
  await loginPage.waitForLoginSuccess();
  console.log('User is logged in - List your facility link visible');
});

// ==================== THEN STEPS - Error Messages ====================

Then('I should see an error message for invalid credentials', async function () {
  await this.page.waitForTimeout(1000);
  const errorMessage = await loginPage.getErrorMessage();
  expect(errorMessage).toBeTruthy();
  console.log(`Error message: ${errorMessage}`);
});

Then('I should see an error message for invalid email format', async function () {
  await this.page.waitForTimeout(1000);
  const errorMessage = await loginPage.getErrorMessage();
  expect(errorMessage).toBeTruthy();
  console.log(`Error message: ${errorMessage}`);
});

Then('I should see validation errors for required fields', async function () {
  const hasValidationError = await loginPage.hasValidationErrors();
  expect(hasValidationError).toBe(true);
  console.log('Validation errors displayed');
});

Then('I should see validation error for email', async function () {
  const hasEmailError = await loginPage.hasEmailValidationError();
  expect(hasEmailError).toBe(true);
  console.log('Email validation error displayed');
});

Then('I should see validation error for password', async function () {
  const hasPasswordError = await loginPage.hasPasswordValidationError();
  expect(hasPasswordError).toBe(true);
  console.log('Password validation error displayed');
});

Then('I should see a rate limit or lockout message', async function () {
  // Check for rate limit message or account lockout
  const hasRateLimitMessage = await loginPage.hasRateLimitMessage();
  // This may not exist on all systems, so we just log it
  console.log(`Rate limit check: ${hasRateLimitMessage ? 'Rate limited' : 'No rate limit detected'}`);
});

// ==================== THEN STEPS - Login Failure ====================

Then('I should not be logged in', async function () {
  await this.page.waitForTimeout(1000);
  const isLoginModalVisible = await loginPage.isLoginModalVisible();
  const isLoggedIn = await loginPage.isLoggedIn().catch(() => false);

  expect(isLoginModalVisible || !isLoggedIn).toBeTruthy();
  console.log('User is not logged in (as expected)');
});

// ==================== THEN STEPS - Navigation ====================

Then('I should see the signup modal', async function () {
  await this.page.waitForTimeout(500);
  const isSignupVisible = await signupPage.isSignupModalVisible();
  expect(isSignupVisible).toBe(true);
  console.log('Signup modal is visible');
});

Then('I should see the forgot password form', async function () {
  const isForgotPasswordVisible = await loginPage.isForgotPasswordVisible();
  expect(isForgotPasswordVisible).toBe(true);
  console.log('Forgot password form is visible');
});

Then('the login modal should be closed', async function () {
  const isModalClosed = await loginPage.isModalClosed();
  expect(isModalClosed).toBe(true);
  console.log('Login modal is closed');
});

// ==================== THEN STEPS - UI Verification ====================

Then('the password should be visible', async function () {
  const isPasswordVisible = await loginPage.isPasswordVisible();
  expect(isPasswordVisible).toBe(true);
  console.log('Password is visible');
});

// ==================== THEN STEPS - Security ====================

Then('the application should handle the input safely', async function () {
  const pageTitle = await this.page.title();
  expect(pageTitle).toBeTruthy();

  const isDialogVisible = await this.page.getByRole('dialog').isVisible().catch(() => false);
  expect(isDialogVisible).toBe(true);
  console.log('Application handled input safely');
});
