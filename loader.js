#!/usr/bin/env node

/* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */

import fs from 'fs/promises';
import fsA from 'fs';
import Debug from 'debug';
import * as cheerio from 'cheerio';
import axios from 'axios';
import 'axios-debug-log';
import path from 'path';

const debug = Debug('page-loader');

const load = async (url, dir = '.') => {
  if (!url || !url.toString() || typeof url !== 'string') {
    throw new Error('Empty url');
  }

  const fileName = url.replace(/http[s]?:\/\//g, '').replace(/[^0-9a-zA-Z]/g, '-');

  let mainResponse;

  try {
    mainResponse = await axios.get(url);
  } catch (e) {
    debug('Url load problem: ', e);

    throw e;
  }
  // debug(response)

  const content = mainResponse.data;

  const $ = cheerio.load(content);

  const { origin } = new URL(url);

  function mapTags() {
    const srcUrl = $(this).attr('src') || $(this).attr('href');
    const src = new URL(srcUrl, origin);

    return { element: $(this), src, originalSrc: srcUrl };
  }

  const tags = $('img,link,script').map(mapTags);

  if (fsA.existsSync(`${dir}/${fileName}_files`)) {
    await fs.rmdir(`${dir}/${fileName}_files`, { recursive: true });
  }
  await fs.mkdir(`${dir}/${fileName}_files`);

  for (const tag of tags) {
    const tagName = tag.element[0].name;
    const file = tag.src.toString();

    if (!file || tag.src.origin !== origin) {
      continue;
    }

    let response;

    try {
      response = await axios.get(file, { responseType: 'arraybuffer' });
    } catch (e) {
      debug('Static load error: ', file, e);
    }

    if (!response || !response.data) {
      debug('Static load error: ', file);
      continue;
    }

    const { dir: fileDir, name, ext } = path.parse(file);

    const staticFileName = path.join(fileDir, name).replace(/http[s]?:\//g, '')
      .replace(/[^0-9a-zA-Z]/g, '-');
    const rewriteName = `${fileName}_files/${staticFileName}${ext || '.html'}`;

    if (tagName !== 'link') {
      $(`${tagName}[src="${tag.originalSrc}"]`).attr('src', rewriteName);
    } else {
      $(`${tagName}[href="${tag.originalSrc}"]`).attr('href', rewriteName);
    }

    try {
      await fs.writeFile(`${dir}/${rewriteName}`, response.data);
    } catch (e) {
      debug('File write error: ', file, e);
    }
  }

  await fs.writeFile(`${dir}/${fileName}.html`, $.html());

  return { filepath: `${dir}/${fileName}.html` };
};

export default load;
// console.log(args)
