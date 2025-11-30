#!/usr/bin/env node

const { createCLI } = require('../src/cli');

const program = createCLI();
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
