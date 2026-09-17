# Beacontra UI redesign

ASTRA · T-034 · 2026-09-18

## Current weaknesses
Actual running homepage returned 500; original HTML inspected in Chromium separately. Dark gradient form, tiny low-contrast copy, all fields equally weighted, repetitive oversized result cards. Full findings: ASTRA_UI_AUDIT.md.

## Top 5 visual issues
1. No recognizable visual identity beyond a blue-gradient wordmark.
2. No product-photo preview on entry.
3. No queue/detail hierarchy; full cards repeated indefinitely.
4. Green “confirmed” treatment for missing evidence.
5. Dense inputs and truncated titles obscure the product variant.

## Top 5 UX issues
1. Homepage 500 prevents the demo.
2. False positive “Photo Match Confirmed” wording.
3. No clickable source trail or focused comparison.
4. No field associations/cross-field price validation; errors lose context.
5. No meaningful waiting, no-results, or partial-evidence coverage state.

## Top 3 demo risks
1. Broken serving route.
2. Weak/unavailable evidence presented as confirmation.
3. Long blocking scan with no progress events; sample MRP/authorized-seller assumptions are unverified.

## Redesign plan
Warm paper and forest-teal evidence desk. Clear product promise beside focused input card. Honest URL preview (upload contract is pending T-035). Compact queue with selected evidence pane, equal photo frames, independent price/source/visual observations, expandable linked records, native comparison dialog. Computed summary counts, explicit provenance, indeterminate workflow loading, recoverable errors. Local CSS/JS with zero frontend dependencies. Verify actual Worker and six viewport widths before commit.
