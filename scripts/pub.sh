#! /bin/bash

yarn --cwd ./tiny-robots publish --patch
. readdlink.sh
git add -A
git commit -m "."
git push