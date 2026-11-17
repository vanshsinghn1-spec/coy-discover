# Coy - Discover Tab

A standalone mobile-first web application featuring a swipe-based **"Discover" tab** for **Coy** ([app.getcoy.com](https://app.getcoy.com)), faithfully replicating its visual identity, design tokens, typography, and privacy-first core promise.

### Live Demo
**Production URL**: [https://coy-discover-green.vercel.app/discover](https://coy-discover-green.vercel.app/discover)

---

## Visual Identity and Design System

The application strictly mirrors Coy's production design system extracted from `app.getcoy.com`:

* **Typography**: **Bricolage Grotesque** (variable weights 400, 600, 700, 800) with fallbacks to `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
* **Wordmark**: Lowercase `coy` in 800 font weight with the signature hot-pink trailing dot (`::after`).
* **Color Palette**:
  * Page Background: `#FFFFFF` (`--bg`)
  * Soft Fill (Cards, Inputs, Rows): `#F6F4FA` (`--soft`)
  * Line and Dividers: `#ECE9F2` (`--line`)
  * Deep Ink (Text, Borders, Shadows): `#15121D` (`--text`)
  * Muted Secondary Text: `#6D6979` (`--muted`)
  * Primary Accent Pink: `#FF3D81` (`--pink`)
  * Soft Pink (Matches and Selected State): `#FFE4EF` (`--pink-soft`)
  * Pastel Accents: Yellow (`#FFE45C`), Lilac (`#E7E0FF`), Mint (`#CBF4E0`), Sky (`#D7ECFF`), Peach (`#FFE1CF`)
  * Success: `#0E8F48` (`--ok`)
  * Danger: `#D92D3A` (`--danger`)
* **Component Styling**:
  * Edge Border: `2px solid #15121D` (`--edge`)
  * Pop Box Shadow: `3px 3px 0 #15121D` (`--pop`) that compresses to `1px 1px 0` on active press
  * Pill Buttons: `border-radius: 999px`
  * Card Radius: `26px` with border and pop shadow
  * Layout: Mobile-first `max-width: 480px` centered container with safe-area insets

---

## Features Implemented

### 1. Profile Data and Seeding (30 Mock Profiles)
* **30 detailed profiles** seeded with names, ages (21-27), high-resolution portrait photos, relatable bios, cities/colleges (IIT Bombay, St. Stephen's, DU, Ashoka, NIFT, Bangalore, Mumbai), and interest tags.
* **Pre-seeded likes**: 10 profiles have pre-liked the demo user (User #1) so that swiping right demonstrates the match celebration screen immediately.
* **Double-blind privacy**: The feed never reveals who has already liked the user.

### 2. Swipe Experience
* **One card at a time**: The active card is in the foreground with smooth drag gestures; the next card peeks underneath for depth.
* **Mobile drag gestures**: Powered by `framer-motion` (`drag="x"`, spring velocity physics, tilt rotation based on drag offset).
* **Desktop buttons**: Action buttons for Pass and Like located directly below the card.
* **Visual feedback stamps**: Bold green **"LIKE"** or red **"PASS"** stamp appears dynamically as you drag past the threshold.
* **No duplicates**: Swiped profiles are recorded in SQLite and will never appear in the feed again.
* **Empty State**: Dedicated state ("You've seen everyone") when all cards are exhausted, with a one-click **"Reset Demo Profiles"** button.

### 3. Matching and Mutual Reveal
* **Double-Blind Matching**: A match occurs **only** when both users like each other.
* **"It's a Match!" Screen**: Replicates Coy's full-screen hot-pink celebration overlay (`dialog.reveal`), featuring overlapping pair avatars, heart emblem, and animated floating particles.
* **Matches View (`/matches`)**: Lists all mutual crushes with timestamp ordering, avatar badges, and location details.
* **Persistence**: All swipes and matches persist on disk in an SQLite database across page reloads and server restarts.

### 4. Navigation
* Fixed bottom navigation tab bar:
  * **Home**: Placeholder view representing Coy's original view as instructed in Part B.
  * **Discover**: The primary swipe discovery experience.
  * **Matches**: The mutual matches view.

---

## Tech Stack

* **Frontend**: Next.js 15+ (App Router), React 19, TypeScript
* **Animations and Gestures**: `framer-motion`
* **Icons**: `lucide-react`
* **Styling**: CSS Modules + Global Coy Design Tokens
* **Database**: SQLite via `better-sqlite3` (WAL mode enabled)
* **Typography**: Bricolage Grotesque via Google Fonts

---

## Getting Started

### Prerequisites
* Node.js 18.x, 20.x, or 22.x
* npm

### Installation and Run

1. Navigate to the project directory:
   ```bash
   cd coy-discover
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in Development Mode:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. Or Build and Run in Production:
   ```bash
   npm run build
   npm start
   ```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/feed` | Returns profiles the logged-in user has not yet swiped on. |
| `POST` | `/api/swipe` | Records a swipe (`like` or `pass`). Returns `{ success, action, matched, matchedProfile }`. |
| `GET` | `/api/matches` | Returns all mutual matches for the user. |
| `POST` | `/api/reset` | Resets the database back to initial seed state. |

---

## Architecture and File Structure

```
coy-discover/
├── data/
│   └── coy.db                    # SQLite database file (auto-initialized)
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout with 480px sheet & TabBar
│   │   ├── globals.css           # Coy design tokens, variables & typography
│   │   ├── page.tsx              # Root redirect to /discover
│   │   ├── home/page.tsx         # Blank Home tab placeholder
│   │   ├── discover/page.tsx     # Discover swipe interface
│   │   ├── matches/page.tsx      # Matches list view
│   │   └── api/
│   │       ├── feed/route.ts     # GET /api/feed
│   │       ├── swipe/route.ts    # POST /api/swipe
│   │       ├── matches/route.ts  # GET /api/matches
│   │       └── reset/route.ts    # POST /api/reset
│   ├── components/
│   │   ├── TopHeader.tsx         # Coy wordmark and reset control
│   │   ├── TabBar.tsx            # Fixed bottom navigation bar
│   │   ├── ProfileCard.tsx       # Profile card with photo, bio, tags & stamps
│   │   ├── SwipeStack.tsx        # Motion drag gestures and button actions
│   │   ├── MatchModal.tsx        # Full-screen "It's a match!" overlay
│   │   └── EmptyState.tsx        # Feed exhausted empty state
│   ├── lib/
│   │   ├── db.ts                 # SQLite connection, schema, queries & transactions
│   │   └── seedData.ts           # 30 realistic profiles with 10 pre-seeded likes
│   └── types/
│       └── index.ts              # TypeScript interfaces
├── package.json
├── tsconfig.json
└── README.md
```
