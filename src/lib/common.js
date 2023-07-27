
const path = require('path');
const { stepCmd, readAsset, writefile } = require("./helpers");

async function createAsmDir(){
    const step = 'Creating .asm dir ';
    const asmDir = path.join('.', '.asm')
    await stepCmd(
      step,
      `mkdir ${asmDir} && echo "{}" > ${asmDir}/asm.json`
    );
    writefile(path.join(asmDir, 'apply_asm.js'), readAsset('apply_asm.js'))
}

module.exports = {
    createAsmDir,
};