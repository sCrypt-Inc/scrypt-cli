const fs = require('fs-extra');
const path = require('path');
const sh = require('shelljs');
const json5 = require('json5');
const { green, red } = require('chalk');
const { stepCmd, readdirRecursive } = require('./helpers');
const { resolve } = require('path');
const { readdir } = require('fs').promises;
const { compileContract } = require('scryptlib');


async function* getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

async function compile() {

  // Check TS config
  let outDir = "";
  const tsConfig = json5.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  let scryptTransFound = false;
  if (tsConfig.hasOwnProperty('compilerOptions')) {
    if (tsConfig.compilerOptions.hasOwnProperty('plugins')) {
      tsConfig.compilerOptions.plugins.map((obj) => {
        if (obj.hasOwnProperty("transform")) {
          scryptTransFound = obj.transform.startsWith('scrypt-ts') && obj.transform.endsWith('transformer');
          outDir = obj.outDir;
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
    'Building TS',
    'npx tsc'
  );

    // Recursively iterate over dist/ dir and find all classes extending 
  // SmartContract class. For each found class, all it's compile() function.
  // This will generate the artifact file of the contract.
  // TODO: This is a hacky approach but works for now. Is there a more elegant solution?

  var currentPath = process.cwd();
  const distFiles = await readdirRecursive(outDir);


  for (const f of distFiles) {
    fAbs = path.resolve(f);
    if (path.extname(fAbs) == '.scrypt') {
      try {
        const outDir = path.join(currentPath, path.dirname(f));
        compileContract(f, {
          out: outDir,
          artifact: true
        });

        const transformerPath = path.join(outDir, `${path.basename(f, '.scrypt')}.transformer.json`);

        const transformer = json5.parse(fs.readFileSync(transformerPath, 'utf8'));

        const artifactPath = path.join(outDir, `${path.basename(f, '.scrypt')}.json`);

        const artifact = json5.parse(fs.readFileSync(artifactPath, 'utf8'));

        artifact.transformer = transformer;

        fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 1))

      } catch (e) {
        const resStr = `\nProject wasn't successfully compiled!\n`;
        console.log(red(resStr));
        console.log(red(`ERROR: ${e.message}`));
        process.exit(-1);
      }
    }
  };

  const resStr = `\nProject was successfully compiled!\n`;
  console.log(green(resStr));
  process.exit(0);
}


  module.exports = {
    compile,
  };