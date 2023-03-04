#!/bin/sh


cd templates/

for d in */ ; do
    cd $d
    rm -rf node_modules/ package-lock.json
    git init  # Init git repo because of husky so "npm i" passes
    npm i
    npm run lint
    npm run lint-check || exit 1
    npm run genprivkey
    npx scrypt-cli compile 
    npm run test || exit 1
    rm -rf .git/
    cd ../
done

rm -rf dapp

npx create-react-app dapp --template typescript

cd dapp
git init
git config user.email "ci@scrypt.io"
git config user.name "scrypt"
git add .
git commit -am "Initial commit"
npm i
npx scrypt-cli init
npx scrypt-cli compile 

