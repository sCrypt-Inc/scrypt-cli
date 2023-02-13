import { method, prop, SmartContract, assert, bsv, UTXO } from 'scrypt-ts'

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
    sum(a: bigint, b: bigint): bigint {
        return a + b
    }

    // Public method which can be unlocked by providing the solution to x + y.
    @method()
    public add(z: bigint) {
        assert(z == this.sum(this.x, this.y))
    }

    // Public method which can be unlocked by providing the solution to x - y.
    @method()
    public sub(z: bigint) {
        assert(z == this.x - this.y)
    }

    // Local method to construct deployment TX.
    getDeployTx(utxos: UTXO[], satoshis: number): bsv.Transaction {
        return new bsv.Transaction().from(utxos).addOutput(
            new bsv.Transaction.Output({
                script: this.lockingScript,
                satoshis: satoshis,
            })
        )
    }

    // Local method to construct TX that calls deployed contract.
    getCallTxForAdd(z: bigint, prevTx: bsv.Transaction): bsv.Transaction {
        return new bsv.Transaction()
            .addInputFromPrevTx(prevTx)
            .setInputScript(0, () => {
                return this.getUnlockingScript((self) => self.add(z))
            })
    }
}
