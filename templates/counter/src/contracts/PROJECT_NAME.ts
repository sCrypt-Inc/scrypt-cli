import {
    method,
    prop,
    SmartContract,
    hash256,
    assert,
    ByteString,
} from 'scrypt-ts'

export class PROJECT_NAME extends SmartContract {
    // Stateful property to store counters value.
    @prop(true)
    count: bigint

    constructor(count: bigint) {
        super(...arguments)
        this.count = count
    }

    @method()
    public incrementOnChain() {
        // Increment counter value
        this.increment()

        // Make sure balance in the contract does not change.
        const amount: bigint = this.ctx.utxo.value
        // Outputs containing the latest state and an optional change output.
        const outputs: ByteString =
            this.buildStateOutput(amount) + this.buildChangeOutput()
        // Verify current tx has the same outputs.
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    @method()
    increment(): void {
        this.count++
    }
}
