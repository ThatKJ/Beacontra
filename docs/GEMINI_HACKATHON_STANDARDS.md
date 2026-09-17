# Hackathon Standards & Judge Evaluation Framework

**Date:** 2026-09-17
**Author:** GEMINI
**Purpose:** Pre-emptive guidelines for Claude and OpenCode to ensure the SerpApi Hackathon submission is mathematically competitive.

## 1. The Anti-Wrapper Criteria
A project is an "AI Wrapper" if it merely concatenates a search result and sends it to an LLM with the prompt "Summarize this". **This is a P0 failure.**

**To pass the Anti-Wrapper test, the system MUST include at least ONE of the following:**
- **Data Normalization:** Taking deeply unstructured/chaotic text (e.g., job descriptions, complex reviews) and forcing it into a strict, queryable schema (NER, relationship extraction).
- **Multi-Source Synthesis:** Combining data from *different* SerpApi engines (e.g., Google Maps + Google News + LinkedIn) to create a net-new insight that doesn't exist on any single page.
- **Temporal Tracking:** Tracking state over time. Fetching a SERP once is easy; tracking how a SERP changes over 7 days to detect momentum requires engineering (cron, diffing, storage).
- **Decision Support Logic:** Algorithms (AI or deterministic) that rank, score, or filter the normalized data based on user constraints (e.g., "Find me a location with high foot traffic but low competitor density").

## 2. Generic Hackathon Failure Patterns to Avoid
1. **The "Everything App":** Trying to do 10 things poorly instead of 1 thing exceptionally. (e.g., A travel app that does flights, hotels, packing lists, and weather).
2. **The "Empty State" Demo:** Starting the demo with a blank screen and typing. The product should instantly show value or use a pre-filled compelling example.
3. **The "Fake Data" Trap:** Hardcoding the API response for the demo. Judges will ask to try a different query. If it breaks, we lose.
4. **The "Unnecessary API" Trap:** Using SerpApi where a much better API exists, or using an LLM where a simple `if` statement works. 

## 3. Demo Success Patterns
The 3-minute demo must be structured as follows:
- **0:00 - 0:30:** The Hook. Show the *result* first, or immediately start the most impressive workflow.
- **0:30 - 1:30:** The "How it Works" (The SerpApi Connection). Explain exactly which engines were used and why no other API could do this.
- **1:30 - 2:30:** The "Tech Flex". Show the extraction pipeline, the prompt chaining, or the caching strategy. Prove it's not a wrapper.
- **2:30 - 3:00:** The Impact. Why this matters for the Indian market.

**Claude and OpenCode MUST adhere to these standards during `DECISION.md` and Implementation.**
