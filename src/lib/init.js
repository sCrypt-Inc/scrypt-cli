const { green, red } = require('chalk');
const { existsSync, mkdirSync } = require('fs');
const { stepCmd, replaceInFile, readfile, writefile, readConfig, camelCase, camelCaseCapitalized, writeAsset } = require("./helpers");
const { PROJECT_NAME_TEMPLATE } = require("./project");
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
    writeAsset('./config-overrides.js')
}

async function configNext() {
    // install dependencies
    await stepCmd(
        'Installing dependencies...',
        'npm i dotenv@10.0.0'
    );

    // override next.config.js
    writeAsset('./next.config.js')
}

async function configVue() {
    // install dependencies
    await stepCmd(
        'Installing dependencies...',
        'npm i node-polyfill-webpack-plugin'
    );

    // override vue.config.js
    writeAsset('./vue.config.js')
}

async function configAngular(projectName) {
    // install dependencies
    await stepCmd(
        'Installing dependencies...',
        'npm i dotenv@10.0.0 @angular-builders/custom-webpack node-polyfill-webpack-plugin'
    );

    // create webpack.config.js
    const webpackConfigFileName = 'webpack.config.js'
    writeAsset(`./${webpackConfigFileName}`)


    // update angularJSON
    const angularJSONFilePath = path.join('.', 'angular.json')
    const angularJSON = readfile(angularJSONFilePath);

    angularJSON.projects[projectName].architect.build.builder = '@angular-builders/custom-webpack:browser'
    angularJSON.projects[projectName].architect.build.options.customWebpackConfig = {
        path: webpackConfigFileName,
        "replaceDuplicatePlugins": true
    }
    angularJSON.projects[projectName].architect.build.configurations.production.budgets[0].maximumError = '10mb'

    angularJSON.projects[projectName].architect.serve.builder = '@angular-builders/custom-webpack:dev-server'
    angularJSON.projects[projectName].architect.serve.options = {
        browserTarget: `${projectName}:build`
    }

    angularJSON.projects[projectName].architect["extract-i18n"].builder = '@angular-builders/custom-webpack:extract-i18n'

    angularJSON.projects[projectName].architect.test.builder = '@angular-builders/custom-webpack:karma'

    writefile(angularJSONFilePath, angularJSON);


    // override src/index.html
    writeAsset('src/index.html')
    replaceInFile('src/index.html', PROJECT_NAME_TEMPLATE, camelCaseCapitalized(projectName));
}

async function configPackageScripts() {

    const packageJSONFilePath = path.join('.', 'package.json')

    // reload packageJSON
    packageJSON = readfile(packageJSONFilePath);

    packageJSON.scripts["build:contract"] = "npx scrypt-cli compile";
    packageJSON.scripts["deploy:contract"] = "npx ts-node --project tsconfig-scryptTS.json ./scripts/deploy.ts";
    packageJSON.scripts["verify:contract"] = `npx scrypt-cli verify $(cat .scriptHash) ./src/contracts/${camelCase(packageJSON.name)}.ts`;
    packageJSON.scripts["genprivkey"] = "npx ts-node --project tsconfig-scryptTS.json ./scripts/privateKey.ts";
    // update packageJSON
    writefile(packageJSONFilePath, packageJSON);
}


async function configTSconfig() {

    // update tsconfig.json
    let tsConfigPath = path.join('.', 'tsconfig.json')

    if (existsSync(tsConfigPath)) {
        let tsConfigJSON = readfile(tsConfigPath);

        tsConfigJSON.compilerOptions.target = "ES2020";
        tsConfigJSON.compilerOptions.experimentalDecorators = true;
        tsConfigJSON.compilerOptions.resolveJsonModule = true;
        tsConfigJSON.compilerOptions.allowSyntheticDefaultImports = true;
        tsConfigJSON.compilerOptions.noImplicitAny = false;

        writefile(tsConfigPath, tsConfigJSON)

        console.log(green('tsconfig.json updated'));
    } else {
        console.log(red('tsconfig.json not found'));
        exit(-1);
    }

    // create tsconfig-scryptTS.json
    tsConfigPath = path.join('.', 'tsconfig-scryptTS.json')
    if (!existsSync(tsConfigPath)) {
        writefile(tsConfigPath, readConfig('tsconfig.json'));
        console.log(green(`${tsConfigPath} created`))
    } else {
        console.log(green(`${tsConfigPath} exists`))
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
        mkdirSync(contractsDir, { recursive: true });
    }

    // create src/contracts/counter.ts
    const contractPath = path.join('.', 'src', 'contracts', `${camelCase(packageJSON.name)}.ts`);
    writefile(contractPath, readConfig('PROJECT_NAME.ts'));
    replaceInFile(contractPath, PROJECT_NAME_TEMPLATE, camelCaseCapitalized(packageJSON.name));

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
        'npx scrypt-cli@latest compile'
    );
}

function scriptIncludes(scripts, includes) {
    for (const k in includes) {
        const v = includes[k]
        const script = scripts[k]
        if (!script || !script.includes(v)) {
            return false
        }
    }
    return true
}

function majorVersion(dependency) {
    return parseInt(/(\d+)/.exec(dependency || '')[0])
}

async function init() {
    console.log(green('Initializing sCrypt in current project...'))

    const packageJSONFilePath = path.join('.', 'package.json')
    if (!existsSync(packageJSONFilePath)) {
        console.log(red('No package.json found, initialization failed.'));
        exit(-1);
    }


    const log = await stepCmd("Git status", "git status");

    if (log.includes("Untracked") || log.includes("modified") || log.includes("to be committed")) {
        console.log(red('Please commit your current changes before initialization.'));
        exit(-1);
    }

    let packageJSON = readfile(packageJSONFilePath);

    const isReactProject = scriptIncludes(packageJSON.scripts, { start: 'react-scripts', build: 'react-scripts' })
    const isNextProject = scriptIncludes(packageJSON.scripts, { start: 'next', build: 'next' })
    const isVueProject = scriptIncludes(packageJSON.scripts, { serve: 'vue-cli-service', build: 'vue-cli-service' })
    const isAngularProject = scriptIncludes(packageJSON.scripts, { start: 'ng', build: 'ng' })

    if (isReactProject) {
        const reactScriptsVersion = majorVersion(packageJSON?.dependencies["react-scripts"])
        if (reactScriptsVersion >= 5) {
            await configReactScriptsV5();
        }
    } else if (isNextProject) {
        await configNext();
    } else if (isVueProject) {
        await configVue();
    } else if (isAngularProject) {
        await configAngular(packageJSON.name)
    } else {
        console.log(red('Only projects created by "create-react-app", "create-next-app", "@vue/cli", or "@angular/cli" are supported'));
        console.log(red('Initialization failed.'));
        exit(-1)
    }

    // Install scrypt-ts
    await stepCmd(
        'Installing dependencies...',
        isAngularProject ? 'npm i scrypt-ts@ts5' : 'npm i typescript@4.8.4 scrypt-ts@beta'
    );

    await configTSconfig();

    await configPackageScripts();

    await createContract();

    await gitCommit();

    // Generate a new private key
    await stepCmd(
        'Generating a private key...',
        'npm run genprivkey'
    );

    const resStr = `
sCrypt has been successfully initialized!
You can compile contract with "npm run build:contract",
and deploy contract with "npm run deploy:contract"`;
    console.log(green(resStr));
    exit(0);
}

module.exports = {
    init,
};