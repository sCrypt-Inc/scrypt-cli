import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
use(chaiAsPromised)
import { MethodCallOptions } from 'scrypt-ts'
import { PROJECT_NAME } from '../../src/contracts/PROJECT_NAME'
import { getDummySigner, getDummyUTXO } from './utils/txHelper'

describe('Test SmartContract `PROJECT_NAME`', () => {
    before(async () => {
        await PROJECT_NAME.compile()
    })

    it('should pass the public method unit test successfully.', async () => {
        const demo = new PROJECT_NAME(1n, 2n)

        await demo.connect(getDummySigner())

        const { tx: callTx, atInputIndex } = await demo.methods.add(3n, {
            fromUTXO: getDummyUTXO(),
        } as MethodCallOptions<PROJECT_NAME>)

        const result = callTx.verifyScript(atInputIndex)
        expect(result.success, result.error).to.eq(true)
    })

    it('should pass the non-public method unit test', () => {
        expect(PROJECT_NAME.sum(3n, 4n)).to.be.eq(7n)
    })

    it('should throw error', async () => {
        const demo = new PROJECT_NAME(1n, 2n)
        await demo.connect(getDummySigner())

        return expect(
            demo.methods.add(4n, { fromUTXO: getDummyUTXO() })
        ).to.be.rejectedWith(/add check failed/)
    })
})
