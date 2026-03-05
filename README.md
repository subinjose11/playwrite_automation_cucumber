# Spot Care Automation

Cucumber + Playwright automation framework for testing [staging.spot.care](https://staging.spot.care).

## Prerequisites

- Node.js (v18 or higher)
- npm

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd spot-care-automation
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install
```

4. Create environment file:
```bash
cp .env.example .env
```

5. Configure `.env` with your settings:
```
MAILSLURP_API_KEY=your_mailslurp_api_key
BASE_URL=https://staging.spot.care/
HEADLESS=false
SLOW_MO=0
DEFAULT_TIMEOUT=30000
```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests with staging config:
```bash
npm run test:staging
```

Run tests by tag:
```bash
npm run test:tags "@smoke"
```

Open HTML report:
```bash
npm run report
```

## Project Structure

```
├── config/                 # Cucumber configuration files
│   ├── cucumber.js
│   └── cucumber.staging.js
├── src/
│   ├── hooks/              # Cucumber hooks and world setup
│   ├── pages/              # Page Object Models
│   │   ├── auth/
│   │   └── home/
│   ├── test/
│   │   ├── features/       # Gherkin feature files
│   │   └── steps/          # Step definitions
│   └── utils/              # Helper utilities
├── test-data/              # Test data files
└── reports/                # Generated test reports
```

## Writing Tests

### Feature Files
Feature files are located in `src/test/features/` and use Gherkin syntax.

### Step Definitions
Step definitions are in `src/test/steps/` and map Gherkin steps to Playwright actions.

### Page Objects
Page objects in `src/pages/` encapsulate page interactions and locators.
