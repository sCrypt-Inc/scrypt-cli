const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const sh = require('shelljs');
const gittar = require('gittar');
const { green, red } = require('chalk');
const { exit } = require('process');
const { stepCmd, replaceInFile, camelCase, camelCaseCapitalized, kebabCase, titleCase, writefile, deletefile } = require("./helpers");
const { createAsmDir } = require("./common")

const ProjectType = {
  Contract: 1,
  Library: 2,
  StatefulContract: 3
}

const PROJECT_NAME_TEMPLATE = 'PROJECT_NAME'
const PROJECT_FILENAME_TEMPLATE = 'PROJECT_FILENAME'

/**
 * Create a new sCrypt project with recommended dir structure, Prettier config,
 * testing lib, etc. Warns if already exists and does NOT overwrite.
 * @param {string} projType - The user's desired project type.
 * @param {object} argv - The arguments object provided by yargs.
 * @param {string} argv.asm - Add .asm dir to project.
 * @param {string} argv.name - The user's desired project name.
 * @return {Promise<void>}
 */
async function project(projType, { asm, name, minimal }) {
  if (name.search(/[^-0-9a-zA-Z]/g) != -1) {
    console.error(red(`Invalid project name format`));
    exit(-1);
  }

  if (fs.existsSync(name)) {
    console.error(red(`Directory already exists. Not proceeding`));
    exit(-1);
  }

  // Git must be initialized before running `npm install` b/c Husky runs an
  // NPM `prepare` script to set up its pre-commit hook within `.git`.
  // Check before fetching project template, to not leave crud on user's system.
  if (!sh.which('git')) {
    console.error(red('Please ensure Git is installed, then try again.'));
    exit(-1);
  }

  // Create path/to/dir with their desired name
  if (sh.mkdir('-p', name).code != 0) {
    exit(-1);
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
    exit(-1);
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
  //

  await configurePackageJson('.', asm, minimal);

  if (asm) {
    await createAsmDir();
  }
  
  if (minimal) {
    await minifyProject('.');
  }

  let resStr = `\nProject ${name} was successfully created!`;
  
  if (!minimal) {
    resStr += `\n\nAdd your Git repo URL and you're good to go:` +
    `\ncd ${name} && git remote add origin <your-repo-url>`;
  }

  console.log(green(resStr));
  exit(0);
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
  let dirSrc = path.join(dir, 'src')
  let fIndex = path.join(dirSrc, 'index.ts')
  if (fs.existsSync(fIndex)) {
    const importTemplateIndex = `from './contracts/${PROJECT_NAME_TEMPLATE}'`
    const importReplacementIndex = importTemplateIndex.replace(PROJECT_NAME_TEMPLATE, camelCase(name))
    replaceInFile(fIndex, importTemplateIndex, importReplacementIndex);
    replaceInFile(fIndex, PROJECT_NAME_TEMPLATE, camelCaseCapitalized(name));
  }

  let dirContracts = path.join(dirSrc, 'contracts')
  let fContract = path.join(dirContracts, PROJECT_NAME_TEMPLATE + '.ts')
  let fContractNew = fContract.replace(PROJECT_NAME_TEMPLATE, camelCase(name))
  if (fs.existsSync(fContract)) {
    sh.mv(fContract, fContractNew)
    replaceInFile(fContractNew, PROJECT_NAME_TEMPLATE, camelCaseCapitalized(name));
  }

  let ftestContract = path.join(dirContracts, "test" + PROJECT_NAME_TEMPLATE + '.ts')
  let ftestContractNew = ftestContract.replace(PROJECT_NAME_TEMPLATE, camelCase(name))

  const importLib = `from './${PROJECT_NAME_TEMPLATE}'`
  const importReplacementLib = importLib.replace(PROJECT_NAME_TEMPLATE, camelCase(name))

  if (fs.existsSync(ftestContract)) {
    sh.mv(ftestContract, ftestContractNew)
    replaceInFile(ftestContractNew, importLib, importReplacementLib);
    replaceInFile(ftestContractNew, PROJECT_NAME_TEMPLATE, camelCaseCapitalized(name));
  }

  const importTemplateTests = `from '../src/contracts/${PROJECT_NAME_TEMPLATE}'`
  const importReplacementTests = importTemplateTests.replace(PROJECT_NAME_TEMPLATE, camelCase(name))

  const importLibTemplateTests = `from '../src/contracts/test${PROJECT_NAME_TEMPLATE}'`
  const importLibReplacementTests = importLibTemplateTests.replace(`test${PROJECT_NAME_TEMPLATE}`, `test${camelCase(name)}`)


  let dirTests = path.join(dir, 'tests')
  let fTest = path.join(dirTests, PROJECT_NAME_TEMPLATE + '.test.ts')
  let fTestNew = fTest.replace(PROJECT_NAME_TEMPLATE, camelCase(name))
  if (fs.existsSync(fTest)) {
    sh.mv(fTest, fTestNew)
    replaceInFile(fTestNew, importTemplateTests, importReplacementTests);
    replaceInFile(fTestNew, importLibTemplateTests, importLibReplacementTests);
    replaceInFile(fTestNew, PROJECT_NAME_TEMPLATE, camelCaseCapitalized(name));
  }


  const importTemplateDeployScript = `from './src/contracts/${PROJECT_NAME_TEMPLATE}'`
  const importReplacementDeployScript = importTemplateDeployScript.replace(PROJECT_NAME_TEMPLATE, camelCase(name))
  const fDeployScript = path.join(dir, 'deploy.ts')
  if (fs.existsSync(fDeployScript)) {
    replaceInFile(fDeployScript, importTemplateDeployScript, importReplacementDeployScript);
    replaceInFile(fDeployScript, PROJECT_NAME_TEMPLATE, camelCaseCapitalized(name));
  }

  const importTemplateLaunch = `${PROJECT_NAME_TEMPLATE}`
  const importReplacementLaunch = importTemplateLaunch.replace(PROJECT_NAME_TEMPLATE, camelCase(name))
  const fLaunch = path.join(dir, '.vscode', 'launch.json')
  if (fs.existsSync(fLaunch)) {
    replaceInFile(fLaunch, importTemplateLaunch, importReplacementLaunch);
    replaceInFile(fLaunch, PROJECT_NAME_TEMPLATE, camelCaseCapitalized(name));
  }

  spin.succeed(green(step));
}


/**
 * Apply modifications to package.json if needed.
 * @param {string} dir - Path to the dir containing target files to be changed.
 * @param {string} asm - Configure for ASM optimizations.
 * @param {string} minimal - Use minimal config. Defaults to false.
 * @returns {Promise<boolean>} - True if successful; false if not.
 */
async function configurePackageJson(dir, asm, minimal = false) {
  const step = 'Configure package.json ';
  const spin = ora(`${step}...`).start();

  const packageJsonPath = path.join(dir, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath))

  if (asm) {
    packageJson.scripts['compile'] += ' --asm'
  }

  if (minimal) {
    packageJson.scripts['lint'] = undefined
    packageJson.scripts['lint-check'] = undefined
    packageJson.scripts['prepare'] = undefined
    packageJson.scripts['pretest'] = undefined
    packageJson.scripts['pretest:testnet'] = undefined
    packageJson.scripts['prebuild'] = undefined
    packageJson['lint-staged'] = undefined
    packageJson.devDependencies['@typescript-eslint/eslint-plugin'] = undefined;
    packageJson.devDependencies['@typescript-eslint/parser'] = undefined;
    packageJson.devDependencies['eslint'] = undefined;
    packageJson.devDependencies['prettier'] = undefined;
    packageJson.devDependencies['eslint-config-prettier'] = undefined;
    packageJson.devDependencies['husky'] = undefined;
    packageJson.devDependencies['lint-staged'] = undefined;
  }

  writefile(packageJsonPath, packageJson)

  spin.succeed(green(step));
}


/**
 * De-clutter project of non-critical files.
 * @param {string} dir Directory to minify.
 */
async function minifyProject(dir) {
    // List of files/directories to delete
    const itemsToDelete = [
        '.git/',
        '.eslintignore',
        '.eslintrc',
        '.husky/',
        '.prettierignore',
        '.prettierrc',
        '.travis.yml',
        '.vscode/'
    ];

    for (const item of itemsToDelete) {
        const itemPath = path.join(dir, item);
        deletefile(itemPath);
    }
}

module.exports = {
  PROJECT_NAME_TEMPLATE,
  PROJECT_FILENAME_TEMPLATE,
  project,
  ProjectType,
  setProjectName,
  replaceInFile,
};
