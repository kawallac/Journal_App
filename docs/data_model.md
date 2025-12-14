v1.1 12.13.2025
This document must remain consistent with vibe_doc_journal_app.md

# DATA_MODEL — Journal App

This document defines the **authoritative data shapes** used by the Journal App.
All persisted state must conform to these models.

---

## Entry Object

Each journal entry follows this shape:

```json
{
  "id": "string",
  "notebookId": "string",
  "date": "YYYY-MM-DD",
  "title": "string",
  "body": "string",
  "imageId": "string | null",
  "tags": [],
  "attachments": [],
  "createdAt": "ISO-8601 timestamp",
  "updatedAt": "ISO-8601 timestamp"
}
```

### Notes
- `notebookId` links the entry to a **Notebook (Journal)**
- Legacy entries without a `notebookId` are treated as belonging to `"default"`
- Entry ordering is always derived from `date` + creation order

---

## Notebook (Journal) Object

A notebook represents a **logical journal container**.
All entries belong to exactly one notebook.

```json
{
  "id": "string",
  "name": "string",
  "createdAt": "ISO-8601 timestamp",
  "updatedAt": "ISO-8601 timestamp"
}
```

### Notes
- Notebook names are:
  - User-defined
  - Case-insensitive for comparison
  - Normalized for uniqueness (trimmed, collapsed whitespace)
- At least one notebook must exist at all times
- A default notebook with `id = "default"` is created during migration if missing

---

## Tag Object

Tags belong to entries and may optionally be placed on images.

```json
{
  "id": "string",
  "text": "string",
  "color": "#hex",
  "x": "number (optional, percent)",
  "y": "number (optional, percent)"
}
```

### Notes
- Tags without x/y values appear only in the tag bar
- Tags with x/y values are rendered on the image
- Tag text is normalized for:
  - Search
  - De-duplication
  - Cross-entry grouping

---

## Image Model

Images are stored separately in IndexedDB.

```json
{
  "id": "string",
  "dataUrl": "base64 image data"
}
```

### Notes
- Entries reference images by `imageId`
- Images are deleted when removed from entries
- Images are journal-agnostic; linkage is via entries

---

## Storage Keys

### localStorage
- `journalEntries_v1` → Array of Entry objects
- `journalNotebooks_v1` → Array of Notebook objects
- `journalActiveNotebookId_v1` → String (active notebook id)

### IndexedDB
- `journalAppImages_v1` → Image store

---

## Invariants

- Entry IDs are unique
- Notebook IDs are unique
- Image IDs are unique
- Every entry belongs to exactly one notebook
- Entry date is always present
- State (in-memory) is the single source of truth
- UI renders are derived from state, never directly from storage

---

_End of document_
