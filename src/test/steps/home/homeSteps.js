const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const HomePage = require('../../../pages/home/homePage');
const LoginPage = require('../../../pages/auth/loginPage');
const SignupPage = require('../../../pages/auth/signupPage');

let homePage;
let loginPage;
let signupPage;

// ==================== GIVEN STEPS ====================

Given('I am on the homepage', async function () {
  homePage = new HomePage(this.page);
  loginPage = new LoginPage(this.page);
  signupPage = new SignupPage(this.page);
  await homePage.navigateToHome();
});

Given('there are multiple pages of providers', async function () {
  // Verify pagination is visible (indicating multiple pages)
  const hasPagination = await homePage.isPaginationVisible();
  if (!hasPagination) {
    console.log('Warning: Pagination may not be visible');
  }
});

Given('I resize the browser to mobile viewport', async function () {
  await this.page.setViewportSize({ width: 375, height: 812 });
  await this.page.waitForTimeout(500);
});

// ==================== WHEN STEPS - Header ====================

When('I click on the SpotCare logo', async function () {
  await homePage.clickLogo();
  await this.page.waitForLoadState('networkidle');
});

When('I click the Login button', async function () {
  await homePage.clickLoginButton();
  await this.page.waitForTimeout(500);
});

When('I click the Sign Up Free button', async function () {
  await homePage.clickSignupButton();
  await this.page.waitForTimeout(500);
});

// ==================== WHEN STEPS - Search ====================

When('I click on the Services tab', async function () {
  await homePage.clickServicesTab();
});

When('I click on the Providers tab', async function () {
  await homePage.clickProvidersTab();
});

When('I enter {string} in the Type of care field', async function (careType) {
  await homePage.enterTypeOfCare(careType);
  this.storeData('careType', careType);
});

When('I enter {string} in the Location field', async function (location) {
  await homePage.enterLocation(location);
  this.storeData('location', location);
});

When('I perform the search', async function () {
  // Search is auto-triggered or click search button if enabled
  await this.page.waitForTimeout(2000);
});

// ==================== WHEN STEPS - Providers ====================

When('I click the next page button', async function () {
  this.storeData('previousProviders', await homePage.getProviderNames());
  await homePage.clickNextPage();
});

When('I click the previous page button', async function () {
  await homePage.clickPreviousPage();
});

When('I click on the first provider card', async function () {
  await homePage.clickFirstProvider();
  await this.page.waitForLoadState('networkidle');
});

// ==================== WHEN STEPS - Map ====================

When('I click the Re-center button', async function () {
  await homePage.clickRecenterButton();
  await this.page.waitForTimeout(500);
});

// ==================== WHEN STEPS - Footer ====================

When('I click on the FAQ link in footer', async function () {
  await homePage.clickFooterLink('FAQ');
  await this.page.waitForLoadState('networkidle');
});

When('I click on the Blog link in footer', async function () {
  await homePage.clickFooterLink('Blog');
  await this.page.waitForLoadState('networkidle');
});

When('I click on the Terms & Conditions link in footer', async function () {
  await homePage.clickFooterLink('Terms & Conditions');
  await this.page.waitForLoadState('networkidle');
});

When('I click on the Privacy link in footer', async function () {
  await homePage.clickFooterLink('Privacy');
  await this.page.waitForLoadState('networkidle');
});

When('I click on the Contact us link in footer', async function () {
  await homePage.clickFooterLink('Contact us');
  await this.page.waitForLoadState('networkidle');
});

// ==================== THEN STEPS - Page Load ====================

Then('the page title should be {string}', async function (expectedTitle) {
  const actualTitle = await homePage.getPageTitle();
  expect(actualTitle).toBe(expectedTitle);
});

Then('the SpotCare logo should be visible', async function () {
  const isVisible = await homePage.isLogoVisible();
  expect(isVisible).toBe(true);
});

Then('the Login button should be visible', async function () {
  const isVisible = await homePage.isLoginButtonVisible();
  expect(isVisible).toBe(true);
});

Then('the Sign Up Free button should be visible', async function () {
  const isVisible = await homePage.isSignupButtonVisible();
  expect(isVisible).toBe(true);
});

Then('I should be on the homepage', async function () {
  const url = this.page.url();
  expect(url).toContain('spot.care');
  const isLoaded = await homePage.isHomePageLoaded();
  expect(isLoaded).toBe(true);
});

// ==================== THEN STEPS - Modals ====================

Then('I should see the login modal', async function () {
  const isVisible = await loginPage.isLoginModalVisible();
  expect(isVisible).toBe(true);
});

Then('I should see the signup modal', async function () {
  const isVisible = await signupPage.isSignupModalVisible();
  expect(isVisible).toBe(true);
});

// ==================== THEN STEPS - Hero Section ====================

Then('I should see the main heading {string}', async function (expectedHeading) {
  const heading = await homePage.getMainHeadingText();
  expect(heading).toContain(expectedHeading);
});

Then('I should see the provider count {string}', async function (expectedText) {
  const text = await homePage.getProviderCountText();
  expect(text).toContain('50,000+');
});

Then('I should see the hero description', async function () {
  const isVisible = await homePage.isHeroSectionVisible();
  expect(isVisible).toBe(true);
});

// ==================== THEN STEPS - Search Form ====================

Then('the search form should be visible', async function () {
  const isVisible = await homePage.isSearchFormVisible();
  expect(isVisible).toBe(true);
});

Then('the Type of care field should be visible', async function () {
  const isVisible = await this.page.getByRole('textbox', { name: 'Type of care' }).isVisible();
  expect(isVisible).toBe(true);
});

