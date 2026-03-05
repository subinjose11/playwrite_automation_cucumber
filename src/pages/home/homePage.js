const BasePage = require('../basePage');

class HomePage extends BasePage {
  constructor(page) {
    super(page);

    this.selectors = {
      // Header
      logo: 'a:has-text("SpotCare Logo")',
      loginButton: 'button:has-text("Login")',
      signupButton: 'button:has-text("Sign Up Free")',

      // Hero Section
      mainHeading: 'h1:has-text("Spot your")',
      heroDescription: 'article p',
      providerCount: 'strong:has-text("50,000+")',

      // Search Form
      servicesTab: 'p:has-text("Services")',
      providersTab: 'p:has-text("Providers")',
      typeOfCareInput: 'textbox[name="Type of care"]',
      locationInput: 'textbox[name="Location"]',
      distanceButton: 'button:has-text("How far are you looking?")',
      searchButton: 'button[disabled]',

      // Provider Listings
      providerRegionHeading: 'h2',
      providerCount: 'p:has-text("Providers Near You")',
      providerCards: 'a[href^="/provider/"]',
      providerName: 'p > span',
      saveButton: 'text=Save',
      medicareRating: 'img[alt="Medicare Rating"]',

      // Pagination
      paginationNav: 'nav',
      previousButton: 'nav button:first-child',
      nextButton: 'nav button:last-child',

      // Map
      mapRegion: 'region[name="Map"]',
      recenterButton: 'button:has-text("Re-center")',

      // Footer
      footerLogo: 'footer a:has-text("SpotCare Logo")',
      faqLink: 'a[href="/faq"]',
      blogLink: 'a[href="/blog"]',
      termsLink: 'a[href="/terms"]',
      privacyLink: 'a[href="/privacy"]',
      contactLink: 'a[href="/contact"]',
      linkedinButton: 'button:has-text("Linkedin")',
      facebookButton: 'button:has-text("Facebook")',
      instagramButton: 'button:has-text("Instagram")',
      twitterButton: 'button:has-text("Twitter")',
      copyright: 'text=© 2026 Spot.care'
    };
  }

  // ==================== Navigation ====================

  async navigateToHome() {
    const baseUrl = process.env.BASE_URL || 'https://staging.spot.care/';
    await this.navigate(baseUrl);
    await this.page.waitForLoadState('networkidle');
  }

  async clickLogo() {
    await this.page.locator('img[alt="SpotCare Logo"]').first().click();
  }

