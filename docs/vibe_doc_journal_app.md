v1.0 12.13.2025

---

# **vibe_doc_journal_app.md**

## Journal App — Vibe & Design Constitution

*“An operating system for thinking.”*

---

## **1. Purpose of This Document**

This document defines the **non-negotiable vibe** of the Journal App.

It exists to:

* Preserve clarity, calm, and intentionality
* Prevent UI drift as features are added
* Keep the app feeling *designed*, not assembled
* Align code structure with mental ergonomics
* Act as a shared reference for all future work

Every design, UI, UX, and code decision is validated against this document.

---

## **2. Core Vibe Statement**

The Journal App is:

* Calm
* Minimal
* Thought-supportive
* Predictable
* Quietly powerful

It should feel like:

* A **trusted personal tool**
* A **workspace for reflection**
* A **mental companion**, not an app demanding attention

Nothing flashy. Nothing noisy. Nothing clever at the expense of clarity.

---

## **3. Mental Model Philosophy**

This app supports **thinking first**, features second.

Key principles:

* The user is already doing cognitive work — the UI must *reduce* load, not add to it
* The interface should disappear once the user begins writing
* The app must respect spatial memory (things stay where the user expects)
* Transitions must be calm, predictable, and reversible

If a feature interrupts the thinking flow, it is wrong — even if it works.

---

## **4. Visual & Layout Vibe**

### **4.1 Layout**

* Downward flow is sacred
* One primary column of focus
* Secondary information (search results, day results) sits *above* the journal entry, never competing with it
* No jumping, collapsing, or reflowing without intent

### **4.2 Cards**

Cards are:

* Calm containers
* Softly elevated
* Clearly separated
* Never nested unnecessarily

All major UI elements feel like they belong to the same family.

### **4.3 Spacing**

* Generous whitespace
* Breathing room between concepts
* Tight spacing signals urgency — avoid it

Whitespace is not emptiness; it is *thinking space*.

---

## **5. Interaction & Behavior Vibe**

### **5.1 Predictability Over Cleverness**

* Buttons do what they say
* Navigation never surprises
* Results stay visible when context matters
* Closing actions always feel safe and reversible

### **5.2 Calm Interactions**

* No aggressive colors
* No jarring animations
* No modal spam
* Escape and “X” always mean *cancel and return*

### **5.3 Respect the User’s Mental Map**

* Search results remain anchored when navigating entries
* Day entry lists behave like search results
* Closing a card returns the user to where they *were*, not somewhere new

---

## **6. Emotional Tone**

The app should feel:

* Supportive
* Neutral
* Grounded
* Non-judgmental

This is not a productivity app yelling for output.
This is a **thinking space**.

---

## **7. Code Vibe (Equally Important)**

The codebase must feel like the UI feels.

That means:

* Readable
* Predictable
* Boring in a good way
* Easy to reason about after time away

If the code feels chaotic, the app *will* feel chaotic.

---

## **8. Vibe Validation (Always On)**

All work is continuously validated against this document.

Vibe validation applies to:

* UI changes
* CSS changes
* Component placement
* Interaction changes
* Refactors
* New features
* Performance optimizations that affect behavior

### **Vibe Check Callouts**

Responses may include a short section like:

**Vibe Check**

* ✅ Preserves downward flow
* ⚠️ Spacing is tight — consider +1rem
* ❌ This introduces visual competition with the journal entry
* ✅ Code changes align with MED rules and mental model

---

## **9. Handling Vibe Conflicts**

If a request conflicts with the vibe:

* The conflict is explicitly stated
* The reason is explained
* A vibe-aligned alternative is proposed

The user always decides — but drift is never silent.

---

## **10. Relationship to MED Rules**

The **MED Rules** are the *mechanical enforcement layer* of this vibe.

* MED protects structure
* Vibe protects feel
* Together they prevent entropy

If MED and Vibe ever appear in conflict:

* Raise it
* Explain it
* Resolve intentionally

---

## **11. Why This Matters**

This app is not just software.

It is:

* A personal system
* A thinking tool
* A long-term companion

It should always feel like:

> *“Keith built this on purpose.”*

---

## **12. Status**

This document is **active**, **authoritative**, and **living**.

Updates happen intentionally — never accidentally.

---
