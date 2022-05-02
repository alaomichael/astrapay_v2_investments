'use strict'


import Env from '@ioc:Adonis/Core/Env'

export const STANDARD_DATE_TIME_FORMAT = 'yyyy-LL-dd HH:mm:ss'
export const TIMEZONE_DATE_TIME_FORMAT = 'yyyy-LL-dd HH:mm:ss ZZ'
export const DATE_FORMAT = 'yyyy-LL-dd'
export const UUID_REGEX =
  /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
export const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/
export const urlRegex =
  /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/

/**
 * An utility function which returns a random number
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 * @returns {Promise<Number>} Random value
 * @throws {Error}
 */
export const generateCode = function (min: number, max: number): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!min || !max) reject(new Error('Incomplete parameters'))
    const code = Math.floor(Math.random() * (max - min) + min)
    return resolve(code)
  })
}

export const bytesToKbytes = (bytes: number) => Math.round((bytes / 1000) * 100) / 100


export const commonEmailProperties = function () {
  const APP_NAME = Env.get('APP_NAME')
  const APP_SENDING_EMAIL = Env.get('APP_SENDING_EMAIL')

  return { APP_NAME, APP_SENDING_EMAIL }
}

export const IS_DEMO_MODE = Env.get('DEMO_MODE')

export const discountTypes: DiscountType[] = ['number', 'percentage']
export const roundingTypes: RoundingType[] = ['none', 'nearest', 'down', 'up']
export const thousandSeparatorTypes: ThousandSeparator[] = ['comma', 'period', 'none', 'space']

export const itemCollectionTypes: ItemCollectionType[] = [
  'set(s)',
  'piece(s)',
  'pack(s)',
  'carton(s)',
  'box(es)',
  'bottle(s)',
  'truck(s)',
  'container(s)',
  'dozen(s)',
  'wrap(s)',
  'roll(s)',
]

export const unitOfMeasurementTypes = [
  ...itemCollectionTypes,
  'kg',
  'lb',
  'm',
  'yd',
  'ft',
  'in',
  'cm',
  'sq.m',
  'sq.ft',
  'sq.in',
  'cu.m',
  'cu.ft',
  'cu.in',
]

export const InvoiceQuotationTypes: InvoiceQuotationType[] = ['invoice', 'quotation']

export const sanitiseHTML: SanitiseHTML = function (input, config) {
  const defaultConfig: SanitiserConfig = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['strike']),
  }

  return sanitizeHtml(input, merge(config, defaultConfig))
}

export const getPrintServerBaseUrl = function () {
  let host: string
  let port: number
  const NODE_ENV = Env.get('NODE_ENV')

  if (NODE_ENV === 'production' || NODE_ENV === 'testing') {
    host = Env.get('PROD_PRINT_SERVER_HOST')
    port = Env.get('PROD_PRINT_SERVER_PORT')
  } else {
    host = Env.get('DEV_PRINT_SERVER_HOST')
    port = Env.get('DEV_PRINT_SERVER_PORT')
  }

  return `http://${host}:${port}`
}

export const isProduction = Env.get('NODE_ENV') === 'production'
export const isDevelopment = Env.get('NODE_ENV') === 'development'