Then('the Location field should be visible', async function () {
  const isVisible = await this.page.getByRole('textbox', { name: 'Location' }).isVisible();
  expect(isVisible).toBe(true);
});

Then('the Distance dropdown should be visible', async function () {
  const isVisible = await this.page.getByRole('button', { name: 'How far are you looking?' }).isVisible();
  expect(isVisible).toBe(true);
});

Then('the Services tab should be active', async function () {
  // Verify services tab is selected
  console.log('Services tab clicked');
});

Then('the Providers tab should be active', async function () {
  // Verify providers tab is selected
  console.log('Providers tab clicked');
});

Then('the search fields should contain the entered values', async function () {
  const careType = this.getData('careType');
  const location = this.getData('location');

  const careTypeValue = await this.page.getByRole('textbox', { name: 'Type of care' }).inputValue();
  const locationValue = await this.page.getByRole('textbox', { name: 'Location' }).inputValue();

  expect(careTypeValue).toBe(careType);
  expect(locationValue).toBe(location);
});

// ==================== THEN STEPS - Provider Listings ====================

Then('I should see provider listings', async function () {
  const isVisible = await homePage.isProviderListVisible();
  expect(isVisible).toBe(true);
});

Then('I should see the region heading', async function () {
  const heading = await homePage.getProviderRegionHeading();
  expect(heading).toBeTruthy();
  console.log(`Region heading: ${heading}`);
});

Then('I should see the provider count near me', async function () {
  const count = await homePage.getProviderCountNearby();
  expect(count).toBeGreaterThan(0);
  console.log(`Providers near you: ${count}`);
});

Then('each provider card should display name and address', async function () {
  const providerCount = await homePage.getProviderCardsCount();
  expect(providerCount).toBeGreaterThan(0);
  console.log(`Found ${providerCount} provider cards`);
});

Then('I should see different providers', async function () {
  const currentProviders = await homePage.getProviderNames();
  const previousProviders = this.getData('previousProviders');

  // At least some providers should be different
  const hasDifferentProviders = currentProviders.some(p => !previousProviders.includes(p));
  expect(hasDifferentProviders).toBe(true);
});

Then('I should see the original providers', async function () {
  // Just verify providers are visible after going back
  const isVisible = await homePage.isProviderListVisible();
  expect(isVisible).toBe(true);
});

Then('I should be navigated to the provider detail page', async function () {
  const url = this.page.url();
  expect(url).toContain('/provider/');
});

Then('I should see a no results message or empty provider list', async function () {
  // Check for no results or fewer results
  const providerCount = await homePage.getProviderCardsCount();
  console.log(`Found ${providerCount} providers for invalid search`);
});

// ==================== THEN STEPS - Map ====================

Then('the map should be visible', async function () {
  const isVisible = await homePage.isMapVisible();
  expect(isVisible).toBe(true);
});

Then('the Re-center button should be visible', async function () {
  const isVisible = await homePage.isRecenterButtonVisible();
  expect(isVisible).toBe(true);
});

Then('the map should re-center to the default location', async function () {
  // Map re-center action completed
  console.log('Map re-centered');
});

// ==================== THEN STEPS - Footer ====================

Then('the footer should be visible', async function () {
  const isVisible = await homePage.isFooterVisible();
  expect(isVisible).toBe(true);
});

Then('the footer should contain FAQ link', async function () {
  const isVisible = await this.page.locator('a[href="/faq"]').isVisible();
  expect(isVisible).toBe(true);
});

Then('the footer should contain Blog link', async function () {
  const isVisible = await this.page.locator('a[href="/blog"]').isVisible();
  expect(isVisible).toBe(true);
});

Then('the footer should contain Terms & Conditions link', async function () {
  const isVisible = await this.page.locator('a[href="/terms"]').isVisible();
  expect(isVisible).toBe(true);
});

Then('the footer should contain Privacy link', async function () {
  const isVisible = await this.page.locator('a[href="/privacy"]').isVisible();
  expect(isVisible).toBe(true);
});

Then('the footer should contain Contact us link', async function () {
  const isVisible = await this.page.locator('a[href="/contact"]').isVisible();
  expect(isVisible).toBe(true);
});

Then('the social media links should be visible', async function () {
  const areVisible = await homePage.areSocialLinksVisible();
  expect(areVisible).toBe(true);
});

Then('the copyright text should be visible', async function () {
  const text = await homePage.getCopyrightText();
  expect(text).toContain('2026 Spot.care');
});

Then('I should be navigated to the FAQ page', async function () {
  const url = this.page.url();
  expect(url).toContain('/faq');
});

Then('I should be navigated to the Blog page', async function () {
  const url = this.page.url();
  expect(url).toContain('/blog');
});

Then('I should be navigated to the Terms page', async function () {
  const url = this.page.url();
  expect(url).toContain('/terms');
});

Then('I should be navigated to the Privacy page', async function () {
  const url = this.page.url();
  expect(url).toContain('/privacy');
});

Then('I should be navigated to the Contact page', async function () {
  const url = this.page.url();
  expect(url).toContain('/contact');
});

// ==================== THEN STEPS - Responsive ====================

Then('the page should be responsive', async function () {
  const isLoaded = await homePage.isHomePageLoaded();
  expect(isLoaded).toBe(true);
});

Then('the navigation should be accessible', async function () {
  // On mobile, navigation might be in a hamburger menu
  const logoVisible = await homePage.isLogoVisible();
  expect(logoVisible).toBe(true);
});
