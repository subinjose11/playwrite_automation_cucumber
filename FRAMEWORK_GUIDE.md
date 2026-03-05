# Playwright + Cucumber BDD Framework Guide

This document explains how Playwright and Cucumber work together in this automation framework, with detailed code explanations.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [How Cucumber BDD Works](#how-cucumber-bdd-works)
4. [How Playwright Integrates](#how-playwright-integrates)
5. [Execution Flow](#execution-flow)
6. [Code Deep Dive](#code-deep-dive)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        TEST EXECUTION                            │
├─────────────────────────────────────────────────────────────────┤
│  Feature Files (.feature)                                        │
│  └── Written in Gherkin syntax (Given/When/Then)                │
│       ↓                                                          │
│  Step Definitions (.js)                                          │
│  └── JavaScript functions that implement each step               │
│       ↓                                                          │
│  Page Objects (.js)                                              │
│  └── Encapsulate page interactions using Playwright              │
│       ↓                                                          │
│  Playwright Browser                                              │
│  └── Automates the actual browser (Chrome, Firefox, etc.)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
demo_automation/
├── config/
│   └── cucumber.js           # Cucumber configuration
├── src/
│   ├── hooks/
│   │   ├── world.js          # Custom World - Playwright browser setup
│   │   └── hooks.js          # Before/After hooks for test lifecycle
│   ├── pages/
│   │   ├── basePage.js       # Base page with common Playwright methods
│   │   └── auth/
│   │       ├── loginPage.js  # Login page interactions
│   │       └── signupPage.js # Signup page interactions
│   ├── test/
│   │   ├── features/         # Gherkin feature files
│   │   │   └── auth/
│   │   │       ├── login.feature
│   │   │       └── signup.feature
│   │   └── steps/            # Step definitions
│   │       └── auth/
│   │           ├── loginSteps.js
│   │           └── signupSteps.js
│   └── utils/
│       ├── mailslurp.js      # Email testing utility
│       └── fileHelper.js     # File operations utility
├── reports/                  # Test reports and screenshots
├── .env                      # Environment variables
└── package.json
```

---

## How Cucumber BDD Works

### 1. Feature Files (Gherkin Syntax)

Feature files describe test scenarios in plain English using **Gherkin** syntax:

```gherkin
# src/test/features/auth/signup.feature

@auth @signup
Feature: User Signup with OTP Verification

  As a new user
  I want to sign up for an account on Spot.care
  So that I can access the healthcare provider search features

  Background:
    Given I am on the signup page

  @smoke @otp @e2e
  Scenario: Successful signup with OTP verification
    Given I have a new email inbox
    When I fill in the signup form with valid details
    And I submit the signup form
    Then I should be redirected to the OTP verification page
    When I wait for the OTP email
    And I enter the OTP code
    And I submit the OTP verification
    Then I should see a success message
    And my credentials should be saved
```

**Key Gherkin Keywords:**

- `Feature:` - Describes the feature being tested
- `Background:` - Steps that run before each scenario
- `Scenario:` - A single test case
- `Given` - Preconditions (setup)
- `When` - Actions (what user does)
- `Then` - Expected outcomes (assertions)
- `And` - Continuation of previous keyword
- `@tags` - Labels for filtering tests

### 2. Step Definitions

Step definitions are JavaScript functions that **match** Gherkin steps and **implement** the actual test logic:

```javascript
// src/test/steps/auth/signupSteps.js

const { Given, When, Then } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const SignupPage = require("../../../pages/auth/signupPage");

let signupPage;

// This function runs when Cucumber sees "Given I am on the signup page"
Given("I am on the signup page", async function () {
  // 'this' refers to the CustomWorld instance (has this.page from Playwright)
  signupPage = new SignupPage(this.page);
  await signupPage.navigateToSignup();
  await signupPage.openSignupModal();
});

// This matches "When I fill in the signup form with valid details"
When("I fill in the signup form with valid details", async function () {
  const password = "TestPassword123!";
  this.storeData("password", password); // Store for later use

  // Generate random phone number
  const randomPhone = "202" + Math.floor(1000000 + Math.random() * 9000000);

  await signupPage.fillSignupForm({
    email: this.getData("email"), // Retrieved from previous step
    password: password,
    firstName: "Test",
    lastName: "User",
    phone: randomPhone,
  });
});

// This matches "Then I should be redirected to the OTP verification page"
Then("I should be redirected to the OTP verification page", async function () {
  const isOnVerification = await signupPage.isOnVerificationPage();
  expect(isOnVerification).toBe(true); // Playwright assertion
});
```

**How Matching Works:**

```
Feature File:                    Step Definition:
─────────────                    ────────────────
Given I am on the signup page → Given('I am on the signup page', async function() {...})
When I fill in ... with email "test@example.com" → When('I fill in ... with email {string}', async function(email) {...})
```

---

## How Playwright Integrates

### 1. Custom World (Browser Setup)

The **World** is Cucumber's context object shared across all steps in a scenario. We extend it to include Playwright:

```javascript
// src/hooks/world.js

const { setWorldConstructor, World } = require("@cucumber/cucumber");
const { chromium } = require("@playwright/test");

class CustomWorld extends World {
  constructor(options) {
    super(options);

    // These will hold Playwright objects
    this.browser = null; // Browser instance (Chrome)
    this.context = null; // Browser context (like incognito window)
    this.page = null; // Page object (the actual tab)

    // Test data storage
    this.testData = {};
  }

  // Initialize Playwright browser
  async initBrowser() {
    // Launch Chrome browser
    this.browser = await chromium.launch({
      headless: process.env.HEADLESS === "true", // Show browser or not
      slowMo: parseInt(process.env.SLOW_MO) || 0, // Slow down for debugging
    });

    // Create a new browser context (isolated session)
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
    });

    // Open a new page (tab)
    this.page = await this.context.newPage();
  }

  // Cleanup after test
  async closeBrowser() {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }

  // Helper to share data between steps
  storeData(key, value) {
    this.testData[key] = value;
  }

  getData(key) {
    return this.testData[key];
  }
}

// Register our custom world with Cucumber
setWorldConstructor(CustomWorld);
```

### 2. Hooks (Lifecycle Management)

Hooks run automatically at specific points in the test lifecycle:

```javascript
// src/hooks/hooks.js

const {
  Before,
  After,
  BeforeAll,
  AfterAll,
  Status,
} = require("@cucumber/cucumber");

// Runs once before all tests
BeforeAll(async function () {
  console.log("Test suite started");
});

// Runs before EACH scenario
Before(async function (scenario) {
  console.log(`Starting: ${scenario.pickle.name}`);
  await this.initBrowser(); // Start Playwright browser
});

// Runs after EACH scenario
After(async function (scenario) {
  // Take screenshot if test failed
  if (scenario.result.status === Status.FAILED) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    this.attach(screenshot, "image/png"); // Attach to report
  }

  await this.closeBrowser(); // Close Playwright browser
});

// Runs once after all tests
AfterAll(async function () {
  console.log("Test suite completed");
});
```

### 3. Page Objects (Encapsulated Interactions)

Page Objects encapsulate all interactions with a specific page using Playwright:

```javascript
// src/pages/basePage.js - Common methods for all pages

class BasePage {
  constructor(page) {
    this.page = page; // Playwright page object
  }

  async navigate(url) {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
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
}
```

```javascript
// src/pages/auth/signupPage.js - Signup page specific methods

const BasePage = require("../basePage");

class SignupPage extends BasePage {
  constructor(page) {
    super(page);
  }

  async openSignupModal() {
    // Use Playwright's role-based selector (most reliable)
    const signupButton = this.page.getByRole("button", {
      name: "Sign Up Free",
    });
    await signupButton.click();

    // Wait for dialog to appear
    await this.page.getByRole("dialog").waitFor({ state: "visible" });
  }

  async fillSignupForm(userData) {
    const dialog = this.page.getByRole("dialog");

    // Fill form fields using Playwright locators
    await dialog.locator('input[name="firstName"]').fill(userData.firstName);
    await dialog.locator('input[name="lastName"]').fill(userData.lastName);

    // Email input (no name attribute, use position)
    await dialog.locator('input[type="text"]').nth(2).fill(userData.email);

    // Phone - must type slowly for formatting
    const phoneInput = dialog.locator('input[type="tel"]');
    await phoneInput.click();
    await phoneInput.pressSequentially(userData.phone, { delay: 50 });

    // Password
    await dialog.locator('input[type="password"]').fill(userData.password);
  }

  async submitSignupForm() {
    await this.page.getByRole("button", { name: "Create account" }).click();
  }

  async isOnVerificationPage() {
    try {
      await this.page.waitForSelector('h3:has-text("Almost done")', {
        timeout: 10000,
      });
      return true;
    } catch {
      return false;
    }
  }
}
```

---

## Execution Flow

When you run `npm test`, here's what happens:

```
1. npm test
   └── Runs: cucumber-js --config config/cucumber.js

2. Cucumber loads configuration
   └── Reads: config/cucumber.js
       ├── require: ['src/hooks/world.js', 'src/hooks/hooks.js', 'src/test/steps/**/*.js']
       ├── paths: ['src/test/features/**/*.feature']
       └── format: ['html:reports/cucumber-report.html']

3. Cucumber parses feature files
   └── Reads: src/test/features/auth/signup.feature
       └── Finds scenarios tagged @smoke, @login, etc.

4. For EACH scenario:
   │
   ├── BeforeAll hook runs (once at start)
   │
   ├── Before hook runs
   │   └── this.initBrowser() → Launches Chrome via Playwright
   │
   ├── Background steps run
   │   └── "Given I am on the signup page"
   │       └── Matches: Given('I am on the signup page', ...)
   │           └── signupPage.navigateToSignup()
   │               └── this.page.goto('https://staging.spot.care/')
   │
   ├── Scenario steps run in order
   │   ├── "When I fill in the signup form..."
   │   │   └── signupPage.fillSignupForm({...})
   │   │       └── this.page.locator(...).fill(...)
   │   │
   │   └── "Then I should see a success message"
   │       └── expect(isSignupSuccessful).toBe(true)
   │
   ├── After hook runs
   │   ├── Takes screenshot if failed
   │   └── this.closeBrowser() → Closes Chrome
   │
   └── AfterAll hook runs (once at end)

5. Reports generated
   └── reports/cucumber-report.html
```

---

## Code Deep Dive

### Data Flow Between Steps

```javascript
// Step 1: Create email inbox
Given('I have a new email inbox', async function () {
  this.inbox = await mailslurp.createInbox();
  this.storeData('email', this.inbox.emailAddress);     // Store email
  this.storeData('inboxId', this.inbox.id);             // Store inbox ID
});

// Step 2: Use stored email in form
When('I fill in the signup form with valid details', async function () {
  await signupPage.fillSignupForm({
    email: this.getData('email'),  // ← Retrieved from Step 1
    password: 'TestPassword123!',
    ...
  });
});

// Step 3: Use inbox ID to check email
When('I wait for the OTP email', async function () {
  const inboxId = this.getData('inboxId');  // ← Retrieved from Step 1
  this.otp = await mailslurp.waitForOTP(inboxId, 120000);
  this.storeData('otp', this.otp);
});

// Step 4: Use OTP
When('I enter the OTP code', async function () {
  const otp = this.getData('otp');  // ← Retrieved from Step 3
  await signupPage.enterOTP(otp);
});
```

### Playwright Selector Strategies

```javascript
// 1. Role-based (RECOMMENDED - most reliable)
this.page.getByRole("button", { name: "Sign Up Free" });
this.page.getByRole("dialog");
this.page.getByRole("textbox", { name: "Email" });

// 2. CSS Selectors
this.page.locator('input[name="firstName"]');
this.page.locator('input[type="password"]');
this.page.locator('h3:has-text("Sign up")');

// 3. Text-based
this.page.getByText("Already have an account?");
this.page.locator("text=Invalid phone number");

// 4. Position-based (when elements lack unique attributes)
dialog.locator('input[type="text"]').nth(2); // Third text input

// 5. Chained locators
const dialog = this.page.getByRole("dialog");
dialog.locator('input[type="password"]').fill("password");
```

### Waiting Strategies

```javascript
// Wait for element to be visible
await this.page.waitForSelector('h3:has-text("Almost done")', {
  timeout: 10000,
});

// Wait for element state
await element.waitFor({ state: "visible", timeout: 15000 });

// Wait for URL change
await this.page.waitForURL("**/dashboard", { timeout: 10000 });

// Wait for network idle
await this.page.waitForLoadState("networkidle");

// Hard wait (avoid when possible)
await this.page.waitForTimeout(2000);
```

---

## Running Tests

```bash
# Run all tests
npm test

  # Run tests by tags
  npm run test:tags -- "@smoke"                    # All smoke tests
  npm run test:tags -- "@smoke and @signup"        # Smoke + signup tests
  npm run test:tags -- "@smoke and @login"         # Smoke + login tests
  npm run test:tags -- "@auth"                     # All auth tests
  npm run test:tags -- "@negative"                 # All negative tests
  npm run test:tags -- "not @negative"             # Exclude negative tests
  npm run test:tags -- "@home"           # All homepage tests
  npm run test:tags -- "@home and @smoke" # Smoke tests only

# View report
npm run report
```

---

## Key Takeaways

1. **Cucumber** provides the BDD layer (feature files + step definitions)
2. **Playwright** provides the browser automation (page interactions)
3. **World** connects them by providing the Playwright `page` object to all steps
4. **Hooks** manage the browser lifecycle (start before each test, close after)
5. **Page Objects** encapsulate Playwright interactions for maintainability
6. **Data sharing** between steps uses `this.storeData()` and `this.getData()`

The flow is: **Feature File → Step Definition → Page Object → Playwright → Browser**
