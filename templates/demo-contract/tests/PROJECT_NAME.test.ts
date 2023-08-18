import { expect, use } from 'chai'
import { MethodCallOptions, sha256, toByteString } from 'scrypt-ts'
import { PROJECT_NAME } from '../src/contracts/PROJECT_NAME'
import { getDefaultSigner } from './utils/txHelper'
import chaiAsPromised from 'chai-as-promised'
use(chaiAsPromised)

describe('Test SmartContract `PROJECT_NAME`', () => {
    let instance: PROJECT_NAME

    before(async () => {
        await PROJECT_NAME.compile()
        instance = new PROJECT_NAME(sha256(toByteString('hello world', true)))
        await instance.connect(getDefaultSigner())
    })

    it('should pass the public method unit test successfully.', async () => {
        const deployTx = await instance.deploy(1)
        console.log('PROJECT_NAME contract deployed: ', deployTx.id)

        const { tx: callTx, atInputIndex } = await instance.methods.unlock(
            toByteString('hello world', true)
        )

        const result = callTx.verifyScript(atInputIndex)
        expect(result.success, result.error).to.eq(true)
    })

    it('should throw with wrong message.', async () => {
        const deployTx = await instance.deploy(1)
        console.log('PROJECT_NAME contract deployed: ', deployTx.id)

        return expect(
            instance.methods.unlock(toByteString('wrong message', true))
        ).to.be.rejectedWith(/Hash does not match/)
    })
})
