const { green, red } = require('chalk');
const { existsSync, mkdirSync } = require('fs');
const { stepCmd, replaceInFile, readfile, writefile, readConfig, camelCase, camelCaseCapitalized, writeAsset } = require("./helpers");
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
    writeAsset('./config-overrides.js')
}

async function configNext() {
    // install dependencies
    await stepCmd(
        'Installing devDependencies...',
        'npm i -D dotenv'
    );

    // override next.config.js
    writeAsset('./next.config.js')
}

async function configReactVite() {
    // install dev dependencies
    await stepCmd(
        'Installing dependencies...',
        'npm i -D dotenv vite-plugin-node-polyfills'
    )

    // override vite.config.ts
    writeAsset('./vite.config.ts', `react.vite.config.ts`)
}

async function configVueCli() {
    // install dependencies
    await stepCmd(
        'Installing devDependencies...',
        'npm i -D node-polyfill-webpack-plugin'
    );

    // override vue.config.js
    writeAsset('./vue.config.js')
}

async function configVueVite(vueVersion) {
    // install dev dependencies
    await stepCmd(
        'Installing dependencies...',
        'npm i -D dotenv vite-plugin-node-polyfills'
    )

    // override vite.config.ts
    writeAsset('./vite.config.ts', `vue${vueVersion}.vite.config.ts`)
}

async function configAngular(projectName) {
    // install dependencies
    await stepCmd(
        'Installing devDependencies...',
        'npm i -D dotenv @angular-builders/custom-webpack node-polyfill-webpack-plugin'
    );

    // create webpack.config.js
    const webpackConfigFileName = 'webpack.config.js'
    writeAsset(`./${webpackConfigFileName}`)


    // update angularJSON
    const angularJSONFilePath = path.join('.', 'angular.json')
    const angularJSON = readfile(angularJSONFilePath);

    angularJSON.projects[projectName].architect.build.builder = '@angular-builders/custom-webpack:browser'
    delete angularJSON.projects[projectName].architect.build.options.browser
    angularJSON.projects[projectName].architect.build.options.main = 'src/main.ts'
    angularJSON.projects[projectName].architect.build.options.customWebpackConfig = {
        path: webpackConfigFileName,
        mergeRules: {
            "externals": "replace"
        }
    }
    angularJSON.projects[projectName].architect.build.configurations.production.budgets[0].maximumError = '10mb'

    angularJSON.projects[projectName].architect.serve.builder = '@angular-builders/custom-webpack:dev-server'
    angularJSON.projects[projectName].architect.serve.options = {
        buildTarget: `${projectName}:build`
    }

    angularJSON.projects[projectName].architect["extract-i18n"].builder = '@angular-builders/custom-webpack:extract-i18n'

    angularJSON.projects[projectName].architect.test.builder = '@angular-builders/custom-webpack:karma'

    writefile(angularJSONFilePath, angularJSON);


    // override src/index.html
    writeAsset('src/index.html', "index.html")
    replaceInFile('src/index.html', PROJECT_NAME_TEMPLATE, camelCaseCapitalized(projectName));
}

async function configSvelte(projectName) {
    // install dev dependencies
    await stepCmd(
        'Installing dependencies...',
        'npm i -D dotenv vite-plugin-node-polyfills'
    )

    // override vite.config.ts
    writeAsset('./vite.config.ts', `svelte.vite.config.ts`)
    replaceInFile('./vite.config.ts', PROJECT_NAME_TEMPLATE, camelCase(projectName));
}

async function configPackageScripts() {

    const packageJSONFilePath = path.join('.', 'package.json')

    // reload packageJSON
    packageJSON = readfile(packageJSONFilePath);

    packageJSON.scripts["pretest"] = "npx scrypt-cli compile";
    packageJSON.scripts["build:contract"] = "npx scrypt-cli compile";
    packageJSON.scripts["deploy:contract"] = "npx tsx ./scripts/deploy.ts";
    packageJSON.scripts["verify:contract"] = `npx scrypt-cli verify $(cat .scriptHash) ./src/contracts/${camelCase(packageJSON.name)}.ts`;
    packageJSON.scripts["genprivkey"] = "npx tsx ./scripts/privateKey.ts";
    // update packageJSON
    writefile(packageJSONFilePath, packageJSON);
}


