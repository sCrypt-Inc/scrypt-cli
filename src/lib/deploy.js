const fs = require('fs-extra');
const path = require('path');
const json5 = require('json5');
const { exit } = require('process');
const { green, red } = require('chalk');
const { stepCmd, camelCase, shExec, isProjectRoot } = require('./helpers');


function getDeployScript(projName) {
    return `
import { ${projName} } from './src/contracts/${camelCase(projName)}'
import { bsv, TestWallet, DefaultProvider } from 'scrypt-ts'

import * as dotenv from 'dotenv'

// Load the .env file
dotenv.config()

// Read the private key from the .env file
const privateKey = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY)

const signer = new TestWallet(privateKey, new DefaultProvider())

async function main() {
    await ${projName}.compile()
    
    const amount = 100 // TODO: Adjust the amount of sats locked in the smart contract.

    const instance = new ${projName}(
        // TODO: Pass constructor parameters.
    )

    // Connect to a signer.
    await instance.connect(signer)

    // Contract deployment.
    const deployTx = await instance.deploy(amount)
    console.log('${projName} contract deployed: ', deployTx.id)
}

main()
`
}

async function deploy({ scriptPath }) {
    if (!isProjectRoot()) {
        console.error(red(`Please run this command in the root directory of the project.`))
        exit(-1)
    }

    await stepCmd(
        'Generating private key',
        'npm run genprivkey'
    );

    if (!scriptPath) {
        scriptPath = 'deploy.ts'
    }

    // Check if script exists, if not, create one.
    if (!fs.existsSync(scriptPath)) {
        await stepCmd(
            'Building TS',
            'npx tsc'
        );

        const scryptIndex = json5.parse(fs.readFileSync('scrypt.index.json', 'utf8'));
        const projName = scryptIndex['bindings'][0]['symbol']

        fs.writeFileSync(scriptPath, getDeployScript(projName))

        const resStr = `New deploy script written to "${scriptPath}".\nPlease adjust it and run the deploy command once again!`;
        console.log(green(resStr));
        exit(0)
    }

    // Run deploy script.
    try {
        console.log(green(`Running deployment script "${scriptPath}"...`));
        await shExec(
            `npx ts-node ${scriptPath}`
        );
    } catch (e) {
        exit(-1)
    }

    exit(0);
}


module.exports = {
    deploy,
};