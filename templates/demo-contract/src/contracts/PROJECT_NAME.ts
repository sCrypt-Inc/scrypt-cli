import { method, prop, SmartContract, assert } from 'scrypt-ts'

export class PROJECT_NAME extends SmartContract {
    @prop()
    readonly x: bigint

    @prop()
    readonly y: bigint

    // The values of the x and y properties get passed via the
    // smart contracts constructor.
    constructor(x: bigint, y: bigint) {
        super(...arguments)
        this.x = x
        this.y = y
    }

    // Contract internal method to compute x + y.
    @method()
    static sum(a: bigint, b: bigint): bigint {
        return a + b
    }

    // Public method which can be unlocked by providing the solution to x + y.
    @method()
    public add(z: bigint) {
        assert(z == PROJECT_NAME.sum(this.x, this.y), 'add check failed')
    }

    // Public method which can be unlocked by providing the solution to x - y.
    @method()
    public sub(z: bigint) {
        assert(z == this.x - this.y, 'sub check failed')
    }
}