function configTsNodeConfig({
    isVue3ViteProject,
    isReactProject,
    isNextProject,
    isReactViteProject,
    isVueCliProject,
    isVueViteProject,
    isSvelteProject,
    isAngularProject
}, tsVersion = 5) {

    let fileName = 'tsconfig.json'
    // update tsconfig.json
    let tsConfigPath = path.join('.', fileName)

    if (existsSync(tsConfigPath)) {
        let tsConfigJSON = readfile(tsConfigPath);



        writefile(tsConfigPath, tsConfigJSON)

    } else {
        console.log(red(`${fileName} not found, only supports typescript project!`));
        exit(-1);
    }
}

function configTSconfig({
    isVue3ViteProject,
    isReactProject,
    isNextProject,
    isReactViteProject,
    isVueCliProject,
    isVueViteProject,
    isSvelteProject,
    isAngularProject
}, tsVersion = 5) {
    let fileName = 'tsconfig.json'
    // update tsconfig.json
    let tsConfigPath = path.join('.', fileName)

    if (existsSync(tsConfigPath)) {
        let tsConfigJSON = readfile(tsConfigPath);

        if (!tsConfigJSON.compilerOptions) {
            tsConfigJSON.compilerOptions = {}
        }

        switch (true) {
            // react & nextjs
            case isReactProject: {
                tsConfigJSON.compilerOptions.target = "ESNext";
                tsConfigJSON.compilerOptions.experimentalDecorators = true;
            }
                break;
            case isReactViteProject: {
                tsConfigJSON.compilerOptions.target = "ESNext";
                tsConfigJSON.compilerOptions.experimentalDecorators = true;
            }
                break;
            case isNextProject: {
                tsConfigJSON.compilerOptions.experimentalDecorators = true;
                tsConfigJSON.compilerOptions.target = "ESNext";
            }
                break;

            // vue
            case isVue3ViteProject: {
                tsConfigJSON.compilerOptions.moduleResolution = "Node";
                // update tsconfig.app.json
                const appConfig = 'tsconfig.app.json'
                let tsConfigAppJSON = readfile(appConfig);
                tsConfigAppJSON.compilerOptions.experimentalDecorators = true;
                tsConfigAppJSON.include.push("artifacts/*.json");
                writefile(appConfig, tsConfigAppJSON)
            }
                break;
            case isVueViteProject: {
                tsConfigJSON.compilerOptions.experimentalDecorators = true;
            }
                break;
            case isVueCliProject: {
                tsConfigJSON.compilerOptions.experimentalDecorators = true;
                tsConfigJSON.compilerOptions.resolveJsonModule = true;
            }
                break;

            // others
            case isSvelteProject: {
                tsConfigJSON.compilerOptions.experimentalDecorators = true;
            }
                break;
            case isAngularProject: {
                tsConfigJSON.compilerOptions.resolveJsonModule = true;
                tsConfigJSON.compilerOptions.allowSyntheticDefaultImports = true;
                tsConfigJSON.compilerOptions.noPropertyAccessFromIndexSignature = false;
                tsConfigJSON.compilerOptions.skipLibCheck = true;
            }
                break;

        }

        writefile(tsConfigPath, tsConfigJSON)

    } else {
        console.log(red(`${fileName} not found, only supports typescript project!`));
        exit(-1);
    }

    return configTsNodeConfig({
        isVue3ViteProject,
        isReactProject,
        isNextProject,
        isVueCliProject,
        isVueViteProject,
        isSvelteProject,
        isAngularProject
    }, tsVersion);
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

    // create src/contracts/counter.test.tsx
    // const contractTestPath = path.join('.', 'src', 'contracts', `${camelCase(packageJSON.name)}.test.tsx`);
    // writefile(contractTestPath, readConfig('PROJECT_NAME.test.tsx'));
    // replaceInFile(contractTestPath, PROJECT_NAME_TEMPLATE, camelCaseCapitalized(packageJSON.name));
    // replaceInFile(contractTestPath, PROJECT_FILENAME_TEMPLATE, camelCase(packageJSON.name));

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

    console.log(green(`Initialization has been successful.`));
    console.log(green(`Execute \`npx scrypt-cli compile\` to compile the contracts.`));

}

