#!/bin/sh
set -e

cd templates/

# for d in */ ; do
#     cd $d
#     rm -rf node_modules/ package-lock.json
#     git init  # Init git repo because of husky so "npm i" passes
#     npm i
#     npm run lint
#     npm run lint-check || exit 1
#     npm run genprivkey
#     npx scrypt-cli compile 
#     npm run test || exit 1
#     rm -rf .git/
#     cd ../
# done


# echo "testing npx scrypt-cli init ..."
# rm -rf dapp
# npx create-react-app dapp --template typescript
# cd dapp
# git init
# git config user.email "ci@scrypt.io"
# git config user.name "scrypt"
# git add .
# git commit -am "Initial commit"
# npm i
# npx scrypt-cli init
# npx scrypt-cli compile 
# cd ..


echo "testing npx scrypt-cli project hello-world"
rm -rf hello-world
echo "npx version"
npx -v
echo "npx scrypt-cli -v"
npx scrypt-cli -v
echo "aaa"
npx scrypt-cli project hello-world
echo "hello-world created"
cd hello-world

npm i
npm t
npm run genprivkey
cd ..


echo "testing npx scrypt-cli project --state stateful-counter"
rm -rf stateful-counter
npx scrypt-cli project --state stateful-counter
cd stateful-counter

npm i
npm t
npm run genprivkey
cd ..


echo "testing npx scrypt-cli project --lib my-lib"
rm -rf my-lib
npx scrypt-cli project --lib my-lib
cd my-lib

npm i
npm t
npm run genprivkey
cd ..

echo "testing npx scrypt-cli system"
npx scrypt-cli system