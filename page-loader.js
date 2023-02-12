import parseArgs from 'minimist'
import fs from 'fs'
import process from 'process'
import axios from 'axios'

const args = parseArgs(process.argv.slice(2))

const dir = args.output || process.cwd()

const url = args._[0]

if (!url) {
  process.exit(1)
}


const load = async () => {
  const fileName = url.replaceAll(/http[s]?:\/\//g, '').replaceAll(/[^0-9a-zA-Z]/g, '-') + '.html'

  const response = await axios.get(url)

  const content = response.data

  fs.writeFile(`${dir}/${fileName}`, content, err => {
    if (err) {
      console.error(err)
    }
    // file written successfully
  })
}


load()

export default load
// console.log(args)