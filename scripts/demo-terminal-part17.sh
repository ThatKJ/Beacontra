#!/usr/bin/env bash
cd /Users/kirtan/Hackathons/Serp
clear

echo -e "\033[1;36m===============================================================\033[0m"
echo -e "\033[1;36m           PART 17 & 18: SECURITY CONTROLS & API BUDGETING      \033[0m"
echo -e "\033[1;36m===============================================================\033[0m"
echo ""

echo -e "\033[1;33m[1] SSRF & Private IP Protection (src/lib/security.ts):\033[0m"
sed -n '15,45p' src/lib/security.ts
sleep 4

echo ""
echo -e "\033[1;33m[2] Chrome Extension Manifest (extension/manifest.json) — No API Keys:\033[0m"
cat extension/manifest.json
sleep 4

echo ""
echo -e "\033[1;33m[3] Strict Credit Caps & Bounded Reverse-Image Calls:\033[0m"
grep -n -C 2 "MAX_LENS_CALLS" src/lib/beacontra.ts
sleep 3
grep -n -C 2 "maxCreditsCap" src/lib/market-radar.ts
sleep 4
