#!/bin/sh
set -e
cd ..
rm -rf test-npx
mkdir -p test-npx

cd test-npx

echo "testing get version info"
npx scrypt-cli -v

echo "testing get system info"
npx scrypt-cli system

echo "testing create project hello-world"
rm -rf hello-world
npx scrypt-cli project hello-world
cd hello-world

npm i
npx scrypt-cli compile
npm t
cd ..


echo "testing create project --state stateful-counter"
rm -rf stateful-counter
npx scrypt-cli project --state stateful-counter
cd stateful-counter

npm i
npx scrypt-cli compile
npm t
cd ..


echo "testing create project --lib my-lib"
rm -rf my-lib
npx scrypt-cli project --lib my-lib
cd my-lib

npm i
npx scrypt-cli compile
cd ..



echo "testing init ..."
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
cd ..

rm -rf test-npx