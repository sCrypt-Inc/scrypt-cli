import { PROJECT_NAME } from '../../src/contracts/PROJECT_NAME'
import { getUtxoManager } from './util/utxoManager'
import { signAndSend } from './util/txHelper'

async function main() {
    const utxoMgr = await getUtxoManager()
    await PROJECT_NAME.compile()

    const demo = new PROJECT_NAME(1n, 2n)

    // contract deployment
    // 1. get the available utxos for the private key
    const utxos = await utxoMgr.getUtxos()
    // 2. construct a transaction for deployment
    const unsignedDeployTx = demo.getDeployTx(utxos, 1000)
    // 3. sign and broadcast the transaction
    const deployTx = await signAndSend(unsignedDeployTx)
    console.log('PROJECT_NAME contract deployed: ', deployTx.id)

    // collect the new p2pkh utxo
    utxoMgr.collectUtxoFrom(deployTx)

    // contract call
    // 1. construct a transaction for call
    const unsignedCallTx = demo.getCallTxForAdd(3n, deployTx)
    // 2. sign and broadcast the transaction
    const callTx = await signAndSend(unsignedCallTx)
    console.log('PROJECT_NAME contract called: ', callTx.id)

    // collect the new p2pkh utxo if it exists in `callTx`
    utxoMgr.collectUtxoFrom(callTx)
}

describe('Test SmartContract `PROJECT_NAME` on testnet', () => {
    it('should succeed', async () => {
        await main()
    })
})
