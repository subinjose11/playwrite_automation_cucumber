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
