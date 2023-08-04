const fs = require('fs-extra');
const path = require('path');
const json5 = require('json5');
const { exit } = require('process');
const { green, red } = require('chalk');
const { stepCmd, readdirRecursive, readConfig, writefile, readfile, shExec } = require('./helpers');
const { compileContract } = require('scryptlib');


async function compile({ include, exclude, tsconfig, watch, noArtifact, asm }) {

  let tsconfigPath = path.resolve("tsconfig.json");

  if (tsconfig) {
    tsconfigPath = path.isAbsolute(tsconfig) ? tsconfig : path.resolve(tsconfig);

    if (!fs.existsSync(tsconfigPath)) {
      console.log(red(`ERROR: tsconfig '${tsconfig}' not found`));
      exit(-1);
    }
  }


  const tsconfigScryptTSPath = path.resolve("tsconfig-scryptTS.json");

  const result = await shExec(`git ls-files ${tsconfigScryptTSPath}`);
  if (result === tsconfigScryptTSPath) {
    await stepCmd(`Git remove '${tsconfigScryptTSPath}' file`, `git rm -f ${tsconfigScryptTSPath}`)
    await stepCmd("Git commit", `git commit -am "remove ${tsconfigScryptTSPath} file."`)
  }

  // Check TS config
  let outDir = "artifacts";
  const config = JSON.parse(readConfig('tsconfig.json'));
  if (fs.existsSync(tsconfigPath)) {

    try {

      const configOverrides = readfile(tsconfigPath);
      Object.assign(config, configOverrides)
      Object.assign(config.compilerOptions, {
        noEmit: true
      })

    } catch (error) {
      console.log(red(`ERROR: invalid tsconfig '${tsconfig}'`));
      exit(-1);
    }
  }


  config.compilerOptions.plugins = [];

  config.compilerOptions.plugins.push({
    transform: require.resolve("scrypt-ts-transpiler"),
    transformProgram: true,
    outDir
  });

  if (include) {
    config.include = include.split(',')
  }


  if (exclude) {
    config.exclude = exclude.split(',')
  }

  writefile(tsconfigScryptTSPath, JSON.stringify(config, null, 2));

  process.on('exit', () => {
    try {
      if (fs.existsSync(tsconfigScryptTSPath)) {
        fs.removeSync(tsconfigScryptTSPath)
      }
    } catch (error) {

    }
  })

  let ts_patch_path = require.resolve("typescript").split(path.sep);

  ts_patch_path = ts_patch_path.slice(0, ts_patch_path.length - 2);
  ts_patch_path.push("bin")
  ts_patch_path.push("tsc")

  const tsc = ts_patch_path.join(path.sep)

  // Run tsc which in turn also transpiles to sCrypt

  if (watch) {
    await shExec(`node ${tsc} --watch --p ${tsconfigScryptTSPath}`)
  } else {
    await stepCmd(
      'Building TS',
      `node ${tsc} --p ${tsconfigScryptTSPath}`
    );
  }

  try {
    fs.removeSync(tsconfigScryptTSPath)
  } catch (error) {

  }

  // Recursively iterate over dist/ dir and find all classes extending 
  // SmartContract class. For each found class, all it's compile() function.
  // This will generate the artifact file of the contract.
  // TODO: This is a hacky approach but works for now. Is there a more elegant solution?


  var currentPath = process.cwd();
  if (!fs.existsSync(outDir)) {
    console.log(red(`ERROR: outDir '${outDir}' not exists`));
    exit(-1);
  }


  if (asm) {
    if (!fs.existsSync(".asm/apply_asm.js")) {
      console.log(red(`ERROR: no ".asm/apply_asm.js" found`));
      process.exit(-1);
    }

    await stepCmd(
      'Applying ASM optimizations',
      `node .asm/apply_asm.js`
    );
  }

  if (!noArtifact) {
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
  }


  const resStr = `\nProject was successfully compiled!\n`;
  console.log(green(resStr));
  exit(0);
}


module.exports = {
  compile,
};