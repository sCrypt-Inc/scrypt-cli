const { green, red, yellow } = require('chalk');
const { existsSync, renameSync, mkdirSync } = require('fs');
const { stepCmd, replaceInFile, readfile, writefile, readConfig, camelCase, camelCaseCapitalized } = require("./helpers");
const { PROJECT_NAME_TEMPLATE, PROJECT_FILENAME_TEMPLATE } = require("./project");
const path = require('path');
const { exit } = require('process');


async function configReactScriptsV5() {

    const packageJSONFilePath = path.join('.', 'package.json')
    // Install devDependencies
    await stepCmd(
        'Installing devDependencies...',
        'npm i -D react-app-rewired node-polyfill-webpack-plugin'
    );

    // reload packageJSON
    packageJSON = readfile(packageJSONFilePath);

    // replace react-scripts with react-app-rewired
    packageJSON.scripts.start = "react-app-rewired start";
    packageJSON.scripts.build = "react-app-rewired build";
    packageJSON.scripts.test = "react-app-rewired test";

    // update packageJSON
    writefile(packageJSONFilePath, packageJSON);

    // create config-overrides.js
    const webpackConfigPath = path.join('.', 'config-overrides.js')
    if (existsSync(webpackConfigPath)) {
        console.log(yellow('Found config-overrides.json, move to config-overrides.js.backup'));
        renameSync(webpackConfigPath, changeExtension(webpackConfigPath, "js.backup"))
    }

    writefile(webpackConfigPath, readConfig('config-overrides.js'))
}


async function configPackageScripts() {

    const packageJSONFilePath = path.join('.', 'package.json')

    // reload packageJSON
    packageJSON = readfile(packageJSONFilePath);

    packageJSON.scripts["build:contract"] = "npx scrypt-cli compile";
    packageJSON.scripts["deploy:contract"] = "npx ts-node --project tsconfig-scryptTS.json ./scripts/deploy.ts";
    packageJSON.scripts["genprivkey"] = "npx ts-node --project tsconfig-scryptTS.json ./scripts/privateKey.ts";
    // update packageJSON
    writefile(packageJSONFilePath, packageJSON);
}


async function configTSconfig() {

    // create tsconfig.json
    const tsConfigPath = path.join('.', 'tsconfig.json')

    if (existsSync(tsConfigPath)) {
        let tsConfigJSON = readfile(tsConfigPath);
        
        tsConfigJSON.compilerOptions.target = "ES2020";
        tsConfigJSON.compilerOptions.experimentalDecorators = true;

        writefile(tsConfigPath, tsConfigJSON)
    } else {
        console.log(red('tsconfig.json not found'));
        exit(-1);
    }
}

async function gitCommit() {
    // update gitignore
    const gitignorePath = path.join('.', '.gitignore')
    const gitignoreContent = readfile(gitignorePath, false) + '\n.env\n/artifacts\nscrypt.index.json';
    writefile(gitignorePath, gitignoreContent)
    await stepCmd("Git add all file", 'git add --all')
    await stepCmd("Git commit", 'git commit -am "Initialized sCrypt."')
}

async function createContract() {
    // create src/contracts dir
    const contractsDir = path.join('.', 'src', 'contracts')
    if (!existsSync(contractsDir)) {
        mkdirSync(contractsDir);
    }

    // create src/contracts/counter.ts
    const contractPath = path.join('.', 'src', 'contracts', `${camelCase(packageJSON.name)}.ts`);
    writefile(contractPath, readConfig('PROJECT_NAME.ts'));
    replaceInFile(contractPath, PROJECT_NAME_TEMPLATE, camelCaseCapitalized(packageJSON.name));

    // create src/contracts/README.md
    const readmePath = path.join('.', 'src', 'contracts', "README.md");
    writefile(readmePath, readConfig('README.md'));
    replaceInFile(readmePath, PROJECT_FILENAME_TEMPLATE, camelCase(packageJSON.name));
    replaceInFile(readmePath, PROJECT_NAME_TEMPLATE, camelCaseCapitalized(packageJSON.name));

    // create scripts dir
    const scriptsDir = path.join('.', 'scripts')
    if (!existsSync(scriptsDir)) {
        mkdirSync(scriptsDir);
    }
    
    // create scripts/privateKey.ts
    const privateKeyScriptPath = path.join('.', 'scripts', 'privateKey.ts')
    writefile(privateKeyScriptPath, readConfig('privateKey.ts'));
    // create scripts/deploy.ts
    const deployScriptPath = path.join('.', 'scripts', 'deploy.ts')
    writefile(deployScriptPath, readConfig('deployTemplate.ts'));
    const importTemplateDeployScript = `from '../src/contracts/${PROJECT_NAME_TEMPLATE}'`
    const importReplacementDeployScript = importTemplateDeployScript.replace(PROJECT_NAME_TEMPLATE, camelCase(packageJSON.name))
    replaceInFile(deployScriptPath, importTemplateDeployScript, importReplacementDeployScript);
    replaceInFile(deployScriptPath, PROJECT_NAME_TEMPLATE, camelCaseCapitalized(packageJSON.name));

    // Compiling contract
    await stepCmd(
        'Compiling contract',
        'npx scrypt-cli compile'
    );
}

async function init() {
    console.log(green('Initializing sCrypt in current project...'))

    const packageJSONFilePath = path.join('.', 'package.json')
    if (!existsSync(packageJSONFilePath)) {
        console.log(red('No package.json found, initialization failed.'));
        exit(-1);
    }


    const log = await stepCmd("Git status", "git status");

    if (log.includes("Untracked") || log.includes("modified")  || log.includes("to be committed")) {
        console.log(red('Please commit your current changes before initialization.'));
        exit(-1);
    }

    let packageJSON = readfile(packageJSONFilePath);

    if (!packageJSON.scripts.start.includes("react-scripts")
        || !packageJSON.scripts.build.includes("react-scripts")) {
        console.log(red('Only projects created by "create-react-app" are supported'));
        console.log(red('Initialization failed.'));
        exit(-1)
    }

    // Install dependencies
    await stepCmd(
        'Installing dependencies...',
        'npm i typescript@4.8.4 scrypt-ts@beta'
    );

    let react_scripts_version = packageJSON?.dependencies["react-scripts"] || '';

    let v = /(\d+)/.exec(react_scripts_version)[0]

    if (parseInt(v) >= 5) {
        await configReactScriptsV5();
    }

    await configTSconfig();

    await configPackageScripts();

    await createContract();

    await gitCommit();

    // Install dependencies
    await stepCmd(
        'Generating a private key...',
        'npm run genprivkey'
    );

    const resStr = `\nsCrypt has been successfully initialized!\n`;
    console.log(green(resStr));
    exit(0);
}

module.exports = {
    init,
};