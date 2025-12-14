/* ============================================================
   VIBE DOCUMENT (AUTHORITATIVE)
   This file is governed by:
     → docs/vibe_doc_journal_app.md

   All UI, UX, interaction, and structural decisions in this file
   must align with the Journal App Vibe:
   “An operating system for thinking.”

   When changes feel technically correct but emotionally wrong,
   defer to the vibe document.
   ============================================================ */

/* ============================================
   JOURNAL APP – v0.4.25
   Frontend logic:
     - Local storage adapter
     - Journal entries (image + tags)
     - Search + search results card
     - Calendar + per-day results card
     - Prev/Next navigation
     - Export JSON
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "journalEntries_v1";
  const APP_VERSION = "v0.4.25";

  // Single source of truth: write APP_VERSION into the UI on load
  function applyAppVersionToUI() {
    const vEl = document.getElementById("app-version");
    if (vEl) vEl.textContent = APP_VERSION;

    // Keep document title aligned too (nice + professional)
    document.title = `Journal App – ${APP_VERSION}`;
  }


  // ============================================
  // Utility Helpers
  // ============================================

  function formatDateForInput(date) {
    // Use LOCAL date components so the app respects the user's local time zone
    // instead of UTC (toISOString() would roll the date forward in the evening
    // for users in negative time zones like EST).
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function generateId() {
    return (
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 8)
    );
  }

    // Status UI behavior (professional + calm)
  // - auto-clears after a short timeout
  // - ignores duplicate messages
  // - suppresses rapid-fire updates (debounced) to avoid jitter
  const STATUS_CLEAR_MS_DEFAULT = 2500;
  const STATUS_DUPLICATE_WINDOW_MS = 800;
  const STATUS_RAPID_DEBOUNCE_MS = 250;

  let _statusLastText = "";
  let _statusLastSetAt = 0;
  let _statusClearTimer = null;
  let _statusDebounceTimer = null;
  let _statusPending = null;

  function updateStatus(text, opts = {}) {
    const statusEl = document.getElementById("status-text");
    if (!statusEl) return;

    const now = Date.now();
    const msg = (text || "").trim();

    // Always allow explicit clears.
    if (!msg) {
      if (_statusDebounceTimer) {
        clearTimeout(_statusDebounceTimer);
        _statusDebounceTimer = null;
      }
      if (_statusClearTimer) {
        clearTimeout(_statusClearTimer);
        _statusClearTimer = null;
      }
      _statusPending = null;
      _statusLastText = "";
      _statusLastSetAt = now;
      statusEl.textContent = "";
      return;
    }

    // Ignore duplicates within a short window (prevents noisy repeats).
    const isDup = msg === _statusLastText && (now - _statusLastSetAt) < STATUS_DUPLICATE_WINDOW_MS;
    if (isDup && !opts.force) return;

    // Suppress rapid-fire updates: debounce so only the *last* message in a burst shows.
    // This keeps typing-related statuses ("Title edited", "Notes edited") from jittering.
    const isRapid = (now - _statusLastSetAt) < STATUS_RAPID_DEBOUNCE_MS;
    if (isRapid && !opts.force) {
      _statusPending = { msg, opts };
      if (_statusDebounceTimer) clearTimeout(_statusDebounceTimer);
      _statusDebounceTimer = setTimeout(() => {
        const pending = _statusPending;
        _statusPending = null;
        _statusDebounceTimer = null;
        if (pending) updateStatus(pending.msg, { ...pending.opts, force: true });
      }, STATUS_RAPID_DEBOUNCE_MS);
      return;
    }

    // Apply immediately.
    statusEl.textContent = msg;
    _statusLastText = msg;
    _statusLastSetAt = now;

    // Auto-clear.
    const clearMs = Number.isFinite(opts.clearMs) ? opts.clearMs : STATUS_CLEAR_MS_DEFAULT;
    if (_statusClearTimer) clearTimeout(_statusClearTimer);
    _statusClearTimer = setTimeout(() => {
      // Only clear if this message is still the one being shown.
      if (statusEl.textContent === msg) {
        statusEl.textContent = "";
        _statusLastText = "";
      }
    }, Math.max(0, clearMs));
  }


  function flashSaveButton() {
  const btn = document.getElementById("save-btn");
  if (!btn) return;
  btn.classList.add("btn-accent-flash");
  setTimeout(() => {
    btn.classList.remove("btn-accent-flash");
  }, 700);
}


  // Simple helper to know if search page is visible (MED: visibility via .hidden only)
function isSearchVisible() {
  const pageSearch = document.getElementById("page-search");
  return !!pageSearch && !pageSearch.classList.contains("hidden");
}

// MED-lite visibility helpers (no inline style.display toggles)
function showEl(el) {
  if (!el) return;
  el.classList.remove("hidden");
}

function hideEl(el) {
  if (!el) return;
  el.classList.add("hidden");
}

// ============================================
  // Storage Adapter + Migration
  // ============================================

  const StorageAdapter = {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.error("Failed to load entries:", err);
        return [];
      }
    },
    save(allEntries) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allEntries));
      } catch (err) {
        console.error("Failed to save entries:", err);
      }
    }
  };

  function migrateEntry(entry) {
    const e = { ...entry };

    if (!e.notebookId) {
      e.notebookId = "default";
    }

    if (!Array.isArray(e.tags)) {
      e.tags = [];
    }

    if (!Array.isArray(e.attachments)) {
      e.attachments = [];
    }

    const nowIso = new Date().toISOString();
    if (!e.createdAt && e.updatedAt) {
      e.createdAt = e.updatedAt;
    } else if (!e.createdAt) {
      e.createdAt = nowIso;
    }
    if (!e.updatedAt && e.createdAt) {
      e.updatedAt = e.createdAt;
    } else if (!e.updatedAt) {
      e.updatedAt = nowIso;
    }

    e.date = e.date || formatDateForInput(new Date());
    e.title = e.title || "";
    e.body = e.body || "";

    return e;
  }

  const journalService = {
    loadAll() {
      return StorageAdapter.load().map(migrateEntry);
    },
    saveAll(allEntries) {
      StorageAdapter.save(allEntries);
    },
    exportAll(allEntries) {
      return JSON.stringify(allEntries, null, 2);
    }
  };

  // ============================================
  // IndexedDB Image Store for images
  // ============================================

  const ImageStore = {
    dbPromise: null,
    getDB() {
      if (!this.dbPromise) {
        this.dbPromise = new Promise((resolve, reject) => {
          const request = indexedDB.open("journalAppImages_v1", 1);
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("images")) {
              db.createObjectStore("images", { keyPath: "id" });
            }
          };
          request.onsuccess = (event) => {
            resolve(event.target.result);
          };
          request.onerror = (event) => {
            reject(event.target.error);
          };
        });
      }
      return this.dbPromise;
    },
    async saveImage(id, dataUrl) {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("images", "readwrite");
        const store = tx.objectStore("images");
        store.put({ id, dataUrl });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },
    async getImage(id) {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("images", "readonly");
        const store = tx.objectStore("images");
        const req = store.get(id);
        req.onsuccess = () => {
          resolve(req.result ? req.result.dataUrl : null);
        };
        req.onerror = () => reject(req.error);
      });
    },
    async deleteImage(id) {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("images", "readwrite");
        const store = tx.objectStore("images");
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  };

  async function migrateImagesToIndexedDBIfNeeded(allEntries) {
    let changed = false;

    for (const entry of allEntries) {
      let dataUrl = null;

      if (entry.imageData) {
        dataUrl = entry.imageData;
      } else if (
        Array.isArray(entry.attachments) &&
        entry.attachments.length > 0 &&
        entry.attachments[0].type === "image" &&
        entry.attachments[0].data
      ) {
        dataUrl = entry.attachments[0].data;
      }

      if (dataUrl && !entry.imageId) {
        const newId = generateId();
        try {
          await ImageStore.saveImage(newId, dataUrl);
          entry.imageId = newId;
          changed = true;
        } catch (err) {
          console.error("Failed to migrate image to IndexedDB", err);
        }
      }

      if (entry.imageData) {
        delete entry.imageData;
        changed = true;
      }

      if (Array.isArray(entry.attachments)) {
        entry.attachments = entry.attachments.map(att => {
          if (att && att.type === "image" && att.data) {
            const clone = { ...att };
            delete clone.data;
            return clone;
          }
          return att;
        });
      }
    }

    if (changed) {
      try {
        journalService.saveAll(allEntries);
        console.log("Migrated images to IndexedDB and trimmed localStorage");
      } catch (err) {
        console.error("Failed to save migrated entries", err);
      }
    }
  }

  // ============================================
  // DOM References
  // ============================================

  const newEntryBtn = document.getElementById("new-entry-btn");
  const newTagBtn = document.getElementById("new-tag-btn");
  const saveBtn = document.getElementById("save-btn");
  const deleteBtnTop = document.getElementById("delete-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const exportBtn = document.getElementById("export-btn");

  const editorInnerEl = document.getElementById("editor-inner");
  const pageJournal = document.getElementById("page-journal");
  const pageSearch = document.getElementById("page-search");
  const pageTopBar = document.getElementById("page-top-bar");
  const dayResultsEl = document.getElementById("day-results");

  const searchInput = document.getElementById("search-input");
  const searchClearBtn = document.getElementById("search-clear-btn");
  const searchResultsEl = document.getElementById("search-results");

  const searchCloseBtn = document.getElementById("search-close-btn");

  const calendarMonthLabel = document.getElementById("calendar-month-label");
  const calendarGrid = document.getElementById("calendar-grid");
  const calendarPrevBtn = document.getElementById("calendar-prev-btn");
  const calendarNextBtn = document.getElementById("calendar-next-btn");

  // ============================================
  // In-memory State
  // ============================================

  let entries = [];
  let currentEntryId = null;
  let currentTags = [];

  // Save-state tracking (for title/body/date only)
  // - snapshot: last saved values for the currently opened entry
  // - dirty: whether the editor fields differ from snapshot
  let currentEntrySnapshot = null;
  let isEditorDirty = false; // text fields dirty
  let isNonTextDirty = false; // photo/tags dirty


  // Search close behavior state
  // - searchOpenedFromEntryId: entry that was showing when search results first appeared
  // - searchPickedEntryId: set when user clicks a result (means keep current entry on close)
  let searchOpenedFromEntryId = null;
  let searchPickedEntryId = null;

  let calendarCurrentYear = null;
  let calendarCurrentMonth = null;

  let currentDayIso = null;
  let currentDayEntries = [];

  // Calendar selection state (independent of current entry / day-results card)
  let calendarSelectedIso = null;

  // Tag dialog
  let tagDialogBackdrop = null;
  let tagDialogInput = null;
  let tagDialogColorSwatches = [];
  let tagDialogActiveTagId = null;
  let tagDialogMode = "edit"; // "edit" | "create"
  let tagDialogDeleteBtn = null;

  const TAG_COLORS = [
    "#2563eb",
    "#16a34a",
    "#dc2626",
    "#d97706",
    "#7c3aed",
    "#0f766e"
  ];





  // ============================================
  // Core Helpers
  // ============================================

  function getChronologicallySortedEntries() {
    // Stable chronological ordering:
    // 1) date (YYYY-MM-DD)
    // 2) createdAt (so editing/saving doesn't reshuffle within a day)
    // 3) updatedAt (fallback)
    // 4) id (final deterministic tie-breaker)
    const copy = [...entries];
    copy.sort((a, b) => {
      const aDate = a.date || "";
      const bDate = b.date || "";
      if (aDate !== bDate) return aDate.localeCompare(bDate);

      const aCreated = a.createdAt || "";
      const bCreated = b.createdAt || "";
      if (aCreated !== bCreated) return aCreated.localeCompare(bCreated);

      const aUpdated = a.updatedAt || "";
      const bUpdated = b.updatedAt || "";
      if (aUpdated !== bUpdated) return aUpdated.localeCompare(bUpdated);

      const aId = a.id || "";
      const bId = b.id || "";
      return aId.localeCompare(bId);
    });
    return copy;
  }

  function getCurrentEntryObject() {
    if (!currentEntryId) return null;
    return entries.find(e => e.id === currentEntryId) || null;
  }

  function ensureEntryShape(e) {
    const nowIso = new Date().toISOString();
    return {
      id: e.id || generateId(),
      notebookId: e.notebookId || "default",
      date: e.date || formatDateForInput(new Date()),
      title: e.title || "",
      body: e.body || "",
      imageId: e.imageId || null,
      tags: Array.isArray(e.tags) ? e.tags : [],
      attachments: Array.isArray(e.attachments) ? e.attachments : [],
      createdAt: e.createdAt || nowIso,
      updatedAt: e.updatedAt || nowIso
    };
  }


  // ============================================
  // Save button enable/disable (dirty tracking)
  // Only tracks: Date / Title / Notes
  // ============================================

  function setCurrentEntrySnapshotFromEntry(entry) {
    if (!entry) {
      currentEntrySnapshot = null;
      return;
    }
    currentEntrySnapshot = {
      date: entry.date || "",
      title: entry.title || "",
      body: entry.body || ""
    };
  }

  function getEditorFieldValues() {
    const dateInput = document.getElementById("entry-date");
    const titleInput = document.getElementById("entry-title");
    const bodyInput = document.getElementById("entry-body");

    return {
      date: dateInput ? (dateInput.value || "") : "",
      title: titleInput ? (titleInput.value || "") : "",
      body: bodyInput ? (bodyInput.value || "") : ""
    };
  }

  function syncSaveButtonState() {
    const dirty = !!isEditorDirty || !!isNonTextDirty;
    if (saveBtn) saveBtn.disabled = !dirty;
  }

  function setEditorDirty(nextDirty) {
    // Tracks only Date/Title/Notes.
    isEditorDirty = !!nextDirty;
    syncSaveButtonState();
  }

  function markNonTextDirty() {
    // Photo/tags changes (even if auto-persisted) should make Save actionable.
    isNonTextDirty = true;
    syncSaveButtonState();
  }

  function clearNonTextDirty() {
    isNonTextDirty = false;
    syncSaveButtonState();
  }

  function recomputeEditorDirty() {
    const entry = getCurrentEntryObject();
    if (!entry) {
      setEditorDirty(false);
      return;
    }

    // If we have no snapshot (e.g., brand-new entry), treat as dirty.
    if (!currentEntrySnapshot) {
      setEditorDirty(true);
      return;
    }

    const values = getEditorFieldValues();
    const dirty =
      values.date !== (currentEntrySnapshot.date || "") ||
      values.title !== (currentEntrySnapshot.title || "") ||
      values.body !== (currentEntrySnapshot.body || "");

    setEditorDirty(dirty);
  }
  function updateNavButtons() {
    const sorted = getChronologicallySortedEntries();
    if (!currentEntryId || sorted.length === 0) {
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      if (deleteBtnTop) deleteBtnTop.disabled = !currentEntryId;
      return;
    }
    const idx = sorted.findIndex(e => e.id === currentEntryId);
    const hasPrev = idx > 0;
    const hasNext = idx >= 0 && idx < sorted.length - 1;

    if (prevBtn) prevBtn.disabled = !hasPrev;
    if (nextBtn) nextBtn.disabled = !hasNext;
    if (deleteBtnTop) deleteBtnTop.disabled = false;
  }

  // ============================================
// View helpers (MED-lite: .hidden only)
// ============================================

function showJournalView() {
  // If we are leaving search view by any path other than the search close button,
  // treat it as ending the current search session.
  if (isSearchVisible()) {
    searchOpenedFromEntryId = null;
    searchPickedEntryId = null;
  }

  hideEl(pageSearch);
  showEl(pageJournal);
  showEl(pageTopBar);
}

function showSearchOnlyView() {
  showEl(pageSearch);
  hideEl(pageJournal);
  hideEl(pageTopBar);
}

function showSearchWithEditorView() {
  showEl(pageSearch);
  showEl(pageJournal);
  showEl(pageTopBar);
}



function closeSearchResults() {
  // Hide search card
  hideEl(pageSearch);

  // Clear the "search session" state after we act on it.
  const shouldReturnToOpenedFrom = !searchPickedEntryId;
  const targetId = searchOpenedFromEntryId;

  searchOpenedFromEntryId = null;
  searchPickedEntryId = null;

  // If the user never clicked a search result, return to whatever entry
  // was visible when the search first appeared.
  if (shouldReturnToOpenedFrom && targetId) {
    openEntryById(targetId);
    return;
  }

  // Otherwise, keep whatever entry is currently shown.
  showJournalView();
}



  // ============================================
  // Editor Rendering
  // ============================================

  function renderEditor(entry) {
    if (!editorInnerEl) return;

    const safe = entry || {
      date: formatDateForInput(new Date()),
      title: "",
      body: "",
      imageData: null,
      tags: []
    };

    currentTags = Array.isArray(safe.tags) ? [...safe.tags] : [];

    editorInnerEl.innerHTML = `
      <div class="editor-row-horizontal">
        <div>
          <div class="field-label">Date</div>
          <input
            id="entry-date"
            type="date"
            class="text-input"
            value="${safe.date || ""}"
          />
        </div>
        <div>
          <div class="field-label">Title</div>
          <input
            id="entry-title"
            type="text"
            class="text-input"
            placeholder="Optional title for this page…"
            value="${safe.title ? safe.title.replace(/"/g, "&quot;") : ""}"
          />
        </div>
      </div>

      <div class="entry-tag-bar">
        <div class="field-label">Tags on this entry</div>
        <div id="entry-tag-list" class="entry-tag-list"></div>
      </div>

      <div class="image-section">
        <div class="image-upload-row">
          <div>
            <div class="field-label">Journal Page Photo</div>
            <input id="entry-photo" type="file" accept="image/*" />
          </div>
        </div>

        <div id="image-preview" class="image-preview">
          ${
            safe.imageId
              ? `<span>Loading image…</span>`
              : `<span>No image yet. Upload a photo of your journal page.</span>`
          }
        </div>
      </div>

      <div>
        <div class="field-label">Notes</div>
        <textarea
          id="entry-body"
          class="textarea-input"
          placeholder="Write notes, highlights, or a summary of this journal page…"
        >${safe.body || ""}</textarea>
      </div>

    `;

    // Snapshot/dirty tracking is based on what we just rendered.
    setCurrentEntrySnapshotFromEntry(safe);
    setEditorDirty(false);
    clearNonTextDirty();

    wireEditorInputs();
    renderEntryTagBar();
    loadAndRenderEntryImage(safe);
  }


  // ============================================
  // Photo remove control (X button)
  // ============================================

  function ensurePhotoRemoveButton() {
    const imagePreview = document.getElementById("image-preview");
    if (!imagePreview) return;

    // Remove any existing controls first (idempotent).
    imagePreview
      .querySelectorAll(".photo-remove-btn, .photo-zoom-btn-inline")
      .forEach(el => el.remove());

    const entry = getCurrentEntryObject();
    const img = imagePreview.querySelector("img");

    // Only show controls when an image is actually present.
    if (!entry || !entry.imageId || !img) return;

    // --- Zoom control (magnify) ---
    const zoomBtn = document.createElement("button");
    zoomBtn.type = "button";
    zoomBtn.className = "photo-zoom-btn-inline";
    zoomBtn.setAttribute("aria-label", "Zoom photo");
    zoomBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
        <line x1="16.65" y1="16.65" x2="21" y2="21"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round"/>
      </svg>
    `;


    zoomBtn.addEventListener("click", (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      openPhotoZoomWithSrc(img.src);
    });

    // --- Remove control (X) ---
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "photo-remove-btn";
    removeBtn.setAttribute("aria-label", "Remove photo");
    removeBtn.textContent = "×";

    removeBtn.addEventListener("click", (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      openPhotoRemoveConfirm();
    });

    imagePreview.appendChild(zoomBtn);
    imagePreview.appendChild(removeBtn);
  }

  async function removePhotoFromCurrentEntry() {
    const entry = getCurrentEntryObject();
    if (!entry || !entry.imageId) return;

    const oldImageId = entry.imageId;

    // Update entry first (so UI doesn't depend on IndexedDB success).
    entry.imageId = null;
    entry.updatedAt = new Date().toISOString();
    journalService.saveAll(entries);
    markNonTextDirty();

    try {
      await ImageStore.deleteImage(oldImageId);
    } catch (err) {
      console.error("Failed to delete image from IndexedDB", err);
    }

    await loadAndRenderEntryImage(entry);
    updateStatus("Photo removed");
  }

  async function loadAndRenderEntryImage(entry) {
    const imagePreview = document.getElementById("image-preview");
    if (!imagePreview) return;

    if (!entry || !entry.imageId) {
      imagePreview.innerHTML = `<span>No image yet. Upload a photo of your journal page.</span>`;
      renderTagsOnImage();
      ensurePhotoRemoveButton();
      ensurePhotoZoomWiring();
      return;
    }

    try {
      const dataUrl = await ImageStore.getImage(entry.imageId);
      if (!dataUrl) {
        imagePreview.innerHTML = `<span>No image yet. Upload a photo of your journal page.</span>`;
        renderTagsOnImage();
        ensurePhotoRemoveButton();
        ensurePhotoZoomWiring();
        return;
      }

      imagePreview.innerHTML = `<img src="${dataUrl}" alt="Journal page image" />`;
      renderTagsOnImage();
      ensurePhotoRemoveButton();
      ensurePhotoZoomWiring();
    } catch (err) {
      console.error("Failed to load image from IndexedDB", err);
      imagePreview.innerHTML = `<span>Unable to load image.</span>`;
      ensurePhotoRemoveButton();
      ensurePhotoZoomWiring();
    }
  }


  function wireEditorInputs() {
    const dateInput = document.getElementById("entry-date");
    const titleInput = document.getElementById("entry-title");
    const bodyInput = document.getElementById("entry-body");
    const photoInput = document.getElementById("entry-photo");
    const imagePreview = document.getElementById("image-preview");

    if (dateInput) {
      dateInput.addEventListener("change", () => {
        // Date changes are staged until the user clicks Save.
        // (Calendar highlight + day-results will sync on Save.)
        updateStatus("Date edited");
        recomputeEditorDirty();
      });
    }


    if (titleInput) {
      titleInput.addEventListener("input", () => {
        // Title changes are staged until the user clicks Save.
        updateStatus("Title edited");
        recomputeEditorDirty();
      });
    }


    if (bodyInput) {
      bodyInput.addEventListener("input", () => {
        // Notes changes are staged until the user clicks Save.
        updateStatus("Notes edited");
        recomputeEditorDirty();
      });
    }


    
    // Photo upload + drag/drop
    if (photoInput && imagePreview) {
      async function handlePhotoFile(file) {
        if (!file) return;

        // Only accept images
        if (!file.type || !file.type.startsWith("image/")) {
          updateStatus("Please drop an image file");
          return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
          const src = e.target.result;

          // Show the image immediately in the UI
          imagePreview.innerHTML = `<img src="${src}" alt="Journal page image" />`;

          // Allow click-to-zoom immediately
          ensurePhotoZoomWiring();

          const entry = getCurrentEntryObject();
          if (!entry) return;

          // If there was a previous image, delete it from IndexedDB
          if (entry.imageId) {
            try {
              await ImageStore.deleteImage(entry.imageId);
            } catch (err) {
              console.error("Failed to delete old image from IndexedDB", err);
            }
          }

          const newImageId = generateId();
          try {
            await ImageStore.saveImage(newImageId, src);
            entry.imageId = newImageId;
            if (entry.imageData) {
              delete entry.imageData;
            }
            entry.updatedAt = new Date().toISOString();
            journalService.saveAll(entries);
            markNonTextDirty();
            updateStatus("Image updated");
            renderTagsOnImage();
            ensurePhotoRemoveButton();
            ensurePhotoZoomWiring();
          } catch (err) {
            console.error("Failed to save image to IndexedDB", err);
            updateStatus("Failed to save image");
          }
        };
        reader.readAsDataURL(file);
      }

      // Standard file input
      photoInput.addEventListener("change", () => {
        if (photoInput.files && photoInput.files[0]) {
          handlePhotoFile(photoInput.files[0]);
          // Reset the input so selecting the same file again still triggers change
          photoInput.value = "";
        }
      });

      // Drag & drop on the preview area
      imagePreview.addEventListener("dragenter", (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        imagePreview.classList.add("is-dragover");
      });

      imagePreview.addEventListener("dragover", (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        imagePreview.classList.add("is-dragover");
      });

      imagePreview.addEventListener("dragleave", (evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        // If we're still inside the preview (moving between children), ignore.
        const stillInside =
          evt.relatedTarget && imagePreview.contains(evt.relatedTarget);

        if (!stillInside) {
          imagePreview.classList.remove("is-dragover");
        }
      });

      imagePreview.addEventListener("drop", (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        imagePreview.classList.remove("is-dragover");

        const dt = evt.dataTransfer;
        const file = dt && dt.files && dt.files[0] ? dt.files[0] : null;
        if (!file) return;

        handlePhotoFile(file);
      });
    }

    // Ensure Save button reflects current editor state after wiring.
    recomputeEditorDirty();
  }

  // ============================================
  // Tags
  // ============================================

  function renderTagsOnImage() {
    const imagePreview = document.getElementById("image-preview");
    if (!imagePreview) return;

    // Remove any existing tag pills inside the image area
    [...imagePreview.querySelectorAll(".tag-pill")].forEach(el => el.remove());

    const entry = getCurrentEntryObject();
    if (!entry) return;

    const hasImage = !!imagePreview.querySelector("img");
    if (!hasImage) return;

    currentTags.forEach(tag => {
      // For new tags that haven't been placed yet, we don't render them on the image.
      // They will only show in the tag bar until the user drags them onto the photo
      // and we assign x/y coordinates.
      if (typeof tag.x !== "number" || typeof tag.y !== "number") {
        return;
      }

      const el = document.createElement("div");
      el.className = "tag-pill";
      el.textContent = tag.text || "Tag";
      el.style.left = `${tag.x}%`;
      el.style.top = `${tag.y}%`;
      el.style.backgroundColor = tag.color || TAG_COLORS[0];
      el.dataset.tagId = tag.id;

      let dragging = false;

      el.addEventListener("mousedown", (evt) => {
        evt.preventDefault();
        dragging = true;

        const rect = imagePreview.getBoundingClientRect();

        function onMove(moveEvt) {
          if (!dragging) return;
          const xPercent = ((moveEvt.clientX - rect.left) / rect.width) * 100;
          const yPercent = ((moveEvt.clientY - rect.top) / rect.height) * 100;
          el.style.left = `${Math.min(100, Math.max(0, xPercent))}%`;
          el.style.top = `${Math.min(100, Math.max(0, yPercent))}%`;
        }

        function onUp(upEvt) {
          dragging = false;
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);

          const rect2 = imagePreview.getBoundingClientRect();
          const xPercent = ((upEvt.clientX - rect2.left) / rect2.width) * 100;
          const yPercent = ((upEvt.clientY - rect2.top) / rect2.height) * 100;

          const tagObj = currentTags.find(t => t.id === tag.id);
          if (tagObj) {
            tagObj.x = Math.min(100, Math.max(0, xPercent));
            tagObj.y = Math.min(100, Math.max(0, yPercent));
          }

          const entry = getCurrentEntryObject();
          if (entry) {
            entry.tags = [...currentTags];
            entry.updatedAt = new Date().toISOString();
            journalService.saveAll(entries);
            markNonTextDirty();
            updateStatus("Tag moved");
          }
        }

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });

      el.addEventListener("dblclick", (evt) => {
        evt.stopPropagation();
        openTagDialog(tag.id, "edit");
      });

      imagePreview.appendChild(el);
    });
  }

  function renderEntryTagBar() {
    const listEl = document.getElementById("entry-tag-list");
    if (!listEl) return;

    listEl.innerHTML = "";

    if (!currentTags || currentTags.length === 0) {
      const empty = document.createElement("div");
      empty.className = "entry-tag-empty";
      empty.textContent = "No tags yet.";
      listEl.appendChild(empty);
      return;
    }

    currentTags.forEach(tag => {
      const pill = document.createElement("span");
      pill.className = "entry-tag-pill";
      pill.textContent = tag.text || "Tag";
      // Match the tag color used on the photo tags
      pill.style.backgroundColor = tag.color || TAG_COLORS[0];
      pill.style.color = "#ffffff";
      // Make it look like the on-photo tag pill
      pill.style.borderRadius = "999px";
      pill.style.padding = "0.15rem 0.6rem";
      pill.style.display = "inline-flex";
      pill.style.alignItems = "center";
      pill.style.justifyContent = "center";
      pill.style.marginRight = "0.4rem";

      // Allow editing tag text/color from the bar
      pill.addEventListener("dblclick", (evt) => {
        evt.stopPropagation();
        openTagDialog(tag.id, "edit");
      });

// Drag from tag bar onto image
pill.addEventListener("mousedown", (evt) => {
  evt.preventDefault();

  const imagePreview = document.getElementById("image-preview");
  const imgEl = imagePreview ? imagePreview.querySelector("img") : null;

  // If there's no image, don't start a drag onto the photo
  if (!imgEl) {
    updateStatus("Add an image first to place tags on the photo");
    return;
  }

  const startX = evt.clientX;
  const startY = evt.clientY;
  let isDragging = false;
  let ghost = null;

  function updateGhostPosition(moveEvt) {
    if (!ghost) return;
    ghost.style.left = moveEvt.clientX + 8 + "px";
    ghost.style.top = moveEvt.clientY + 8 + "px";
  }

  function startDrag(startEvt) {
    if (isDragging) return;
    isDragging = true;

    ghost = document.createElement("div");
    ghost.className = "tag-pill";
    ghost.textContent = tag.text || "Tag";
    ghost.style.position = "fixed";
    ghost.style.pointerEvents = "none";
    ghost.style.zIndex = "9999";
    ghost.style.backgroundColor = tag.color || TAG_COLORS[0];
    ghost.style.color = "#ffffff";
    ghost.style.borderRadius = "999px";
    ghost.style.padding = "0.15rem 0.6rem";

    document.body.appendChild(ghost);
    updateGhostPosition(startEvt);
  }

  function onMove(moveEvt) {
    const dx = moveEvt.clientX - startX;
    const dy = moveEvt.clientY - startY;
    const distSq = dx * dx + dy * dy;

    // Only start a drag if the mouse has moved a bit (e.g. > 5px)
    if (!isDragging) {
      if (distSq < 25) {
        return; // still just a click, not a drag
      }
      startDrag(moveEvt);
      return;
    }

    updateGhostPosition(moveEvt);
  }

  function onUp(upEvt) {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);

    // If we never started dragging, do nothing.
    // (Click/double-click behavior is handled by the dblclick handler.)
    if (!isDragging) {
      return;
    }

    if (ghost && ghost.parentNode) {
      ghost.parentNode.removeChild(ghost);
    }

    const rect = imgEl.getBoundingClientRect();
    const x = upEvt.clientX;
    const y = upEvt.clientY;

    // Only place the tag if the drop ends inside the image bounds
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      return;
    }

    const xPercent = ((x - rect.left) / rect.width) * 100;
    const yPercent = ((y - rect.top) / rect.height) * 100;

    const tagObj = currentTags.find(t => t.id === tag.id);
    if (!tagObj) return;

    tagObj.x = Math.min(100, Math.max(0, xPercent));
    tagObj.y = Math.min(100, Math.max(0, yPercent));

    const entry = getCurrentEntryObject();
    if (entry) {
      entry.tags = [...currentTags];
      entry.updatedAt = new Date().toISOString();
      journalService.saveAll(entries);
      markNonTextDirty();
      renderTagsOnImage();
      updateStatus("Tag placed on image");
    }
  }

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
});


      listEl.appendChild(pill);
    });
  }

  function setupTagDialog() {
    tagDialogBackdrop = document.createElement("div");
    tagDialogBackdrop.className = "tag-dialog-backdrop";

    const dialog = document.createElement("div");
    dialog.className = "tag-dialog";

    dialog.innerHTML = `      <button type="button" class="tag-dialog-close-x" id="tag-dialog-close-x" aria-label="Close dialog">×</button>

      <div>
        <div class="field-label">Tag text</div>
        <input id="tag-dialog-input" type="text" class="text-input" />
      </div>

      <div>
        <div class="field-label">Color</div>
        <div class="tag-dialog-colors" id="tag-dialog-colors"></div>
      </div>

      <div class="tag-dialog-buttons">
        <button type="button" class="btn-primary" id="tag-dialog-apply">Apply</button>
        <button type="button" class="btn-danger" id="tag-dialog-delete">Delete</button>
      </div>`;

    tagDialogBackdrop.appendChild(dialog);
    document.body.appendChild(tagDialogBackdrop);
    // Hidden by default; opened via openTagDialog()
    tagDialogBackdrop.classList.add("hidden");

    tagDialogInput = dialog.querySelector("#tag-dialog-input");
    const colorsContainer = dialog.querySelector("#tag-dialog-colors");
    const applyBtn = dialog.querySelector("#tag-dialog-apply");
    const closeXBtn = dialog.querySelector("#tag-dialog-close-x");
    tagDialogDeleteBtn = dialog.querySelector("#tag-dialog-delete");

    TAG_COLORS.forEach(color => {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = "tag-color-swatch";
      swatch.style.backgroundColor = color;
      swatch.dataset.color = color;

      swatch.addEventListener("click", () => {
        tagDialogColorSwatches.forEach(s => s.classList.remove("selected"));
        swatch.classList.add("selected");
      });

      colorsContainer.appendChild(swatch);
      tagDialogColorSwatches.push(swatch);
    });

    applyBtn.addEventListener("click", () => {
      applyTagDialogChanges();
    });

    if (closeXBtn) {
      closeXBtn.addEventListener("click", () => {
        hideTagDialog();
      });
    }

    if (tagDialogDeleteBtn) {
      tagDialogDeleteBtn.addEventListener("click", () => {
        deleteActiveTag();
      });
    }

    tagDialogBackdrop.addEventListener("click", (evt) => {
      if (evt.target === tagDialogBackdrop) {
        hideTagDialog();
      }
    });

    // Escape closes (cancel)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && tagDialogBackdrop && !tagDialogBackdrop.classList.contains("hidden")) {
        hideTagDialog();
      }
    });
  }

  function openTagDialog(tagId, mode = "edit") {
    tagDialogMode = mode;
    tagDialogActiveTagId = tagId;

    // Reset selection state each time
    tagDialogColorSwatches.forEach(s => s.classList.remove("selected"));

    if (mode === "edit") {
      const tag = currentTags.find(t => t.id === tagId);
      if (!tag || !tagDialogBackdrop) return;

      if (tagDialogInput) tagDialogInput.value = tag.text || "";

      const color = tag.color || TAG_COLORS[0];
      let matched = false;
      tagDialogColorSwatches.forEach(swatch => {
        if (swatch.dataset.color === color) {
          swatch.classList.add("selected");
          matched = true;
        }
      });
      if (!matched && tagDialogColorSwatches[0]) {
        tagDialogColorSwatches[0].classList.add("selected");
      }

      if (tagDialogDeleteBtn) {
        tagDialogDeleteBtn.classList.remove("hidden");
      }
    } else {
      // create mode: new tag, not yet added
      if (tagDialogInput) tagDialogInput.value = "";

      if (tagDialogColorSwatches[0]) {
        tagDialogColorSwatches[0].classList.add("selected");
      }

      if (tagDialogDeleteBtn) {
        // No delete for brand-new, not-yet-created tags
        tagDialogDeleteBtn.classList.add("hidden");
      }
    }

    if (tagDialogBackdrop) {
      tagDialogBackdrop.classList.remove("hidden");
    }
    if (tagDialogInput) tagDialogInput.focus();
  }

  function hideTagDialog() {
    if (tagDialogBackdrop) {
      tagDialogBackdrop.classList.add("hidden");
    }
    tagDialogActiveTagId = null;
    tagDialogMode = "edit";
  }

  function applyTagDialogChanges() {
    const entry = getCurrentEntryObject();
    if (!entry) {
      hideTagDialog();
      return;
    }

    const textValue = tagDialogInput ? (tagDialogInput.value || "Tag") : "Tag";
    const selectedSwatch = tagDialogColorSwatches.find(s => s.classList.contains("selected"));
    const colorValue = selectedSwatch ? (selectedSwatch.dataset.color || TAG_COLORS[0]) : TAG_COLORS[0];

    if (tagDialogMode === "create") {
      // Create a brand-new tag, only after user hits Apply
      const newTag = {
        id: generateId(),
        text: textValue,
        color: colorValue
        // no x/y yet -> lives only in tag bar until placed
      };

      currentTags.push(newTag);
      entry.tags = [...currentTags];
      entry.updatedAt = new Date().toISOString();
      journalService.saveAll(entries);
      markNonTextDirty();
      updateStatus("Tag created");
    } else {
      // Edit existing tag
      if (!tagDialogActiveTagId) {
        hideTagDialog();
        return;
      }

      const tag = currentTags.find(t => t.id === tagDialogActiveTagId);
      if (!tag) {
        hideTagDialog();
        return;
      }

      tag.text = textValue;
      tag.color = colorValue;

      entry.tags = [...currentTags];
      entry.updatedAt = new Date().toISOString();
      journalService.saveAll(entries);
      markNonTextDirty();
      updateStatus("Tag updated");
    }

    renderTagsOnImage();
    renderEntryTagBar();
    hideTagDialog();
  }

  function deleteActiveTag() {
    if (!tagDialogActiveTagId) {
      hideTagDialog();
      return;
    }

    const idx = currentTags.findIndex(t => t.id === tagDialogActiveTagId);
    if (idx === -1) {
      hideTagDialog();
      return;
    }

    currentTags.splice(idx, 1);

    const entry = getCurrentEntryObject();
    if (entry) {
      entry.tags = [...currentTags];
      entry.updatedAt = new Date().toISOString();
      journalService.saveAll(entries);
      markNonTextDirty();
      updateStatus("Tag deleted");
    }

    renderTagsOnImage();
    renderEntryTagBar();
    hideTagDialog();
  }

  function createNewTagAtCenter() {
    const entry = getCurrentEntryObject();
    if (!entry) {
      updateStatus("Create an entry first.");
      return;
    }

    // Open the tag dialog in "create" mode. We will actually create/persist
    // the tag only after the user hits Apply.
    openTagDialog(null, "create");
  }



  // ============================================
  // Delete Confirm Dialog
  // ============================================

  let deleteConfirmBackdrop = null;

  function ensureDeleteConfirmDialog() {
    if (deleteConfirmBackdrop) return;

    deleteConfirmBackdrop = document.createElement("div");
    deleteConfirmBackdrop.className = "confirm-backdrop";
    deleteConfirmBackdrop.id = "delete-confirm-backdrop";

    const dialog = document.createElement("div");
    dialog.className = "confirm-dialog";
    dialog.innerHTML = `
      <button type="button" class="confirm-close-x" aria-label="Close dialog">×</button>
      <h3 class="confirm-title">Are you sure?</h3>
      <div class="confirm-actions">
        <button type="button" class="confirm-circle-btn confirm-yes" id="delete-confirm-yes" aria-label="Confirm delete">✓</button>
      </div>
    
    `;

    deleteConfirmBackdrop.appendChild(dialog);
    document.body.appendChild(deleteConfirmBackdrop);

    // Hidden by default; opened via openDeleteConfirm()
    deleteConfirmBackdrop.classList.add("hidden");

    // Click outside closes (cancel)
    deleteConfirmBackdrop.addEventListener("click", (e) => {
      if (e.target === deleteConfirmBackdrop) closeDeleteConfirm();
    });

    // Buttons
    const yesBtn = dialog.querySelector("#delete-confirm-yes");

    const closeXBtn = dialog.querySelector(".confirm-close-x");
    if (closeXBtn) {
      closeXBtn.addEventListener("click", () => {
        closeDeleteConfirm();
      });
    }

    yesBtn.addEventListener("click", () => {
      closeDeleteConfirm();
      deleteCurrentEntryShowPrev();
    });

    // Escape closes (cancel)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isDeleteConfirmOpen()) {
        closeDeleteConfirm();
      }
    });
  }

  function isDeleteConfirmOpen() {
    return !!deleteConfirmBackdrop && !deleteConfirmBackdrop.classList.contains("hidden");
  }

  function openDeleteConfirm() {
    if (!currentEntryId) return;
    ensureDeleteConfirmDialog();
    deleteConfirmBackdrop.classList.remove("hidden");
  }

  function closeDeleteConfirm() {
    if (!deleteConfirmBackdrop) return;
    deleteConfirmBackdrop.classList.add("hidden");
  }

  /**
   * Delete the current entry and then show the PREVIOUS entry (chronologically).
   * If the deleted entry was the first, show the new first entry.
   * If there are no entries left, clear the editor.
   */
  function deleteCurrentEntryShowPrev() {
    if (!currentEntryId) return;

    const sortedBefore = getChronologicallySortedEntries();
    const sortedIdx = sortedBefore.findIndex(e => e.id === currentEntryId);
    if (sortedIdx === -1) return;

    // Remove from the main entries array by ID (safer than index assumptions)
    const rawIdx = entries.findIndex(e => e.id === currentEntryId);
    if (rawIdx === -1) return;

    entries.splice(rawIdx, 1);
    journalService.saveAll(entries);

    const sortedAfter = getChronologicallySortedEntries();
    if (sortedAfter.length === 0) {
      currentEntryId = null;
      editorInnerEl.innerHTML = "";
      updateNavButtons();
      renderCalendar();
      currentDayIso = null;
      currentDayEntries = [];
      renderDayResults();
      return;
    }

    const targetIdx = Math.max(0, sortedIdx - 1);
    goToEntryAtIndex(targetIdx);
  }

  
  // ============================================
  // Photo Remove Confirm Dialog
  // Mirrors the entry delete confirm dialog in
  // function + style (same classes / behavior).
  // ============================================

  let photoRemoveConfirmBackdrop = null;

  function ensurePhotoRemoveConfirmDialog() {
    if (photoRemoveConfirmBackdrop) return;

    photoRemoveConfirmBackdrop = document.createElement("div");
    photoRemoveConfirmBackdrop.className = "confirm-backdrop";
    photoRemoveConfirmBackdrop.id = "photo-remove-confirm-backdrop";

    const dialog = document.createElement("div");
    dialog.className = "confirm-dialog";
    dialog.innerHTML = `
      <button type="button" class="confirm-close-x" aria-label="Close dialog">×</button>
      <h3 class="confirm-title">Are you sure?</h3>
      <div class="confirm-actions">
        <button type="button" class="confirm-circle-btn confirm-yes" id="photo-remove-confirm-yes" aria-label="Confirm remove photo">✓</button>
      </div>
    
    `;

    photoRemoveConfirmBackdrop.appendChild(dialog);
    document.body.appendChild(photoRemoveConfirmBackdrop);

    // Hidden by default; opened via openPhotoRemoveConfirm()
    photoRemoveConfirmBackdrop.classList.add("hidden");

    // Click outside closes (cancel)
    photoRemoveConfirmBackdrop.addEventListener("click", (e) => {
      if (e.target === photoRemoveConfirmBackdrop) closePhotoRemoveConfirm();
    });

    // Buttons
    const yesBtn = dialog.querySelector("#photo-remove-confirm-yes");

    const closeXBtn = dialog.querySelector(".confirm-close-x");
    if (closeXBtn) {
      closeXBtn.addEventListener("click", () => {
        closePhotoRemoveConfirm();
      });
    }

    yesBtn.addEventListener("click", async () => {
      closePhotoRemoveConfirm();
      await removePhotoFromCurrentEntry();
    });

    // Escape closes (cancel)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isPhotoRemoveConfirmOpen()) {
        closePhotoRemoveConfirm();
      }
    });
  }

  function isPhotoRemoveConfirmOpen() {
    return (
      !!photoRemoveConfirmBackdrop &&
      !photoRemoveConfirmBackdrop.classList.contains("hidden")
    );
  }

  function openPhotoRemoveConfirm() {
    const entry = getCurrentEntryObject();
    if (!entry || !entry.imageId) return;
    ensurePhotoRemoveConfirmDialog();
    photoRemoveConfirmBackdrop.classList.remove("hidden");
  }

  function closePhotoRemoveConfirm() {
    if (!photoRemoveConfirmBackdrop) return;
    photoRemoveConfirmBackdrop.classList.add("hidden");
  }





  // ============================================
  // Photo Zoom (click image to open larger view)
  // - Uses .hidden for visibility (MED-lite)
  // - Calm overlay with simple zoom controls
  // ============================================

  let photoZoomBackdrop = null;
  let photoZoomImgEl = null;
  let photoZoomScale = 1;
  let photoZoomFitScale = 1;
  let photoZoomOffsetX = 0;
  let photoZoomOffsetY = 0;
  let photoZoomApply = null;
  function ensurePhotoZoomModal() {
    if (photoZoomBackdrop) return;

    photoZoomBackdrop = document.createElement("div");
    photoZoomBackdrop.className = "photo-zoom-backdrop hidden";
    photoZoomBackdrop.id = "photo-zoom-backdrop";

    const dialog = document.createElement("div");
    dialog.className = "photo-zoom-dialog";

    dialog.innerHTML = `
      <div class="photo-zoom-header">
        <div class="photo-zoom-title">Photo Zoom</div>
        <div class="photo-zoom-controls">
          <button type="button" class="btn-ghost photo-zoom-btn" id="photo-zoom-out" aria-label="Zoom out">−</button>
          <button type="button" class="btn-ghost photo-zoom-btn" id="photo-zoom-in" aria-label="Zoom in">+</button>
          <button type="button" class="btn-ghost photo-zoom-btn" id="photo-zoom-reset" aria-label="Reset zoom">Reset</button>
          <button type="button" class="photo-zoom-close-x" id="photo-zoom-close-x" aria-label="Close zoom">×</button>
        </div>
      </div>
      <div class="photo-zoom-body" id="photo-zoom-body">
        <img id="photo-zoom-img" alt="Zoomed journal page" />
      </div>
      <div class="photo-zoom-hint">Tip: wheel to zoom • drag to pan</div>
    `;

    photoZoomBackdrop.appendChild(dialog);
    document.body.appendChild(photoZoomBackdrop);

    photoZoomImgEl = dialog.querySelector("#photo-zoom-img");
    const body = dialog.querySelector("#photo-zoom-body");

    const closeBtn = dialog.querySelector("#photo-zoom-close-x");
    const zoomInBtn = dialog.querySelector("#photo-zoom-in");
    const zoomOutBtn = dialog.querySelector("#photo-zoom-out");
    const resetBtn = dialog.querySelector("#photo-zoom-reset");

    function applyZoom() {
      if (!photoZoomImgEl) return;
      const clamped = Math.max(0.2, Math.min(6, photoZoomScale));
      photoZoomScale = clamped;
      photoZoomImgEl.style.transform = `translate(${photoZoomOffsetX}px, ${photoZoomOffsetY}px) scale(${clamped})`;
    }

    // Single source of truth for applying transform (used by open/fit logic)
    photoZoomApply = applyZoom;


    function zoomBy(delta) {
      photoZoomScale = photoZoomScale + delta;
      applyZoom();
    }

    function resetZoom() {
      // Reset returns to the initial "fit-to-view" state (not 1:1).
      photoZoomScale = photoZoomFitScale || 1;
      photoZoomOffsetX = 0;
      photoZoomOffsetY = 0;
      applyZoom();
    }

    if (zoomInBtn) zoomInBtn.addEventListener("click", () => zoomBy(0.25));
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => zoomBy(-0.25));
    if (resetBtn) resetBtn.addEventListener("click", () => resetZoom());

    if (closeBtn) closeBtn.addEventListener("click", () => closePhotoZoom());

    // Click outside closes
    photoZoomBackdrop.addEventListener("click", (evt) => {
      if (evt.target === photoZoomBackdrop) closePhotoZoom();
    });

    // Escape closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isPhotoZoomOpen()) {
        closePhotoZoom();
      }
    });

    
    // Wheel zoom + drag pan (simple, deliberate)
    if (body) {
      // Zoom with wheel (no modifier keys)
      body.addEventListener(
        "wheel",
        (evt) => {
          evt.preventDefault();

          // Smooth zoom factor
          const zoomFactor = evt.deltaY < 0 ? 1.08 : 0.92;
          photoZoomScale = photoZoomScale * zoomFactor;
          applyZoom();
        },
        { passive: false }
      );

      // Drag to pan (left mouse hold)
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let startOffsetX = 0;
      let startOffsetY = 0;

      function onMove(moveEvt) {
        if (!isDragging) return;
        const dx = moveEvt.clientX - startX;
        const dy = moveEvt.clientY - startY;
        photoZoomOffsetX = startOffsetX + dx;
        photoZoomOffsetY = startOffsetY + dy;
        applyZoom();
      }

      function onUp() {
        if (!isDragging) return;
        isDragging = false;
        body.classList.remove("is-panning");
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }

      body.addEventListener("mousedown", (evt) => {
        // Only left-click drag
        if (evt.button !== 0) return;
        // Don't start a drag from the header buttons
        if (evt.target && evt.target.closest && evt.target.closest(".photo-zoom-controls")) return;

        evt.preventDefault();
        isDragging = true;
        startX = evt.clientX;
        startY = evt.clientY;
        startOffsetX = photoZoomOffsetX;
        startOffsetY = photoZoomOffsetY;
        body.classList.add("is-panning");

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
      });

      // Double-click to reset zoom + pan (safe, deliberate)
      body.addEventListener("dblclick", (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        resetZoom();
      });
    }
    // Expose reset for open
    dialog._resetZoom = resetZoom;
  }

  function isPhotoZoomOpen() {
    return !!photoZoomBackdrop && !photoZoomBackdrop.classList.contains("hidden");
  }

  function openPhotoZoomWithSrc(src) {
    if (!src) return;
    ensurePhotoZoomModal();
    if (!photoZoomBackdrop || !photoZoomImgEl) return;

    const body = document.getElementById("photo-zoom-body");

    // Set image src first (may load async). We'll fit-to-view once we know natural size.
    photoZoomImgEl.src = src;

    // Always reset pan.
    photoZoomOffsetX = 0;
    photoZoomOffsetY = 0;

    // Default scale starts at 1, but we'll immediately fit it down if needed.
    photoZoomScale = 1;

    photoZoomImgEl.style.transformOrigin = "top left";

    // Lock background scroll (calm, no surprises) and show overlay
    document.body.classList.add("no-scroll");
    showEl(photoZoomBackdrop);

    function fitToViewIfPossible() {
      if (!body || !photoZoomImgEl) return;

      const bw = body.clientWidth;
      const bh = body.clientHeight;
      const iw = photoZoomImgEl.naturalWidth;
      const ih = photoZoomImgEl.naturalHeight;

      if (!bw || !bh || !iw || !ih) return;

      // Fit entire image in the available area (never upscale above 1).
      const fitScale = Math.min(bw / iw, bh / ih, 1);

      photoZoomScale = fitScale;

      photoZoomFitScale = fitScale;
      photoZoomScale = fitScale;
      photoZoomOffsetX = 0;
      photoZoomOffsetY = 0;

      if (photoZoomApply) photoZoomApply();
    }

    // If the image is already cached/loaded, fit immediately.
    if (photoZoomImgEl.complete) {
      fitToViewIfPossible();
    } else {
      photoZoomImgEl.onload = () => {
        fitToViewIfPossible();
      };
    }

    // Apply at least one transform immediately (safe default).
    if (photoZoomApply) photoZoomApply();
}

  function closePhotoZoom() {
    if (!photoZoomBackdrop) return;
    hideEl(photoZoomBackdrop);
    document.body.classList.remove("no-scroll");
  }

  function ensurePhotoZoomWiring() {
    // Intentionally disabled.
    // Zoom is only triggered via the magnify (🔍) button.
  }
