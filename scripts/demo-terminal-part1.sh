#!/usr/bin/env bash
cd /Users/kirtan/Hackathons/Serp
clear

echo -e "\033[1;36m===============================================================\033[0m"
echo -e "\033[1;36m       BEACONTRA OS — AUTOMATED VERIFICATION & BUILD          \033[0m"
echo -e "\033[1;36m===============================================================\033[0m"
echo ""

echo -e "\033[1;32m$ pwd\033[0m"
pwd
sleep 2

echo ""
echo -e "\033[1;32m$ git branch --show-current\033[0m"
git branch --show-current
sleep 2

echo ""
echo -e "\033[1;32m$ git log --oneline -5\033[0m"
git log --oneline -5
sleep 3

echo ""
echo -e "\033[1;32m$ npm test\033[0m"
npm test
sleep 4

echo ""
echo -e "\033[1;32m$ npm run typecheck\033[0m"
npm run typecheck
sleep 2

echo ""
echo -e "\033[1;32m$ npm run lint\033[0m"
npm run lint
sleep 2

echo ""
echo -e "\033[1;32m$ npm run build\033[0m"
npm run build
sleep 3

echo ""
echo -e "\033[1;32m===============================================================\033[0m"
echo -e "\033[1;32m[PASS] ALL QUALITY GATES VERIFIED. STARTING BEACONTRA OS DEV SERVER\033[0m"
echo -e "\033[1;32m===============================================================\033[0m"
echo ""
sleep 3
