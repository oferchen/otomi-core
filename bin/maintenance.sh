#!/usr/bin/env bash
shopt -s expand_aliases
. bin/utils.sh
set -e

if [ "$CLOUD" = "azure" ]; then
  printf "${COLOR_LIGHT_PURPLE}DONE!\nKilling ingress-azure pod...${COLOR_NC}\n"
  ki delete po $(ki get po -l "app=ingress-azure" -ojsonpath='{.items[0].metadata.name}')
fi

kis get secret | grep -E 'harbor|notary|dev' | awk '{print $1}' | xargs kubectl -n istio-system get secret --export -o yaml | k -n harbor apply -f -
