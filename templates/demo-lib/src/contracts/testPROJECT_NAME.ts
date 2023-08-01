
import {
    method,
    assert,
    SmartContract,
} from 'scrypt-ts'

import { PROJECT_NAME } from './PROJECT_NAME'

// Test via smart contract:
export class TestPROJECT_NAME extends SmartContract {
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