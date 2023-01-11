import { method, prop, SmartContractLib } from 'scrypt-ts'

export class MyLib extends SmartContractLib {
    @prop()
    x: bigint

    constructor(x: bigint) {
        super(x)
        this.x = x
    }

    @method()
    diff(y: bigint): bigint {
        return this.x - y
    }

    @method()
    static add(x: bigint, y: bigint): bigint {
        return x + y
    }
}
