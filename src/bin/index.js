#!/usr/bin/env node

const semver = require('semver');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { project, ProjectType } = require('../lib/project');
const { compile } = require('../lib/compile');
const { verify } = require('../lib/verify');
const { deploy } = require('../lib/deploy');
const { system } = require('../lib/system');
const { init } = require('../lib/init');
const chalk = require('chalk');
const { showVersion } = require('yargs');


const _g = chalk.green;
const _r = chalk.reset;
const _y = chalk.yellow;
const _red = chalk.red;

// Check for minimum required Node.js version
const minNodeVersion = '16.0.0';
if (!semver.satisfies(process.version, `>=${minNodeVersion}`)) {
  console.error(
    `ERROR: You are using Node.js ${process.version}, but sCrypt requires at least Node.js ${minNodeVersion}. Please upgrade your Node.js version.`
  );
  process.exit(1);
}

yargs(hideBin(process.argv))
  .scriptName(_g('scrypt'))
  .usage('Usage: $0 <command> [options]')
  .strictCommands()
  .strictOptions()

  // https://github.com/yargs/yargs/issues/199
  // https://github.com/yargs/yargs/blob/master/locales/en.json
  .updateStrings({
    'Missing required argument: %s': {
      one: _red('Missing required argument: %s'),
    },
    'Unknown argument: %s': {
      one: _red('Unknown argument: %s'),
    },
    'Unknown command: %s': {
      one: _red('Unknown command: %s'),
    },
    'Invalid values:': _red('Invalid values:'),
    'Argument: %s, Given: %s, Choices: %s': _red(
      `%s was %s. Must be one of: %s.`
    ),
  })
  .demandCommand(1, _red('Please provide a command.'))

  .command(
    ['project [name]', 'proj [name]', 'p [name]'],
    'Create a new smart contract project',
    (y) => {
      return y.option('stateful', {
        description: 'Create stateful smart contract project.',
        required: false,
        type: 'boolean'
      })
        .alias('state', 'stateful')
        .option('library', {
          description: 'Create library project.',
          required: false,
          type: 'boolean'
        })
        .alias('lib', 'library')
        .option('asm', {
          description: 'Include inline ASM script.',
          required: false,
          type: 'boolean'
        })
        .option('minimal', {
          description: 'Include only minimal dependencies and configs.',
          required: false,
          type: 'boolean'
        })
        .alias('min', 'minimal')
        .positional('name', { demand: true, string: true, hidden: true });
    },
    async (argv) => {
      if (argv.stateful && argv.library) {
        red('Flags "--state" and "--lib" cannot be used together.')
      }

      if (argv.stateful) {
        await project(ProjectType.StatefulContract, argv)
      } else if (argv.library) {
        await project(ProjectType.Library, argv)
      } else {
        await project(ProjectType.Contract, argv)
      }
    }
  )
  .command(['compile', 'comp', 'c'], 'Compile smart contracts in current project.',  (y) => {
    return y.option('i', {
        description: 'Specifies an array of filenames or patterns to include when compling.  Defaults "src/contracts/**/*.ts".',
        required: false,
        type: 'string',
      }).alias('include', 'i')
      .option('e', {
        description: 'Specifies an array of filenames or patterns that should be skipped when resolving include. Defaults none.',
        required: false,
        type: 'string',
      }).alias('exclude', 'e')
      .option('t', {
        description: 'Specify a tsconfig to override the default tsconfig.',
        required: false,
        type: 'string'
      }).alias('tsconfig', 't')
      .option('w', {
        description: 'Watch input files.',
        required: false,
        type: 'boolean'
      }).alias('watch', 'w')
      .option('noArtifact', {
        description: 'Disable emitting artifact file from a compilation.',
        required: false,
        type: 'boolean'
      })
      .option('asm', {
        description: 'Apply asm optimization before compiling scrypt file.',
        required: false,
        type: 'boolean'
      });

  }, (argv) => compile(argv))
  .command(['deploy', 'depl', 'd'], 'Deploy a smart contract.',
    (y) => {
      return y.option('f', {
        description: 'Path to deployment script. Defaults to "deploy.ts" if none specified.',
        required: false,
        type: 'string'
      }).alias('file', 'f')
    },
    async (argv) => {
      await deploy(argv)
    })
  .command(['verify [scriptHash] [contractPath]'], 'Verify a deployed smart contract.',
    (y) => {
      return y.option('n', {
        description: 'Select Bitcoin network.',
        required: false,
        type: 'string',
        choices: ['main', 'test'],
        default: 'test'
      }).alias('network', 'n')
        .option('V', {
          description: 'Select sCrypt version. Defaults to latest release, if omitted.',
          required: false,
          type: 'string',
        })
        .positional('scriptHash', { demand: true, string: true, hidden: true })
        .positional('contractPath', { demand: true, string: true, hidden: true });
    },
    async (argv) => {
      await verify(argv)
    })
  .command(['system', 'sys', 's'], 'Show system info', {}, () => system())
  .command(['init'], 'Initialize sCrypt in an existing project ', (y) => {
    return y.option('f', {
        description: 'Force init will ignore git status, default false',
        required: false,
        type: 'boolean',
        default: false
      }).alias('force', 'f')
  }, (argv) => {
    
    // console.log(_y(`Note: the "init" command has been deprecated!`));
    // console.log("See how to integrate a frontend here:")
    // console.log("https://docs.scrypt.io/how-to-integrate-a-frontend/")
    init(argv)

  })
  .command(['version'], 'show version', {}, () => showVersion())
  .alias('h', 'help')
  .alias('v', 'version')

  .epilog(
    // _r is a hack to force the terminal to retain a line break below
    _r(
      `
  ___  / __|  _ _   _  _   _ __  | |_ 
 (_-< | (__  | '_| | || | | '_ \ |  _|
 /__/  \___| |_|    \_, | | .__/  \__|
                    |__/  |_|         
   
             sCrypt CLI
      `
    )
  ).argv;
