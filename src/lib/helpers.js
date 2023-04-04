const ora = require('ora');
const util = require('util');
const sh = require('shelljs');
const fs = require('fs');
const { green, red } = require('chalk');
const { readdir } = require('fs/promises');
const { join, basename, dirname, extname } = require('path');
const { exit, cwd } = require('process');

const shExec = util.promisify(sh.exec);
const isWindows = process.platform === 'win32';


async function readdirRecursive(dir) {
  const files = await readdir(dir, { withFileTypes: true });

  const paths = files.map(async file => {
    const p = join(dir, file.name);

    if (file.isDirectory()) return await readdirRecursive(p);

    return p;
  });

  return (await Promise.all(paths)).flat(Infinity);
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
    exit(-1);
  }
}

/**
 * Helper for any steps that need to call a shell command.
 * @param {string} step - Name of step to show user
 * @param {string} cmd - Shell command to execute.
 * @returns {Promise<string>}
 */
async function stepCmd(step, cmd) {
  const spin = ora({ text: `${step}...\n`, discardStdin: true }).start();
  try {
    const result = await shExec(cmd);
    spin.succeed(green(step));
    return result;
  } catch (err) {
    console.log(err);
    spin.fail(step);
    exit(-1);
  }
}

/**
 * Helper to replace text in a file.
 * @param {string} file - Path to file
 * @param {string} a - Old text.
 * @param {string} b - New text.
 */
function replaceInFile(file, a, b) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replaceAll(a, b);
  fs.writeFileSync(file, content);
}

/**
 * Helper to read a json
 * @param {string} file 
 * @param {boolean} if returns json format 
 * @returns 
 */
function readfile(file, json = true) {
  const content = fs.readFileSync(file, 'utf8');
  if (json) {
    return JSON.parse(content);
  }
  return content;
}

/**
 *  Helper to write a json object to file
 * @param {string} path of file 
 * @param {object | string} object or text to save
 */
function writefile(file, content) {
  if (typeof content === "string") {
    fs.writeFileSync(file, content);
  } else {
    fs.writeFileSync(file, JSON.stringify(content, null, 2));
  }
}


/**
 * Helper to change file extension in a path
 * @param {string} the path of a file 
 * @param {string} extension 
 * @returns 
 */
function changeExtension(file, extension) {
  const name = basename(file, extname(file))
  return join(dirname(file), name + "." + extension)
}


/**
 * read config in src/configs
 * @param {string} config filename 
 * @returns 
 */
function readAsset(filename) {
  return readfile(join(dirname(__filename), '..', 'asserts', filename), false);
}

function isProjectRoot(dirPath = cwd()) {
  return fs.existsSync('package.json') &&
         fs.existsSync('tsconfig.json')
}

function titleCase(str) {
  return str
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase())
    .join(' ').replace("Scrypt", "sCrypt");
}

function kebabCase(str) {
  return str.toLowerCase().replace(' ', '-');
}

function camelCase(str) {
  const a = str.toLowerCase()
    .replace(/[-_\s.]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  return a.substring(0, 1).toLowerCase() + a.substring(1);
}

function camelCaseCapitalized(str) {
  const a = camelCase(str)
  return a.substring(0, 1).toUpperCase() + a.substring(1);
}

module.exports = {
  step,
  stepCmd,
  shExec,
  readdirRecursive,
  replaceInFile,
  readfile,
  writefile,
  changeExtension,
  readConfig: readAsset,
  isProjectRoot,
  titleCase,
  kebabCase,
  camelCase,
  camelCaseCapitalized
};
