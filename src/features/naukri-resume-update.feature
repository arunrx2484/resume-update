Feature: Naukri resume management

  @regression @naukri @resume
  Scenario: Update Naukri resume successfully
    Given the user opens Naukri home page
    When the user logs in using environment credentials
    Then the profile widget should appear
    When the user navigates to View and Update Profile
    And the user captures current resume last updated text
    And the user uploads resume from environment path
    Then the resume upload date should be updated to today
