import { PROJECT_NAME } from '../src/contracts/PROJECT_NAME'
import { privateKey } from './privateKey'
import { bsv, TestWallet, DefaultProvider } from 'scrypt-ts'


async function main() {
    await PROJECT_NAME.compile()

    // Prepare signer. 
    // See https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#prepare-a-signer-and-provider
    const signer = new TestWallet(privateKey, new DefaultProvider({
        network: bsv.Networks.testnet
    }))

    // TODO: Adjust the amount of satoshis locked in the smart contract:
    const amount = 100

    const instance = new PROJECT_NAME(
        // TODO: Pass constructor parameter values.
        0n
    )

    // Connect to a signer.
    await instance.connect(signer)

    // Contract deployment.
    const deployTx = await instance.deploy(amount)
    console.log('PROJECT_NAME contract deployed: ', deployTx.id)
}

main()
