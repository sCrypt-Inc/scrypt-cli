import { expect, use } from 'chai'
import { sha256, toByteString } from 'scrypt-ts'
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
        await instance.deploy(1)

        const callContract = async () => await instance.methods.unlock(
            toByteString('hello world', true)
        )

        return expect(callContract()).not.be.rejected
    })

    it('should throw with wrong message.', async () => {
        await instance.deploy(1)

        const callContract = async () => instance.methods.unlock(toByteString('wrong message', true))
        return expect(callContract()).to.be.rejectedWith(/Hash does not match/)
    })
})
