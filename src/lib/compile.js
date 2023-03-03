const fs = require('fs-extra');
const path = require('path');
const json5 = require('json5');
const { exit } = require('process');
const { green, red } = require('chalk');
const { stepCmd, readdirRecursive } = require('./helpers');
const { compileContract } = require('scryptlib');


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
    exit(-1)
  }

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
        const result = compileContract(f, {
          out: outDir,
          artifact: true
        });

        if(result.errors.length > 0) {
          const resStr = `\nCompilation failed.\n`;
          console.log(red(resStr));
          console.log(red(`ERROR: Failed to compile ${f}`));
          exit(-1);
        }

        const transformerPath = path.join(outDir, `${path.basename(f, '.scrypt')}.transformer.json`);

        const transformer = json5.parse(fs.readFileSync(transformerPath, 'utf8'));

        const artifactPath = path.join(outDir, `${path.basename(f, '.scrypt')}.json`);

        const artifact = json5.parse(fs.readFileSync(artifactPath, 'utf8'));

        artifact.transformer = transformer;

        fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 1))
        console.log(green(`Compiled successfully, artifact file: ${artifactPath}`));
      } catch (e) {
        const resStr = `\nCompilation failed.\n`;
        console.log(red(resStr));
        console.log(red(`ERROR: ${e.message}`));
        exit(-1);
      }
    }
  };

  const resStr = `\nProject was successfully compiled!\n`;
  console.log(green(resStr));
  exit(0);
}


module.exports = {
  compile,
};