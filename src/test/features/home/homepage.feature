@home @homepage
Feature: Homepage

  As a visitor
  I want to view the Spot.care homepage
  So that I can search for healthcare providers and learn about the platform

  Background:
    Given I am on the homepage

  # ==================== POSITIVE SCENARIOS ====================

  # --- Page Load & Header ---

  @smoke @positive @ui
  Scenario: Homepage loads successfully
    Then the page title should be "Find Healthcare Providers Near You | Spot Care"
    And the SpotCare logo should be visible
    And the Login button should be visible
    And the Sign Up Free button should be visible

  @positive @header
  Scenario: Click on logo navigates to homepage
    When I click on the SpotCare logo
    Then I should be on the homepage

  @positive @header @navigation
  Scenario: Open login modal from header
    When I click the Login button
    Then I should see the login modal

  @positive @header @navigation
  Scenario: Open signup modal from header
    When I click the Sign Up Free button
    Then I should see the signup modal

  # --- Hero Section ---

  @positive @hero
  Scenario: Hero section displays correctly
    Then I should see the main heading "Spot your"
    And I should see the provider count "50,000+ verified healthcare providers"
    And I should see the hero description

  # --- Search Form ---

  @smoke @positive @search
  Scenario: Search form is visible and functional
    Then the search form should be visible
    And the Type of care field should be visible
    And the Location field should be visible
    And the Distance dropdown should be visible

  @positive @search @tabs
  Scenario: Switch between Services and Providers tabs
    When I click on the Services tab
    Then the Services tab should be active
    When I click on the Providers tab
    Then the Providers tab should be active

  @positive @search
  Scenario: Enter search criteria
    When I enter "Skilled Nursing" in the Type of care field
    And I enter "New York" in the Location field
    Then the search fields should contain the entered values

  # --- Provider Listings ---

  @smoke @positive @providers
  Scenario: Provider listings are displayed
    Then I should see provider listings
    And I should see the region heading
    And I should see the provider count near me
    And each provider card should display name and address

  @positive @providers @pagination
  Scenario: Navigate through provider pages
    Given there are multiple pages of providers
    When I click the next page button
    Then I should see different providers
    When I click the previous page button
    Then I should see the original providers

  @positive @providers @navigation
  Scenario: Click on provider card
    When I click on the first provider card
    Then I should be navigated to the provider detail page

  # --- Map ---

  @positive @map
  Scenario: Map is displayed
    Then the map should be visible
    And the Re-center button should be visible

  @positive @map
  Scenario: Re-center map
    When I click the Re-center button
    Then the map should re-center to the default location

  # --- Footer ---

  @smoke @positive @footer
  Scenario: Footer is displayed with all elements
    Then the footer should be visible
    And the footer should contain FAQ link
    And the footer should contain Blog link
    And the footer should contain Terms & Conditions link
    And the footer should contain Privacy link
    And the footer should contain Contact us link
    And the social media links should be visible
    And the copyright text should be visible

  @positive @footer @navigation
  Scenario: Navigate to FAQ page
    When I click on the FAQ link in footer
    Then I should be navigated to the FAQ page

  @positive @footer @navigation
  Scenario: Navigate to Blog page
    When I click on the Blog link in footer
    Then I should be navigated to the Blog page

  @positive @footer @navigation
  Scenario: Navigate to Terms page
    When I click on the Terms & Conditions link in footer
    Then I should be navigated to the Terms page

  @positive @footer @navigation
  Scenario: Navigate to Privacy page
    When I click on the Privacy link in footer
    Then I should be navigated to the Privacy page

  @positive @footer @navigation
  Scenario: Navigate to Contact page
    When I click on the Contact us link in footer
    Then I should be navigated to the Contact page

  # ==================== NEGATIVE SCENARIOS ====================

  @negative @search
  Scenario: Search with no results
    When I enter "NonExistentCareType12345" in the Type of care field
    And I enter "InvalidLocation99999" in the Location field
    And I perform the search
    Then I should see a no results message or empty provider list

  # ==================== RESPONSIVE SCENARIOS ====================

  @positive @responsive
  Scenario: Homepage displays correctly on mobile viewport
    Given I resize the browser to mobile viewport
    Then the page should be responsive
    And the navigation should be accessible
