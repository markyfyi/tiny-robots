#! /bin/bash

yarn --cwd ./tiny-robots publish --patch
yarn --cwd ./example add tiny-robots
yarn --cwd ./example link tiny-robots
git add -A
git commit -m "x"
git push