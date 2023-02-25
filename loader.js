#!/usr/bin/env node

import fs from 'fs/promises'
import fsA from 'fs'
import axios from 'axios'
import Debug from 'debug'
import * as cheerio from 'cheerio'
import 'axios-debug-log'

const debug = Debug('page-loader')

const load = async (url, dir = '.') => {
  if (!url) {
    throw new Error('Empty url')
  }

  const fileName = url.replaceAll(/http[s]?:\/\//g, '').replaceAll(/[^0-9a-zA-Z]/g, '-')

  let response

  try {
    response = await axios.get(url)
  }
  catch (e) {
    console.error('Url load problem: ', e)

    throw e
  }
  // debug(response)

  const content = response.data

  const $ = cheerio.load(content)

  const tags = $('img,link,script').map(function () {
    return {element: $(this), src: $(this).attr('src') || $(this).attr('href')}
  })

  if (fsA.existsSync(`${dir}/${fileName}_files`)) {
    await fs.rmdir(`${dir}/${fileName}_files`, {recursive: true})
  }
  await fs.mkdir(`${dir}/${fileName}_files`)

  debug(tags)

  for (let tag of tags) {
    const tagName = tag.element[0].name
    const file = tag.src

    if (!file) {
      continue
    }

    const name = file.split('/').pop()

    let response

    try {
      response = await axios.get(file, {responseType: 'stream'})
    }
    catch (e) {
      debug(file)
      console.error('Static load error: ', file, e)
      throw e
    }

    const isHtml = response.headers && response.headers['content-type'] && response.headers['content-type'].includes('text/html')
    const rewriteName = `${fileName}_files/${name}${isHtml ? '.html' : ''}`

    if (tagName !== 'link') {
      $(`${tagName}[src="${file}"]`).attr('src', rewriteName)
    }
    else {
      $(`${tagName}[href="${file}"]`).attr('href', rewriteName)
    }

    await fs.writeFile(`${dir}/${rewriteName}`, response.data)


  }

  await fs.writeFile(`${dir}/${fileName}.html`, $.html())
}

export default load
// console.log(args)