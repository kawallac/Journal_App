v1.1 12.13.2025
This document must remain consistent with vibe_doc_journal_app.md

# ARCHITECTURE — Journal App

## Overview

The Journal App is a **local-first, frontend-only web application** designed for personal use.
It prioritizes predictability, clarity, and low cognitive overhead.

There is no backend and no external dependencies.

---

## High-Level Architecture

- HTML: Static structure
- CSS: Layout, spacing, and visual hierarchy
- JavaScript:
  - State management
  - Rendering
  - Storage coordination
  - Interaction logic

---

## State Model

The app maintains a single authoritative in-memory state, including:
- All journal entries (all journals)
- All notebooks (journals list)
- Active notebook ID (current journal context)
- Current entry ID
- Current tags for the active entry
- Search session state (query, scope, last viewed entry)
- Calendar state (month, selected day)
- Day-results state (selected day entries)

UI renders are derived from this state.

### Active Notebook Context
Most of the app operates within the **active notebook context**:
- Calendar dots
- Day-results list
- Prev/Next navigation
- Default search scope
- Tag browser

Switching notebooks is a state transition that triggers:
- Notebook list re-render
- Calendar re-render (filtered to that notebook)
- Editor load (most recent entry in notebook, or empty state)

---

## Storage Layer

### localStorage
- Stores entry metadata and non-binary data
- Accessed only through storage adapters

Persisted keys:
- `journalEntries_v1` → Array of Entry objects
- `journalNotebooks_v1` → Array of Notebook objects
- `journalActiveNotebookId_v1` → String (active notebook id)

### IndexedDB
- Stores image binary data
- Referenced by image IDs in entry objects

Database key:
- `journalAppImages_v1`

### Migration
- On startup, legacy image data is migrated to IndexedDB
- Notebooks are also migrated:
  - A default notebook with id `"default"` is created if missing
  - Legacy entries missing `notebookId` are treated as belonging to `"default"`
- Migration is idempotent and safe to re-run

---

## Rendering Strategy

- Render functions are centralized and idempotent
- List-based UIs use a single render function per list
  - Examples: search results list, day-results list, notebooks list
- Rendering clears and rebuilds DOM sections
- No incremental DOM patching

### Notebook List Rendering
- The notebooks list is rendered from state using a single function
- Delete mode is a temporary UI state (X buttons appear) and is exited by clicking outside the notebooks section

---

## View Management

Explicit view functions control visibility:
- Journal view
- Search-only view
- Search-with-editor view

Event handlers call view functions rather than manipulating visibility directly.

### Search Scope Modes
Search supports explicit scope selection via query syntax:
- Default: active notebook only
- `scope:all` or `all:` → search across all notebooks
- `journal:<name>` → search within a specific notebook

When search is cross-notebook:
- Results include notebook context
- Clicking a result switches to the result’s notebook before opening the entry

---

## Event Handling

- Event handlers are thin
- Business logic lives in named functions
- No inline logic walls inside listeners
- Notebook UI events follow the same discipline:
  - Toggle collapse
  - Add inline
  - Enter/exit delete mode

---

## Error Handling

- Defensive checks occur at boundaries:
  - Storage load
  - Image access
  - User input
  - Notebook existence (missing notebook falls back to default)
- Errors fail gracefully without breaking the UI

---

## Design Discipline

- MED-lite rules enforced
- Vibe document is authoritative
- Structure favors readability over cleverness
- New features must reduce special cases, not add them

---

_End of document_
