# Advanced Security Learning Bot — Bot specification

**Archetype:** education

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A Telegram bot delivering structured learning paths, hands-on labs, and curated resources for experienced security professionals focused on legal, ethical offensive and defensive research techniques. Tracks user progress through modules and provides notifications about new content and threats.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Experienced security professionals
- Red teams
- Blue teams
- Incident responders
- Security researchers

## Success criteria

- User completes at least one learning path
- User engages with 3+ labs per week
- Admin publishes 5+ new modules monthly

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu
- **Browse learning paths** (button, actor: user, callback: browse:paths) — View available learning tracks
  - inputs: focus area, delivery cadence
  - outputs: path list
- **Enroll in path** (button, actor: user, callback: enroll:start) — Begin a learning path
  - inputs: selected path
  - outputs: first module
- **Start lab** (button, actor: user, callback: lab:start) — Begin a hands-on lab
  - inputs: selected lab
  - outputs: lab instructions
- **View progress** (button, actor: user, callback: progress:view) — See completed modules and notes
  - inputs: none
  - outputs: progress summary
- **Settings** (button, actor: user, callback: settings:open) — Configure notifications and preferences
  - inputs: notification cadence, email opt-in
  - outputs: updated settings
- **/admin** (command, actor: admin, command: /admin) — Open admin tools
  - inputs: admin credentials
  - outputs: admin dashboard

## Flows

### Onboarding
_Trigger:_ /start

1. Display focus options (Offense, Defense, Research, Mixed)
2. Collect preferred delivery cadence
3. Create user profile
4. Show main menu

_Data touched:_ user profile

### Browse learning paths
_Trigger:_ browse:paths

1. List available paths with filters
2. Show path details on selection
3. Option to enroll or preview

_Data touched:_ learning paths

### Enroll in path
_Trigger:_ enroll:start

1. Select path
2. Confirm enrollment
3. Track progress
4. Display first module

_Data touched:_ user progress, learning paths

### Lab execution
_Trigger:_ lab:start

1. Display lab instructions
2. Collect user evidence (text or multiple-choice)
3. Verify completion
4. Mark as complete
5. Show next module

_Data touched:_ user progress, labs

### Admin tools
_Trigger:_ /admin

1. Authenticate admin
2. Publish/update content
3. Push announcements
4. Moderate user submissions

_Data touched:_ content catalog, admin logs

### Notifications
_Trigger:_ scheduled

1. Generate weekly digest
2. Send urgent security alerts
3. Send path reminders

_Data touched:_ user profile, notifications

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User profile** _(retention: persistent)_ — User preferences, focus area, delivery cadence, and subscription status
  - fields: focus_area, delivery_cadence, subscription_status, email_opt_in
- **Learning path** _(retention: persistent)_ — Multi-step track with modules and metadata
  - fields: title, description, modules, focus_area, access_level
- **Module** _(retention: persistent)_ — Lesson content with links, exercises, and verification
  - fields: title, content, links, exercises, verification_type
- **Lab** _(retention: persistent)_ — Hands-on task with instructions and expected outcomes
  - fields: title, instructions, expected_outcomes, verification_type
- **Resource item** _(retention: persistent)_ — Curated article, tool, paper, or CVE reference
  - fields: title, url, tags, recency
- **User progress** _(retention: persistent)_ — Completed modules, notes, and certificates
  - fields: completed_modules, notes, certificates
- **Notification** _(retention: persistent)_ — Scheduled updates and alerts
  - fields: type, content, timestamp
- **Admin log** _(retention: persistent)_ — Content publishing and moderation history
  - fields: action, timestamp, admin_id

## Integrations

- **Telegram** (required) — Bot API messaging
- **Email service** (optional) — Optional opt-in email summaries
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Publish new learning paths
- Update modules and resources
- Push announcements
- Moderate user submissions
- Configure notification templates
- Manage subscription access levels

## Notifications

- Weekly digest of new resources
- Urgent security bulletins
- Path completion reminders
- New module alerts for subscribed paths

## Permissions & privacy

- User data is stored securely and only used for progress tracking
- Email opt-in requires explicit consent
- Admins can only view content they moderate
- User submissions are reviewed before publication

## Edge cases

- User tries to access Pro content without subscription
- Lab verification fails due to incomplete evidence
- Admin attempts to publish content violating content policy
- User changes focus area after enrolling in a path
- Notification system fails to deliver urgent alerts

## Required tests

- Verify user can complete a full learning path from enrollment to certificate
- Test lab verification with multiple evidence types
- Validate admin workflow for content publishing and moderation
- Confirm subscription access controls work for free vs Pro content
- Test notification delivery for all alert types

## Assumptions

- Content policy will be enforced through admin moderation
- Verification will use user-submitted text or multiple-choice options
- Notifications will default to weekly digest plus critical alerts
- Payment model will be freemium with monthly subscription
- Admin tools will use a Telegram group for moderation
