import { randomBytes } from 'crypto'
import {
    DummyProvider,
    DefaultProvider,
    TestWallet,
    UTXO,
    bsv,
} from 'scrypt-ts'
import { myPrivateKey } from './privateKey'

export const inputSatoshis = 10000

export const inputIndex = 0

export const dummyUTXO = {
    txId: randomBytes(32).toString('hex'),
    outputIndex: 0,
    script: '', // placeholder
    satoshis: inputSatoshis,
}

export function getDummySigner(
    privateKey?: bsv.PrivateKey | bsv.PrivateKey[]
): TestWallet {
    if (global.dummySigner === undefined) {
        global.dummySigner = new TestWallet(myPrivateKey, new DummyProvider())
    }
    if (privateKey !== undefined) {
        global.dummySigner.addPrivateKey(privateKey)
    }
    return global.dummySigner
}

export function getDummyUTXO(satoshis: number = inputSatoshis): UTXO {
    return Object.assign({}, dummyUTXO, { satoshis })
}

export function getDefaultSigner(
    privateKey?: bsv.PrivateKey | bsv.PrivateKey[]
): TestWallet {
    if (global.testnetSigner === undefined) {
        global.testnetSigner = new TestWallet(
            myPrivateKey,
            new DefaultProvider({
                network: bsv.Networks.testnet,
            })
        )
    }
    if (privateKey !== undefined) {
        global.testnetSigner.addPrivateKey(privateKey)
    }
    return global.testnetSigner
}

export const sleep = async (seconds: number) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({})
        }, seconds * 1000)
    })
}

export function randomPrivateKey() {
    const privateKey = bsv.PrivateKey.fromRandom('testnet')
    const publicKey = bsv.PublicKey.fromPrivateKey(privateKey)
    const publicKeyHash = bsv.crypto.Hash.sha256ripemd160(publicKey.toBuffer())
    const address = publicKey.toAddress()
    return [privateKey, publicKey, publicKeyHash, address] as const
}
