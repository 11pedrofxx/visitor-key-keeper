# Event Check-in Pro

https://github.com/11pedrofxx/SITE-FEIRA-DE-PROFISS-ES-2026 I am working on an existing website project for a professional careers fair. The visual design, layout, colors, typography, pages, and overall structure are already created and should be preserved.

I want you to transform this project into a fully functional web application while maintaining the existing visual identity and aesthetics.

IMPORTANT: Do NOT redesign the website or change its visual style unnecessarily. Use the existing HTML/CSS/design as the foundation and make the functionality work within the current project.

MAIN GOAL

Make the entire project functional from end to end, including user registration, QR Code generation and scanning, administrative login, and an administrative dashboard.

Everything should work in a real-world scenario, not just be a visual prototype.

1. USER REGISTRATION

Make the existing registration form fully functional.

The user should be able to register by filling out the existing fields, including:

Full name

Phone number

Email

How they heard about the event

Expected arrival time

Course of interest

Whether they are or were a student of Frei

When the user submits the form:

Validate all required fields.

Validate the email format.

Prevent invalid or incomplete submissions.

Save the registration in the database.

Generate a unique registration ID.

Generate a unique QR Code associated with that registration.

Show a confirmation screen after successful registration.

Allow the user to access or save their QR Code.

Make sure the same registration cannot accidentally be duplicated.

The QR Code must contain a secure unique identifier, not sensitive personal information.

2. QR CODE

Implement a REAL and FUNCTIONAL QR Code system.

Each registered participant must receive a unique QR Code.

The QR Code should be associated with their registration in the database.

Create a QR Code scanner that works using the device camera.

The scanner should work on:

Desktop devices with a compatible camera

Android phones

iPhones

Tablets

When an administrator scans a participant's QR Code:

Read the QR Code.

Find the associated registration.

Verify whether the registration is valid.

Display the participant's information.

Display whether the participant has already checked in.

If they have not checked in, allow the administrator to confirm/check them in.

Save the check-in date and time.

If the participant has already checked in, clearly display that they have already checked in and show the previous check-in information.

The QR Code scanner must use the device camera with proper permission handling.

If camera permission is denied, provide a clear message explaining how the user can enable camera access.

3. ADMINISTRATIVE LOGIN

Make the existing administrative login functional.

Create a secure authentication system for administrators.

The administrator should be able to:

Log in using email/username and password.

Log out.

Stay authenticated while navigating the administrative area.

Be prevented from accessing administrative pages without authentication.

Passwords must NOT be stored as plain text.

Use proper password hashing and secure authentication practices.

Do not expose administrative credentials in frontend code.

4. ADMIN DASHBOARD

Create a functional administrative dashboard while following the existing visual style of the project.

The dashboard should allow administrators to:

View all registered participants.

Search participants by name.

Search by email.

Search by registration ID.

Filter registrations.

View participant details.

See whether a participant has checked in.

See the check-in date and time.

Scan QR Codes.

Manually check in a participant if necessary.

View the total number of registrations.

View the total number of checked-in participants.

View the number of participants who have not checked in.

The dashboard should be responsive and work properly on desktop, tablet, and mobile.

5. DATABASE

Connect the project to a real database.

Create the necessary database structure for:

Participants

Store information such as:

ID

Full name

Phone

Email

How they heard about the event

Expected arrival time

Course of interest

Student status

Registration date

Unique QR Code identifier

Check-in status

Check-in date/time

Administrators

Store:

ID

Name

Email/username

Securely hashed password

Account creation date

Make sure database operations are secure and validated.

6. CHECK-IN SYSTEM

The check-in process must be reliable.

The administrator scans the QR Code.

If the participant exists:

Show something similar to:

"Participant found"

Then display:

Name

Email

Course of interest

Registration status

Check-in status

If they have not checked in:

Show a clear button:

"Confirm Check-in"

After confirmation:

Update the database.

Record the exact date and time.

Change the status to checked in.

Display a success message.

If they already checked in:

Display:

"Already checked in"

And show the previous check-in date and time.

7. QR CODE SECURITY

Do not put sensitive personal information directly inside the QR Code.

Use a unique random registration identifier or secure token.

The QR Code should only contain what is necessary to identify the registration securely.

Do not expose database IDs unnecessarily.

8. RESPONSIVENESS

The entire application must remain fully responsive.

Preserve the existing desktop design.

Make sure everything works correctly on:

Full HD desktop

Smaller desktop screens

Tablets

Mobile phones

Portrait orientation

Landscape orientation

Do not allow horizontal scrolling.

Inputs, buttons, tables, cards, QR scanner, dashboard, and navigation must adapt properly to small screens.

9. NAVIGATION

Make sure all existing navigation and buttons actually work.

Buttons such as:

Registration

Login

Back

Access System

Submit Registration

Scan QR Code

Dashboard

Logout

must perform their intended actions.

If the current project contains links that are only visual placeholders, connect them to the appropriate pages or functionality.

10. VALIDATION AND ERROR HANDLING

Add proper validation and user-friendly error messages.

Examples:

Invalid email

Missing required field

Invalid login credentials

Registration already exists

QR Code not recognized

Participant not found

Participant already checked in

Database/server error

Camera permission denied

Network error

Do not expose technical errors, database information, passwords, tokens, or sensitive system information to normal users.

11. SECURITY

Follow modern web security practices.

At minimum:

Secure authentication

Password hashing

Protected administrative routes

Input validation

Server-side validation

Protection against unauthorized database access

Do not expose admin credentials in frontend code

Do not store passwords in localStorage

Do not expose sensitive participant information unnecessarily

Use secure random identifiers for QR Codes

12. EXISTING DESIGN

This is extremely important:

KEEP THE CURRENT DESIGN.

Do not replace the existing visual identity with a generic dashboard template.

Preserve:

Existing colors

Existing typography

Existing logos

Existing images

Existing buttons

Existing spacing

Existing visual hierarchy

Existing backgrounds

Existing animations and hover effects

Existing responsive behavior

Only modify the design when it is necessary to make a new functionality usable.

The administrative dashboard should look like it belongs to the same website.

13. FINAL RESULT

I want the final project to behave like a real event registration system.

The expected flow is:

USER:

Website → Registration → Fill Form → Submit → Registration saved → Unique QR Code generated → Confirmation

ADMIN:

Admin Login → Dashboard → QR Code Scanner → Scan Participant → Find Registration → Display Participant → Confirm Check-in → Save Check-in

The complete system should work end-to-end.

Before finishing, test every important flow and make sure there are no broken buttons, broken routes, missing database operations, or non-functional forms.

Do not simply create a visual mockup.

I need the actual functionality implemented and connected to the database.

If the project already has a backend, database, authentication system, or existing components, inspect and reuse them instead of unnecessarily replacing them.

If something is missing, implement it using the most appropriate technology already compatible with the project.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://prof-fair-pass.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ac320197-42e9-4060-9c6e-34e0936bf545).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
