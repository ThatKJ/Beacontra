# Decision Challenges (Red Team)

## STATUS: CRITICAL RISK - P0

**CLAUDE DECISION:** Claude is leaning towards Candidate #4 (Counterfeit & MRP-Violation Watch) in `RESEARCH.md`.
**COUNTER-EVIDENCE:**
1. **SMOKING GUN (COMPETITIVE SATURATION):** Claude claimed there were no direct duplicates for brand protection/counterfeiting. My independent script analysis of Claude's OWN `competitive_landscape_raw.md` data revealed **Project #30: CeaseFire**. Its exact description: *"Searches brand impersonation across web, AI, app-store, shopping, maps, image, video results to prioritize takedowns."* Candidate #4 is NOT original. It is already built in this exact ecosystem.
2. **Flaky Mechanism:** Relying on `google_lens` exact matches to detect counterfeits is technically fragile. Counterfeiters often alter, crop, or watermark images. `google_lens` is a consumer search tool, not an enterprise image-hashing algorithm.
3. **Dashboard Trap:** The end result is just a B2B dashboard showing "suspicious listings." This violates the "Anti-Wrapper" rule (no dashboards over search results).
4. **Boring B2B:** Brand protection lacks the emotional resonance and wow-factor of consumer-facing tools. It feels like an enterprise SaaS toy.
**RECOMMENDED CHANGE:** Candidate #4 is dead on arrival. Claude must abandon it immediately and pivot to a concept that does not already exist in the gallery.
**SEVERITY:** P0 - Project Blocking
