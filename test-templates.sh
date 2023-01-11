#!/bin/sh


cd templates/

for d in */ ; do
    cd $d
    git init  # Init git repo because of husky so "npm i" passes
    npm i
    rm -rf .git/
    npm run lint-check || exit 1
    npm run test || exit 1
    cd ../
done

