import { expect, use } from 'chai'
import { PROJECT_NAME } from '../src/contracts/PROJECT_NAME'
import { getDefaultSigner } from './utils/txHelper'
import { MethodCallOptions } from 'scrypt-ts'
import chaiAsPromised from 'chai-as-promised'
use(chaiAsPromised)

describe('Test SmartContract `PROJECT_NAME`', () => {
    before(async () => {
        await PROJECT_NAME.compile()
    })

    it('should pass the public method unit test successfully.', async () => {
        // create a genesis instance
        const counter = new PROJECT_NAME(0n)
        // construct a transaction for deployment
        await counter.connect(getDefaultSigner())

        await counter.deploy(1)

        let prevInstance = counter

        // multiple calls
        for (let i = 0; i < 3; i++) {
            // 1. build a new contract instance
            const newPROJECT_NAME = prevInstance.next()
            // 2. apply the updates on the new instance.
            newPROJECT_NAME.increment()
            // 3. construct a transaction for contract call
            const callContract = async () => prevInstance.methods.incrementOnChain({
                    next: {
                        instance: newPROJECT_NAME,
                        balance: 1,
                    },
                } as MethodCallOptions<PROJECT_NAME>)

            await expect(callContract()).not.be.rejected

            // prepare for the next iteration
            prevInstance = newPROJECT_NAME
        }
    })
})
