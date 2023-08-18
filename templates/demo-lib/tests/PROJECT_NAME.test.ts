import { expect } from 'chai'
import { PROJECT_NAME } from '../src/contracts/PROJECT_NAME'
import { TestPROJECT_NAME } from '../src/contracts/testPROJECT_NAME'
import { getDefaultSigner } from './utils/txHelper'

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

        const deployTx = await testLib.deploy(1)
        console.log('TestPROJECT_NAME contract deployed: ', deployTx.id)

        const { tx: callTx, atInputIndex } = await testLib.methods.unlock1(3n)

        // 4. run `verify` method on `prevInstance`
        const result = callTx.verifyScript(atInputIndex)

        expect(result.success, result.error).to.be.true
        console.log('PROJECT_NAME contract called: ', callTx.id)
    })

    it('should pass integration test successfully.', async () => {
        const testLib = new TestPROJECT_NAME()

        await testLib.connect(getDefaultSigner())

        const deployTx = await testLib.deploy(1)
        console.log('TestPROJECT_NAME contract deployed: ', deployTx.id)

        const { tx: callTx, atInputIndex } = await testLib.methods.unlock2(3n)

        // 4. run `verify` method on `prevInstance`
        const result = callTx.verifyScript(atInputIndex)

        expect(result.success, result.error).to.be.true
        console.log('PROJECT_NAME contract called: ', callTx.id)
    })
})
