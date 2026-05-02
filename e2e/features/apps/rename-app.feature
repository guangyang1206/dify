@apps @authenticated @core
Feature: Rename app

  Scenario: Rename an existing app via the Edit Info menu option
    Given I am signed in as the default E2E admin
    And there is an existing E2E app available for testing
    When I open the apps console
    And I open the options menu for the last created E2E app
    And I click "Edit Info" in the app options menu
    And I clear the app name field and enter a new name
    And I confirm the app info update
    Then the app should appear in the console with the new name
