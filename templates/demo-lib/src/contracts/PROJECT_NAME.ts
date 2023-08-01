import {
    method,
    prop,
    SmartContractLib,
} from 'scrypt-ts'

export class PROJECT_NAME extends SmartContractLib {
    @prop()
    x: bigint

    constructor(x: bigint) {
        super(...arguments)
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