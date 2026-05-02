import type { DifyWorld } from '../../support/world'
import { Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

When('I clear the app name field and enter a new name', async function (this: DifyWorld) {
  const page = this.getPage()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  const nameInput = dialog.getByPlaceholder('Give your app a name')
  await expect(nameInput).toBeVisible()

  const newName = `E2E Renamed App ${Date.now()}`
  this.renamedAppName = newName
  await nameInput.clear()
  await nameInput.fill(newName)
})

When('I confirm the app info update', async function (this: DifyWorld) {
  const dialog = this.getPage().getByRole('dialog')
  const saveButton = dialog.getByRole('button', { name: /^(Save|Confirm)$/ })
  await expect(saveButton).toBeEnabled()
  await saveButton.click()
  // Wait for the dialog to close
  await expect(dialog).not.toBeVisible({ timeout: 10_000 })
})

Then('the app should appear in the console with the new name', async function (this: DifyWorld) {
  const newName = this.renamedAppName
  if (!newName) {
    throw new Error(
      'No renamed app name stored. Run "I clear the app name field and enter a new name" first.',
    )
  }

  const page = this.getPage()
  // The card title should now show the new name
  await expect(page.getByTitle(newName)).toBeVisible({ timeout: 10_000 })
})
