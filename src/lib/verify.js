const fs = require('fs-extra');
const { exit } = require('process');
const { green, red } = require('chalk');
const { isProjectRoot } = require('./helpers');
const axios = require('axios');
const json5 = require('json5');

async function verify({ network, V, scriptHash, contractPath }) {
  
  let scryptVer = V
  const wocUrl = network == 'test' ? 'https://test.whatsonchain.com' : 'https://whatsonchain.com'

  // Read contract source
  const src = fs.readFileSync(contractPath).toString()

  if (!scryptVer) {
    try {
      // Get version from package.json
      const packageJSON = json5.parse(fs.readFileSync('package.json', 'utf8'));
      scryptVer = packageJSON.dependencies['scrypt-ts']
    } catch (e) {
      console.error(red('sCrypt version couldn\'t be read from package.json\nEither specify the version manually using the `scrytVer` option or run this command in the root of an sCrypt project.'));
      exit(-1)
    }
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