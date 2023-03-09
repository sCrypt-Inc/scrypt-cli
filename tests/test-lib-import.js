const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { exit } = require('process');

const CONSUMER_SRC = `
import {
    assert,
    ByteString,
    method,
    prop,
    sha256,
    Sha256,
    SmartContract,
} from 'scrypt-ts'
import { TestLib } from 'test-lib'

export class TestConsumer extends SmartContract {
    @prop()
    x: bigint

    @prop()
    y: bigint

    constructor(x: bigint, y: bigint) {
        super(...arguments)
        this.x = x
        this.y = y
    }

    @method()
    public unlock(sum: bigint) {
        assert(TestLib.add(this.x, this.y) == sum, 'Wrong sum')
    }
}
`

try {
  const tmpDir = os.tmpdir()

  const libName = 'test-lib'
  const libDir = path.join(tmpDir, libName)
  if (fs.existsSync(libDir)) {
    fs.rmSync(libDir, { recursive: true, force: true })
  }
  execSync(`node ${__dirname}/../src/bin/index.js p --lib ${libName}`, { cwd: tmpDir })

  execSync('npm i', { cwd: libDir })
  execSync('npm run build', { cwd: libDir })

  const consumerName = 'test-consumer'
  const consumerDir = path.join(tmpDir, consumerName)
  if (fs.existsSync(consumerDir)) {
    fs.rmSync(consumerDir, { recursive: true, force: true })
  }
  execSync(`node ${__dirname}/../src/bin/index.js p ${consumerName}`, { cwd: tmpDir })

  const consumerPackageJSONPath = path.join(consumerDir, 'package.json')
  const consumerPackageJSON = JSON.parse(fs.readFileSync(consumerPackageJSONPath))
  consumerPackageJSON['devDependencies']['test-lib'] = `file:${libDir}`
  fs.writeFileSync(consumerPackageJSONPath, JSON.stringify(consumerPackageJSON))

  fs.writeFileSync(path.join(consumerDir, 'src', 'contracts', 'testConsumer.ts'), CONSUMER_SRC)

  fs.rmSync(path.join(consumerDir, 'tests'), { recursive: true, force: true })

  execSync('npm i', { cwd: consumerDir })

  const modulePath = path.join(consumerDir, 'node_modules', 'test-lib')
  fs.rmSync(modulePath)
  fs.copySync(libDir, modulePath)

  execSync('npm run build', { cwd: consumerDir })
} catch (e) {
  console.error(e)
  exit(-1)
}

console.log('Library import test completed successfully...')

