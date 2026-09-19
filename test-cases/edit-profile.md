# Edit Profile Test Cases

## Status

Approved and implemented. TC-63 remains disabled as requested, and TC-65 is retained as a blocked candidate flow.

## Scope

Validate User 1 profile details, profile image management, both Save buttons, password management, and Marketing Emails preference.

## Preconditions

- `USER1_EMAIL` and `USER1_PASSWORD` identify a valid confirmed account.
- User 1 can log in and open Edit Profile.
- User 1 has existing profile data.
- Tests that change saved data must capture and restore the original value before finishing.
- Tests must not leave User 1 unable to log in with `USER1_PASSWORD`.

## Edit Profile

### TC-45: Save profile changes with the top Save button

| Field | Details |
| --- | --- |
| Priority | High |
| Type | Positive / Regression |
| Steps | 1. Log in as User 1 and open Edit Profile. 2. Change an editable profile value. 3. Tap the top Save button. 4. Reopen Edit Profile. 5. Restore the original value with Save. |
| Expected result | The top Save button stores the change, the value persists after reopening, and the original value is restored. |

### TC-46: Save profile changes with the bottom Save button

| Field | Details |
| --- | --- |
| Priority | High |
| Type | Positive / Regression |
| Steps | 1. Open Edit Profile. 2. Change an editable profile value. 3. Scroll to and tap the bottom Save button. 4. Reopen Edit Profile. 5. Restore the original value. |
| Expected result | The bottom Save button stores the change, the value persists after reopening, and the original value is restored. |

### TC-47: Display existing profile information

| Field | Details |
| --- | --- |
| Priority | High |
| Type | Positive / Regression |
| Steps | 1. Open Edit Profile. 2. Review all profile sections and fields. |
| Expected result | Personal Information, Contact Information, Security, First Name, Last Name, Country, City, Nationality, Date of Birth, Gender, Batting Style, Bowling Style, Phone Number, Email, Update Password, Email Preferences, and both Save buttons are displayed. |

### TC-48: Update first and last name

| Field | Details |
| --- | --- |
| Priority | High |
| Type | Positive / Regression |
| Steps | 1. Capture the original First Name and Last Name. 2. Enter temporary values. 3. Save and reopen Edit Profile. 4. Restore and save the original values. |
| Expected result | Both names persist after saving and the original values are restored before the test ends. |

### TC-49: Select a country from the bottom sheet

| Field | Details |
| --- | --- |
| Priority | High |
| Type | Positive / Regression |
| Steps | 1. Open Country. 2. Verify the Country bottom sheet. 3. Select another country. 4. Restore the original country before finishing. |
| Expected result | The bottom sheet displays the available countries, identifies the current selection, closes after selection, and updates the Country field. |
| Reference data | The supplied image shows Australia, Bangladesh, USA, England, and Pakistan. |

### TC-50: Update city options after changing country

| Field | Details |
| --- | --- |
| Priority | High |
| Type | Functional / Regression |
| Steps | 1. Capture the original Country and City. 2. Select a different Country. 3. Open City. 4. Select a valid city for that country. 5. Restore the original Country and City. |
| Expected result | City options correspond to the selected country and an incompatible previous city is not retained. |

### TC-51: Update nationality

| Field | Details |
| --- | --- |
| Priority | Medium |
| Type | Positive / Regression |
| Steps | 1. Capture the original Nationality. 2. Select another nationality. 3. Save and reopen Edit Profile. 4. Restore the original nationality. |
| Expected result | The selected nationality persists after saving and the original value is restored. |

### TC-52: Update date of birth

| Field | Details |
| --- | --- |
| Priority | High |
| Type | Positive / Regression |
| Steps | 1. Capture the original Date of Birth. 2. Open the date picker. 3. Select a valid date. 4. Save and reopen Edit Profile. 5. Restore the original date. |
| Expected result | The selected valid date is displayed in the expected format and persists after saving. |

### TC-53: Update gender

| Field | Details |
| --- | --- |
| Priority | Medium |
| Type | Positive / Regression |
| Steps | 1. Capture the original Gender. 2. Select another option. 3. Save and reopen Edit Profile. 4. Restore the original value. |
| Expected result | The selected gender persists after saving and the original value is restored. |

### TC-54: Update batting and bowling styles

| Field | Details |
| --- | --- |
| Priority | Medium |
| Type | Positive / Regression |
| Steps | 1. Capture the original Batting Style and Bowling Style. 2. Select different values. 3. Save and reopen Edit Profile. 4. Restore the original values. |
| Expected result | Both playing styles persist after saving and their original values are restored. |

### TC-55: Validate required profile fields

| Field | Details |
| --- | --- |
| Priority | High |
| Type | Negative / Validation |
| Steps | 1. Clear one required editable field. 2. Tap Save. 3. Repeat for each required editable field without saving invalid data. |
| Expected result | Saving is blocked and an appropriate validation message is displayed. Existing saved profile data remains unchanged. |

### TC-56: Validate Email as read-only User 1 data

| Field | Details |
| --- | --- |
| Priority | High |
| Type | Security / Regression |
| Steps | 1. Open Edit Profile. 2. Verify the Email value. 3. Attempt to focus and edit Email. |
| Expected result | Email displays `USER1_EMAIL` and cannot be edited from Edit Profile. |

### TC-57: Edit and restore Phone Number

| Field | Details |
| --- | --- |
| Priority | High |
| Type | Positive / Regression |
| Steps | 1. Capture the original Phone Number and country code. 2. Enter a valid temporary phone number. 3. Save and reopen Edit Profile. 4. Restore and save the original phone number and country code. |
| Expected result | The temporary phone number persists after saving and the exact original contact number is restored before the test ends. |

