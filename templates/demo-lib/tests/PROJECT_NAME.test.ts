import { expect, use } from 'chai'
import { PROJECT_NAME } from '../src/contracts/PROJECT_NAME'
import { TestPROJECT_NAME } from '../src/contracts/testPROJECT_NAME'
import { getDefaultSigner } from './utils/txHelper'
import chaiAsPromised from 'chai-as-promised'
use(chaiAsPromised)

// Test lib directly:
describe('Test SmartContractLib `PROJECT_NAME`', () => {
    it('static function call', () => {
        expect(PROJECT_NAME.add(1n, 2n)).to.eq(3n)
    })

    it('method call', () => {
        const myLib = new PROJECT_NAME(5n)
        expect(myLib.diff(2n)).to.eq(3n)
    })
})

describe('Test SmartContractLib `Lib`', () => {
    before(async () => {
        await TestPROJECT_NAME.compile()
    })

    it('should pass integration test successfully.', async () => {
        const testLib = new TestPROJECT_NAME()

        await testLib.connect(getDefaultSigner())

        await testLib.deploy(1)

        const call = async () => testLib.methods.unlock1(3n)

        await expect(call()).not.to.be.rejected
    })

    it('should pass integration test successfully.', async () => {
        const testLib = new TestPROJECT_NAME()

        await testLib.connect(getDefaultSigner())

        await testLib.deploy(1)

        const call = async () => testLib.methods.unlock2(3n)

        await expect(call()).not.to.be.rejected
    })
})
