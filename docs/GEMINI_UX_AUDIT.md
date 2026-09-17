# Gemini UX Audit

**STATUS: AUDIT COMPLETE - ISSUES FOUND**

This document evaluates the `BrandLens` frontend (`public/index.html`) as a first-time user and hackathon judge.

## P0 - Demo/Product Breaking

- **PROBLEM:** No visual proof of counterfeiting is rendered in the UI. The results only display text (title, seller, price, and a text badge for "Google Lens Visual Matches").
- **USER IMPACT:** The core value proposition of BrandLens is *visual* verification. If the user cannot *see* the offending image next to their official image, the product feels like a generic text dashboard and will fail the "Anti-Wrapper" test during the live pitch.
- **FILE/SCREEN:** `public/index.html` (renderResults function)
- **RECOMMENDED FIX:** Ensure the API returns the thumbnail URL of the suspect listing. The UI MUST display the offending thumbnail alongside the official product image for an immediate visual "gotcha" moment.
- **ACCEPTANCE CRITERIA:**
  - Suspect listing thumbnail is visible in the result card.

## P1 - Weakens Quality

- **PROBLEM:** "Official Product Image URL" input is friction-heavy. 
- **USER IMPACT:** Forcing a user (or the demo presenter) to find and paste a raw image URL breaks flow.
- **FILE/SCREEN:** `public/index.html` (Scan Form)
- **RECOMMENDED FIX:** For a hackathon, pasting a URL is acceptable ONLY IF you pre-fill it with a highly recognizable example, or add a "Load Demo Example" button so the presenter doesn't fumble with URLs on stage.
- **ACCEPTANCE CRITERIA:**
  - Add a "Load Demo Data" button that populates all fields with a perfect, testable example.

## P2 - Polish

- **PROBLEM:** The "Score" is displayed as a raw number (e.g., `Score: 85`).
- **USER IMPACT:** The user doesn't know if the score is out of 100, 10, or what it specifically represents.
- **FILE/SCREEN:** `public/index.html` (renderResults function)
- **RECOMMENDED FIX:** Add context to the score, e.g., `Confidence Score: 85/100` or use a visual progress bar.
- **ACCEPTANCE CRITERIA:**
  - Score presentation includes its denominator or a visual indicator.
