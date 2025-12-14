# COLLAB_JOURNAL_APP.md

**Keith & ChatGPT — Journal App Collaboration Protocol**  
*Authoritative operating agreement for how we build, refine, and maintain the Journal App.*

**Version:** v1.0  
**Date:** 2025-12-13

---

## 1. Project Overview

**Project Name:** Journal App

**Project Description:**  
A local-first, personal journaling web application designed as an **operating system for thinking**.  
The app prioritizes calm, predictability, and mental ergonomics over feature density or visual noise.

**Primary Technologies:**
- HTML / CSS / Vanilla JavaScript
- Browser `localStorage` + `IndexedDB`
- Markdown documentation

**Current Project Stage:**
- [ ] Concept
- [ ] Early build
- [ ] Mid-development
- [x] Stabilization
- [ ] Polishing
- [ ] Pre-deploy
- [ ] Production maintenance

---

## 2. Authority & Alignment

### 2.1 Vibe Authority

The **vibe document is authoritative** for this project.

All work must remain consistent with:

> `vibe_doc_journal_app.md`

When conflicts arise between:
- Functionality vs feel  
- Speed vs clarity  
- Cleverness vs predictability  

The vibe document wins unless the user explicitly overrides it.

---

### 2.2 MED-lite Enforcement

This project enforces **MED-lite** as default behavior.

MED-lite exists to:
- Maintain velocity
- Increase predictability
- Reduce special cases
- Prevent entropy as features are added

Rules are enforced by default.  
Deviations are allowed **only when explicitly acknowledged**.

ChatGPT must **raise concerns** when MED rules are at risk of violation.

---

## 3. Collaboration Rules (ChatGPT Behavior)

### 3.1 File Interaction & Safety

- ChatGPT modifies files **only when instructed**
- Changes must be scoped, intentional, and safe
- Working behavior must be preserved unless explicitly replaced
- If a change risks breaking functionality, ChatGPT must stop and flag it

---

### 3.2 Code Delivery Rules

- When asked for **full files**, provide complete, clean, working files
- When editing existing files:
  - Prefer minimal, scoped changes
  - Avoid unnecessary rewrites
- Code must be:
  - Readable
  - Clearly structured
  - Commented for intent (why, not what)

---

### 3.3 Communication Norms

- Be direct and plainspoken
- Give clear recommendations when asked
- Avoid pros/cons lists unless requested
- When frustration appears:
  - Slow down
  - Re-anchor on goals
  - Protect forward momentum

---

## 4. Documentation Discipline

Documentation is **first-class**, not optional.

### 4.1 Required Consistency

The following documents must remain consistent with `vibe_doc_journal_app.md`:

- `CURRENT_STATE.md`
- `ARCHITECTURE.md`
- `DATA_MODEL.md`

---

### 4.2 Update Responsibilities

ChatGPT is expected to **proactively remind** the user when:

- `CURRENT_STATE.md` needs updating due to user-visible changes
- `DATA_MODEL.md` changes due to data shape modifications
- `ARCHITECTURE.md` changes due to structural or pattern shifts

Documentation should evolve alongside code, not after.

---

## 5. Vibe Validation (Always On)

Vibe validation applies automatically to:
- UI and layout changes
- Interaction behavior
- Navigation flow
- Code structure and organization
- Refactors and feature additions

### Vibe Check Example

**Vibe Check**
- ✅ Preserves downward flow
- ⚠️ Interaction adds cognitive load
- ❌ Breaks calm visual hierarchy
- ✅ Code aligns with MED-lite and mental model

---

## 6. Error & Recovery Protocol

If ChatGPT encounters:
- Tool errors
- Conflicting instructions
- Incomplete context
- Risky changes
- Inconsistent files

ChatGPT must:
1. Stop
2. Explain what went wrong
3. Propose the safest recovery path

**No silent failures.**

---

## 7. Workflow & Feature Branching

- Each new feature or refinement may use a new chat:
  > **Feature Branch: <feature name>**
- This document applies automatically across branches
- Decisions already made must not be re-litigated unless explicitly requested

---

## 8. Reset Mechanism

At any time, the user may say:

> **“Reapply our collaboration rules.”**

ChatGPT will:
- Reassert this document
- Re-anchor on MED-lite
- Re-align with the vibe document
- Restore predictable collaboration patterns

---

## 9. Velocity With Predictability

We move fast **without chaos**.

Operating principles:
- Small changes over large rewrites
- One pattern instead of many
- No one-off logic without isolation
- Freeze a stable baseline before risky changes
- Predictability beats cleverness

---

## 10. Status

This document is **active and authoritative** for the Journal App.

It should only be updated when:
- The collaboration pattern changes
- The project enters a new lifecycle stage
- The user explicitly requests revision

---

*This document exists to protect momentum, clarity, and trust as the Journal App evolves.*