### TC-58: Discard unsaved profile changes

| Field | Details |
| --- | --- |
| Priority | Medium |
| Type | Navigation / Regression |
| Steps | 1. Change an editable profile field. 2. Navigate back without tapping either Save button. 3. Reopen Edit Profile. |
| Expected result | Unsaved changes are not persisted, or a discard-confirmation prompt is shown before leaving. |

### TC-59: Upload a profile image

| Field | Details |
| --- | --- |
| Priority | High |
| Type | Positive / Media |
| Steps | 1. Open Edit Profile. 2. Tap the profile-image edit control. 3. Select the repository image fixture. 4. Save and reopen Edit Profile. |
| Expected result | The selected image is uploaded and remains displayed after reopening Edit Profile. |

### TC-60: Remove a profile image

| Field | Details |
| --- | --- |
| Priority | High |
| Type | Positive / Media |
| Steps | 1. Ensure User 1 has a profile image. 2. Open the profile-image edit control. 3. Remove the image and save. 4. Reopen Edit Profile. 5. Restore the original image if one existed before the test. |
| Expected result | The profile image is removed and replaced by the default avatar; the original image is restored when required. |

## Update Password

### TC-61: Open Update Password

| Field | Details |
| --- | --- |
| Priority | High |
| Type | Navigation / Regression |
| Steps | 1. Open Edit Profile. 2. Tap Update Password. |
| Expected result | Update Your Password opens with Current Password, New Password, Confirm Password, password requirements, visibility controls, and Save Changes. |

### TC-62: Validate password errors and controls

| Field | Details |
| --- | --- |
| Priority | Critical |
| Type | Negative / Security / Validation |
| Steps | 1. Submit an incorrect Current Password with an otherwise valid new password. 2. Verify the incorrect-current-password error. 3. Enter new passwords that omit length, uppercase, lowercase, number, and symbol requirements. 4. Enter mismatched New Password and Confirm Password values. |
| Expected result | `Current password is not correct.` is displayed for an incorrect current password; all five requirement indicators respond correctly; mismatched confirmation is rejected. |
| Required rules | 8 or more characters, at least one uppercase letter, at least one lowercase letter, at least one number, and at least one symbol. |

### TC-63: Change and restore the User 1 password

| Field | Details |
| --- | --- |
| Priority | Critical |
| Type | Positive / Security |
| Steps | 1. Enter `USER1_PASSWORD` as Current Password. 2. Enter a valid temporary password in New Password and Confirm Password. 3. Save. 4. Log in with the temporary password. 5. Change the password back to `USER1_PASSWORD`. 6. Verify login with the restored password. |
| Expected result | The password change succeeds and `USER1_PASSWORD` is restored before the test ends. |
| Implementation status | Keep the future Maestro implementation commented out. This case is based on the expected behavior and must not run until safe cleanup and account-recovery handling are approved. |

### TC-64: Toggle password visibility

| Field | Details |
| --- | --- |
| Priority | Medium |
| Type | UI / Security |
| Steps | 1. Open Update Password. 2. Enter values in Current Password, New Password, and Confirm Password. 3. Toggle each visibility control on and off. |
| Expected result | Each control reveals and masks only its associated password value without changing the entered text. |

## Email Preferences

### TC-65: Save and restore Marketing Emails preference

| Field | Details |
| --- | --- |
| Priority | High |
| Type | Positive / Regression |
| Steps | 1. Open Edit Profile. 2. Open Email Preferences. 3. Verify Marketing Emails and Save. 4. Capture the original Marketing Emails state. 5. Toggle it and tap Save. 6. Reopen Email Preferences. 7. Restore and save the original state. |
| Expected result | The changed Marketing Emails state persists after reopening and its original state is restored before the test ends. |
| Execution status | Blocked on the current User 1 data because a five-minute automated scroll cannot reach Save through the unusually large preference list. The candidate flow remains authored. |

### TC-66: Discard an unsaved Marketing Emails change

| Field | Details |
| --- | --- |
| Priority | High |
| Type | Negative / Navigation / Regression |
| Steps | 1. Open Edit Profile. 2. Open Email Preferences. 3. Capture the original Marketing Emails state. 4. Toggle Marketing Emails without tapping Save. 5. Tap the app's Back icon. 6. Open Email Preferences again. |
| Expected result | The unsaved toggle change is discarded and Marketing Emails still displays its original state. |

## Automation Structure

```text
.maestro/flows/editProfile/
├── tc-45-*.yaml through tc-60-*.yaml
├── updatePassword/
│   ├── tc-61-*.yaml
│   ├── tc-62-*.yaml
│   ├── tc-63-*.yaml             # Keep implementation commented out
│   └── tc-64-*.yaml
└── emailPreferences/
    ├── tc-65-*.yaml.blocked
    └── tc-66-*.yaml
```

Reusable components include:

- Log in as User 1 and open Edit Profile.
- Save with the top Save button.
- Scroll to and save with the bottom Save button.
- Open Update Password.
- Open Email Preferences.
- Capture, save, reopen, and restore mutable User 1 profile data.
- Upload and remove a profile image using a repository media fixture.

## Final Approval Notes

- TC-63 will be documented but its Maestro implementation will remain commented out.
- Email Preferences coverage is limited to Marketing Emails.
- The Email field is expected to be read-only and equal to `USER1_EMAIL`.
- Phone Number is editable, but the original value must be restored in the same test.
- The Email Preferences folder will be named `emailPreferences/`.
