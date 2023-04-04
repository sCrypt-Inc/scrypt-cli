const fs = require('fs-extra');
const path = require('path');
const json5 = require('json5');
const { exit } = require('process');
const { green, red } = require('chalk');
const { stepCmd, camelCase, shExec, isProjectRoot, writefile, replaceInFile, camelCaseCapitalized, readConfig } = require('./helpers');
const { PROJECT_NAME_TEMPLATE } = require('./project')


async function deploy({ file }) {
    if (!isProjectRoot()) {
        console.error(red(`Please run this command in the root directory of the project.`))
        exit(-1)
    }

    // TODO: If private key was generated just now, then exit.
    await stepCmd(
        'Generating private key',
        'npm run genprivkey'
    );

    if (!file) {
        file = 'deploy.ts'
    }

    // Check if script exists, if not, create one.
    if (!fs.existsSync(file)) {
        await stepCmd(
            'Building TS',
            'npx tsc'
        );

        const scryptIndex = json5.parse(fs.readFileSync('scrypt.index.json', 'utf8'));
        const projName = scryptIndex['bindings'][0]['symbol']


        // create deploy.ts
        writefile(file, readConfig('deployTemplate.ts'));
        const importTemplateDeployScript = `from './src/contracts/${PROJECT_NAME_TEMPLATE}'`
        const importReplacementDeployScript = importTemplateDeployScript.replace(PROJECT_NAME_TEMPLATE, camelCase(projName))
        replaceInFile(file, importTemplateDeployScript, importReplacementDeployScript);
        replaceInFile(file, PROJECT_NAME_TEMPLATE, camelCaseCapitalized(projName));

        const resStr = `New deploy script written to "${file}".\nPlease adjust it and run the deploy command once again!`;
        console.log(green(resStr));
        exit(0)
    }

    // Run deploy script.
    try {
        console.log(green(`Running deployment script "${file}"...`));
        await shExec(
            `npx ts-node ${file}`
        );
    } catch (e) {
        exit(-1)
    }

    exit(0);
}


module.exports = {
    deploy,
};