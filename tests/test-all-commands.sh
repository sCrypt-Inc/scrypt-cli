#!/bin/sh
set -e

git config  --global user.email "ci@scrypt.io"
git config  --global user.name "scrypt"

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

chmod +x ../tests/helper-scripts/*.exp
npm i -g @vue/cli

echo "testing init React ..."
rm -rf dapp-react
npx create-react-app@latest dapp-react --template typescript
cd dapp-react
git init
git add .
git commit -am "Initial commit"
npm i
npm i -D ../../
npx scrypt-cli init --force
npx scrypt-cli compile
cp ../../tests/replaced-files/react-index.tsx src/index.tsx
cat src/index.tsx
CI=true npm t
cd ..

echo "testing init Next.js ..."
rm -rf dapp-next
npx create-next-app dapp-next --typescript --use-npm --eslint --tailwind --src-dir --app --import-alias "@/*"
cd dapp-next
git init
git add .
git commit -am "Initial commit"
npm i
npm i -D ../../
npx scrypt-cli init --force
npx scrypt-cli compile
cp ../../tests/replaced-files/next-page.tsx src/app/page.tsx
cat src/app/page.tsx
npm run build
cd ..

echo "testing init Angular ..."
rm -rf dapp-angular
npx @angular/cli new dapp-angular
cd dapp-angular
git init
git add .
git commit -am "Initial commit"
npm i
npm i -D ../../
npx scrypt-cli init --force
npx scrypt-cli compile
cp ../../tests/replaced-files/angular-main.ts src/main.ts
cat src/main.ts
npm run build
cd ..


if [ $TRAVIS_OS_NAME = linux ] ; then

    echo "testing init Svelte ..."
    rm -rf dapp-svelte
    ../tests/helper-scripts/create-svelte-app.exp
    cd dapp-svelte
    git init
    git add .
    git commit -am "Initial commit"
    npm i
    npm i -D ../../
    npx scrypt-cli init --force
    npx scrypt-cli compile
    cp ../../tests/replaced-files/svelte-page.svelte src/routes/+page.svelte
    cat src/routes/+page.svelte
    npm run build
    cd ..

    echo "testing Vue 3.x bundled with Vite"
    rm -rf dapp-vue3-vite
    ../tests/helper-scripts/create-vue3-vite-app.exp
    cd dapp-vue3-vite
    git init
    git add .
    git commit -am "Initial commit"
    npm i
    npm i -D ../../
    npx scrypt-cli init --force
    npx scrypt-cli compile
    cp ../../tests/replaced-files/vue3-vite-main.ts src/main.ts
    cat src/main.ts
    npm run build
    cd ..

    echo "testing Vue 2.x bundled with Vite"
    rm -rf dapp-vue2-vite
    ../tests/helper-scripts/create-vue2-vite-app.exp
    cd dapp-vue2-vite
    git init
    git add .
    git commit -am "Initial commit"
    npm i
    npm i -D ../../
    npx scrypt-cli init --force
    npx scrypt-cli compile
    cp ../../tests/replaced-files/vue2-vite-main.ts src/main.ts
    cat src/main.ts
    npm run build
    cd ..

    echo "testing Vue 3.x bundled with Webpack"
    rm -rf dapp-vue3-webpack ~/.vuerc
    echo "{ \"useTaobaoRegistry\": true }" > ~/.vuerc
    ../tests/helper-scripts/create-vue3-webpack-app.exp
    cd dapp-vue3-webpack
    git init
    git add .
    git commit -am "Initial commit"
    npm i
    npm i -D ../../
    npx scrypt-cli init --force
    npx scrypt-cli compile
    cp ../../tests/replaced-files/vue3-webpack-main.ts src/main.ts
    cat src/main.ts
    npm run build
    cd ..

    rm -rf dapp-vue2-webpack ~/.vuerc
    echo "{ \"useTaobaoRegistry\": true }" > ~/.vuerc
    ../tests/helper-scripts/create-vue2-webpack-app.exp
    cd dapp-vue2-webpack
    git init
    git add .
    git commit -am "Initial commit"
    npm i
    npm i -D ../../
    npx scrypt-cli init --force
    npx scrypt-cli compile
    cp ../../tests/replaced-files/vue2-webpack-main.ts src/main.ts
    cat src/main.ts
    npm run build
    cd ..
fi

ls -la

cd ..
rm -rf test-commands
