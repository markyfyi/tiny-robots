#! /bin/bash

yarn --cwd ./hyperlab publish --patch
yarn --cwd ./example add hyperlab
yarn --cwd ./example link hyperlab
git add -A
git commit -m "x"
git push