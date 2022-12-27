const fs = require('fs-extra');
const path = require('path');
const sh = require('shelljs');
const json5 = require('json5');
const { green, red } = require('chalk');
const { stepCmd } = require('./helpers');


async function compile() {
  
  // Check TS config
  const tsConfig = json5.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  let scryptTransFound = false;
  if (tsConfig.hasOwnProperty('compilerOptions')) {
    if (tsConfig.compilerOptions.hasOwnProperty('plugins')) {
      tsConfig.compilerOptions.plugins.map((obj) => {
        if (obj.hasOwnProperty("transform")) {
          scryptTransFound = obj.transform == 'scrypt-ts/dist/transformer';
          return;
        }
      });
    }
  }
  if (!scryptTransFound) {
    console.error(red(`TS config missing sCrypt transformer plugin.\n` +
    `Check out a working example of tsconfig.json:\n` +
    `https://github.com/sCrypt-Inc/scryptTS-examples/blob/master/tsconfig.json`));
  }
  
  await stepCmd(
    'NPM install',
    'npm i'
  );

  // Run tsc which in turn also transpiles to sCrypt
  await stepCmd(
    'Compilation...',
    'npx tsc'
  );

  const resStr = `\nProject was successfully compiled!\n`;
  console.log(green(resStr));
  process.exit(0);
}


module.exports = {
  compile,
};