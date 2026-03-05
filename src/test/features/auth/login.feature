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

  # ==================== NEGATIVE SCENARIOS ====================

  # --- Empty Field Validations ---

  @negative @validation @empty
  Scenario: Login with empty fields
    When I click the login button without entering credentials
    Then I should see validation errors for required fields

  @negative @validation @empty
  Scenario: Login with empty email
    When I enter password "Password123!" only
    And I click the login button
    Then I should see validation error for email

  @negative @validation @empty
  Scenario: Login with empty password
    When I enter email "test@example.com" only
    And I click the login button
    Then I should see validation error for password

  # --- Invalid Credentials ---

  @negative @validation @credentials
  Scenario: Login with unregistered email
    When I enter email "unregistered_user_xyz@nonexistent.com" and password "Password123!"
    And I click the login button
    Then I should see an error message for invalid credentials
    And I should not be logged in

  @negative @validation @credentials
  Scenario: Login with wrong password
    Given I have saved credentials
    When I enter my email and wrong password "WrongPassword123!"
    And I click the login button
    Then I should see an error message for invalid credentials
    And I should not be logged in

  @negative @validation @credentials
  Scenario: Login with wrong email format
    When I enter email "invalid-email-format" and password "Password123!"
    And I click the login button
    Then I should see an error message for invalid email format

  # --- Security Tests ---

  @negative @security
  Scenario: Login attempt with SQL injection in email
    When I enter email "admin'--" and password "password"
    And I click the login button
    Then I should see an error message for invalid credentials
    And I should not be logged in

  @negative @security
  Scenario: Login attempt with SQL injection in password
    When I enter email "test@example.com" and password "' OR '1'='1"
    And I click the login button
    Then I should see an error message for invalid credentials
    And I should not be logged in

  @negative @security
  Scenario: Login attempt with XSS in email
    When I enter email "<script>alert('xss')</script>@test.com" and password "Password123!"
    And I click the login button
    Then the application should handle the input safely
    And I should not be logged in

  # --- Rate Limiting (if applicable) ---

  @negative @security @ratelimit
  Scenario: Multiple failed login attempts
    When I attempt to login 5 times with wrong credentials
    Then I should see a rate limit or lockout message

  # --- Session Tests ---

  @positive @session
  Scenario: Remember me functionality
    Given I have saved credentials
    When I enter my email and password
    And I check the remember me checkbox
    And I click the login button
    Then I should be logged in successfully
