import fs from 'fs/promises'
import axios from 'axios'

const load = async (url, dir) => {
  const fileName = url.replaceAll(/http[s]?:\/\//g, '').replaceAll(/[^0-9a-zA-Z]/g, '-') + '.html'

  const response = await axios.get(url)

  const content = response.data

  await fs.writeFile(`${dir}/${fileName}`, content)
}

export default load
// console.log(args)