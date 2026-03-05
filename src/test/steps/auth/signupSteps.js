const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const SignupPage = require('../../../pages/auth/signupPage');
const LoginPage = require('../../../pages/auth/loginPage');
const MailSlurpHelper = require('../../../utils/mailslurp');
const FileHelper = require('../../../utils/fileHelper');

let signupPage;
let loginPage;
let mailslurp;
let fileHelper;

// ==================== GIVEN STEPS ====================

Given('I am on the signup page', async function () {
  signupPage = new SignupPage(this.page);
  loginPage = new LoginPage(this.page);
  fileHelper = new FileHelper();
  await signupPage.navigateToSignup();
  await signupPage.openSignupModal();
});

Given('I have a new email inbox', async function () {
  mailslurp = new MailSlurpHelper();
  this.inbox = await mailslurp.createInbox();
  this.storeData('email', this.inbox.emailAddress);
  this.storeData('inboxId', this.inbox.id);
  console.log(`Created test inbox: ${this.inbox.emailAddress}`);
});

Given('I have existing credentials', async function () {
  this.credentials = fileHelper.getLatestCredentials();
  if (!this.credentials) {
    throw new Error('No existing credentials found. Please run signup test first.');
  }
  this.storeData('existingEmail', this.credentials.email);
});

// ==================== WHEN STEPS - Form Filling ====================

When('I fill in the signup form with valid details', async function () {
  const password = 'TestPassword123!';
  this.storeData('password', password);

  // Generate a valid US phone number
  const exchange = (Math.floor(Math.random() * 8) + 2).toString() +
                   Math.floor(Math.random() * 10).toString() +
                   Math.floor(Math.random() * 10).toString();
  const subscriber = Math.floor(1000 + Math.random() * 9000).toString();
  const randomPhone = '202' + exchange + subscriber;
  this.storeData('phone', randomPhone);

  console.log(`Using phone number: ${randomPhone}`);

  await signupPage.fillSignupForm({
    email: this.getData('email'),
    password: password,
    firstName: 'Test',
    lastName: 'User',
    phone: randomPhone
  });
});

When('I fill in the signup form with email {string}', async function (email) {
  const exchange = (Math.floor(Math.random() * 8) + 2).toString() +
                   Math.floor(Math.random() * 10).toString() +
                   Math.floor(Math.random() * 10).toString();
  const subscriber = Math.floor(1000 + Math.random() * 9000).toString();
  const randomPhone = '202' + exchange + subscriber;

  await signupPage.fillSignupForm({
    email: email,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phone: randomPhone
  });
});

When('I fill in the signup form with password {string}', async function (password) {
  const exchange = (Math.floor(Math.random() * 8) + 2).toString() +
                   Math.floor(Math.random() * 10).toString() +
                   Math.floor(Math.random() * 10).toString();
  const subscriber = Math.floor(1000 + Math.random() * 9000).toString();
  const randomPhone = '202' + exchange + subscriber;

  await signupPage.fillSignupForm({
    email: this.getData('email'),
    password: password,
    firstName: 'Test',
    lastName: 'User',
    phone: randomPhone
  });
});

When('I fill in the signup form with phone {string}', async function (phone) {
  await signupPage.fillSignupForm({
    email: this.getData('email'),
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phone: phone
  });
});

When('I fill in the signup form with first name {string}', async function (firstName) {
  const exchange = (Math.floor(Math.random() * 8) + 2).toString() +
                   Math.floor(Math.random() * 10).toString() +
                   Math.floor(Math.random() * 10).toString();
  const subscriber = Math.floor(1000 + Math.random() * 9000).toString();
  const randomPhone = '202' + exchange + subscriber;

  await signupPage.fillSignupForm({
    email: this.getData('email'),
    password: 'TestPassword123!',
    firstName: firstName,
    lastName: 'User',
    phone: randomPhone
  });
});

When('I fill in the signup form with the existing email', async function () {
  const exchange = (Math.floor(Math.random() * 8) + 2).toString() +
                   Math.floor(Math.random() * 10).toString() +
                   Math.floor(Math.random() * 10).toString();
  const subscriber = Math.floor(1000 + Math.random() * 9000).toString();
  const randomPhone = '202' + exchange + subscriber;

  await signupPage.fillSignupForm({
    email: this.getData('existingEmail'),
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phone: randomPhone
  });
});

When('I fill in the signup form without first name', async function () {
  const exchange = (Math.floor(Math.random() * 8) + 2).toString() +
                   Math.floor(Math.random() * 10).toString() +
                   Math.floor(Math.random() * 10).toString();
  const subscriber = Math.floor(1000 + Math.random() * 9000).toString();
  const randomPhone = '202' + exchange + subscriber;

  await signupPage.fillSignupFormPartial({
    email: this.getData('email'),
    password: 'TestPassword123!',
    firstName: '',
    lastName: 'User',
    phone: randomPhone
  });
});

When('I fill in the signup form without last name', async function () {
  const exchange = (Math.floor(Math.random() * 8) + 2).toString() +
                   Math.floor(Math.random() * 10).toString() +
                   Math.floor(Math.random() * 10).toString();
  const subscriber = Math.floor(1000 + Math.random() * 9000).toString();
  const randomPhone = '202' + exchange + subscriber;

  await signupPage.fillSignupFormPartial({
    email: this.getData('email'),
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: '',
    phone: randomPhone
  });
});

