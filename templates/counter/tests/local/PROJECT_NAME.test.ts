import { expect } from 'chai'
import { PROJECT_NAME } from '../../src/contracts/PROJECT_NAME'
import { randomBytes } from 'crypto'

describe('Test SmartContract `PROJECT_NAME`', () => {
    before(async () => {
        await PROJECT_NAME.compile()
    })

    it('should pass the public method unit test successfully.', async () => {
        const utxos = [
            {
                txId: randomBytes(32).toString('hex'),
                outputIndex: 0,
                script: '', // placeholder
                satoshis: 1000,
            },
        ]

        // create a genesis instance
        const counter = new PROJECT_NAME(0n).markAsGenesis()
        // construct a transaction for deployment
        const deployTx = counter.getDeployTx(utxos, 1)

        let prevTx = deployTx
        let prevInstance = counter

        // multiple calls
        for (let i = 0; i < 3; i++) {
            // 1. build a new contract instance
            const newPROJECT_NAME = prevInstance.next()
            // 2. apply the updates on the new instance.
            newPROJECT_NAME.count++
            // 3. construct a transaction for contract call
            const callTx = prevInstance.getCallTx(
                utxos,
                prevTx,
                newPROJECT_NAME
            )
            // 4. run `verify` method on `prevInstance`
            const result = prevInstance.verify((self) => {
                self.increment()
            })

            expect(result.success, result.error).to.be.true

            // prepare for the next iteration
            prevTx = callTx
            prevInstance = newPROJECT_NAME
        }
    })
})
