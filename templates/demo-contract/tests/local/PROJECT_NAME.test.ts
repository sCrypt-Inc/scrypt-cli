import { expect, use } from 'chai'
import { MethodCallOptions, sha256, toByteString } from 'scrypt-ts'
import { PROJECT_NAME } from '../../src/contracts/PROJECT_NAME'
import { getDummySigner, getDummyUTXO } from './utils/txHelper'
import chaiAsPromised from 'chai-as-promised'
use(chaiAsPromised)

describe('Test SmartContract `PROJECT_NAME`', () => {
    let instance: PROJECT_NAME

    before(async () => {
        await PROJECT_NAME.compile()
        instance = new PROJECT_NAME(sha256(toByteString('hello world', true)))
        await instance.connect(getDummySigner())
    })

    it('should pass the public method unit test successfully.', async () => {
        const { tx: callTx, atInputIndex } = await instance.methods.unlock(
            toByteString('hello world', true),
            {
                fromUTXO: getDummyUTXO(),
            } as MethodCallOptions<PROJECT_NAME>
        )

        const result = callTx.verifyScript(atInputIndex)
        expect(result.success, result.error).to.eq(true)
    })

    it('should throw with wrong message.', async () => {
        return expect(
            instance.methods.unlock(toByteString('wrong message', true), {
                fromUTXO: getDummyUTXO(),
            } as MethodCallOptions<PROJECT_NAME>)
        ).to.be.rejectedWith(/Not expected message!/)
    })
})