When('I fill in the signup form without email', async function () {
  const exchange = (Math.floor(Math.random() * 8) + 2).toString() +
                   Math.floor(Math.random() * 10).toString() +
                   Math.floor(Math.random() * 10).toString();
  const subscriber = Math.floor(1000 + Math.random() * 9000).toString();
  const randomPhone = '202' + exchange + subscriber;

  await signupPage.fillSignupFormPartial({
    email: '',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phone: randomPhone
  });
});

When('I fill in the signup form without password', async function () {
  const exchange = (Math.floor(Math.random() * 8) + 2).toString() +
                   Math.floor(Math.random() * 10).toString() +
                   Math.floor(Math.random() * 10).toString();
  const subscriber = Math.floor(1000 + Math.random() * 9000).toString();
  const randomPhone = '202' + exchange + subscriber;

  await signupPage.fillSignupFormPartial({
    email: this.getData('email'),
    password: '',
    firstName: 'Test',
    lastName: 'User',
    phone: randomPhone
  });
});

// ==================== WHEN STEPS - Form Submission ====================

When('I submit the signup form', async function () {
  await signupPage.submitSignupForm();
});

When('I submit the signup form without filling any fields', async function () {
  await signupPage.clickCreateAccountButton();
});

When('I click the create account button', async function () {
  await signupPage.clickCreateAccountButton();
});

// ==================== WHEN STEPS - OTP ====================

When('I wait for the OTP email', async function () {
  if (!mailslurp) {
    mailslurp = new MailSlurpHelper();
  }

  const inboxId = this.getData('inboxId');
  console.log('Waiting for OTP email...');

  this.otp = await mailslurp.waitForOTP(inboxId, 120000);
  if (!this.otp) {
    throw new Error('Failed to extract OTP from email');
  }

  this.storeData('otp', this.otp);
  console.log(`OTP received: ${this.otp}`);
});

When('I enter the OTP code', async function () {
  const otp = this.getData('otp');
  await signupPage.enterOTP(otp);
});

When('I enter incorrect OTP {string}', async function (incorrectOtp) {
  await signupPage.enterOTP(incorrectOtp);
});

When('I submit the OTP verification', async function () {
  await signupPage.submitOTP();
});

// ==================== WHEN STEPS - Navigation ====================

When('I click on {string}', async function (linkText) {
  await signupPage.clickLink(linkText);
});

When('I close the signup modal', async function () {
  await signupPage.closeModal();
});

// ==================== THEN STEPS - Verification ====================

Then('I should be redirected to the OTP verification page', async function () {
  const isOnVerification = await signupPage.isOnVerificationPage();
  expect(isOnVerification).toBe(true);
  console.log('On OTP verification page');
});

Then('I should see a success message', async function () {
  const isSignupSuccessful = await signupPage.isSignupSuccessful();
  expect(isSignupSuccessful).toBe(true);
  console.log('Signup successful - login form displayed');
});

Then('my credentials should be saved', async function () {
  const credentials = {
    email: this.getData('email'),
    password: this.getData('password'),
    inboxId: this.getData('inboxId')
  };

  fileHelper.saveCredentials(credentials);
  console.log('Credentials saved successfully');
});

// ==================== THEN STEPS - Error Messages ====================

Then('I should see error {string}', async function (expectedError) {
  const hasError = await signupPage.hasErrorMessage(expectedError);
  expect(hasError).toBe(true);
  console.log(`Verified error message: ${expectedError}`);
});

Then('I should see an error message for invalid email', async function () {
  const errorMessage = await signupPage.getErrorMessage();
  expect(errorMessage).toBeTruthy();
  expect(errorMessage.toLowerCase()).toMatch(/invalid|email/);
  console.log(`Error message: ${errorMessage}`);
});

Then('I should see an error message for existing account', async function () {
  const errorMessage = await signupPage.getErrorMessage();
  expect(errorMessage).toBeTruthy();
  expect(errorMessage.toLowerCase()).toMatch(/exist|already|registered/);
  console.log(`Error message: ${errorMessage}`);
});

Then('I should see an error message for weak password', async function () {
  const errorMessage = await signupPage.getErrorMessage();
  expect(errorMessage).toBeTruthy();
  console.log(`Error message: ${errorMessage}`);
});

Then('I should see an error for invalid OTP', async function () {
  const hasError = await signupPage.hasOTPError();
  expect(hasError).toBe(true);
  console.log('Invalid OTP error displayed');
});

// ==================== THEN STEPS - Navigation ====================

Then('I should see the login modal', async function () {
  const isLoginVisible = await loginPage.isLoginModalVisible();
  expect(isLoginVisible).toBe(true);
  console.log('Login modal is visible');
});

Then('the signup modal should be closed', async function () {
  const isModalClosed = await signupPage.isModalClosed();
  expect(isModalClosed).toBe(true);
  console.log('Signup modal is closed');
});

// ==================== THEN STEPS - Security ====================

Then('the application should handle the input safely', async function () {
  const pageTitle = await this.page.title();
  expect(pageTitle).toBeTruthy();

  const isDialogVisible = await this.page.getByRole('dialog').isVisible().catch(() => false);
  expect(isDialogVisible).toBe(true);
  console.log('Application handled input safely');
});
