const fs = require('fs-extra');
const { exit } = require('process');
const { green, red } = require('chalk');
const { isProjectRoot } = require('./helpers');
const axios = require('axios');
const json5 = require('json5');

async function verify({ network, scryptVer, scriptHash, contractPath }) {

  const wocUrl = network == 'test' ? 'https://test.whatsonchain.com' : 'https://whatsonchain.com'

  if (!isProjectRoot()) {
    console.error(red(`Please run this command in the root directory of the project.`))
    exit(-1)
  }

  // Read contract source
  const src = fs.readFileSync(contractPath).toString()

  if (!scryptVer) {
    // Get version from package.json
    const packageJSON = json5.parse(fs.readFileSync('package.json', 'utf8'));
    scryptVer = packageJSON.dependencies['scrypt-ts']
  }

  const url = `https://woc.scrypt.io/api/${network}/${scriptHash}?ver=${scryptVer}`

  const payload = {
    code: src
  };

  const options = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  axios
    .post(url, payload, options)
    .then((response) => {
      const resStr = `\nContract was successfully verified! ✓\nCheck the sCrypt tab at ${wocUrl}/script/${scriptHash}`;

      console.log(green(resStr));
      exit(0);
    })
    .catch((error) => {
      if (error.response) {
        if (error.response.status == 409) {
          const resStr = `\n${error.response.data}\nCheck the sCrypt tab at ${wocUrl}/script/${scriptHash}`;

          console.log(green(resStr));
          exit(0);
        }
        console.error(
          red(`Request failed with status code: ${error.response.status}, message: ${error.response.data}`)
        );
      } else {
        console.error(red('Error:', error.message));
      }
      exit(-1)
    });
}


module.exports = {
  verify,
};