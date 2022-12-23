import { method, prop, SmartContractLib, ByteString } from "scrypt-ts";


export class MyLib extends SmartContractLib {

  @prop()
  buf: ByteString;

  constructor(buf: ByteString) {
    super(buf);
    this.buf = buf;
  }

  @method
  append(content: ByteString) {
    this.buf += content;
  }

  @method
  static add(x: bigint, y: bigint): bigint {
    return x + y;
  }

}
