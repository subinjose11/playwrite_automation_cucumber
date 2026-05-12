@auth @login
Feature: User Login

  As a registered user
  I want to log in to my Spot.care account
  So that I can access healthcare provider search and save features

  Background:
    Given I am on the login page

  # ==================== POSITIVE SCENARIOS ====================

  @smoke @e2e @positive
  Scenario: Successful login with valid credentials
    Given I have saved credentials
    When I enter my email and password
    And I click the login button
    Then I should be logged in successfully
    And I should see the dashboard

  @positive @navigation
  Scenario: Navigate to signup from login modal
    When I click on "Don't have account? Sign up"
    Then I should see the signup modal

  @positive @navigation
  Scenario: Navigate to forgot password
    When I click on "Forgot password?"
    Then I should see the forgot password form

  @positive @ui
  Scenario: Close login modal
    When I close the login modal
    Then the login modal should be closed

  @positive @ui
  Scenario: Toggle password visibility
    When I enter password "TestPassword123!"
    And I click the show password button
    Then the password should be visible
