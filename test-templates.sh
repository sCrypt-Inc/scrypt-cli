#!/bin/sh
set -e

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


echo "testing npx scrypt-cli init ..."
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


echo "testing npx scrypt-cli project hello-world"
rm -rf hello-world
npx scrypt-cli project hello-world
cd hello-world

if ! tree . | grep -q 'helloWorld.ts'; then
   echo "cannot find helloWorld.ts"
   exit -1
fi

if ! tree . | grep -q 'helloWorld.test.ts'; then
   echo "cannot find helloWorld.test.ts"
   exit -1
fi

npm i
npm t
npm run genprivkey
cd ..


echo "testing npx scrypt-cli project --state stateful-counter"
rm -rf stateful-counter
npx scrypt-cli project --state stateful-counter
cd stateful-counter

if ! tree . | grep -q 'statefulCounter.ts'; then
   echo "cannot find statefulCounter.ts"
   exit -1
fi

if ! tree . | grep -q 'statefulCounter.test.ts'; then
   echo "cannot find statefulCounter.test.ts"
   exit -1
fi
npm i
npm t
npm run genprivkey
cd ..


echo "testing npx scrypt-cli project --lib my-lib"
rm -rf my-lib
npx scrypt-cli project --lib my-lib
cd my-lib

if ! tree . | grep -q 'myLib.ts'; then
   echo "cannot find myLib.ts"
   exit -1
fi

if ! tree . | grep -q 'myLib.test.ts'; then
   echo "cannot find myLib.test.ts"
   exit -1
fi
npm i
npm t
npm run genprivkey
cd ..

echo "testing npx scrypt-cli system"
npx scrypt-cli system