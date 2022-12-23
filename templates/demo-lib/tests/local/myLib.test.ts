import { expect } from 'chai';
import { assert, method, SmartContract } from 'scrypt-ts';
import { MyLib } from '../../src/contracts/myLib';


// Test lib directly:
describe('Test SmartContractLib `MyLib`', () => {
  it('should pass unit test successfully.', () => {
    expect(MyLib.add(1n, 2n)).to.eq(3n);
  })
})


// Test via smart contract:
class TestLibContract extends SmartContract {
  @method
  public unlock(x: bigint) {
    assert(MyLib.add(1n, 2n) === x);
  }
}

describe('Test SmartContractLib `Lib`', () => {
  before(async() => {
    await TestLibContract.compile();
  })

  it('should pass integration test successfully.', () => {
    let testLib = new TestLibContract();
    let result = testLib.verify(self => self.unlock(3n));
    expect(result.success, result.error).to.be.true;
  }
})