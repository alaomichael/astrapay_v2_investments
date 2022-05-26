import Application from '@ioc:Adonis/Core/Application'
import puppeteer, { PaperFormat } from 'puppeteer'
import HttpContext from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import path from 'path'
import createDirectory from 'App/Helpers/CreateDirectory'
import { getPrintServerBaseUrl /* isProduction */ } from 'App/Helpers/utils'
import Event from '@ioc:Adonis/Core/Event'
// import Subscription from 'App/Models/Subscription'
import Investment from 'App/Models/Investment'
interface PrintOptions {
  paperFormat?: PaperFormat
  fileName: string
}

/**
 * For Puppeteer-related tasks.
 */
export default class PuppeteerServices {
  private paperFormat: PaperFormat
  private fileName: string
  private url: string

  /**
   * Initialise PuppeteerServices
   * @param url The relative URL
   * @param options Options object
   */
  constructor(url: string, options: PrintOptions) {
    this.paperFormat = options?.paperFormat ?? 'a4'
    if (!options.fileName) throw new Error('File name is required!')
    if (options.fileName.length < 2) throw new Error('File name must be at least 2 characters!')
    this.fileName = options.fileName
    this.url = `${getPrintServerBaseUrl()}/${url}`
  }

  public async printAsPDF(data: Investment) {
    const ctx = HttpContext.get()

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--headless', '--disable-gpu', '--window-size=1920x1080'],
    })
    const page = await browser.newPage()

    // 1. Create PDF from URL
    // await page.goto("http://192.168.88.18:3000/")
    await page.goto(this.url)
    // await page.setContent("<h1>Hello World !</h1>")

    /* if (isProduction) {
      await page
        .waitForNavigation({
          timeout: 1 * 60 * 1000, // 2 minute timeout
          waitUntil: 'networkidle0', //consider navigation to be finished when there are no more than 0 network connections for at least 500 ms
        })
        .then(() => {
          console.log('waitForNavigation done') 
        })
    } */

    // 2. Save a PDF
    await this.prepareFilePath(this.fileName).then(async (filePath) => {
      await page.emulateMediaType('screen')
      await page
        .pdf({
          path: filePath,
          format: this.paperFormat,
          scale: 0.8,
          printBackground: true,
          margin: { left: '20px', right: '20px', top: '20px', bottom: '20px' },
        })
        .then(() => {
          console.log('File created')
          let customer = JSON.parse(JSON.stringify(data?.asset_owner))
          Event.emit('subscription::subscription_receipt_generated', {
            name: customer.name,
            email: customer.email,
            filePath: filePath,
          })
        })
        .catch((error) => {
          Logger.error('Error at PuppeteerServices.printAsPDF > page.pdf(): %j', error)
          ctx?.response.internalServerError({ data: error })
        })

      await browser.close()
      ctx?.response.attachment(filePath, this.fileName, 'attachment', true)
    })
  }

  /**
   * Prepare the baseDir of the file. Create if it does not exist
   * @param fileName The file name
   * @returns
   */
  private prepareFilePath(fileName: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const filePath = Application.tmpPath(
        `${fileName.charAt(0)}/${fileName.charAt(1)}/${fileName}.pdf`
      )
      const baseDir = path.dirname(filePath)

      // Create baseDir if it does not exist
      await createDirectory(baseDir)
        .then(async () => {
          resolve(filePath)
        })
        .catch((error) => reject(error))
    })
  }
}
