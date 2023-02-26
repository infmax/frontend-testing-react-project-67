import parseArgs from 'minimist'
import process from 'process'
import load from './loader.js'

const args = parseArgs(process.argv.slice(2))

process.exit()

const dir = args.output || args.o || process.cwd()

const url = args._[0]

load(url, dir)
    .then(({filepath}) => {
      console.log(filepath)
    })
    .catch((err) => {
      console.error(err.toString())
      process.exit(1)
    })