import fs from 'fs/promises'
import fsA from 'fs'
import axios from 'axios'
import * as cheerio from 'cheerio'

const load = async (url, dir = '.') => {
  const fileName = url.replaceAll(/http[s]?:\/\//g, '').replaceAll(/[^0-9a-zA-Z]/g, '-')

  const response = await axios.get(url)

  const content = response.data

  const $ = cheerio.load(content)

  const tags = $('img,link,script').map(function () {
    return {element: $(this), src: $(this).attr('src') || $(this).attr('href')}
  })

  if (fsA.existsSync(`${dir}/${fileName}_files`)) {
    await fs.rmdir(`${dir}/${fileName}_files`, {recursive: true})
  }
  await fs.mkdir(`${dir}/${fileName}_files`)

  for (let tag of tags) {
    const tagName = tag.element[0].name
    const file = tag.src

    // скипаем загрузку статики из гугла
    if (!file || file.includes('google.com')) {
      continue
    }
    const name = file.split('/').pop()
    const response = await axios.get(file, { responseType: 'stream' })
    const isHtml = response.headers['content-type'].includes('text/html')
    const rewriteName = `${dir}/${fileName}_files/${name}${isHtml ? '.html' : ''}`

    if (tagName === 'img') {
      $(`img[src="${file}"]`).attr('src', rewriteName)
    } else {
      $(`${tagName}[href="${file}"]`).attr('href', rewriteName)
    }


    // console.log(response.headers)

    await fs.writeFile(rewriteName, response.data)
  }

  await fs.writeFile(`${dir}/${fileName}.html`, $.html())
}

export default load
// console.log(args)