#!/bin/sh
set -e

if [ -n "$TRAVIS" ] || [ -n "$GITHUB_ACTIONS" ]; then
    echo "config git ..."
    git config  --global user.email "ci@scrypt.io"
    git config  --global user.name "scrypt"
else 
    echo "skip git config"
fi


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
npm i -D ../../
npx scrypt-cli compile
npm t
npm run genprivkey
cd ..


echo "testing create project --state stateful-counter"
rm -rf stateful-counter
node ../src/bin/index.js project --state stateful-counter
cd stateful-counter

npm i
npm i -D ../../
npx scrypt-cli compile
npm t
npm run genprivkey
cd ..


echo "testing create project --lib my-lib"
rm -rf my-lib
node ../src/bin/index.js project --lib my-lib
cd my-lib

npm i
npm i -D ../../
npx scrypt-cli compile
npm t
npm run genprivkey
cd ..

echo "testing create project --asm hello-world-asm"
rm -rf hello-world-asm
node ../src/bin/index.js project --asm hello-world-asm
cd hello-world-asm

echo '{"HelloWorldAsm": {"unlock": "op_1 op_1 op_equalverify"}}' > .asm/asm.json
npm i
npm i -D ../../
npx scrypt-cli compile
npm t
npm run genprivkey
cd ..

echo "testing create project --min hello-world-min"
rm -rf hello-world-min
node ../src/bin/index.js project --min hello-world-min
cd hello-world-min
npm i
npm i -D ../../
npx scrypt-cli compile
npm t
npm run genprivkey
cd ..


ls -la

cd ..
rm -rf test-commands