  async clickLoginButton() {
    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  async clickSignupButton() {
    await this.page.getByRole('button', { name: 'Sign Up Free' }).click();
  }

  // ==================== Header Verification ====================

  async isLogoVisible() {
    return await this.page.locator('img[alt="SpotCare Logo"]').first().isVisible();
  }

  async isLoginButtonVisible() {
    return await this.page.getByRole('button', { name: 'Login' }).isVisible();
  }

  async isSignupButtonVisible() {
    return await this.page.getByRole('button', { name: 'Sign Up Free' }).isVisible();
  }

  // ==================== Hero Section ====================

  async getMainHeadingText() {
    return await this.page.locator('h1').textContent();
  }

  async isHeroSectionVisible() {
    const heading = await this.page.locator('h1:has-text("Spot your")').isVisible();
    return heading;
  }

  async getProviderCountText() {
    return await this.page.locator('strong:has-text("50,000+")').textContent();
  }

  // ==================== Search Form ====================

  async clickServicesTab() {
    await this.page.locator('p:has-text("Services")').click();
  }

  async clickProvidersTab() {
    await this.page.locator('p:has-text("Providers")').click();
  }

  async isSearchFormVisible() {
    const typeOfCare = await this.page.getByRole('textbox', { name: 'Type of care' }).isVisible();
    const location = await this.page.getByRole('textbox', { name: 'Location' }).isVisible();
    return typeOfCare && location;
  }

  async enterTypeOfCare(careType) {
    await this.page.getByRole('textbox', { name: 'Type of care' }).click();
    await this.page.getByRole('textbox', { name: 'Type of care' }).fill(careType);
  }

  async enterLocation(location) {
    await this.page.getByRole('textbox', { name: 'Location' }).click();
    await this.page.getByRole('textbox', { name: 'Location' }).fill(location);
  }

  async selectDistance(distance) {
    await this.page.getByRole('button', { name: 'How far are you looking?' }).click();
    await this.page.waitForTimeout(500);
    // Select distance option if dropdown appears
  }

  async isSearchButtonEnabled() {
    const button = this.page.locator('button').filter({ has: this.page.locator('img') }).last();
    const isDisabled = await button.getAttribute('disabled');
    return isDisabled === null;
  }

  // ==================== Provider Listings ====================

  async getProviderRegionHeading() {
    return await this.page.locator('h2').first().textContent();
  }

  async getProviderCountNearby() {
    const text = await this.page.getByText(/\d+ Providers Near You/).textContent();
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async getProviderCardsCount() {
    return await this.page.locator('a[href^="/provider/"]').count();
  }

  async getFirstProviderName() {
    return await this.page.locator('a[href^="/provider/"]').first().locator('p').first().textContent();
  }

  async clickFirstProvider() {
    await this.page.locator('a[href^="/provider/"]').first().click();
  }

  async isProviderListVisible() {
    return await this.page.locator('a[href^="/provider/"]').first().isVisible();
  }

  async getProviderNames() {
    const providers = this.page.locator('a[href^="/provider/"] p:first-child');
    return await providers.allTextContents();
  }

  // ==================== Pagination ====================

  async isPaginationVisible() {
    return await this.page.locator('nav').last().isVisible();
  }

  async clickNextPage() {
    await this.page.locator('nav button').last().click();
    await this.page.waitForTimeout(1000);
  }

  async clickPreviousPage() {
    await this.page.locator('nav button').first().click();
    await this.page.waitForTimeout(1000);
  }

  async clickPageNumber(pageNum) {
    await this.page.locator(`nav >> text="${pageNum}"`).click();
    await this.page.waitForTimeout(1000);
  }

  async getCurrentPage() {
    // The current page is usually highlighted differently
    const pages = await this.page.locator('nav > *').allTextContents();
    return pages;
  }

  // ==================== Map ====================

  async isMapVisible() {
    return await this.page.locator('region[name="Map"]').isVisible().catch(() => false) ||
           await this.page.locator('iframe').isVisible();
  }

  async clickRecenterButton() {
    await this.page.getByRole('button', { name: 'Re-center' }).click();
  }

  async isRecenterButtonVisible() {
    return await this.page.getByRole('button', { name: 'Re-center' }).isVisible();
  }

  // ==================== Footer ====================

  async isFooterVisible() {
    return await this.page.locator('text=© 2026 Spot.care').isVisible();
  }

  async clickFooterLink(linkName) {
    const linkMap = {
      'FAQ': '/faq',
      'Blog': '/blog',
      'Terms & Conditions': '/terms',
      'Privacy': '/privacy',
      'Contact us': '/contact'
    };
    await this.page.locator(`a[href="${linkMap[linkName]}"]`).click();
  }

  async getFooterLinks() {
    return ['FAQ', 'Blog', 'Terms & Conditions', 'Privacy', 'Contact us'];
  }

  async areSocialLinksVisible() {
    const linkedin = await this.page.getByRole('button', { name: 'Linkedin' }).isVisible();
    const facebook = await this.page.getByRole('button', { name: 'Facebook' }).isVisible();
    const instagram = await this.page.getByRole('button', { name: 'Instagram' }).isVisible();
    const twitter = await this.page.getByRole('button', { name: 'Twitter' }).isVisible();
    return linkedin && facebook && instagram && twitter;
  }

  async getCopyrightText() {
    return await this.page.locator('text=© 2026 Spot.care').textContent();
  }

  // ==================== Page Verification ====================

  async getPageTitle() {
    return await this.page.title();
  }

  async isHomePageLoaded() {
    const logo = await this.isLogoVisible();
    const hero = await this.isHeroSectionVisible();
    const searchForm = await this.isSearchFormVisible();
    return logo && hero && searchForm;
  }
}

module.exports = HomePage;
