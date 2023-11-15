import { expect, use } from 'chai'
import { PROJECT_NAME } from '../src/contracts/PROJECT_NAME'
import { getDefaultSigner } from './utils/txHelper'
import { MethodCallOptions } from 'scrypt-ts'
import chaiAsPromised from 'chai-as-promised'
use(chaiAsPromised)

describe('Test SmartContract `PROJECT_NAME`', () => {
    before(async () => {
        await PROJECT_NAME.loadArtifact()
    })

    it('should pass the public method unit test successfully.', async () => {
        // Create an initial instance of the counter smart contract.
        const counter = new PROJECT_NAME(0n)
        await counter.connect(getDefaultSigner())

        // Deploy the instance.
        const deployTx = await counter.deploy(1)
        console.log(`Deployed contract "PROJECT_NAME": ${deployTx.id}`)

        let prevInstance = counter

        // Perform multiple contract calls:
        for (let i = 0; i < 3; i++) {
            // 1. Build a new contract instance.
            const newPROJECT_NAME = prevInstance.next()

            // 2. Apply updates on the new instance in accordance to the contracts requirements.
            newPROJECT_NAME.increment()

            // 3. Perform the contract call.
            const call = async () => {
                const callRes = await prevInstance.methods.incrementOnChain({
                    next: {
                        instance: newPROJECT_NAME,
                        balance: 1,
                    },
                } as MethodCallOptions<PROJECT_NAME>)
                
                console.log(`Called "incrementOnChain" method: ${callRes.tx.id}`)
            }
            await expect(call()).not.to.be.rejected

            // Set new instance as the current one.
            prevInstance = newPROJECT_NAME
        }
    })
})
