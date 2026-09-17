# Tagline Candidates — Beacontra

**Process:** CLAUDE generates 5 candidates with a preliminary self-critique (so Gemini's red-team has a documented baseline to argue with, not a blank slate); GEMINI red-teams for overclaim/genericness/clarity/memorability; CLAUDE selects one, consistently applied across UI/README/DEMO/SUBMISSION/JUDGE_QA afterward.

**Constraint carried from every naming/language decision this session:** must not imply a verdict ("counterfeit," "fraud," "fake") — only that something is worth a human's review.

---

## Candidates

**1. "Know which listings deserve a second look."**
- Self-critique: **Overclaim** — none, "deserve a second look" is explicitly review-framed, not accusatory. **Genericness** — moderate; "second look" is a common phrase, could belong to almost any anomaly-detection tool. **Clarity** — high, immediately understandable without context. **Memorability** — medium.

**2. "Live marketplace evidence, reviewed at a glance."**
- Self-critique: **Overclaim** — none. **Genericness** — highest risk of the five; "evidence at a glance" reads like stock SaaS-dashboard copy and doesn't name what makes this different. **Clarity** — high. **Memorability** — low — the weakest candidate, kept for completeness/contrast rather than as a real contender.

**3. "Where price, seller, and photo evidence meet."**
- Self-critique: **Overclaim** — none; if anything, this one is almost too literal/modest. **Genericness** — low, precisely because it names the three actual signals shown on screen — nobody else's tagline would describe *this specific* combination. **Clarity** — high, and it doubles as an accurate one-line technical description, useful for demo narration too. **Memorability** — medium; the "meet" ending is a little soft.

**4. "Signals worth reviewing, not accusations to make."**
- Self-critique: **Overclaim** — none; this is the candidate that states the core design philosophy most directly. **Genericness** — low, the explicit contrast ("not accusations") is distinctive and on-brand for this specific product's history. **Clarity** — high. **Memorability** — medium-high, but it's the longest of the five and reads slightly more like a mission statement than a tagline — a real trade-off to weigh.

**5. "See what's really being sold under your name."**
- Self-critique: **Overclaim** — borderline; "what's really being sold" edges toward implying a definitive finding, worth Gemini specifically checking whether this crosses the line the rest of this project has been careful about. **Genericness** — low, "under your name" is specific to the brand-impersonation angle and reads as the most brand-owner-specific of the five. **Clarity** — high. **Memorability** — highest of the five — punchiest, most likely to be remembered after a 3-minute demo.

---

## CLAUDE's preliminary lean (subject to Gemini's red-team, not final)

**#3 ("Where price, seller, and photo evidence meet")** and **#5 ("See what's really being sold under your name")** are the two real contenders. #3 is the safer, more defensible choice — zero overclaim risk, doubles as an accurate technical description. #5 is punchier and more memorable but should get the closest look for whether "what's really being sold" overclaims relative to what three heuristic signals can actually establish — the exact failure mode this project has repeatedly caught and corrected elsewhere (`docs/COMPETITIVE_ADJUDICATION.md`, T-030's price-language finding). Handing to Gemini rather than deciding this alone, since #5's borderline case is exactly the kind of thing an independent read is most useful for.
