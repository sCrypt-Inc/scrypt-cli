const fs = require('fs-extra');
const path = require('path');
const { exit } = require('process');
const { green, red } = require('chalk');
const { stepCmd, shExec, isProjectRoot } = require('./helpers');


async function deploy({ file }) {
    if (!isProjectRoot()) {
        console.error(red(`Please run this command in the root directory of the project.`))
        exit(-1)
    }


    if (file && !fs.existsSync(file)) {
        console.error(red(`Deploy script "${file}" not found.`))
        exit(-1)
    }

    // TODO: If private key was generated just now, then exit.
    await stepCmd(
        'Generating private key',
        'npm run genprivkey'
    );



    // Run deploy script.
    try {

        let deployScriptPath = file ? file : path.join('.', 'deploy.ts');

        if (!fs.existsSync(deployScriptPath)) {
            deployScriptPath = path.join('.', 'scripts', 'deploy.ts')
        }
    
        // Check if script exists, if not, create one.
        if (!fs.existsSync(deployScriptPath)) {
            console.error(red(`Not deploy script found.`))
            exit(-1)
        }

        
        console.log(green(`Running deployment script "${deployScriptPath}"...`));

        await shExec(`npx ts-node ${deployScriptPath}`);
    
    } catch (e) {
        console.error(red(`Running deployment script "${file}" failed, ${e}`));
        exit(-1)
    }

    exit(0);
}


module.exports = {
    deploy,
};