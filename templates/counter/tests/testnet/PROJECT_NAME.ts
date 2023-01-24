import { PROJECT_NAME } from '../../src/contracts/PROJECT_NAME'
import { signAndSend } from './util/txHelper'
import { privateKey } from './util/privateKey'
import { getUtxoManager } from './util/utxoManager'

async function main() {
    await PROJECT_NAME.compile()
    const utxoMgr = await getUtxoManager()

    // contract deployment
    // 1. create a genesis instance
    const counter = new PROJECT_NAME(0n).markAsGenesis()
    // 2. get the available utxos for the private key
    const utxos = await utxoMgr.getUtxos()
    // 3. construct a transaction for deployment
    const unsignedDeployTx = counter.getDeployTx(utxos, 1)
    // 4. sign and broadcast the transaction
    const deployTx = await signAndSend(unsignedDeployTx)
    console.log('PROJECT_NAME deploy tx:', deployTx.id)

    // collect the new p2pkh utxo if it exists in `deployTx`
    utxoMgr.collectUtxoFrom(deployTx)

    // fee in satoshis for `callTx`, can be estimated in local tests by calling `tx.getEstimateFee()`.
    const fee = 230
    let prevTx = deployTx
    let prevInstance = counter

    // calling contract multiple times
    for (let i = 0; i < 3; i++) {
        // 1. build a new contract instance
        const newPROJECT_NAME = prevInstance.next()
        // 2. apply the updates on the new instance.
        newPROJECT_NAME.count++
        // 3. get the available utxos for the private key
        const utxos = await utxoMgr.getUtxos(fee)
        // 4. construct a transaction for contract call
        const unsignedCallTx = prevInstance.getCallTx(
            utxos,
            prevTx,
            newPROJECT_NAME
        )
        // 5. sign and broadcast the transaction
        const callTx = await signAndSend(unsignedCallTx, privateKey, false)
        console.log(
            'PROJECT_NAME call tx: ',
            callTx.id,
            ', count updated to: ',
            newPROJECT_NAME.count
        )

        // prepare for the next iteration
        prevTx = callTx
        prevInstance = newPROJECT_NAME
    }
}

describe('Test SmartContract `PROJECT_NAME` on testnet', () => {
    it('should success', async () => {
        await main()
    })
})
