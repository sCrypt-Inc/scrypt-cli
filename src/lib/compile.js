const fs = require('fs-extra');
const path = require('path');
const json5 = require('json5');
const { exit } = require('process');
const { green, red } = require('chalk');
const { stepCmd, readdirRecursive, isProjectRoot, readConfig, writefile } = require('./helpers');
const { compileContract } = require('scryptlib');


async function compile() {

  if (!isProjectRoot()) {
    console.error(red(`Please run this command in the root directory of the project.`))
    exit(-1)
  }

  const tsconfigPath = "tsconfig-scryptTS.json";

  if (!fs.existsSync(tsconfigPath)) {
    writefile(tsconfigPath, readConfig('tsconfig.json'));
    console.log(green(`${tsconfigPath} created`))
  } else {
    console.log(green(`${tsconfigPath} exists`))
  }


  const tsConfig = json5.parse(fs.readFileSync(tsconfigPath, 'utf8'));

  // Check TS config
  let outDir = tsConfig.compilerOptions.plugins[0].outDir || "artifacts";

  // Run tsc which in turn also transpiles to sCrypt
  await stepCmd(
    'Building TS',
    `npx tsc --p ${tsconfigPath}`
  );

  // Recursively iterate over dist/ dir and find all classes extending 
  // SmartContract class. For each found class, all it's compile() function.
  // This will generate the artifact file of the contract.
  // TODO: This is a hacky approach but works for now. Is there a more elegant solution?

  var currentPath = process.cwd();
  if (!fs.existsSync(outDir)) {
    console.log(red(`ERROR: outDir '${outDir}' not exists`));
    exit(-1);
  }

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

        if (result.errors.length > 0) {
          const resStr = `\nCompilation failed.\n`;
          console.log(red(resStr));
          console.log(red(`ERROR: Failed to compile ${f}`));
          exit(-1);
        }

        const artifactPath = path.join(outDir, `${path.basename(f, '.scrypt')}.json`);

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