// ============================================
  // CRUD: New / Save / Delete / Navigation
  // ============================================

  function newEntry() {
    const fresh = ensureEntryShape({
      date: formatDateForInput(new Date()),
      title: "",
      body: "",
      imageData: null,
      tags: []
    });

    entries.push(fresh);
    currentEntryId = fresh.id;
    calendarSelectedIso = fresh.date;
    renderEditor(fresh);

    // New entry starts 'dirty' so the user can commit with Save.
    setCurrentEntrySnapshotFromEntry(fresh);
    clearNonTextDirty();
    setEditorDirty(true);

    updateNavButtons();
    renderCalendar();
    currentDayIso = null;
    currentDayEntries = [];
    renderDayResults();
    showJournalView();
    updateStatus("New entry created");
  }
  function saveCurrentEntry() {
    const entry = getCurrentEntryObject();
    if (!entry) return;

    const dateInput = document.getElementById("entry-date");
    const titleInput = document.getElementById("entry-title");
    const bodyInput = document.getElementById("entry-body");

    if (dateInput) entry.date = dateInput.value || entry.date;
    if (titleInput) entry.title = titleInput.value || "";
    if (bodyInput) entry.body = bodyInput.value || "";

    entry.tags = [...currentTags];
    entry.updatedAt = new Date().toISOString();

    // Keep calendar highlight aligned to the entry the user just saved.
    if (entry.date) calendarSelectedIso = entry.date;

    journalService.saveAll(entries);
    updateNavButtons();
    renderCalendar();
    flashSaveButton();
    updateStatus("Entry saved");

    // Update snapshot so Save becomes disabled again until the next change.
    setCurrentEntrySnapshotFromEntry(entry);
    setEditorDirty(false);
    clearNonTextDirty();

    // If search is visible, day-results stays hidden (no stacking).
    // Otherwise, day-results should follow the saved entry's date.
    if (!isSearchVisible()) {
      const sorted = getChronologicallySortedEntries();
      const iso = entry.date || null;

      if (iso) {
        const sameDay = sorted.filter(e => e.date === iso);
        if (sameDay.length > 1) {
          currentDayIso = iso;
          currentDayEntries = sameDay;
        } else {
          currentDayIso = null;
          currentDayEntries = [];
        }
      } else {
        currentDayIso = null;
        currentDayEntries = [];
      }

      renderDayResults();
    }
  }


