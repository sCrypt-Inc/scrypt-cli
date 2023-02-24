import { PROJECT_NAME } from '../../src/contracts/PROJECT_NAME'
import { getDefaultSigner } from './util/txHelper'
import { MethodCallOptions } from 'scrypt-ts'

async function main() {
    await PROJECT_NAME.compile()

    // create a genesis instance
    const counter = new PROJECT_NAME(0n)

    // connect to a signer
    await counter.connect(getDefaultSigner())

    // contract deployment
    const deployTx = await counter.deploy(1)
    console.log('Counter deploy tx:', deployTx.id)

    let prevInstance = counter

    // multiple calls
    for (let i = 0; i < 3; i++) {
        // 1. build a new contract instance
        const newPROJECT_NAME = prevInstance.next()
        // 2. apply the updates on the new instance.
        newPROJECT_NAME.count++
        // 3. construct a transaction for contract call
        const { tx: callTx, atInputIndex } =
            await prevInstance.methods.increment({
                next: {
                    instance: newPROJECT_NAME,
                    balance: 1,
                },
            } as MethodCallOptions<PROJECT_NAME>)

        console.log(
            'Counter call tx: ',
            callTx.id,
            ', count updated to: ',
            newPROJECT_NAME.count
        )
        // prepare for the next iteration
        prevInstance = newPROJECT_NAME
    }
}

describe('Test SmartContract `Counter` on testnet', () => {
    it('should succeed', async () => {
        await main()
    })
})
