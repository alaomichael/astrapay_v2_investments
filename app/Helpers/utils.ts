/* eslint-disable prettier/prettier */
'use strict'

// import { string } from '@ioc:Adonis/Core/Helpers'
// import Env from '@ioc:Adonis/Core/Env'

// export const STANDARD_DATE_TIME_FORMAT = 'yyyy-LL-dd HH:mm:ss'
// export const TIMEZONE_DATE_TIME_FORMAT = 'yyyy-LL-dd HH:mm:ss ZZ'
// export const DATE_FORMAT = 'yyyy-LL-dd'
// export const UUID_REGEX =
//   /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
// export const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/
// export const urlRegex =
//   /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/

// export type RateType = 'percentage' | 'number'
// export type RoundingType = 'none' | 'nearest' | 'down' | 'up'
// export type ThousandSeparator = 'comma' | 'period' | 'none' | 'space'

// Generate rate
// export const generateRate = function generateRate(amount, period) {
//   return new Promise((resolve, reject) => {
//     if (!amount || !period || amount <= 0)
//       reject(new Error('Incomplete parameters or amount is less than allowed range'))
//     let rate
//     if (parseInt(period) >= 90 && 180 > parseInt(period)) {
//       period = '3 months'
//     } else if (parseInt(period) >= 180 && 270 > parseInt(period)) {
//       period = '6 months'
//     } else if (parseInt(period) >= 270 && 360 > parseInt(period)) {
//       period = '9 months'
//     } else if (parseInt(period) >= 360 && 450 > parseInt(period)) {
//       period = '12 months'
//     } else if (parseInt(period) >= 450 && 540 > parseInt(period)) {
//       period = '1 year and 3 months'
//     } else if (parseInt(period) >= 540 && 630 > parseInt(period)) {
//       period = '1 year and 6 months'
//     } else if (parseInt(period) >= 630 && 720 > parseInt(period)) {
//       period = '1 year and 9 months'
//     } else if (parseInt(period) >= 720) {
//       period = '2 years or more'
//     }

//     switch (period) {
//       case '3 months':
//         rate = 0.06
//         console.log(`RATE for ${period} is:`, rate)
//         break
//       case '6 months':
//         rate = 0.07
//         console.log(`RATE for ${period} is:`, rate)
//         break
//       case '9 months':
//         rate = 0.08
//         console.log(`RATE for ${period} is:`, rate)
//         break
//       case '12 months':
//         rate = 0.09
//         console.log(`RATE for ${period} is:`, rate)
//         break
//       case '1 year and 3 months':
//         rate = 0.1
//         console.log(`RATE for ${period} is:`, rate)
//         break
//       case '1 year and 6 months':
//         rate = 0.11
//         console.log(`RATE for ${period} is:`, rate)
//         break
//       case '1 year and 9 months':
//         rate = 0.12
//         console.log(`RATE for ${period} is:`, rate)
//         break
//       case '2 years or more':
//         rate = 0.13
//         console.log(`RATE for ${period} is:`, rate)
//         break
//       default:
//         rate = 0.05
//         console.log(`RATE for ${period} days is:`, rate)
//         break
//     }
//     return resolve(rate)
//   })
// }

// generateRate(198, '752')

// generateRate(1000, '300')

// Generate Return on Investment
// export const interestDueOnPayout =
function interestDueOnPayout(amount, rate, period) {
  return new Promise((resolve, reject) => {
    if (!amount || !rate || !period || amount <= 0) {
      reject(new Error('Incomplete parameters or amount is less than allowed range'))
    }
    let interestDue
    interestDue = amount * rate
    console.log(
      `Interest due for your investment of ${amount} for ${period} days is ${interestDue}`
    )
    return resolve(interestDue)
  })
}

interestDueOnPayout(150000, 0.1, 180)

// Check Investment due for payout
// export const dueForPayout =
function dueForPayout(created_at, period) {
  return new Promise((resolve, reject) => {
    if (!created_at || !period) {
      reject(new Error('Incomplete parameters or out of range'))
    }
    let isDueForPayout
    let investmentCreationDate = new Date(created_at).toDateString()
    let investmentPayoutDate = new Date(created_at).setDate(parseInt(period))
    let investmentDuration
    let currentDate = new Date().toDateString()
    console.log(' Current Date: ' + currentDate)
    // investmentDuration = ( currentDate -  investmentCreationDate)
    if (currentDate === investmentPayoutDate) {
      isDueForPayout = true
      console.log(`Your investment is due for payout on ${currentDate}`)
    } else {
      isDueForPayout = false
      investmentPayoutDate = investmentPayoutDate
      console.log(`Your investment will be due for payout on ${investmentPayoutDate}`)
    }
    return resolve(isDueForPayout)
  })
}

dueForPayout(150000, 180)

/**
 * An utility function which returns a random number
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 * @returns {Promise<Number>} Random value
 * @throws {Error}
 */
// export const generateCode = function (min: number, max: number): Promise<number> {
//   return new Promise((resolve, reject) => {
//     if (!min || !max) reject(new Error('Incomplete parameters'))
//     const code = Math.floor(Math.random() * (max - min) + min)
//     return resolve(code)
//   })
// }

// export const bytesToKbytes = (bytes: number) => Math.round((bytes / 1000) * 100) / 100

// export const commonEmailProperties = function () {
//   const APP_NAME = Env.get('APP_NAME')
//   const APP_SENDING_EMAIL = Env.get('APP_SENDING_EMAIL')

//   return { APP_NAME, APP_SENDING_EMAIL }
// }

// export const IS_DEMO_MODE = Env.get('DEMO_MODE')

// export const rateTypes: RateType[] = ['number', 'percentage']
// export const roundingTypes: RoundingType[] = ['none', 'nearest', 'down', 'up']
// export const thousandSeparatorTypes: ThousandSeparator[] = ['comma', 'period', 'none', 'space']

// export const getPrintServerBaseUrl = function () {
//   let host: string
//   let port: number
//   const NODE_ENV = Env.get('NODE_ENV')

//   if (NODE_ENV === 'production' || NODE_ENV === 'testing') {
//     host = Env.get('PROD_PRINT_SERVER_HOST')
//     port = Env.get('PROD_PRINT_SERVER_PORT')
//   } else {
//     host = Env.get('DEV_PRINT_SERVER_HOST')
//     port = Env.get('DEV_PRINT_SERVER_PORT')
//   }

//   return `http://${host}:${port}`
// }

// export const isProduction = Env.get('NODE_ENV') === 'production'
// export const isDevelopment = Env.get('NODE_ENV') === 'development'