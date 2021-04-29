#! /bin/bash

yarn --cwd ./tiny-robots publish --patch
sleep 15
. ./scripts/readdlink.sh
git add -A
git commit -m "."
git push