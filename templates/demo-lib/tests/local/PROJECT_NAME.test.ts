import { expect } from 'chai'
import { PROJECT_NAME } from '../../src/contracts/PROJECT_NAME'
import { TestPROJECT_NAME } from '../../src/contracts/testPROJECT_NAME'

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

    it('should pass integration test successfully.', () => {
        const testLib = new TestPROJECT_NAME()

        let result = testLib.verify((self) => self.unlock1(3n))
        expect(result.success, result.error).to.be.true

        result = testLib.verify((self) => self.unlock2(3n))
        expect(result.success, result.error).to.be.true
    })
})
