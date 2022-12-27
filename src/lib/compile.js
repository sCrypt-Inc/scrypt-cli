const fs = require('fs-extra');
const path = require('path');
const sh = require('shelljs');
const { green, red } = require('chalk');


async function compile() {
  
  // Check TS config
  const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json'));
  let scryptTransFound = false;
  if (tsConfig.hasOwnProperty('plugins')) {
    tsConfig.plugins.map((obj) => {
      if (obj.hasOwnProperty("transform")) {
        scryptTransFound = obj.transform == 'scrypt-ts/dist/transformer';
        return;
      }
    });
  }
  if (!scryptTransFound) {
    console.error(red(`TS config missing sCrypt transformer plugin.\n` +
    `Check out a working example of tsconfig.json:\n` +
    `https://github.com/sCrypt-Inc/scryptTS-examples/blob/master/tsconfig.json`));
  }

  // Run tsc which in turn also transpiles to sCrypt
  if (sh.exec('npx tsc').code != 0) {
    return;
  }

  const resStr = `\nProject ${name} was successfully compiled!\n`;
  console.log(green(resStr));
  process.exit(0);
}


module.exports = {
  compile,
};