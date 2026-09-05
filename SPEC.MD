# Specification: Cooperative Band Admin Dashboard (GUATACA)

## 1. Project Overview & Philosophy
A lightweight, high-utility admin dashboard built for a collaborative musical group (supporting GUATACA initiatives in the Bay Area). 
* **Core Philosophy:** 100% Free Tech Stack. Media storage and financial transactions are link-based or intent-based to completely avoid hitting free database tier limits.
* **Phase 1 UI Target:** Claude Artifacts (Single-file React prototype, Tailwind CSS, Lucide Icons).
* **Phase 2 Backend Target:** Claude Code (Supabase Free Tier, Node.js, built-in Google/Apple Auth setup).

## 2. User Roles & Multi-Role Profiles
* **Authentication:** Traditional Email/Password with placeholders for free Google & Apple OAuth setup (fully native on Supabase Free Tier).
* **Role Tiers:** 
  * `Admin` (Full write/edit access across all modules).
  * `Band Member` (Read access to scheduling/finances, profile editing, ability to post in forums and submit links/donations).
* **Musician Profile Schema:**
  * **Instruments:** Array of instruments played.
  * **Proficiency:** Level tied per instrument (e.g., Expert, Intermediate, Beginner / Lead vs. Rhythm).
  * **Vocals:** Multi-select flags (`Lead Vocals`, `Chorus/Backing Harmonies`, `No Vocals`).

## 3. Repertoire & Song Library (Core Engine)
* **Song Card Schema:**
  * Metadata: Title, Genre, Key, BPM, Duration.
  * **Resource Links (Zero-Cost Hosting):**
    * Google Doc Link (Sheet music, lyrics, charts).
    * Streaming Links (YouTube, Spotify, Apple Music).
    * Internal Recording Link (iCloud/Google Drive link to the band's own rehearsal recording).
* **UI Representation:** Searchable grid list. Clicking a song expands an accordion showing all functional external links as cleanly branded icons.

## 4. Smart Event & Performance Manager
* **Event Types:** `Gig` (Presentation), `Studio Practice`, `Garage Practice`.
* **Event States:** `Active`, `Cancelled`, `Rescheduled`.
* **Archiving Logic:** Events automatically migrate to a **"History"** tab/view once the scheduled date/time passes.
* **Event Media Section:** Past events display user-submitted link galleries (Google Drive folders or iCloud Shared Albums containing event photos/videos).
* **Repertoire Integration:**
  * **For Gigs:** Admins build a targeted **Setlist** selecting specific songs from the Repertoire to perform.
  * **For Practices:** Admins or members tag which songs from the Repertoire were actually rehearsed during that session.
  * **Rehearsal Analytics Tracker:** The app keeps a running "Last Rehearsed" timestamp on each song in the Repertoire based on practice logs, highlighting songs that haven't been practiced recently.

## 4.1 Social Sharing Integration (Semi-Automated Share)
* **Objective:** Allow admins or members to easily promote upcoming Gigs on Instagram from mobile devices without Meta API overhead or approvals.
* **Workflow Loop:**
  1. User clicks the **"Prepare for Instagram"** button on an upcoming Gig card.
  2. The app automatically copies a formatted caption to the user's clipboard (e.g., *"🎵 Live Music Alert! Catch us at [Venue] on [Date] at [Time]! See you there! #GUATACA"*).
  3. If a flyer image link is attached to the event, the app opens that link in a new tab or prompts a download so the user has the image ready in their device's camera roll.
  4. The app fires a browser-native Web Share intent (`navigator.share`) or deep link directly to the Instagram app (`instagram://camera` for mobile native apps), allowing the user to paste the caption and upload the asset seamlessly.

## 5. Post-Event Feedback & Retrospectives
* **Objective:** Give musicians a dedicated space to reflect, survey, and vote on how an event went to drive continuous improvement.
* **Trigger:** Appears automatically inside the event details card once an event transitions into the **"History"** section.
* **Feedback Architecture:**
  * **Quick Rating Scale:** 1-5 star emoji-based scale tracking: Sound/Mix Quality, Performance, Logistics, and Personal Energy.
  * **Retrospective Q&A (Open Text fields):** 
    * "What went well?" 
    * "What can we improve next time?"
  * **Poll / Survey Widget:** Admins can append a custom multi-choice poll to specific events (e.g., *"Should we play at this venue again?"* or *"Was the $50 studio rental worth it?"*).
  * **Anonymity Toggle:** Members can choose to submit feedback anonymously or with their profile name attached.
  * **Aggregated View (Admin Dashboard):** Charts or text aggregators summarizing responses so the band leader can review group feedback at a glance.

## 6. Transparent Ledger & Asset Inventory
* **Financial Ledger (Cooperative Pool):**
  * Completely distinct from the 501(c)(3) non-profit entity. Managed by a designated treasurer.
  * Global viewability for all band members to ensure total community trust.
  * **Transaction Schema:** `Type` (Income/Expense), `Amount`, `Date`, `Description`, `Proof Link` (URL to a Google Drive or iCloud screenshot of a Zelle transfer or shop invoice).
  * **Balance Widget:** Prominent header component showing real-time `Total Pool Balance`.
* **Asset & Equipment Inventory:**
  * List tracking community-owned gear (e.g., "$305 Audio Mixer").
  * Fields: Item Name, Purchase Date, Cost (linked to ledger), **Current Custodian** (who has the gear right now), Condition Notes.

## 7. Brainstorming Forums & Q&A
* **Objective:** Sandbox area for pitch sessions prior to committing to the official calendar.
* **Functionality:** 
  * Members create "Brainstorm Threads" (e.g., "Idea: Summer Street Fest Gig").
  * Support for community upvoting/liking to gauge member interest.
  * Simple threaded Q&A style commenting.
  * **"Convert to Event" Button (Admin Only):** Instantly ports thread title and description into the Event Creator form.

## 8. Design & UI Guidelines
* **Theme:** Dark Mode by default. Rich slate/deep charcoal background with electric neon accents (e.g., emerald green for active items, electric violet for branding, amber for rescheduled/warn states).
* **Layout:** Sidebar navigation parsing through: `Dashboard`, `Calendar`, `Repertoire`, `Ledger & Gear`, `Brainstorm`.
