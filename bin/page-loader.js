#!/usr/bin/env node
/* linebreak-style: ["error", "windows"] */

import { program } from 'commander';
import process from 'process';
import pageLoader from '../loader.js';

program
  .command('page-loader')
  .version('1.0.0')
  .description('Page download')
  .arguments('<url>', 'url source')
  .option('-o, --output [dirPath]', 'output directory', process.cwd())
  .action(async (url, options) => {
    console.log(await pageLoader(url, options.output));
  })
  .parse(process.argv);
