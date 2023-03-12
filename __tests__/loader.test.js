import nock from 'nock';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import load from '../loader.js';

let html;

let dir;
let loadedHtml;
let wrongHtml;

nock.disableNetConnect();

const staticFiles = [
  {
    file: 'style.css',
    path: '/assets/style.css',
    convertedName: 'google-com-assets-style.css',
  },
  {
    file: 'page.html',
    path: '/courses',
    convertedName: 'google-com-courses.html',
  },
  {
    file: 'runtime.js',
    path: '/assets/runtime.js',
    convertedName: 'google-com-assets-runtime.js',
  },
];

const staticFilesContent = {};

const readFile = async (fileName) => {
  const file = await fs.readFile(fileName, 'utf-8');
  return file.trim();
};

beforeAll(async () => {
  nock.disableNetConnect();
  html = (await readFile(`${__dirname}/__fixtures__/page.html`));

  const promises = staticFiles.map((file) => readFile(`${__dirname}/__fixtures__/${file.file}`)
    .then((r) => {
      staticFilesContent[file.file] = r;
    }));

  await Promise.all(promises);

  loadedHtml = (await readFile(`${__dirname}/__fixtures__/loaded-page.html`));
  wrongHtml = (await readFile(`${__dirname}/__fixtures__/wrong-page.html`));
});

afterAll(() => {
  nock.enableNetConnect();
});

beforeEach(async () => {
  nock('https://google.com')
    .get('/')
    .reply(200, html);

  staticFiles.forEach((file) => {
    nock('https://google.com').get(file.path)
      .reply(200, staticFilesContent[file.file]);
  });

  [404, 500].forEach((code) => {
    nock('https://google.com').get(code).reply(code);
  });

  nock('https://google-wrong.com')
    .get('/')
    .reply(200, wrongHtml);

  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

describe('positive scenarios', () => {
  it('matched html content', async () => {
    await load('https://google.com', dir);

    const loadedContent = (await fs.readFile(`${dir}/google-com.html`, 'utf-8')).trim();

    expect(loadedContent).toBe(loadedHtml);
  });

  it('created stat directory', async () => {
    await load('https://google.com', dir);

    const files = (await fs.readdir(`${dir}/google-com_files/`, 'utf-8')).length;

    expect(files).toBe(3);
  });

  it('returned filePath', async () => {
    const out = await load('https://google.com', dir);

    expect(out).toEqual({ filepath: `${dir}/google-com.html` });
  });

  test.each(staticFiles)('it created file %s', async (file) => {
    await load('https://google.com', dir);

    const generated = await readFile(`${dir}/google-com_files/${file.convertedName}`);

    expect(staticFilesContent[file.file]).toEqual(generated);
  });

  it('created with existing dir', async () => {
    await fs.mkdir(`${dir}/google-com_files`);

    await load('https://google.com', dir);
    const files = (await fs.readdir(`${dir}/google-com_files/`, 'utf-8')).length;

    expect(files).toBe(3);
  });
});

describe('negative scenarios', () => {
  it('failed with empty url', async () => {
    await expect(load('', dir)).rejects.toThrow();
  });

  it('failed with object url', async () => {
    await expect(load({}, dir)).rejects.toThrow();
  });

  it('failed with wrong url', async () => {
    await expect(load('https://atatat/atata', dir)).rejects.toThrow();
  });

  it('failed with wrong img', async () => {
    await expect(load('https://atatat/atata', dir)).rejects.toThrow();
  });

  it('failed with wrong img src', async () => {
    await load('https://google-wrong.com', dir);

    const loadedContent = (await fs.readFile(`${dir}/google-wrong-com.html`, 'utf-8')).trim();

    expect(loadedContent).toBe(wrongHtml);
  });

  test.each([404, 500])('failed with error code %s', async (code) => {
    await expect(load(`https://google.com/${code}`, dir)).rejects.toThrow(new RegExp(code));
  });
});
