import axios from 'axios'
import load from "../loader"
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

jest.mock('axios')

const fileExists = async path => !!(await fs.stat(path).catch(e => false))

describe('page loader', () => {
  let html
  let dir

  beforeAll(async () => {
    html = (await fs.readFile(`${__dirname}/__fixtures__/page.html`, 'utf-8')).trim()
  })

  beforeEach(async() => {
    axios.get.mockImplementationOnce(() => Promise.resolve({data: html}))
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
  })

  it('created file', async () => {
    await load('https://google.com', dir)

    const isExist = await fileExists(`${dir}/google-com.html`)

    expect(isExist).toBe(true)
  })

  it('matched html content', async () => {
    console.log(dir)
    await load('https://google.com', dir)

    const loadedContent = (await fs.readFile(`${dir}/google-com.html`, 'utf-8')).trim()

    expect(loadedContent).toBe(html)
  })
})