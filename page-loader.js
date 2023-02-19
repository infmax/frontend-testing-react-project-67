import parseArgs from 'minimist'
import process from 'process'
import load from './loader.js'

const args = parseArgs(process.argv.slice(2))

const dir = args.output || process.cwd()

const url = args._[0]

load(url, dir)