const fs = require('fs-extra');
const path = require('path');
const sh = require('shelljs');
const json5 = require('json5');
const { green, red } = require('chalk');


async function publish() {
  
  // Check if project has a dist folder
  if (!fs.existsSync("dist")) {
    console.error(red(`Missing dist/ directory. Run: scrypt compile`));
    return;
  }

  // Check scrypt.index.json
  if (!fs.existsSync("scrypt.index.json")) {
    console.error(red(`Missing scrypt.index.json. Run: scrypt compile`));
    return;
  }
  
  const tsConfig = json5.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  let outDir = undefined;
  if (tsConfig.hasOwnProperty('compilerOptions')) {
    if (tsConfig.compilerOptions.hasOwnProperty('plugins')) {
      tsConfig.compilerOptions.plugins.map((obj) => {
        if (obj.hasOwnProperty("transform")) {
          outDir = obj.outDir;
          return;
        }
      });
    }
  }
  if (!outDir) {
    console.error(red(`scrypt-ts out dir not specified in TS config.\n` +
    `Check out a working example of tsconfig.json:\n` +
    `https://github.com/sCrypt-Inc/scryptTS-examples/blob/master/tsconfig.json`));
  }

  const indexFile = JSON.parse(fs.readFileSync('scrypt.index.json'));
  let missingScryptFiles = [];
  indexFile.bindings.map((obj) => {
    let srcPath = path.join(outDir, obj.path);
    if (!fs.existsSync(srcPath)) {
      missingScryptFiles.push(srcPath);
    }
  })
  if (missingScryptFiles.length > 0) {
    console.error(red(`Missing sCrypt source files:`));
    console.error(red(missingScryptFiles));
    return;
  }
  
  // Run npm publish
  if (sh.exec('npm publish').code != 0) {
    return;
  }
  
  const resStr = `\nProject was successfully published!\n`;
  console.log(green(resStr));
  process.exit(0);
}


module.exports = {
  publish,
};
