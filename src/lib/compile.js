const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const { exit } = require('process');
const { green, red } = require('chalk');
const { stepCmd, readdirRecursive, readConfig, writefile, readfile, shExec, resolvePaths, extractBaseNames } = require('./helpers');
const { compileContract, findCompiler } = require('scryptlib');
const ts = require('typescript');
const { safeCompilerVersion, getBinary } = require('scryptlib/util/getBinary');

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
  const scryptcPath = findCompiler();
  if(!scryptcPath || safeCompilerVersion(scryptcPath) === "0.0.0") {
    // no scryptc found, auto download scryptc
    await getBinary()
  }


  const tsconfigScryptTSPath = path.resolve(tsconfig ? tsconfig : "tsconfig-scryptTS.json");
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

      if (parsedCommandLine.errors[0]) {
        console.log(red(`ERROR: invalid tsconfig.json`));
        exit(-1);
      }

      const override = containsDeprecatedOptions(parsedCommandLine.options) ?
        {
          noEmit: true,
          experimentalDecorators: true,
          target: "ESNext",
          esModuleInterop: true,
          ignoreDeprecations: "5.0"
        } : {
          noEmit: true,
          experimentalDecorators: true,
          target: "ESNext",
          esModuleInterop: true,
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
    await shExec(`node "${tsc}" --watch --p "${tsconfigScryptTSPath}"`)
  } else {
    const result = await stepCmd(
      'Building TS',
      `node "${tsc}" --p "${tsconfigScryptTSPath}"`, false);

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

  let successCount = 0;
  let failedCount = 0;

  if (!noArtifact) {
    // Compile only what was transpiled using TSC
    const include = extractBaseNames(resolvePaths(Array.isArray(config.include) ? config.include : []))
    const exclude = extractBaseNames(resolvePaths(Array.isArray(config.exclude) ? config.exclude : []))
    const toCompile = include.filter(el => !exclude.includes(el))

    const files = [];
    const distFiles = await readdirRecursive(outDir);
    for (const f of distFiles) {
      const relativePath = path.relative(outDir, f);
      if (relativePath.startsWith("node_modules" + path.sep)) {
        // Ignore scrypt files in node_modules directory
        continue;
      }

      const fAbs = path.resolve(f);      

      if (fAbs.endsWith(".transformer.json")) {
        try {
		      const name = path.basename(fAbs, '.transformer.json')

          if(!toCompile.includes(name)) {
            // Ignore files not included
            continue;
          }

          const transformerResult = readfile(fAbs, true);
          const {scryptfile, success} = transformerResult;
		      const scryptfilePath = path.join(path.dirname(fAbs), path.basename(scryptfile));

          if(success) {
            if(fs.existsSync(scryptfilePath)) {
              files.push(scryptfilePath)
            } else {
              failedCount++;
              const resStr = `\nTranslation succeed but scrypt file not found! ${fAbs}\n`;
              console.log(red(resStr));
            }
          } else if(success === false) {
            failedCount++;
            const resStr = `\nTranslation failed! See errors in: ${fAbs}\n`;
            console.log(red(resStr));
          }
        } catch (error) {
		      failedCount ++;
          console.log(red(`ERROR: ${error.message}, transformer file: ${fAbs}`));
        }
      }
    };

    for (const f of files) {
      try {
        const outDir = path.dirname(f)
        const result = compileContract(f, {
          out: outDir,
          artifact: true,
          optimize: true,
        });

        if (result.errors.length > 0) {
          failedCount++;
          console.log(red(`ERROR: Failed to compile ${f}`));
          continue;
        }

        successCount++;

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

  const resStr = `\nProject compilation completed!`;
  console.log(green(resStr));

  console.log(green(`\n${successCount} passing`));
  
  console.log(red(`\n${failedCount} failing`));


  exit(0);
}


module.exports = {
  compile,
};