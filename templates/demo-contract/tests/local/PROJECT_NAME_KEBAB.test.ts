import { expect } from 'chai'
import { PROJECT_NAME } from '../../src/contracts/PROJECT_NAME_KEBAB'

describe('Test SmartContract `PROJECT_NAME`', () => {
    before(async () => {
        await PROJECT_NAME.compile()
    })

    it('should pass the public method unit test successfully.', async () => {
        const demo = new PROJECT_NAME(1n, 2n)

        let result = demo.verify(() => demo.add(3n))
        expect(result.success, result.error).to.eq(true)

        result = demo.verify(() => demo.sub(-1n))
        expect(result.success, result.error).to.eq(true)
    })

    it('should pass with negative', async () => {
        const demo = new PROJECT_NAME(-1n, -2n)

        let result = demo.verify(() => demo.add(-3n))
        expect(result.success, result.error).to.eq(true)

        result = demo.verify(() => demo.sub(1n))
        expect(result.success, result.error).to.eq(true)
    })

    it('should pass the non-public method unit test', () => {
        const demo = new PROJECT_NAME(1n, 2n)
        expect(demo.sum(3n, 4n)).to.be.eq(7n)
    })

    it('should throw error', () => {
        expect(() => {
            const demo = new PROJECT_NAME(1n, 2n)
            demo.add(4n)
        }).to.throw(/Execution failed/)

        expect(() => {
            const demo = new PROJECT_NAME(-1n, -2n)
            demo.add(-4n)
        }).to.throw(/Execution failed/)
    })
})
