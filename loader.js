import fs from 'fs'
import axios from 'axios'

const load = async (url, dir) => {
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

export default load
// console.log(args)