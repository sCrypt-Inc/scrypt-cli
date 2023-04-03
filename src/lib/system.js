const envinfo = require('envinfo');

function system() {
  console.log('Please include the following when submitting a Github issue:');
  envinfo
    .run(
      {
        System: ['OS', 'CPU'],
        Binaries: ['Node', 'npm', 'Yarn'],
        npmPackages: ['scrypt-ts']
      },
      { showNotFound: true }
    )
    .then((env) => {
      const str = 'scrypt-ts: Not Found';
      return env.replace(str, `${str} (not in a project)`);
    })
    .then((env) => console.log(env));
}

module.exports = { system };
