import fs from 'fs/promises'
import fsA from 'fs'
import axios from 'axios'
import * as cheerio from 'cheerio'

const load = async (url, dir = '.') => {
  const fileName = url.replaceAll(/http[s]?:\/\//g, '').replaceAll(/[^0-9a-zA-Z]/g, '-')

  const response = await axios.get(url)

  const content = response.data

  const $ = cheerio.load(content)

  const imgs = $('img').map(function() {
    return $(this).attr('src')
  })

  if (fsA.existsSync(`${dir}/${fileName}_files`)) {
    await fs.rmdir(`${dir}/${fileName}_files`, { recursive: true })
  }
  await fs.mkdir(`${dir}/${fileName}_files`)

  for (let img of imgs) {
    const name = img.split('/').pop()
    const response = await axios.get(img, { responseType: 'stream' })

    const rewriteName = `${dir}/${fileName}_files/${name}`

    $(`img[src="${img}"]`).attr('src', rewriteName)

    await fs.writeFile(rewriteName, response.data)
  }

  await fs.writeFile(`${dir}/${fileName}.html`, $.html())
}

export default load
// console.log(args)