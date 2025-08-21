#!/bin/bash

RESET='\033[0m'
BOLD='\033[1m'
RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'

MESSAGE=$(cat $1) 
COMMITFORMAT="^(feat|fix|docs|style|refactor|test|chore|perf|other)(\((.*)\))?: (.*)( \(#([0-9]+)\))?$"

echo "${BOLD}${YELLOW}🔍 Validating commit message...${RESET}"

if ! [[ "$MESSAGE" =~ $COMMITFORMAT ]]; then
  echo "${BOLD}${RED}❌ Your commit was rejected due to the commit message. Aborting...${RESET}" 
  echo
  echo "${BOLD}Please use the following format:${RESET}"
  echo "  ${GREEN}feat: feature example comment (#4321)${RESET}"
  echo "  ${GREEN}fix(ui): bugfix example comment (#4321)${RESET}"
  echo "  ${GREEN}docs: added documentation${RESET}"
  echo "  ${GREEN}docs(install): added installation instructions${RESET}"
  echo "  ${GREEN}test: added unit tests for health endpoint${RESET}"
  echo "  ${GREEN}chore: updated dependencies${RESET}"
  echo "  ${GREEN}perf: optimized database queries${RESET}"
  echo "  ${GREEN}refactor: restructured API modules${RESET}"
  echo "  ${GREEN}style: fixed code formatting${RESET}"
  echo "  ${GREEN}other: any other type of change${RESET}"
  echo
  echo "More details on ${BOLD}docs/COMMITS.md${RESET}"
  echo
  echo "${BOLD}Your message was:${RESET}"
  echo "  ${RED}$MESSAGE${RESET}"
  exit 1
fi

echo "${BOLD}${GREEN}✅ Commit message is valid!${RESET}"
exit 0
