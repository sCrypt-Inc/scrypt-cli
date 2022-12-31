const ora = require('ora');
const util = require('util');
const sh = require('shelljs');
const { green, red } = require('chalk');
const { readdir } = require('fs/promises');
const { join } = require('path');

const shExec = util.promisify(sh.exec);
const isWindows = process.platform === 'win32';


async function readdirRecursive(dir) {
  const files = await readdir( dir, { withFileTypes: true } );

  const paths = files.map( async file => {
    const p = join( dir, file.name );

    if ( file.isDirectory() ) return await readdirRecursive( p );

    return p;
  } );

  return ( await Promise.all( paths ) ).flat( Infinity );
}

/**
 * Helper for any steps for a consistent UX.
 * @template T
 * @param {string} step  Name of step to show user.
 * @param {() => Promise<T>} fn  An async function to execute.
 * @returns {Promise<T>}
 */
async function step(str, fn) {
  // discardStdin prevents Ora from accepting input that would be passed to a
  // subsequent command, like a y/n confirmation step, which would be dangerous.
  const spin = ora({ text: `${str}...`, discardStdin: true }).start();
  try {
    const result = await fn();
    spin.succeed(green(str));
    return result;
  } catch (err) {
    spin.fail(str);
    console.error('  ' + red(err)); // maintain expected indentation
    process.exit(1);
  }
}

/**
 * Helper for any steps that need to call a shell command.
 * @param {string} step - Name of step to show user
 * @param {string} cmd - Shell command to execute.
 * @returns {Promise<void>}
 */
async function stepCmd(step, cmd) {
  const spin = ora({ text: `${step}...`, discardStdin: true }).start();
  try {
    await shExec(cmd);
    spin.succeed(green(step));
  } catch (err) {
    console.log(err);
    spin.fail(step);
    process.exit(1);
  }
}


module.exports = {
  step,
  stepCmd,
  readdirRecursive
};