function deleteCurrentEntry() {
    if (!currentEntryId) return;
    const idx = entries.findIndex(e => e.id === currentEntryId);
    if (idx === -1) return;

    entries.splice(idx, 1);
    journalService.saveAll(entries);

    const sorted = getChronologicallySortedEntries();
    if (sorted.length === 0) {
      currentEntryId = null;
      editorInnerEl.innerHTML = "";
      updateNavButtons();
      renderCalendar();
      currentDayIso = null;
      currentDayEntries = [];
      renderDayResults();
      updateStatus("Entry deleted");
      return;
    }

    const newIdx = Math.min(idx, sorted.length - 1);
    currentEntryId = sorted[newIdx].id;
    renderEditor(sorted[newIdx]);
    updateNavButtons();
    renderCalendar();
    updateStatus("Entry deleted");
  }

  function goToEntryAtIndex(idx) {
    const sorted = getChronologicallySortedEntries();
    if (idx < 0 || idx >= sorted.length) return;

    const target = sorted[idx];
    currentEntryId = target.id;
    calendarSelectedIso = target.date || calendarSelectedIso;
    renderEditor(target);
    // Opening an existing entry resets dirty state.
    setCurrentEntrySnapshotFromEntry(target);
    setEditorDirty(false);
    clearNonTextDirty();

    updateNavButtons();
    renderCalendar();

    // Sync day-results *only if* search is not visible
    if (!isSearchVisible()) {
      const sameDay = sorted.filter(e => e.date === target.date);
      if (sameDay.length > 1) {
        currentDayIso = target.date;
        currentDayEntries = sameDay;
      } else {
        currentDayIso = null;
        currentDayEntries = [];
      }
      renderDayResults();
    } else {
      currentDayIso = null;
      currentDayEntries = [];
      renderDayResults();
    }
  }

  function goToPreviousEntry() {
    const sorted = getChronologicallySortedEntries();
    if (!currentEntryId) return;
    const idx = sorted.findIndex(e => e.id === currentEntryId);
    if (idx <= 0) return;
    goToEntryAtIndex(idx - 1);
  }

  function goToNextEntry() {
    const sorted = getChronologicallySortedEntries();
    if (!currentEntryId) return;
    const idx = sorted.findIndex(e => e.id === currentEntryId);
    if (idx === -1 || idx >= sorted.length - 1) return;
    goToEntryAtIndex(idx + 1);
  }

  function openEntryById(entryId) {
    const sorted = getChronologicallySortedEntries();
    const idx = sorted.findIndex(e => e.id === entryId);
    if (idx === -1) return;
    showJournalView();
    goToEntryAtIndex(idx);
  }

  function openEntryFromSearch(entryId) {
    // Mark that the user has clicked a result during this search session.
    searchPickedEntryId = entryId;
    const sorted = getChronologicallySortedEntries();
    const idx = sorted.findIndex(e => e.id === entryId);
    if (idx === -1) return;
    showSearchWithEditorView();
    goToEntryAtIndex(idx); // internal logic will suppress day-results if search is visible
  }

  // ============================================
  // Search
  // ============================================

  function entryMatchesQuery(entry, qLower) {
    const fields = [
      entry.title || "",
      entry.body || "",
      ...(Array.isArray(entry.tags)
        ? entry.tags.map(t => t.text || "")
        : [])
    ]
      .join(" ")
      .toLowerCase();

    return fields.includes(qLower);
  }

  function runSearch(query) {
    const q = (query || "").trim();

    // Remember what entry the user was on when search opened.
    // If they pick a result, we keep the picked entry on close.
    if (!searchOpenedFromEntryId) {
      searchOpenedFromEntryId = currentEntryId || null;
    }
    searchPickedEntryId = null;

    // Search should always clear day-results so it doesn't stack under the card
    currentDayIso = null;
    currentDayEntries = [];
    renderDayResults();

    if (!q) {
      // MED-lite Step 2: Search results rendering must flow through renderSearchResults()
      renderSearchResults([], { state: "emptyQuery" });
      showSearchOnlyView();
      updateStatus("Search cleared");
      return;
    }

    const qLower = q.toLowerCase();
    const results = entries.filter(e => entryMatchesQuery(e, qLower));
    results.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

    renderSearchResults(results, { state: "results", query: q });
    showSearchOnlyView();
    updateStatus(`Found ${results.length} result${results.length === 1 ? "" : "s"}`);
  }

  function renderSearchResults(results, opts = {}) {
    if (!searchResultsEl) return;
    searchResultsEl.innerHTML = "";

    // MED-lite Step 2: ALL search card contents (empty state + results list) render here.
    if (opts.state === "emptyQuery") {
      const msg = document.createElement("div");
      msg.className = "search-result-snippet";
      msg.textContent = "Type in the search box and press Enter to search.";
      searchResultsEl.appendChild(msg);
      return;
    }

    if (!results || results.length === 0) {
      const msg = document.createElement("div");
      msg.className = "search-result-snippet";
      msg.textContent = "No results. Try a different query.";
      searchResultsEl.appendChild(msg);
      return;
    }

    results.forEach(entry => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      item.dataset.entryId = entry.id;

      const titleEl = document.createElement("div");
      titleEl.className = "search-result-title";
      titleEl.textContent = entry.title || "(Untitled entry)";

      const snippetEl = document.createElement("div");
      snippetEl.className = "search-result-snippet";

      const dateStr = entry.date || "";
      const bodySnippet = (entry.body || "").replace(/\s+/g, " ").slice(0, 120);
      const tagsText = Array.isArray(entry.tags)
        ? entry.tags.map(t => t.text).filter(Boolean).join(", ")
        : "";

      const parts = [];
      if (dateStr) parts.push(dateStr);
      if (bodySnippet) parts.push(bodySnippet + (entry.body && entry.body.length > 120 ? "…" : ""));
      if (tagsText) parts.push(`Tags: ${tagsText}`);

      snippetEl.textContent = parts.join("  •  ");

      item.appendChild(titleEl);
      item.appendChild(snippetEl);

      item.addEventListener("click", () => {
        openEntryFromSearch(entry.id);
      });

      searchResultsEl.appendChild(item);
    });
  }

  // ============================================
  // Calendar + Day Results
  // ============================================

  function initCalendarState() {
    const now = new Date();
    calendarCurrentYear = now.getFullYear();
    calendarCurrentMonth = now.getMonth();
  }

  function renderCalendar() {
    if (!calendarGrid || !calendarMonthLabel) return;

    if (calendarCurrentYear === null || calendarCurrentMonth === null) {
      initCalendarState();
    }

    const year = calendarCurrentYear;
    const month = calendarCurrentMonth;

    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    calendarMonthLabel.textContent = `${monthNames[month]} ${year}`;
    calendarGrid.innerHTML = "";

    const weekdayLabels = ["Su","Mo","Tu","We","Th","Fr","Sa"];
    weekdayLabels.forEach(label => {
      const wd = document.createElement("div");
      wd.className = "calendar-weekday";
      wd.textContent = label;
      calendarGrid.appendChild(wd);
    });

    const firstOfMonth = new Date(year, month, 1);
    const startDay = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < startDay; i++) {
      const empty = document.createElement("div");
      empty.className = "calendar-empty";
      calendarGrid.appendChild(empty);
    }

    const todayIso = formatDateForInput(new Date());
    const sorted = getChronologicallySortedEntries();
    const currentEntry = getCurrentEntryObject();
    // Highlight the last calendar-selected day when available; otherwise fall back to current entry date.
    const selectedDateIso = calendarSelectedIso || currentEntry?.date || null;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const iso = formatDateForInput(dateObj);

      const hasEntry = sorted.some(e => e.date === iso);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-day";
      btn.textContent = String(day);

      if (hasEntry) {
        const dot = document.createElement("div");
        dot.className = "entry-dot";
        btn.appendChild(dot);
      }

      if (iso === todayIso) {
        btn.classList.add("today");
      }

      if (selectedDateIso && iso === selectedDateIso) {
        btn.classList.add("selected");
      }

      btn.addEventListener("click", () => {
        handleCalendarDayClick(iso);
      });

      calendarGrid.appendChild(btn);
    }
  }

  function changeCalendarMonth(delta) {
    if (calendarCurrentYear === null || calendarCurrentMonth === null) {
      initCalendarState();
    }
    calendarCurrentMonth += delta;
    if (calendarCurrentMonth < 0) {
      calendarCurrentMonth = 11;
      calendarCurrentYear -= 1;
    } else if (calendarCurrentMonth > 11) {
      calendarCurrentMonth = 0;
      calendarCurrentYear += 1;
    }
    renderCalendar();
  }

  function renderDayResults() {
    if (!dayResultsEl) return;

    dayResultsEl.innerHTML = "";
    if (!currentDayIso || !currentDayEntries || currentDayEntries.length === 0) {
      hideEl(dayResultsEl);
      return;
    }

    showEl(dayResultsEl);

    const card = document.createElement("div");
    card.className = "day-results-card";

    const titleEl = document.createElement("div");
    titleEl.className = "day-results-title";
    titleEl.textContent = `Entries on ${currentDayIso}`;

    const listEl = document.createElement("div");
    listEl.className = "day-results-list";

    currentDayEntries.forEach(entry => {
      const item = document.createElement("div");
      item.className = "day-result-item";
      item.dataset.entryId = entry.id;

      const title = document.createElement("div");
      title.className = "day-result-title";
      title.textContent = entry.title || "(Untitled entry)";

      const meta = document.createElement("div");
      meta.className = "day-result-meta";

      const tagsText = Array.isArray(entry.tags)
        ? entry.tags.map(t => t.text).filter(Boolean).join(", ")
        : "";

      meta.textContent = [
        entry.date || "",
        tagsText ? `Tags: ${tagsText}` : ""
      ].filter(Boolean).join("  •  ");

      item.appendChild(title);
      if (meta.textContent) item.appendChild(meta);

      item.addEventListener("click", () => {
        openEntryById(entry.id);
      });

      listEl.appendChild(item);
    });

    card.appendChild(titleEl);
    card.appendChild(listEl);
    dayResultsEl.appendChild(card);
  }

  function handleCalendarDayClick(isoDate) {
    const sorted = getChronologicallySortedEntries();
    const sameDayEntries = sorted.filter(e => e.date === isoDate);

    // Track calendar selection independently of whether we show a day-results card.
    calendarSelectedIso = isoDate;

    // Calendar selection should exit search mode
    showJournalView();

    if (sameDayEntries.length === 0) {
      currentDayIso = null;
      currentDayEntries = [];
      renderDayResults();
      renderCalendar();
      return;
    }

    // Only show the day-results card for multi-entry days (consistent with prev/next behavior)
    if (sameDayEntries.length > 1) {
      currentDayIso = isoDate;
      currentDayEntries = sameDayEntries;
    } else {
      currentDayIso = null;
      currentDayEntries = [];
    }
    renderDayResults();

    // Open the first entry for the day (the day-results card lets the user pick others if multiple exist)
    openEntryById(sameDayEntries[0].id);

    // Ensure the calendar highlight stays in sync after navigation
    renderCalendar();
  }

  // ============================================
  // Export
  // ============================================

  function exportEntries() {
    const json = journalService.exportAll(entries);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "journal_entries.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    updateStatus("Exported entries as JSON");
  }

  // ============================================
  // Init
  // ============================================

  async function init() {
    entries = journalService.loadAll();
    await migrateImagesToIndexedDBIfNeeded(entries);
    setupTagDialog();

    // Single-source-of-truth version stamp
    applyAppVersionToUI();

    // Initialize status bar empty.
    updateStatus("");

    if (entries.length === 0) {
      newEntry();
    } else {
      const sorted = getChronologicallySortedEntries();
      const mostRecent = sorted[sorted.length - 1];
      currentEntryId = mostRecent.id;
      calendarSelectedIso = mostRecent.date || null;
      renderEditor(mostRecent);
      setCurrentEntrySnapshotFromEntry(mostRecent);
      setEditorDirty(false);
      clearNonTextDirty();
      updateNavButtons();
      renderCalendar();
    }

    renderDayResults();

    // Button wiring
    if (newEntryBtn) {
      newEntryBtn.addEventListener("click", () => {
        newEntry();
      });
    }

    if (newTagBtn) {
      newTagBtn.addEventListener("click", () => {
        createNewTagAtCenter();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", saveCurrentEntry);
    }

    if (deleteBtnTop) {
      deleteBtnTop.addEventListener("click", openDeleteConfirm);
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", goToPreviousEntry);
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", goToNextEntry);
    }

    if (exportBtn) {
      exportBtn.addEventListener("click", exportEntries);
    }

    // Search events
    if (searchInput) {
      searchInput.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter") {
          const value = searchInput.value || "";
          // auto-clear field after executing
          searchInput.value = "";
          runSearch(value);
        }
      });
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        runSearch("");
      });
    }


    if (searchCloseBtn) {
      searchCloseBtn.addEventListener("click", () => {
        closeSearchResults();
      });
    }

    // Calendar nav
    if (calendarPrevBtn) {
      calendarPrevBtn.addEventListener("click", () => changeCalendarMonth(-1));
    }
    if (calendarNextBtn) {
      calendarNextBtn.addEventListener("click", () => changeCalendarMonth(1));
    }
  }

  init();
});
