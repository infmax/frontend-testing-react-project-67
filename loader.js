#!/usr/bin/env node

import fs from 'fs/promises'
import fsA from 'fs'
import Debug from 'debug'
import * as cheerio from 'cheerio'
import axios from 'axios'
import 'axios-debug-log'

const debug = Debug('page-loader')

const load = async (url, dir = '.') => {
  if (!url || typeof url !== "string") {
    throw new Error('Empty url')
  }

  debug(url)
  const fileName = url.replace(/http[s]?:\/\//g, '').replace(/[^0-9a-zA-Z]/g, '-')

  let response

  try {
    response = await axios.get(url)
  }
  catch (e) {
    debug('Url load problem: ', e)

    throw e
  }
  // debug(response)

  const content = response.data

  const $ = cheerio.load(content)

  const origin = (new URL(url)).origin

  const tags = $('img,link,script').map(function () {

    const url = $(this).attr('src') || $(this).attr('href')
    const src = new URL(url, origin)

    debug(src, url, origin)
    return {element: $(this), src: src.toString(), originalSrc: url}
  })

  if (fsA.existsSync(`${dir}/${fileName}_files`)) {
    await fs.rmdir(`${dir}/${fileName}_files`, {recursive: true})
  }
  await fs.mkdir(`${dir}/${fileName}_files`)

  // debug(tags)

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
      debug('Static load error: ', file, e)
    }

    if (!response || !response.data) {
      debug('Static load error: ', file)
      continue
    }

    try {
      const isHtml = response && response.headers && response.headers['content-type'] && response.headers['content-type'].includes('text/html')
      const rewriteName = `${fileName}_files/${name}${isHtml ? '.html' : ''}`

      await fs.writeFile(`${dir}/${rewriteName}`, response.data)

      if (tagName !== 'link') {
        $(`${tagName}[src="${tag.originalSrc}"]`).attr('src', rewriteName)
      }
      else {
        $(`${tagName}[href="${tag.originalSrc}"]`).attr('href', rewriteName)
      }
    }
    catch (e) {
      debug('File write error: ', file)
    }
  }

  await fs.writeFile(`${dir}/${fileName}.html`, $.html())

  return { filepath: `${dir}/${fileName}.html` }
}

export default load
// console.log(args)