import {
    method,
    prop,
    SmartContract,
    hash256,
    assert,
    bsv,
    UTXO,
    ByteString,
} from 'scrypt-ts'

export class PROJECT_NAME extends SmartContract {
    // Stateful property to store counters value.
    @prop(true)
    count: bigint

    // Current balance of the contract. This is only stored locally.
    private balance: number

    constructor(count: bigint) {
        super(...arguments)
        this.count = count
    }

    @method()
    public increment() {
        // Increment counter value.
        this.count++

        // Make sure balance in the contract does not change.
        const amount: bigint = this.ctx.utxo.value
        // Output containing the latest state.
        const output: ByteString = this.buildStateOutput(amount)
        // Verify current tx has this single output.
        assert(this.ctx.hashOutputs == hash256(output), 'hashOutputs mismatch')
    }

    // Local method to construct deployment TX.
    getDeployTx(utxos: UTXO[], initBalance: number): bsv.Transaction {
        this.balance = initBalance
        const tx = new bsv.Transaction().from(utxos).addOutput(
            new bsv.Transaction.Output({
                script: this.lockingScript,
                satoshis: initBalance,
            })
        )
        this.from = { tx, outputIndex: 0 }
        return tx
    }

    // Local method to construct TX calling deployed smart contract.
    getCallTx(
        utxos: UTXO[],
        prevTx: bsv.Transaction,
        nextInst: PROJECT_NAME
    ): bsv.Transaction {
        const inputIndex = 0
        return new bsv.Transaction()
            .addInputFromPrevTx(prevTx)
            .from(utxos)
            .setOutput(0, (tx: bsv.Transaction) => {
                nextInst.from = { tx, outputIndex: 0 }
                return new bsv.Transaction.Output({
                    script: nextInst.lockingScript,
                    satoshis: this.balance,
                })
            })
            .setInputScript(
                {
                    inputIndex,
                    sigtype: bsv.crypto.Signature.ANYONECANPAY_SINGLE,
                },
                (tx: bsv.Transaction) => {
                    this.to = { tx, inputIndex }
                    return this.getUnlockingScript((self) => {
                        self.increment()
                    })
                }
            )
    }
}
