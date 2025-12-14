# Search Guide — Journal App

This document explains **how to use the Search feature** in the Journal App, including **entry search**, **multi‑journal search**, and the built‑in **Tag Browser**.

---

## 1. Basic Search (Default Behavior)

The search bar lives in the **left sidebar**.

### Default scope (important)
By default, search is **scoped to the currently active journal only**.

This means:
- Searches do **not** cross journals unless you explicitly ask them to
- Results are always predictable and context‑aware

### What it searches
Typing plain text searches across:
- Entry titles
- Entry body text
- Tag text

### How to use
1. Click in the search bar
2. Type any word or phrase  
   Example:
   ```
   morning run
   ```
3. Press **Enter**

### Results
- Results appear in the **Search Results card**
- Clicking a result opens that journal entry
- Closing search returns you to the last viewed entry (unless you selected a new one)

---

## 2. Searching Across All Journals

You can intentionally search **across every journal** using special syntax.

### Supported syntax
Use **either** of the following:
```
scope:all
```
or
```
all:
```

These are aliases and behave the same.

### Examples
```
scope:all thanksgiving
```
```
all: tags:run
```
```
scope:all #gratitude
```

### Behavior
- Search runs across **all journals**
- Each result shows which journal it belongs to
- Clicking a result:
  1. Automatically switches to that journal
  2. Opens the selected entry

This keeps the app state consistent at all times.

---

## 3. Searching Within a Specific Journal

You can target a **single journal by name** using the `journal:` filter.

### Syntax
```
journal:<journal name>
```

Journal names are:
- Case‑insensitive
- Trimmed of extra spaces
- Quoted if they contain spaces

### Examples
```
journal:work meeting
```
```
journal:"Morning Pages" reflection
```
```
journal:training tags:longrun
```

### Behavior
- Search runs **only inside the named journal**
- If the journal does not exist, no results are returned

---

## 4. Tag Browser (Discover & Reuse Tags)

If you forget what tags you’ve used, the Tag Browser lets you **browse and filter tags** directly from search.

### Supported aliases
You can enter any of the following to activate tag browsing:
- `tag:`
- `tags:`
- `#`

All three behave the same.

### Default scope
- Tag browsing is scoped to the **active journal**
- Combine with `scope:all` or `journal:` to change scope

---

## 5. Browse All Tags

### How to show every tag (current journal)
```
tag:
```
or
```
#
```

### Across all journals
```
scope:all tag:
```
or
```
all: #
```

### What you’ll see
- A list of tags within the chosen scope
- Each tag shows:
  - Tag name
  - Number of entries that use it

### Important behavior
Tags are **normalized**, meaning:
- `Run`, `run`, and ` run ` are treated as the **same tag**
- Differences in capitalization or extra spaces are ignored

---

## 6. Filter Tags by Name

You can narrow the tag list by typing part of a tag name.

### Examples
```
tag:ru
```
```
scope:all #run
```

### Result
- Shows only tags containing that text
- Useful when you have many tags

---

## 7. View Entries for a Tag

### How
1. Use the Tag Browser to show tags
2. **Click a tag** in the results list

### Result
- The Search Results card switches to show:
  - All entries that contain that tag
- Entries are sorted by most recently updated
- Scope (journal / all journals) is preserved

---

## 8. Clearing Search

To exit search mode:
- Click the **×** in the Search Results card header, or
- Clear the search input and press **Enter**

The app will return to the journal entry you were previously viewing (unless you selected a new one).

---

## 9. Design Philosophy (What to Expect)

The search system is intentionally:

- **Scoped by default** — prevents accidental context mixing
- **Explicitly powerful** — cross‑journal search requires intent
- **Keyboard‑friendly** — everything starts from the search bar
- **Predictable** — one results card, one behavior model

If you remember text → search text  
If you forget tags → browse tags  
If you need everything → `scope:all`

---

## Quick Reference

| Goal | What to type |
|----|----|
| Search current journal | `morning run` |
| Search all journals | `scope:all morning run` / `all: morning run` |
| Search a specific journal | `journal:work meeting` |
| Show tags (current journal) | `tag:` / `#` |
| Show tags (all journals) | `scope:all tag:` |
| Filter tags | `#ru` |
| View entries for a tag | Click the tag |

---

_End of document_