function scriptIncludes(scripts, includes) {
    for (const k in includes) {
        const v = includes[k]
        const script = scripts[k]
        if (typeof v === 'boolean') {
            if (!script) {
                return false
            }
        } else {
            if (!script || !script.includes(v)) {
                return false
            }
        }
    }
    return true
}

function dependencyIncludes(dependencies, packageName) {
    return !!dependencies[packageName]
}

function majorVersion(dependency) {
    return parseInt(/(\d+)/.exec(dependency || '')[0])
}

async function init({ force }) {
    console.log(green('Initializing sCrypt in current project...'))

    const packageJSONFilePath = path.join('.', 'package.json')
    if (!existsSync(packageJSONFilePath)) {
        console.log(red('No package.json found, initialization failed.'));
        exit(-1);
    }

    if (!force) {
        const log = await stepCmd("Git status", "git status");

        if (log.includes("Untracked") || log.includes("modified") || log.includes("to be committed")) {
            console.log(red('Please commit your current changes before initialization.'));
            exit(-1);
        }
    }

    let packageJSON = readfile(packageJSONFilePath);


    const isReactProject = scriptIncludes(packageJSON.scripts, { start: 'react-scripts', build: 'react-scripts' })
    const isReactViteProject = scriptIncludes(packageJSON.scripts, { dev: 'vite' }) && dependencyIncludes(packageJSON.dependencies, 'react')
    const isNextProject = scriptIncludes(packageJSON.scripts, { start: 'next', build: 'next' })

    const isVueCliProject = scriptIncludes(packageJSON.scripts, { serve: 'vue-cli-service', build: 'vue-cli-service' })
    const isVueViteProject = scriptIncludes(packageJSON.scripts, { dev: 'vite', 'build-only': 'vite' })
    let isVue3ViteProject = false

    const isAngularProject = scriptIncludes(packageJSON.scripts, { start: 'ng', build: 'ng' })
    const isSvelteProject = scriptIncludes(packageJSON.scripts, { dev: 'vite', build: 'vite', check: 'svelte-kit' })

    // Install dependencies
    await stepCmd(
        'Installing dependencies...',
        'npm i scrypt-ts@latest'
    );

    if (isReactProject) {
        const reactScriptsVersion = majorVersion(packageJSON?.dependencies["react-scripts"])
        if (reactScriptsVersion >= 5) {
            await configReactScriptsV5();
        }
    } else if (isNextProject) {
        await configNext();
    } else if (isReactViteProject) {
        await configReactVite();
    } else if (isVueCliProject) {
        await configVueCli();
    } else if (isVueViteProject) {
        const vueVersion = majorVersion(packageJSON?.dependencies["vue"])
        isVue3ViteProject = vueVersion === 3
        await configVueVite(vueVersion)
    } else if (isSvelteProject) {
        await configSvelte(packageJSON.name)
    } else if (isAngularProject) {
        await configAngular(packageJSON.name)
    } else {
        console.log(red('Only projects created by "create-react-app", "create-next-app", "@vue/cli", "vue@2", "vue@3", "@angular/cli", or "svelte@latest" are supported'));
        console.log(red('Initialization failed.'));
        exit(-1)
    }

    const tsStr = Object.assign({}, packageJSON?.dependencies, packageJSON?.devDependencies)["typescript"];
    if(!tsStr) {
        console.log(red('Not typescript found'));
        exit(-1) 
    }

    const tsVersion = majorVersion(tsStr)
    configTSconfig({
        isVue3ViteProject,
        isReactProject,
        isReactViteProject,
        isNextProject,
        isVueCliProject,
        isVueViteProject,
        isSvelteProject,
        isAngularProject
    }, tsVersion);

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