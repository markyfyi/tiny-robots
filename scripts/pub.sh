#! /bin/bash

yarn --cwd ./tiny-robots publish --patch
. ./scripts/readdlink.sh
git add -A
git commit -m "."
git push