import nock from 'nock'
import load from "../loader"
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

describe('page loader', () => {

  let html
  let dir
  let loadedHtml
  let wrongHtml

  beforeAll(async () => {
    html = (await fs.readFile(`${__dirname}/__fixtures__/page.html`, 'utf-8')).trim()
    loadedHtml = (await fs.readFile(`${__dirname}/__fixtures__/loaded-page.html`, 'utf-8')).trim()
    wrongHtml = (await fs.readFile(`${__dirname}/__fixtures__/wrong-page.html`, 'utf-8')).trim()
  })

  beforeEach(async() => {
    nock('https://google.com')
        .get('/')
        .reply(200, html)

    nock('https://google.com')
        .get('/assets/runtime.js')
        .reply(200, 'var a = 0')

    nock('https://google-wrong.com')
        .get('/')
        .reply(200, wrongHtml)

    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
  })

  it('failed with empty url', async () => {
    await expect(load('', dir)).rejects.toThrow('Empty url')
  })

  it('failed with object url', async () => {
    await expect(load({}, dir)).rejects.toThrow('Empty url')
  })


  it('failed with wrong url', async () => {
    await expect(load('https://atatat/atata', dir)).rejects.toThrow()
  })

  it('failed with wrong img', async () => {
    await expect(load('https://atatat/atata', dir)).rejects.toThrow()
  })

  it('failed with wrong img src', async () => {
    await expect(load('https://google-wrong.com', dir)).rejects.toThrow()
  })

  it('matched html content', async () => {
    await load('https://google.com', dir)

    const loadedContent = (await fs.readFile(`${dir}/google-com.html`, 'utf-8')).trim()

    expect(loadedContent).toBe(loadedHtml)
  })

  it('created stat directory', async () => {
    await load('https://google.com', dir)

    const files = (await fs.readdir(`${dir}/google-com_files/`, 'utf-8')).length

    expect(files).toBe(4)
  })
})