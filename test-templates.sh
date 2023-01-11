#!/bin/sh


cd templates/

for d in */ ; do
    cd $d
    npm i
    npm run lint-check || exit 1
    npm run test || exit 1
    cd ../
done

