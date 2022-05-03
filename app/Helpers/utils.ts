/* eslint-disable prettier/prettier */
'use strict'

// import { string } from '@ioc:Adonis/Core/Helpers'
// const string = require('@ioc:Adonis/Core/Helpers')
// import Env from '@ioc:Adonis/Core/Env'
// const Env = require('@ioc:Adonis/Core/Env')
const JSJoda = require('js-joda')
const LocalDate = JSJoda.LocalDate
const Moment = require('moment')

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
// export const generateRate =
const generateRate = (amount, period) => {
  return new Promise((resolve, reject) => {
    if (!amount || !period || amount <= 0)
      reject(new Error('Incomplete parameters or amount is less than allowed range'))
    let rate
    if (parseInt(period) >= 90 && 180 > parseInt(period)) {
      period = '3 months'
    } else if (parseInt(period) >= 180 && 270 > parseInt(period)) {
      period = '6 months'
    } else if (parseInt(period) >= 270 && 360 > parseInt(period)) {
      period = '9 months'
    } else if (parseInt(period) >= 360 && 450 > parseInt(period)) {
      period = '12 months'
    } else if (parseInt(period) >= 450 && 540 > parseInt(period)) {
      period = '1 year and 3 months'
    } else if (parseInt(period) >= 540 && 630 > parseInt(period)) {
      period = '1 year and 6 months'
    } else if (parseInt(period) >= 630 && 720 > parseInt(period)) {
      period = '1 year and 9 months'
    } else if (parseInt(period) >= 720) {
      period = '2 years or more'
    }

    switch (period) {
      case '3 months':
        rate = 0.06
        console.log(`RATE for ${period} is:`, rate)
        break
      case '6 months':
        rate = 0.07
        console.log(`RATE for ${period} is:`, rate)
        break
      case '9 months':
        rate = 0.08
        console.log(`RATE for ${period} is:`, rate)
        break
      case '12 months':
        rate = 0.09
        console.log(`RATE for ${period} is:`, rate)
        break
      case '1 year and 3 months':
        rate = 0.1
        console.log(`RATE for ${period} is:`, rate)
        break
      case '1 year and 6 months':
        rate = 0.11
        console.log(`RATE for ${period} is:`, rate)
        break
      case '1 year and 9 months':
        rate = 0.12
        console.log(`RATE for ${period} is:`, rate)
        break
      case '2 years or more':
        rate = 0.13
        console.log(`RATE for ${period} is:`, rate)
        break
      default:
        rate = 0.05
        console.log(`RATE for ${period} days is:`, rate)
        break
    }
    return resolve(rate)
  })
}

generateRate(198, '752')

generateRate(1000, '300')

// Generate Return on Investment
const interestDueOnPayout = (amount, rate, period) => {
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
const dueForPayout = (created_at, period) => {
  return new Promise((resolve, reject) => {
    if (!created_at || !period) {
      reject(new Error('Incomplete parameters or out of range'))
    }

    // Get numbers of days difference between two dates
    function getNumberOfDays(start, end) {
      const date1 = new Date(start)
      const date2 = new Date(end)

      // One day in milliseconds
      const oneDay = 1000 * 60 * 60 * 24

      // Calculating the time difference between two dates
      const diffInTime = date2.getTime() - date1.getTime()

      // Calculating the no. of days between two dates
      const diffInDays = Math.round(diffInTime / oneDay)

      return diffInDays
    }

    console.log('From Date Comparism function:', getNumberOfDays('2/1/2021', '3/1/2021'))

    // function getNumberOfDays2(start, end) {
    //   const start_date = new LocalDate.parse(start)
    //   const end_date = new LocalDate.parse(end)

    //   return JSJoda.ChronoUnit.DAYS.between(start_date, end_date)
    // }

    // console.log('From Js-Joda:', getNumberOfDays2('2021-02-01', '2022-04-29'))

    let isDueForPayout
    let investmentCreationDate = new Date(created_at).getTime()
    let periodToMs = parseInt(period) * 24 * 60 * 60 * 1000
    let investmentPayoutDate = new Date(periodToMs + investmentCreationDate).getTime()
    let investmentDuration
    let currentDate = new Date().getTime()
    console.log('Current Date: ' + currentDate)
    console.log('Period converted to Ms: ' + periodToMs)
    console.log(`Your investment was created on ${new Date(investmentCreationDate).toDateString()}`)
    console.log(`Investment Payout Date is ${new Date(investmentPayoutDate).toDateString()} `)
    investmentDuration = getNumberOfDays(
      new Date(investmentCreationDate).toLocaleDateString(),
      new Date(currentDate).toLocaleDateString()
    )

    console.log(
      'From Date Comparism function 2:',
      getNumberOfDays(
        new Date(investmentCreationDate).toLocaleDateString(),
        new Date(currentDate).toLocaleDateString()
      )
    )

    console.log('Investment duration is : ' + investmentDuration + ' days.')
    if (currentDate >= investmentPayoutDate || investmentDuration >= parseInt(period)) {
      isDueForPayout = true
      // investmentPayoutDate = new Date(investmentPayoutDate).toLocaleString()
      console.log(
        `Your investment is due for payout on ${new Date(investmentPayoutDate).toDateString()}`
      )
    } else {
      isDueForPayout = false
      console.log(
        `Your investment will be due for payout on ${new Date(investmentPayoutDate).toDateString()}`
      )
    }
    return resolve(isDueForPayout)
  })
}

dueForPayout('2022-04-29 10:02:07.58+01', '190')

const payoutDueDate = (created_at, period) => {
  return new Promise((resolve, reject) => {
    if (!created_at || !period) {
      reject(new Error('Incomplete parameters or out of range'))
    }
    let payoutDueDate
    let investmentCreationDate = new Date(created_at).getTime()
    let periodToMs = parseInt(period) * 24 * 60 * 60 * 1000
    let investmentPayoutDate = new Date(periodToMs + investmentCreationDate).getTime()
    let currentDate = new Date().getTime()
    console.log('Current Date: ' + currentDate)
    console.log('Period converted to Ms: ' + periodToMs)
    console.log(`Your investment was created on ${new Date(investmentCreationDate).toDateString()}`)
    console.log(`Investment Payout Date is ${new Date(investmentPayoutDate).toDateString()} `)
    payoutDueDate = new Date(investmentPayoutDate).toDateString()
    console.log(
      `The payout date for investment created on ${new Date(
        created_at
      ).toDateString()} for a period of ${period} is ${payoutDueDate}`
    )
    return resolve(payoutDueDate)
  })
}

payoutDueDate('2022-04-29 10:02:07.58+01', '200')

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

module.exports = { generateRate, interestDueOnPayout, dueForPayout, payoutDueDate }
