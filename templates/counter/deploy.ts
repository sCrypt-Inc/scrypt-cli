import { PROJECT_NAME } from './src/contracts/PROJECT_NAME'
import { bsv, TestWallet, DefaultProvider } from 'scrypt-ts'

import * as dotenv from 'dotenv'

// Load the .env file
dotenv.config()

// Read the private key from the .env file
const privateKey = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY)

const signer = new TestWallet(privateKey, new DefaultProvider())

async function main() {
    await PROJECT_NAME.compile()

    // TODO: Adjust the amount of satoshis locked in the smart contract:
    const amount = 100

    const instance = new PROJECT_NAME(
        // TODO: Adjust constructor parameter values:
        0n
    )

    // Connect to a signer.
    await instance.connect(signer)

    // Contract deployment.
    const deployTx = await instance.deploy(amount)
    console.log('PROJECT_NAME contract deployed: ', deployTx.id)
}

main()
