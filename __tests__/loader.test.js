import nock from 'nock';
import fs from 'fs/promises';
import path from 'path';
import fsA from 'fs';
import os from 'os';
import load from '../loader.js';

describe('page loader', () => {
  let html;

  let dir;
  let loadedHtml;
  let wrongHtml;
  let css;

  nock.disableNetConnect()

  beforeAll(async () => {
    html = (await fs.readFile(`${__dirname}/__fixtures__/page.html`, 'utf-8')).trim();
    css = (await fs.readFile(`${__dirname}/__fixtures__/style.css`, 'utf-8')).trim();

    html = (await fs.readFile(`${__dirname}/__fixtures__/page.html`, 'utf-8')).trim();
    loadedHtml = (await fs.readFile(`${__dirname}/__fixtures__/loaded-page.html`, 'utf-8')).trim();
    wrongHtml = (await fs.readFile(`${__dirname}/__fixtures__/wrong-page.html`, 'utf-8')).trim();
  });

  beforeEach(async () => {
    nock('https://google.com')
      .get('/')
      .reply(200, html);

    nock('https://google.com')
      .get('/courses')
      .reply(200, html);

    nock('https://google.com')
      .get('/assets/style.css')
      .reply(200, css);

    nock('https://google.com')
        .get('/assets/example.jpg')
        .reply(200, 'any');

    nock('https://google.com')
      .get('/assets/runtime.js')
      .reply(200, 'var a = 0');

    nock('https://google-wrong.com')
      .get('/')
      .reply(200, wrongHtml);

    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });

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

  it('matched html content', async () => {
    await load('https://google.com', dir);

    const loadedContent = (await fs.readFile(`${dir}/google-com.html`, 'utf-8')).trim();

    expect(loadedContent).toBe(loadedHtml);
  });

  it('created stat directory', async () => {
    await load('https://google.com', dir);

    const files = (await fs.readdir(`${dir}/google-com_files/`, 'utf-8')).length;

    expect(files).toBe(4);
  });

  it('returned filePath', async () => {
    const out = await load('https://google.com', dir);

    expect(out).toEqual({ filepath: `${dir}/google-com.html` });
  });

  it('created css', async () => {
    await load('https://google.com', dir);
    expect(fsA.existsSync(`${dir}/google-com_files/google-com-assets-style.css`)).toBe(true);
  });

  it('created js', async () => {
    await load('https://google.com', dir);
    expect(fsA.existsSync(`${dir}/google-com_files/google-com-assets-runtime.js`)).toBe(true);
  });

  it('created with existing dir', async () => {
    await fs.mkdir(`${dir}/google-com_files`);

    await load('https://google.com', dir);
    const files = (await fs.readdir(`${dir}/google-com_files/`, 'utf-8')).length;

    expect(files).toBe(4);
  });

  it('created html', async () => {
    await load('https://google.com', dir);
    expect(fsA.existsSync(`${dir}/google-com_files/google-com-courses.html`)).toBe(true);
  });
});
