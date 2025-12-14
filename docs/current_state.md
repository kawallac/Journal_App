v1.2 12.13.2025
This document must remain consistent with vibe_doc_journal_app.md

# CURRENT_STATE — Journal App

**Status:** Active personal MVP  
**Version:** v0.4.27  
**Architecture:** Local-first, single-user, frontend-only

This document reflects the **exact current reality** of the Journal App as implemented today.
It is intentionally factual and non-aspirational.

---

## Core Capabilities

### Journals (Notebooks)
- Multiple journals are supported
- Each journal is a logical container for entries
- Journals are managed from the left sidebar:
  - Add journal (inline naming)
  - Delete journal (with confirmation if entries exist)
- One journal is always active
- Switching journals updates:
  - Calendar dots
  - Search scope
  - Prev / Next navigation
  - Editor content

### Journal Entries
- Create, edit, and delete journal entries
- Every entry belongs to exactly one journal
- Fields per entry:
  - Date
  - Optional title
  - Freeform notes/body
- Entries are ordered **chronologically by date**, with stable Prev / Next navigation (within a journal)

### Photos
- Attach **one photo per entry**
- Upload via file picker or drag-and-drop
- Images are stored in **IndexedDB**
- Photo removal requires confirmation
- Image loads lazily when an entry is opened
- Photo zoom viewer with wheel-zoom, drag-pan, and double-click reset

### Tags
- Create tags with:
  - Text label
  - Color
- Tags can exist in two states:
  - In the tag bar only (unplaced)
  - Placed directly on the image with x/y coordinates
- Tags are draggable on the image
- Tags can be edited or deleted
- Tag edits update immediately and persist
- Tags are normalized for grouping and search

### Search
- Search across:
  - Entry titles
  - Entry body text
  - Tag text
- Default search scope is the **active journal only**
- Explicit scope modifiers are supported:
  - `scope:all` or `all:` → search across all journals
  - `journal:<name>` → search within a specific journal
- Tag browsing supports the same scope rules
- Search results appear in a dedicated results card
- Search behavior preserves user context:
  - Closing search returns to the previously viewed entry if no result was clicked
  - If a result is clicked, that entry remains active on close
- Search results never stack with day-results
- Cross-journal results automatically switch to the correct journal when opened

### Calendar
- Monthly calendar view in the sidebar
- Days with entries are visually marked (per active journal)
- Clicking a day:
  - Opens the entry if one exists
  - Shows a day-results card if multiple entries exist on that date
- Calendar selection state is independent and persistent
- Month navigation supported

### Day Results
- Multi-entry days show a results card
- Card lists all entries for the selected day (active journal only)
- Clicking an item opens that entry
- Card placement respects downward visual flow

### Navigation
- Prev / Next buttons navigate chronologically **within the active journal**
- Buttons are disabled appropriately at boundaries
- Deleting an entry navigates to the previous chronological entry

### Export
- Export all journal data (all journals) as a JSON file

---

## Data Storage

- Entries metadata stored in `localStorage`
- Journals metadata stored in `localStorage`
- Images stored in `IndexedDB`
- Storage access is centralized via adapters
- Automatic migration logic exists for:
  - Legacy image data
  - Missing journal data (default journal creation)

---

## Intentional Constraints

- Single-user only
- No authentication
- No cloud sync
- No backend
- No multi-user support
- No version history
- No undo/redo system

---

## UX Principles Currently Enforced

- Visibility controlled exclusively via `.hidden`
- One-card pattern for major UI containers
- Predictable, calm transitions
- Search and day-results are mutually exclusive
- Default-scoped behavior with explicit opt-in power features
- State drives UI; DOM is not the source of truth

---

_End of document_
