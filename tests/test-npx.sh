#!/bin/sh
set -e
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



chmod +x ../tests/helper-scripts/*.exp
npm i -g @vue/cli

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
git config user.email "ci@scrypt.io"
git config user.name "scrypt"
git add .
git commit -am "Initial commit"
npm i
npx scrypt-cli init --force
npx scrypt-cli compile
cp ../../tests/replaced-files/next-page.tsx src/app/page.tsx
cat src/app/page.tsx
npm run build
cd ..

echo "testing init Angular ..."
rm -rf dapp-angular
npx @angular/cli new dapp-angular
echo "Skip"

echo "testing init Svelte ..."
rm -rf dapp-svelte
../tests/helper-scripts/create-svelte-app.exp
cd dapp-svelte
git init
git config user.email "ci@scrypt.io"
git config user.name "scrypt"
git add .
git commit -am "Initial commit"
npm i
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
git config user.email "ci@scrypt.io"
git config user.name "scrypt"
git add .
git commit -am "Initial commit"
npm i
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
git config user.email "ci@scrypt.io"
git config user.name "scrypt"
git add .
git commit -am "Initial commit"
npm i
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
git config user.email "ci@scrypt.io"
git config user.name "scrypt"
git add .
git commit -am "Initial commit"
npm i
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
git config user.email "ci@scrypt.io"
git config user.name "scrypt"
git add .
git commit -am "Initial commit"
npm i
npx scrypt-cli init --force
npx scrypt-cli compile
cp ../../tests/replaced-files/vue2-webpack-main.ts src/main.ts
cat src/main.ts
npm run build
cd ..

ls -la

cd ..
rm -rf test-npx