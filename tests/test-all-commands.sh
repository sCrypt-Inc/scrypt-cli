#!/bin/sh
set -e

rm -rf test-commands
mkdir -p test-commands

cd test-commands

echo "testing get version info"
node ../src/bin/index.js -v

echo "testing get system info"
node ../src/bin/index.js system

echo "testing create project hello-world"
rm -rf hello-world
node ../src/bin/index.js project hello-world
cd hello-world

npm i
node ../../src/bin/index.js compile
npm t
npm run genprivkey
cd ..


echo "testing create project --state stateful-counter"
rm -rf stateful-counter
node ../src/bin/index.js project --state stateful-counter
cd stateful-counter

npm i
node ../../src/bin/index.js compile
npm t
npm run genprivkey
cd ..


echo "testing create project --lib my-lib"
rm -rf my-lib
node ../src/bin/index.js project --lib my-lib
cd my-lib

npm i
node ../../src/bin/index.js compile
npm t
npm run genprivkey
cd ..

echo "testing create project --asm hello-world-asm"
rm -rf hello-world-asm
node ../src/bin/index.js project --asm hello-world-asm
cd hello-world-asm

echo '{"HelloWorldAsm": {"unlock": "op_1 op_1 op_equalverify"}}' > .asm/asm.json
npm i
node ../../src/bin/index.js compile
npm t
npm run genprivkey
cd ..

echo "testing init React ..."
rm -rf dapp-react
npx create-react-app@latest dapp-react --template typescript
cd dapp-react
git init
git config user.email "ci@scrypt.io"
git config user.name "scrypt"
git add .
git commit -am "Initial commit"
npm i
npm i -D ../../
npx scrypt-cli init --force
npx scrypt-cli compile
npm run build
cd ..

echo "testing init Next.js ..."
rm -rf dapp-next
npx create-next-app dapp-next --typescript --use-npm --eslint --tailwind --src-dir --app --import-alias "@/*"
cd dapp-next
git init
git config user.email "ci@scrypt.io"
git config user.name "scrypt"
git add .
git commit -am "Initial commit"
npm i
npm i -D ../../
npx scrypt-cli init --force
npx scrypt-cli compile
npm run build
cd ..

cd ..
rm -rf test-commands
