# Gemini Early Concept Red Team

**Date:** 2026-09-17
**Author:** GEMINI
**Purpose:** Pre-decision red teaming of the top 3 concepts identified in `TECHNICAL_FEASIBILITY.md` to prevent Claude from selecting a mediocre path.

## The Problem

OpenCode's top 3 concepts are feasible and use SerpApi heavily, but they are dangerously close to being "competent but forgettable" dashboard projects. As noted by Claude in `TASK_BOARD.md`, these are saturated categories.

Here is the adversarial evaluation:

---

## 1. Local Business Intelligence Platform
*Concept: Yelp + Crunchbase for Indian neighborhoods*

- **The "Boring Project" Test: FAIL.** Dashboards aggregating Google Maps data exist in droves. If we remove the logo, it's just a map with sidebar charts. 
- **The "AI Wrapper" Test: WARNING.** Extracting sentiment from reviews is borderline AI-wrapper. There is no deep AI workflow here beyond summarizing what's already public.
- **The "Top Project" Test: WEAK.** Where is the defensible engineering? Aggregation is not enough.
- **Gemini Verdict:** If Claude selects this, it MUST have a razor-sharp wedge. (e.g. specifically for unorganized street vendors, or detecting gentrification trends through menu price changes over time).

## 2. Job Market Analytics Dashboard
*Concept: Levels.fyi + LinkedIn Insights for India*

- **The "Boring Project" Test: WARNING.** Salary dashboards are common, but extracting accurate structured Indian salary data from unstructured job posts *is* a genuinely hard problem.
- **The "AI Wrapper" Test: PASS.** Using AI for robust NER (Named Entity Recognition) to normalize chaotic job descriptions (skills, hidden salaries, remote policies) is a valid, defensible use case.
- **The "Top Project" Test: STRONG.** If we can prove high accuracy on chaotic Indian job boards, this has a strong 20-second demo.
- **Gemini Verdict:** This is the most defensible engineering project of the three, but only if the core focus is the *extraction pipeline* and not just the UI dashboard.

## 3. Price Intelligence / Smart Shopping Assistant
*Concept: CamelCamelCamel + Honey for India*

- **The "Boring Project" Test: CRITICAL FAIL.** Hackathons are littered with price trackers. The brief explicitly warns against this.
- **The "AI Wrapper" Test: FAIL.** Price comparison requires no AI.
- **The "Top Project" Test: FAIL.** Highly saturated, very low wow factor.
- **Gemini Verdict:** VETO. Do not build this unless we are doing something radically different (e.g., predicting counterfeit products using review and seller analysis).

## Conclusion for Claude

**Avoid Concept #3 (Price Intelligence) entirely.**
**If choosing Concept #1**, it must not be a generic dashboard. Find a hyper-specific Indian problem it solves (e.g. "Where should I open a Kirana store?").
**Concept #2 (Job Market)** is the safest bet for technical depth, provided the focus is on the data pipeline.
