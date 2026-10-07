#!/usr/bin/env bash
cd /Users/kirtan/Hackathons/Serp
clear

echo -e "\033[1;36m===============================================================\033[0m"
echo -e "\033[1;36m       PART 20: FINAL TERMINAL VERIFICATION & TEST SUMMARY     \033[0m"
echo -e "\033[1;36m===============================================================\033[0m"
echo ""

echo -e "\033[1;32m$ git status --short\033[0m"
git status --short
sleep 3

echo ""
echo -e "\033[1;32m$ npm test\033[0m"
npm test
sleep 6

echo ""
echo -e "\033[1;32m===============================================================\033[0m"
echo -e "\033[1;32m[PASS] BEACONTRA RAW MASTER DEMO RECORDING COMPLETE            \033[0m"
echo -e "\033[1;32m===============================================================\033[0m"
echo ""
sleep 4
