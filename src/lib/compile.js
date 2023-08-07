const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const { exit } = require('process');
const { green, red } = require('chalk');
const { stepCmd, readdirRecursive, readConfig, writefile, readfile, shExec } = require('./helpers');
const { compileContract } = require('scryptlib');
const ts = require('typescript');
const { IndexerReader, INDEX_FILE_NAME } = require('scrypt-ts-transpiler');

function containsDeprecatedOptions(options) {
  return "out" in options
    || "noImplicitUseStrict" in options
    || "keyofStringsOnly" in options
    || "suppressExcessPropertyErrors" in options
    || "suppressImplicitAnyIndexErrors" in options
    || "noStrictGenericChecks" in options
    || "charset" in options
    || "importsNotUsedAsValues" in options
    || "preserveValueImports" in options
}

async function compile({ include, exclude, tsconfig, watch, noArtifact, asm }) {

  const tsconfigScryptTSPath = path.resolve("tsconfig-scryptTS.json");
  const tsconfigPath = path.resolve("tsconfig.json");

  if (!fs.existsSync(tsconfigScryptTSPath)) {
    if (!fs.existsSync(tsconfigPath)) {
      writefile(tsconfigScryptTSPath, readConfig('tsconfig.json'))
    } else {

      const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(tsconfigPath, {}, ts.sys);

      if (!parsedCommandLine) {
        console.log(red(`ERROR: invalid tsconfig.json`));
        exit(-1);
      }

      if(parsedCommandLine.errors[0]) {
        console.log(red(`ERROR: invalid tsconfig.json`));
        exit(-1);
      }

      const override = containsDeprecatedOptions(parsedCommandLine.options) ?
        {
          noEmit: true,
          experimentalDecorators: true,
          ignoreDeprecations: "5.0"
        } : {
          noEmit: true,
          experimentalDecorators: true,
        };

      writefile(tsconfigScryptTSPath, {
        extends: "./tsconfig.json",
        include: ["src/contracts/**/*.ts"],
        compilerOptions: override
      })
    }
  }

  // Check TS config
  let outDir = "artifacts";
  const config = readfile(tsconfigScryptTSPath, true);

  if (include) {
    config.include = include.split(',')
  }


  if (exclude) {
    config.exclude = exclude.split(',')
  }

  let clonedConfig = _.cloneDeep(config);

  Object.assign(config.compilerOptions, {
    plugins: []
  })

  config.compilerOptions.plugins.push({
    transform: require.resolve("scrypt-ts-transpiler"),
    transformProgram: true,
    outDir
  });


  writefile(tsconfigScryptTSPath, JSON.stringify(config, null, 2));

  process.on('exit', () => {
    if (clonedConfig == ! null) {
      writefile(tsconfigScryptTSPath, JSON.stringify(clonedConfig, null, 2));
      clonedConfig = null
    }
  })

  process.on('SIGINT', function () {
    if (clonedConfig == ! null) {
      writefile(tsconfigScryptTSPath, JSON.stringify(clonedConfig, null, 2));
      clonedConfig = null
    }
    process.exit();
  });

  let ts_patch_path = require.resolve("typescript").split(path.sep);

  ts_patch_path = ts_patch_path.slice(0, ts_patch_path.length - 2);
  ts_patch_path.push("bin")
  ts_patch_path.push("tsc")

  const tsc = ts_patch_path.join(path.sep)

  // Run tsc which in turn also transpiles to sCrypt

  if (watch) {
    await shExec(`node ${tsc} --watch --p ${tsconfigScryptTSPath}`)
  } else {
    const result = await stepCmd(
      'Building TS',
      `node ${tsc} --p ${tsconfigScryptTSPath}`, false);

    if (result instanceof Error) {
      console.log(red(`ERROR: Building TS failed!`));
      console.log(`Please modify your code or \`tsconfig-scryptTS.json\` according to the error message output during BUILDING.`);
      try {
        writefile(tsconfigScryptTSPath, JSON.stringify(clonedConfig, null, 2));
        clonedConfig = null
      } catch (error) {

      }
      exit(-1);
    }
  }
  try {
    writefile(tsconfigScryptTSPath, JSON.stringify(clonedConfig, null, 2));
    clonedConfig = null
  } catch (error) {

  }

  // Recursively iterate over dist/ dir and find all classes extending 
  // SmartContract class. For each found class, all it's compile() function.
  // This will generate the artifact file of the contract.
  // TODO: This is a hacky approach but works for now. Is there a more elegant solution?


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

    const files = [];
    if (fs.existsSync(path.resolve(INDEX_FILE_NAME))) {
      const indexr = new IndexerReader(path.resolve(INDEX_FILE_NAME));
      indexr.symbolPaths.forEach((value, key) => {
        const scryptFile = indexr.getFullPath(key);
        if (path.relative(scryptFile, outDir) === '..') {
          files.push(scryptFile)
        }
      })

    } else {
      const distFiles = await readdirRecursive(outDir);
      for (const f of distFiles) {
        const fAbs = path.resolve(f);
        if (path.extname(fAbs) == '.scrypt') {
          files.push(fAbs)
        }
      };
    }


    for (const f of files) {

      try {
        const outDir = path.dirname(f)
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
  }


  const resStr = `\nProject was successfully compiled!\n`;
  console.log(green(resStr));
  exit(0);
}


module.exports = {
  compile,
};