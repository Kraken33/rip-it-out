# Spec Delta

## Purpose

Provides user registration, email/password login, session state management, and strict application access gating via Supabase Auth.

## ADDED Requirements

### Requirement: Strict Application Access Gate
The system SHALL require users to be registered and authenticated before granting access to any application features, screens, or data.

#### Scenario: Unauthenticated User Attempts Access
- **WHEN** an unauthenticated user loads the application
- **THEN** the system displays the registration/login screen and prevents navigation to the dashboard or internal screens.

#### Scenario: Authenticated User Accesses Application
- **WHEN** an authenticated user loads the application
- **THEN** the system grants access to the main application interface and displays user data.

### Requirement: User Registration and Login
The system SHALL allow users to register a new account and sign in with email and password using Supabase Auth.

#### Scenario: User Registers Account
- **WHEN** a user fills out registration details and submits the registration form
- **THEN** an account is created in Supabase Auth and the user session is established.

#### Scenario: User Logs In
- **WHEN** a user enters valid email and password credentials
- **THEN** the system authenticates the user with Supabase Auth and transitions the app to authenticated state.

#### Scenario: User Logs Out
- **WHEN** an authenticated user clicks log out
- **THEN** the Supabase Auth session is destroyed and the user is immediately returned to the login screen.

### Requirement: Authentication State Persistence
The system SHALL observe Supabase authentication state changes and maintain user identity across page reloads.

#### Scenario: Page Reload with Active Session
- **WHEN** an authenticated user reloads the application page
- **THEN** the auth state listener restores the user session without requiring re-login.
