import {
    method,
    prop,
    SmartContractLib,
    assert,
    SmartContract,
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

// Test via smart contract:
export class TestLibContract extends SmartContract {
    @method()
    public unlock1(x: bigint) {
        assert(PROJECT_NAME.add(1n, 2n) === x)
    }

    @method()
    public unlock2(x: bigint) {
        const myLib = new PROJECT_NAME(5n)
        assert(myLib.diff(2n) === x)
    }
}
