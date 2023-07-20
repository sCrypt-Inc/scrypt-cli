#!/bin/sh
set -e

cd templates/

for d in */ ; do
    cd $d
    rm -rf node_modules/ package-lock.json
    git init  # Init git repo because of husky so "npm i" passes
    npm i
    npm i -D ../../
    npm run lint
    npm run lint-check || exit 1
    npm run genprivkey
    npm run test || exit 1
    rm -rf node_modules/ package-lock.json
    rm -rf .git/
    cd ../
done
