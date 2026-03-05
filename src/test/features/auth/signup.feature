@auth @signup
Feature: User Signup with OTP Verification

  As a new user
  I want to sign up for an account on Spot.care
  So that I can access the healthcare provider search features

  Background:
    Given I am on the signup page

  # ==================== POSITIVE SCENARIOS ====================

  @smoke @otp @e2e @positive
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

  @positive @navigation
  Scenario: Navigate to login from signup modal
    When I click on "Already have an account? Sign in"
    Then I should see the login modal

  @positive @ui
  Scenario: Close signup modal
    When I close the signup modal
    Then the signup modal should be closed

  # ==================== NEGATIVE SCENARIOS ====================

  # --- Empty Field Validations ---

  @negative @validation @empty
  Scenario: Signup with all empty fields
    When I submit the signup form without filling any fields
    Then I should see error "First name is required"
    And I should see error "Last name is required"
    And I should see error "Email is required"
    And I should see error "Invalid phone number"
    And I should see error "Password is required"

  @negative @validation @empty
  Scenario: Signup with empty first name
    Given I have a new email inbox
    When I fill in the signup form without first name
    And I click the create account button
    Then I should see error "First name is required"

  @negative @validation @empty
  Scenario: Signup with empty last name
    Given I have a new email inbox
    When I fill in the signup form without last name
    And I click the create account button
    Then I should see error "Last name is required"

  @negative @validation @empty
  Scenario: Signup with empty email
    When I fill in the signup form without email
    And I click the create account button
    Then I should see error "Email is required"

  @negative @validation @empty
  Scenario: Signup with empty password
    Given I have a new email inbox
    When I fill in the signup form without password
    And I click the create account button
    Then I should see error "Password is required"

  # --- Invalid Format Validations ---

  @negative @validation @format
  Scenario: Signup with invalid email format - no @ symbol
    When I fill in the signup form with email "invalidemail"
    And I click the create account button
    Then I should see error "Invalid email address"

  @negative @validation @format
  Scenario: Signup with invalid email format - no domain
    When I fill in the signup form with email "test@"
    And I click the create account button
    Then I should see error "Invalid email address"

  @negative @validation @format
  Scenario: Signup with invalid email format - special characters
    When I fill in the signup form with email "test@@example..com"
    And I click the create account button
    Then I should see error "Invalid email address"

  @negative @validation @format
  Scenario: Signup with invalid phone number - too short
    Given I have a new email inbox
    When I fill in the signup form with phone "123"
    And I click the create account button
    Then I should see error "Invalid phone number"

  @negative @validation @format
  Scenario: Signup with invalid phone number - letters
    Given I have a new email inbox
    When I fill in the signup form with phone "abcdefghij"
    And I click the create account button
    Then I should see error "Invalid phone number"

  # --- Password Validations ---

  @negative @validation @password
  Scenario: Signup with weak password - too short
    Given I have a new email inbox
    When I fill in the signup form with password "123"
    And I click the create account button
    Then I should see an error message for weak password

  @negative @validation @password
  Scenario: Signup with weak password - no uppercase
    Given I have a new email inbox
    When I fill in the signup form with password "password123!"
    And I click the create account button
    Then I should see an error message for weak password

  @negative @validation @password
  Scenario: Signup with weak password - no number
    Given I have a new email inbox
    When I fill in the signup form with password "Password!"
    And I click the create account button
    Then I should see an error message for weak password

  # --- Business Logic Validations ---

  @negative @validation @duplicate
  Scenario: Signup with existing email
    Given I have existing credentials
    When I fill in the signup form with the existing email
    And I click the create account button
    Then I should see an error message for existing account

  # --- Security Tests ---

  @negative @security
  Scenario: Signup with XSS in first name
    Given I have a new email inbox
    When I fill in the signup form with first name "<script>alert('xss')</script>"
    And I click the create account button
    Then the application should handle the input safely

  @negative @security
  Scenario: Signup with SQL injection in email
    When I fill in the signup form with email "admin'--@test.com"
    And I click the create account button
    Then I should see error "Invalid email address"

  # --- OTP Validations ---

  @negative @otp
  Scenario: Submit incorrect OTP code
    Given I have a new email inbox
    When I fill in the signup form with valid details
    And I submit the signup form
    Then I should be redirected to the OTP verification page
    When I enter incorrect OTP "0000"
    And I submit the OTP verification
    Then I should see an error for invalid OTP
