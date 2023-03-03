import { PROJECT_NAME } from '../../src/contracts/PROJECT_NAME'
import { getDefaultSigner, inputSatoshis } from './utils/txHelper'
import { toByteString, sha256 } from 'scrypt-ts'

const message = 'hello world, sCrypt!'

async function main() {
    await PROJECT_NAME.compile()
    const instance = new PROJECT_NAME(sha256(toByteString(message, true)))

    // connect to a signer
    await instance.connect(getDefaultSigner())

    // contract deployment
    const deployTx = await instance.deploy(inputSatoshis)
    console.log('PROJECT_NAME contract deployed: ', deployTx.id)

    // contract call
    const { tx: callTx } = await instance.methods.unlock(
        toByteString(message, true)
    )
    console.log('PROJECT_NAME contract `unlock` called: ', callTx.id)
}

describe('Test SmartContract `PROJECT_NAME` on testnet', () => {
    it('should succeed', async () => {
        await main()
    })
})
