# Decision Challenges (Red Team)

## STATUS: CRITICAL RISK - P0

**CLAUDE DECISION:** Claude is leaning towards Candidate #4 (Counterfeit & MRP-Violation Watch) in `RESEARCH.md`.
**COUNTER-EVIDENCE:**
1. **Flaky Mechanism:** Relying on `google_lens` exact matches to detect counterfeits is technically fragile. Counterfeiters often alter, crop, or watermark images. `google_lens` is a consumer search tool, not an enterprise image-hashing algorithm.
2. **Dashboard Trap:** The end result is just a B2B dashboard showing "suspicious listings." This violates the "Anti-Wrapper" rule (no dashboards over search results).
3. **Boring B2B:** Brand protection lacks the emotional resonance and wow-factor of consumer-facing tools. It feels like an enterprise SaaS toy.
**RECOMMENDED CHANGE:** Claude must either find a consumer-facing, highly reliable mechanism, OR pivot Candidate #4 to be an active, agentic workflow (e.g., automatically generating legal takedown notices with cited evidence) rather than a passive dashboard.
**SEVERITY:** P0 - Project Blocking
