import { expect } from 'chai'
import { PROJECT_NAME } from '../src/contracts/PROJECT_NAME'
import { getDefaultSigner } from './utils/txHelper'
import { MethodCallOptions } from 'scrypt-ts'

describe('Test SmartContract `PROJECT_NAME`', () => {
    before(async () => {
        await PROJECT_NAME.compile()
    })

    it('should pass the public method unit test successfully.', async () => {
        // create a genesis instance
        const counter = new PROJECT_NAME(0n)
        // construct a transaction for deployment
        await counter.connect(getDefaultSigner())

        const deployTx = await counter.deploy(1)
        console.log('PROJECT_NAME contract deployed: ', deployTx.id)

        let prevInstance = counter

        // multiple calls
        for (let i = 0; i < 3; i++) {
            // 1. build a new contract instance
            const newPROJECT_NAME = prevInstance.next()
            // 2. apply the updates on the new instance.
            newPROJECT_NAME.increment()
            // 3. construct a transaction for contract call
            const { tx: callTx, atInputIndex } =
                await prevInstance.methods.incrementOnChain({
                    next: {
                        instance: newPROJECT_NAME,
                        balance: 1,
                    },
                } as MethodCallOptions<PROJECT_NAME>)

            // 4. run `verify` method on `prevInstance`
            const result = callTx.verifyScript(atInputIndex)

            expect(result.success, result.error).to.be.true
            console.log('PROJECT_NAME contract called: ', callTx.id)
            // prepare for the next iteration
            prevInstance = newPROJECT_NAME
        }
    })
})
