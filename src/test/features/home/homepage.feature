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


  