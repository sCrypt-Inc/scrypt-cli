const { green, red, yellow } = require('chalk');
const { existsSync, renameSync, mkdirSync } = require('fs');
const { stepCmd, replaceInFile, readfile, writefile, readConfig, camelCase, camelCaseCapitalized, changeExtension } = require("./helpers");
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
    const webpackConfigFileName = 'config-overrides.js'
    const webpackConfigFilePath = path.join('.', webpackConfigFileName)
    if (existsSync(webpackConfigFilePath)) {
        console.log(yellow(`Found ${webpackConfigFileName}, move to ${webpackConfigFileName}.backup`));
        renameSync(webpackConfigFilePath, changeExtension(webpackConfigFilePath, "js.backup"))
    }

    writefile(webpackConfigFilePath, readConfig(webpackConfigFileName))
}

async function configNext() {
    // install dependencies
    await stepCmd(
        'Installing dependencies...',
        'npm i dotenv@10.0.0'
    );

    // override next.config.js
    const nextConfigFileName = 'next.config.js'
    const nextConfigFilePath = path.join('.', nextConfigFileName)
    if (existsSync(nextConfigFilePath)) {
        console.log(yellow(`Found ${nextConfigFileName}, move to ${nextConfigFileName}.backup`));
        renameSync(nextConfigFilePath, changeExtension(nextConfigFilePath, "js.backup"))
    }

    writefile(nextConfigFilePath, readConfig(nextConfigFileName))
}

async function configVue(version) {
    // install dependencies
    await stepCmd(
        'Installing dependencies...',
        'npm i dotenv@10.0.0 vite-plugin-node-polyfills'
    );

    // override vite.config.ts
    const viteConfigFileName = 'vite.config.ts'
    const viteConfigFilePath = path.join('.', viteConfigFileName)
    if (existsSync(viteConfigFilePath)) {
        console.log(yellow(`Found ${viteConfigFileName}, move to ${viteConfigFileName}.backup`));
        renameSync(viteConfigFilePath, changeExtension(viteConfigFilePath, "ts.backup"))
    }

    writefile(viteConfigFilePath, readConfig(`vite${version}.config.ts`))
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


async function configTSconfig(fileName = 'tsconfig.json') {

    // update tsconfig.json
    let tsConfigPath = path.join('.', fileName)

    if (existsSync(tsConfigPath)) {
        let tsConfigJSON = readfile(tsConfigPath);

        tsConfigJSON.compilerOptions.target = "ES2020";
        tsConfigJSON.compilerOptions.experimentalDecorators = true;
        tsConfigJSON.compilerOptions.preserveValueImports = false;
        tsConfigJSON.compilerOptions.moduleResolution = 'node';

        writefile(tsConfigPath, tsConfigJSON)

        console.log(green(`${fileName} updated`));
    } else {
        console.log(red(`${fileName} not found`));
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


    // Install dependencies
    await stepCmd(
        'Installing dependencies...',
        'npm i typescript@4.8.4 scrypt-ts@beta'
    );

    const isReactProject = scriptIncludes(packageJSON.scripts, { start: 'react-scripts', build: 'react-scripts' })
    const isNextProject = scriptIncludes(packageJSON.scripts, { start: 'next', build: 'next' })
    const isVueProject = scriptIncludes(packageJSON.scripts, { dev: 'vite', 'build-only': 'vite' })
    let isVue2Project = false, isVue3Project = false

    if (isReactProject) {
        const reactScriptsVersion = majorVersion(packageJSON?.dependencies["react-scripts"])
        if (reactScriptsVersion >= 5) {
            await configReactScriptsV5();
        }
    } else if (isNextProject) {
        await configNext();
    } else if (isVueProject) {
        const vueVersion = majorVersion(packageJSON?.dependencies["vue"])
        isVue2Project = vueVersion === 2
        isVue3Project = vueVersion === 3
        await configVue(vueVersion);
    } else {
        console.log(red('Only projects created by "create-react-app", "create-next-app", "npm create vue@2", or "npm create vue@3" are supported'));
        console.log(red('Initialization failed.'));
        exit(-1)
    }

    await configTSconfig(isVue3Project ? 'tsconfig.app.json' : 'tsconfig.json');

    await configPackageScripts();

    await createContract();

    await gitCommit();

    // Install dependencies
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