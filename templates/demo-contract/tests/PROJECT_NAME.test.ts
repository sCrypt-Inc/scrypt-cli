import { expect, use } from 'chai'
import { sha256, toByteString } from 'scrypt-ts'
import { PROJECT_NAME } from '../src/contracts/PROJECT_NAME'
import { getDefaultSigner } from './utils/txHelper'
import chaiAsPromised from 'chai-as-promised'
use(chaiAsPromised)

describe('Test SmartContract `PROJECT_NAME`', () => {
    let instance: PROJECT_NAME

    before(async () => {
        await PROJECT_NAME.loadArtifact()

        instance = new PROJECT_NAME(sha256(toByteString('hello world', true)))
        await instance.connect(getDefaultSigner())
    })

    it('should pass the public method unit test successfully.', async () => {
        const deployTx = await instance.deploy(1)
        console.log(`Deployed contract ${PROJECT_NAME}: ${deployTx.id}`)

        const call = async () => {
            const callRes = await instance.methods.unlock(
                toByteString('hello world', true)
            )
            
            console.log(`Called "unlock" method: ${callRes.tx.id}`)
        }
        await expect(call()).not.to.be.rejected
    })

    it('should throw with wrong message.', async () => {
        await instance.deploy(1)

        const call = async () => instance.methods.unlock(toByteString('wrong message', true))
        await expect(call()).to.be.rejectedWith(/Hash does not match/)
    })
})
