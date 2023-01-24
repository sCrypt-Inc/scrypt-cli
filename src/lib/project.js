const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const sh = require('shelljs');
const gittar = require('gittar');
const { green, red } = require('chalk');
const { stepCmd } = require("./helpers");


const ProjectType = {
  Contract: 1,
  Library: 2,
  StatefulContract: 3
}

const PROJECT_NAME_TEMPLATE = 'PROJECT_NAME'
const PROJECT_NAME_TEMPLATE_KEBAB = 'PROJECT_NAME_KEBAB'

/**
 * Create a new sCrypt project with recommended dir structure, Prettier config,
 * testing lib, etc. Warns if already exists and does NOT overwrite.
 * @param {string} projType - The user's desired project type.
 * @param {object} argv - The arguments object provided by yargs.
 * @param {string} argv.name - The user's desired project name.
 * @return {Promise<void>}
 */
async function project(projType, { name }) {
  if (fs.existsSync(name)) {
    console.error(red(`Directory already exists. Not proceeding`));
    return;
  }

  // Git must be initialized before running `npm install` b/c Husky runs an
  // NPM `prepare` script to set up its pre-commit hook within `.git`.
  // Check before fetching project template, to not leave crud on user's system.
  if (!sh.which('git')) {
    console.error(red('Please ensure Git is installed, then try again.'));
    return;
  }

  // Create path/to/dir with their desired name
  if (sh.mkdir('-p', name).code != 0) {
    return;
  }
  sh.cd(name); // Set dir for shell commands. Doesn't change user's dir in their CLI.

  // Initialize .git in the root, whether monorepo or not.
  await stepCmd('Initialize Git repo', 'git init -q');

  if (projType == ProjectType.Contract) {
    if (!(await fetchProjectTemplate("demo-contract"))) return;
  } else if (projType == ProjectType.Library) {
    if (!(await fetchProjectTemplate("demo-lib"))) return;
  } else if (projType == ProjectType.StatefulContract) {
    if (!(await fetchProjectTemplate("counter"))) return;
  } else {
    return;
  }

  // `/dev/null` on Mac or Linux and 'NUL' on Windows is the only way to silence
  // Husky's install log msg. (Note: The contract project template commits
  // package-lock.json so we can use `npm ci` for faster installation.)

  //await stepCmd(
  //  'NPM install',
  //  `npm ci --silent > ${isWindows ? 'NUL' : '"/dev/null" 2>&1'}`
  //);

  //// Build the template contract so it can be imported into the ui scaffold
  //await stepCmd('NPM build contract', 'npm run build --silent');

  await setProjectName('.', name.split(path.sep).pop());

  // `-n` (no verify) skips Husky's pre-commit hooks.
  //await stepCmd(
  //  'Git init commit',
  //  'git add . && git commit -m "Init commit" -q -n && git branch -m main'
  //);

  const resStr = `\nProject ${name} was successfully created!\n` +
    `\nAdd your Git repo URL and you're good to go:` +
    `\ncd ${name} && git remote add origin <your-repo-url>`;

  console.log(green(resStr));
  process.exit(0);
}

/**
 * Fetch project template.
 * @returns {Promise<boolean>} - True if successful; false if not.
 */
async function fetchProjectTemplate(projectName) {
  const step = 'Set up project';
  const spin = ora({ text: `${step}...`, discardStdin: true }).start();

  try {
    const src = 'github:sCrypt-Inc/scrypt-cli#master';
    await gittar.fetch(src, { force: true });

    // Note: Extract will overwrite any existing dir's contents. Ensure
    // destination does not exist before this.
    const TEMP = '.gittar-temp-dir';
    await gittar.extract(src, TEMP, {
      filter(path) {
        return path.includes(`templates/${projectName}/`);
      },
    });

    // Copy files into current working dir
    sh.cp(
      '-r',
      `${path.join(TEMP, 'templates', projectName)}${path.sep}.`,
      '.'
    );
    sh.rm('-r', TEMP);

    spin.succeed(green(step));
    return true;
  } catch (err) {
    spin.fail(step);
    console.error(err);
    return false;
  }
}

/**
 * Step to replace placeholder names in the project with the properly-formatted
 * version of the user-supplied name as specified via `zk project <name>`
 * @param {string} dir - Path to the dir containing target files to be changed.
 * @param {string} name - User-provided project name.
 * @returns {Promise<void>}
 */
async function setProjectName(dir, name) {
  const step = 'Set project name';
  const spin = ora(`${step}...`).start();

  replaceInFile(path.join(dir, 'README.md'), PROJECT_NAME_TEMPLATE, titleCase(name));
  replaceInFile(
    path.join(dir, 'package.json'),
    'package-name',
    kebabCase(name)
  );

  // Rename contract and test files w project name.
  // Also rename template inside these files.
  let dirContracts = path.join(dir, 'src', 'contracts')
  let fContract = path.join(dirContracts, PROJECT_NAME_TEMPLATE_KEBAB + '.ts')
  let fContractNew = fContract.replace(PROJECT_NAME_TEMPLATE_KEBAB, name)
  if (fs.existsSync(fContract)) {
    sh.mv(fContract, fContractNew)
    replaceInFile(fContractNew, PROJECT_NAME_TEMPLATE, titleCase(name));
    replaceInFile(fContractNew, PROJECT_NAME_TEMPLATE_KEBAB, kebabCase(name));
  }

  let dirTestsLocal = path.join(dir, 'tests', 'local')
  let fTestLocal = path.join(dirTestsLocal, PROJECT_NAME_TEMPLATE_KEBAB + '.test.ts')
  let fTestLocalNew = fTestLocal.replace(PROJECT_NAME_TEMPLATE_KEBAB, name)
  if (fs.existsSync(fTestLocal)) {
    sh.mv(fTestLocal, fTestLocalNew)
    replaceInFile(fTestLocalNew, PROJECT_NAME_TEMPLATE, titleCase(name));
    replaceInFile(fTestLocalNew, PROJECT_NAME_TEMPLATE_KEBAB, kebabCase(name));
  }

  let dirTestsTestnet = path.join(dir, 'tests', 'testnet')
  let fTestTestnet = path.join(dirTestsTestnet, PROJECT_NAME_TEMPLATE_KEBAB + '.ts')
  let fTestTestnetNew = fTestTestnet.replace(PROJECT_NAME_TEMPLATE_KEBAB, name)
  if (fs.existsSync(fTestTestnet)) {
    sh.mv(fTestTestnet, fTestTestnetNew)
    replaceInFile(fTestTestnetNew, PROJECT_NAME_TEMPLATE, titleCase(name));
    replaceInFile(fTestTestnetNew, PROJECT_NAME_TEMPLATE_KEBAB, kebabCase(name));
  }

  spin.succeed(green(step));
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

function titleCase(str) {
  return str
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase())
    .join(' ').replace("Scrypt", "sCrypt");
}

function kebabCase(str) {
  return str.toLowerCase().replace(' ', '-');
}

module.exports = {
  project,
  ProjectType,
  setProjectName,
  replaceInFile,
  titleCase,
  kebabCase,
};
