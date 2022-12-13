/* eslint-disable eqeqeq */
/* eslint-disable prettier/prettier */
'use strict'

// import Investment from "App/Models/Investment"
// import Setting from "App/Models/Setting"
// import PuppeteerServices from "App/Services/PuppeteerServices"
// import { DateTime } from "luxon"

// import { createRequire } from 'module'
// @ts-ignore
// const require = createRequire(import.meta.url)
// import Tax from "App/Models/Tax"
// const Tax = require('App/Models/Tax.ts')

// import { string } from '@ioc:Adonis/Core/Helpers'
// const string = require('@ioc:Adonis/Core/Helpers')
// import { DateTime } from 'luxon'
// const { DateTime } = require('luxon')
// const {DateTime} = Luxon
// import Env from '@ioc:Adonis/Core/Env'
const Env = require('@ioc:Adonis/Core/Env')
const axios = require('axios').default
// const JSJoda = require('js-joda')
// const LocalDate = JSJoda.LocalDate
// const Moment = require('moment')
const API_URL = Env.get('API_URL')

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
// export type ThousandSeparator = 'comma' | 'duration' | 'none' | 'space'

// Generate rate
// export const generateRate =

const generateRate = (amount, duration, investment_type) => {
  return new Promise((resolve, reject) => {
    if (!amount || !duration || !investment_type || amount <= 0)
      reject(new Error('Incomplete parameters or amount is less than allowed range'))
    let rate
    if (parseInt(duration) >= 90 && 180 > parseInt(duration)) {
      duration = '3 months'
    } else if (parseInt(duration) >= 180 && 270 > parseInt(duration)) {
      duration = '6 months'
    } else if (parseInt(duration) >= 270 && 360 > parseInt(duration)) {
      duration = '9 months'
    } else if (parseInt(duration) >= 360 && 450 > parseInt(duration)) {
      duration = '12 months'
    } else if (parseInt(duration) >= 450 && 540 > parseInt(duration)) {
      duration = '1 year and 3 months'
    } else if (parseInt(duration) >= 540 && 630 > parseInt(duration)) {
      duration = '1 year and 6 months'
    } else if (parseInt(duration) >= 630 && 720 > parseInt(duration)) {
      duration = '1 year and 9 months'
    } else if (parseInt(duration) >= 720) {
      duration = '2 years or more'
    }

    switch (duration) {
      case '3 months':
        rate = 0.06
        console.log(`RATE for ${investment_type} deposit for ${duration} days is:`, rate)
        break
      case '6 months':
        rate = 0.07
        console.log(`RATE for ${investment_type} deposit for ${duration} days is:`, rate)
        break
      case '9 months':
        rate = 0.08
        console.log(`RATE for ${investment_type} deposit for ${duration} days is:`, rate)
        break
      case '12 months':
        rate = 0.09
        console.log(`RATE for ${investment_type} deposit for ${duration} days is:`, rate)
        break
      case '1 year and 3 months':
        rate = 0.1
        console.log(`RATE for ${investment_type} deposit for ${duration} days is:`, rate)
        break
      case '1 year and 6 months':
        rate = 0.11
        console.log(`RATE for ${investment_type} deposit for ${duration} days is:`, rate)
        break
      case '1 year and 9 months':
        rate = 0.12
        console.log(`RATE for ${investment_type} deposit for ${duration} days is:`, rate)
        break
      case '2 years or more':
        rate = 0.13
        console.log(`RATE for ${investment_type} deposit for ${duration} days is:`, rate)
        break
      default:
        rate = 0.05
        console.log(`RATE for ${investment_type} deposit for ${duration} days is:`, rate)
        break
    }
    return resolve(rate)
  })
}

// generateRate(198, '752', 'fixed')

// generateRate(1000, '300', 'debenture')

// Generate Return on Investment
const interestDueOnPayout = (amount, rate, duration) => {
  return new Promise((resolve, reject) => {
    if (!amount || !rate || !duration || amount <= 0) {
      reject(new Error('Incomplete parameters or amount is less than allowed range'))
    }
    let interestDue
    let interestDueDaily
    interestDue = amount * (duration/360) * (rate/100)
    interestDueDaily = interestDue / duration
    let day = 'day'
    if (duration > 1) {
      day = 'days'
    }
    console.log(
      `Interest due for your investment of ${amount} for ${duration} ${day} is ${interestDue}`
    )
    console.log(
      `Interest due daily for your investment of ${amount} for ${duration} ${day} is ${interestDueDaily}`
    )
    return resolve(interestDue)
  })
}

// interestDueOnPayout(150000, 0.05, 180)

// Check Investment due for payout
// export const dueForPayout =
const dueForPayout = (created_at, duration) => {
  return new Promise((resolve, reject) => {
    if (!created_at || !duration) {
      reject(new Error('Invalid or incomplete parameters or out of range, please try again.'))
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

    // console.log('From Date Comparism function:', getNumberOfDays('2/1/2021', '3/1/2021'))

    // function getNumberOfDays2(start, end) {
    //   const start_date = new LocalDate.parse(start)
    //   const end_date = new LocalDate.parse(end)

    //   return JSJoda.ChronoUnit.DAYS.between(start_date, end_date)
    // }

    // console.log('From Js-Joda:', getNumberOfDays2('2021-02-01', '2022-04-29'))

    let isDueForPayout
    console.log('Current Date line 159 utils.ts: ' + created_at)
    let investmentCreationDate = new Date(created_at).getTime()
    let durationToMs = parseInt(duration) * 24 * 60 * 60 * 1000
    let investmentPayoutDate = new Date(durationToMs + investmentCreationDate).getTime()
    let investmentDuration
    let currentDate = new Date().getTime()

    // let verificationCodeExpiresAt = DateTime.now().plus({ hours: 2 })
    // let testingPayoutDate = DateTime.now().plus({ days: duration })
    // console.log('verificationCodeExpiresAt : ' + verificationCodeExpiresAt + ' from now')
    // console.log('Testing Payout Date: ' + testingPayoutDate)

    // console.log('Current Date: ' + currentDate)
    // console.log('duration converted to Ms: ' + durationToMs)
    // console.log(`Your investment was created on ${new Date(investmentCreationDate).toDateString()}`)
    // console.log(`Investment Payout Date is ${new Date(investmentPayoutDate).toDateString()} `)
    investmentDuration = getNumberOfDays(
      new Date(investmentCreationDate).toLocaleDateString(),
      new Date(currentDate).toLocaleDateString()
    )

    // console.log(
    //   'From Date Comparism function 2:',
    //   getNumberOfDays(
    //     new Date(investmentCreationDate).toLocaleDateString(),
    //     new Date(currentDate).toLocaleDateString()
    //   )
    // )
    let day = 'day'
    if (investmentDuration > 1) {
      day = 'days'
    }
    console.log('Investment duration is : ' + investmentDuration + ` ${day}`)
    if (currentDate >= investmentPayoutDate || investmentDuration >= parseInt(duration)) {
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

// dueForPayout('2022-04-29 10:02:07.58+01', '190')

// Get numbers of days difference between two dates
const investmentDuration = async function getNumberOfDays(start, end) {
  const date1 = new Date(start)
  const date2 = new Date(end)

  // One day in milliseconds
  const oneDay = 1000 * 60 * 60 * 24

  // Calculating the time difference between two dates
  const diffInTime = (await date2.getTime()) - date1.getTime()

  // Calculating the no. of days between two dates
  const diffInDays = await Math.round(diffInTime / oneDay)
  console.log('Duration of the investment is: ', diffInDays)
  // let currentDate = new Date().toISOString() //.toLocaleString()
  // console.log('currentDate : ', currentDate)

  return diffInDays
}

// let currentDate = new Date().toISOString()
// investmentDuration('2022-04-30 10:02:07.58+01', currentDate)

const payoutDueDate = (created_at, duration) => {
  return new Promise((resolve, reject) => {
    if (!created_at || !duration) {
      reject(new Error('Incomplete parameters or out of range'))
    }
    let payoutDueDate
    let investmentCreationDate = new Date(created_at).getTime()
    let durationToMs = parseInt(duration) * 24 * 60 * 60 * 1000
    let investmentPayoutDate = new Date(durationToMs + investmentCreationDate).getTime()
    // let currentDate = new Date().getTime()
    // console.log('Current Date: ' + currentDate)
    // console.log('duration converted to Ms: ' + durationToMs)
    // console.log(`Your investment was created on ${new Date(investmentCreationDate).toDateString()}`)
    // console.log(`Investment Payout Date is ${new Date(investmentPayoutDate).toDateString()} `)
    payoutDueDate = new Date(investmentPayoutDate).toISOString() // using .toISOString() to convert it to luxon acceptable format
    // console.log(
    //   `The payout date for investment created on ${new Date(
    //     created_at
    //   ).toDateString()} for a duration of ${duration} is ${payoutDueDate}`
    // )
    return resolve(payoutDueDate)
  })
}

// payoutDueDate('2022-04-29 10:02:07.58+01', '200')

const approvalRequest = async function (userId, investmentId, requestType) {
  try {
    // let requestType = 'start_investment'
    const response = await axios.post(`${API_URL}/investments/approvals`, {
      userId,
      investmentId,
      requestType,
    })
    console.log('The API response for approval request line 280: ', response.data)
    if (response && response.data.status === 'OK') {
      console.log('Approval request status is OK')
      return response.data
    } else {
      console.log('Approval request status is NOT OK')
      return
    }
  } catch (error) {
    console.error(error)
  }
}

const getTaxRate = async function (state, income) {
  try {
    console.log('Income from investment: ', income)
    // const response = await Tax.query().where({ state: state })
    // ${API_URL}/admin/investments/taxes?state=${state}
    const response = await axios.get(`${API_URL}/admin/investments/taxes`, {
      state,
    })
    console.log('The API response for tax rate request: ', response[0].rate)
    if (response && response[0].rate !== undefined && response[0].rate > 0) {
      console.log('tax request status is OK')
      return response[0].rate
    } else {
      console.log('Tax request status is NOT OK')
      return
    }
  } catch (error) {
    console.error(error)
  }
}

// getTaxRate('oyo', 19000)

const sendPaymentDetails = async function (amount, duration, investmentType) {
  try {
    const response = await axios.get(
      `${API_URL}/investments/rates?amount=${amount}&duration=${duration}&investmentType=${investmentType}`
    )
    console.log('The API response: ', response.data)
    if (response.data.status === 'OK' && response.data.data.length > 0) {
      return response.data.data[0].interestRate
    } else {
      return
    }
  } catch (error) {
    console.error(error)
  }
}

// console.log(
//   ' The Rate return for RATE utils.ts line 299: ',
//   sendPaymentDetails(12000, 180, 'fixed')
// )
const investmentRate = async function (payloadAmount, payloadDuration, payloadInvestmentType) {
  try {
    const response = await axios.get(
      `${API_URL}/investments/rates?amount=${payloadAmount}&duration=${payloadDuration}&investmentType=${payloadInvestmentType}`
    )
    console.log('The API response line 346: ', response.data)
    if (response.data.status === 'OK' && response.data.data.length > 0) {
      console.log('The API response line 348: ', response.data.data[0].interestRate)
      return response.data.data[0].interestRate
    } else {
      return
    }
  } catch (error) {
    console.error(error)
  }
}

const createNewInvestment = async function ( payloadAmount,
                  payloadDuration,
                  payloadInvestmentType,
                  investmentData) {
                      console.log('Investment data line 362: ', investmentData)
                  console.log('Investment payloadAmount data line 363: ', payloadAmount)
                  console.log('Investment payloadDuration data line 364: ', payloadDuration)
                  console.log(
                    'Investment payloadInvestmentType data line 366: ',
                    payloadInvestmentType
                  )
  try {
    // let requestType = 'start_investment'
      let payload
                  // destructure / extract the needed data from the investment
                  let {
                    amount,
                    rolloverType,
                    rolloverTarget,
                    rolloverDone,
                    investmentType,
                    duration,
                    userId,
                    tagName,
                    currencyCode,
                    long,
                    lat,
                    walletHolderDetails,
                  } = investmentData
                  // copy the investment data to payload
                  payload = {
                    amount,
                    rolloverType,
                    rolloverTarget,
                    rolloverDone,
                    investmentType,
                    duration,
                    userId,
                    tagName,
                    currencyCode,
                    long,
                    lat,
                    walletHolderDetails,
                  }
                  payload.amount = payloadAmount
                  //  payload.interestRate = rate
                  console.log('PAYLOAD line 2325 :', payload)

    const response = await axios.post(`${API_URL}/investments`, {
      amount:payloadAmount,
      rolloverType,
      rolloverTarget,
      rolloverDone,
      investmentType,
      duration,
      userId,
      tagName,
      currencyCode,
      long,
      lat,
      walletHolderDetails,
    })
    console.log('The API response for new investment creation request line 420: ', response.data)
    if (response && response.data.status === 'OK') {
      console.log('New investment created successfully, request status is OK')
      return response.data
    } else {
      console.log('New investment request status is NOT OK')
      return
    }
  } catch (error) {
    console.error(error)
  }
}


// const createInvestment = async (
//                   payloadAmount,
//                   payloadDuration,
//                   payloadInvestmentType,
//                   investmentData
//                 ) => {
//                   console.log('Investment data line 1713: ', investmentData)
//                   console.log('Investment payloadAmount data line 1714: ', payloadAmount)
//                   console.log('Investment payloadDuration data line 1715: ', payloadDuration)
//                   console.log(
//                     'Investment payloadInvestmentType data line 1717: ',
//                     payloadInvestmentType
//                   )

//                   console.log(
//                     ' The Rate return for RATE line 2274: ',
//                     await investmentRate(payloadAmount, payloadDuration, payloadInvestmentType)
//                   )
//                   let rate = await investmentRate(
//                     payloadAmount,
//                     payloadDuration,
//                     payloadInvestmentType
//                   )
//                   console.log(' Rate return line 2282 : ', rate)
//                   if (rate === undefined) {
//                     return response.status(400).json({
//                       status: 'FAILED',
//                       message: 'no investment rate matched your search, please try again.',
//                       data: [],
//                     })
//                   }
//                   let settings = await Setting.query().where({ tagName: 'default setting' })
//                   console.log('Approval setting line 2291:', settings[0])
//                   let payload
//                   // destructure / extract the needed data from the investment
//                   let {
//                     amount,
//                     rolloverType,
//                     rolloverTarget,
//                     rolloverDone,
//                     investmentType,
//                     duration,
//                     userId,
//                     tagName,
//                     currencyCode,
//                     long,
//                     lat,
//                     walletHolderDetails,
//                   } = investmentData
//                   // copy the investment data to payload
//                   payload = {
//                     amount,
//                     rolloverType,
//                     rolloverTarget,
//                     rolloverDone,
//                     investmentType,
//                     duration,
//                     userId,
//                     tagName,
//                     currencyCode,
//                     long,
//                     lat,
//                     walletHolderDetails,
//                   }
//                   payload.amount = payloadAmount
//                   //  payload.interestRate = rate
//                   console.log('PAYLOAD line 2325 :', payload)

//                   const investment = await Investment.create(payload)
//                   investment.interestRate = rate

//                   // When the Invest has been approved and activated
//                   let investmentAmount = investment.amount
//                   let investmentDuration = investment.duration
//                   let amountDueOnPayout = await interestDueOnPayout(
//                     investmentAmount,
//                     rate,
//                     investmentDuration
//                   )
//                   // @ts-ignore
//                   investment.interestDueOnInvestment = amountDueOnPayout
//                   // @ts-ignore
//                   investment.totalAmountToPayout = investment.amount + amountDueOnPayout
//                   // @ts-ignore
//                   investment.walletId = investment.walletHolderDetails.investorFundingWalletId
//                   await investment.save()
//                   console.log('The new Reinvestment, line 2345 :', investment)

//                   await investment.save()
//                   let newInvestmentId = investment.id
//                   // @ts-ignore
//                   let newInvestmentEmail = investment.walletHolderDetails.email

//                   // Send Investment Initiation Message to Queue

//                   // check if Approval is set to Auto, from Setting Controller
//                   let requestType = 'start_investment'
//                   let approvalIsAutomated = settings[0].isInvestmentAutomated
//                   if (approvalIsAutomated === false) {
//                     // Send Approval Request to Admin
//                     userId = investment.userId
//                     let investmentId = investment.id
//                     // let requestType = 'start_investment'
//                     let approval = await approvalRequest(userId, investmentId, requestType)
//                     console.log(' Approval request return line 2362 : ', approval)
//                     if (approval === undefined) {
//                       return response.status(400).json({
//                         status: 'FAILED',
//                         message:
//                           'investment approval request was not successful, please try again.',
//                         data: [],
//                       })
//                     }
//                     // update timeline
//                     timelineObject = {
//                       id: uuid(),
//                       action: 'investment initiated',
//                       // @ts-ignore
//                       message: `${investment.walletHolderDetails.firstName} investment has just been sent for activation approval.`,
//                       createdAt: DateTime.now(),
//                       meta: `amount invested: ${investment.amount}, request type : ${requestType}`,
//                     }
//                     console.log('Timeline object line 2380:', timelineObject)
//                     //  Push the new object to the array
//                     console.log('Timeline array line 2382:', investment.timeline)
//                     //  create a new timeline array
//                     timeline = []
//                     timeline.push(timelineObject)
//                     console.log('Timeline object line 2384:', timeline)
//                     // stringify the timeline array
//                     investment.timeline = JSON.stringify(timeline)
//                     console.log('Timeline array line 2389:', investment.timeline)
//                     // Save
//                     await investment.save()

//                     // Send to Notification Service
//                     // New investment initiated
//                     Event.emit('new:investment', {
//                       id: newInvestmentId,
//                       email: newInvestmentEmail,
//                     })
//                   } else if (approvalIsAutomated === true) {
//                     // TODO
//                     // If Approval is automated
//                     // Send Investment Payload To Transaction Service and await response
//                     let sendToTransactionService = 'OK' //= new SendToTransactionService(investment)
//                     console.log(' Feedback from Transaction service: ', sendToTransactionService)
//                     if (sendToTransactionService === 'OK') {
//                       // Activate the investment
//                       investment.requestType = requestType
//                       investment.status = 'active'
//                       investment.approvalStatus = 'approved'
//                       investment.startDate = DateTime.now() //.toISODate()
//                       investment.payoutDate = DateTime.now().plus({
//                         days: parseInt(investmentDuration),
//                       })
//                       // update timeline
//                       timelineObject = {
//                         id: uuid(),
//                         action: 'investment activated',
//                         // @ts-ignore
//                         message: `${investment.walletHolderDetails.firstName} investment has just been activated.`,
//                         createdAt: DateTime.now(),
//                         meta: `amount invested: ${investment.amount}, request type : ${investment.requestType}`,
//                       }
//                       console.log('Timeline object line 2422:', timelineObject)
//                       //  Push the new object to the array
//                       timeline = [] //JSON.parse(investment.timeline)
//                       timeline.push(timelineObject)
//                       console.log('Timeline object line 2426:', timeline)
//                       // stringify the timeline array
//                       investment.timeline = JSON.stringify(timeline)
//                       // Save
//                       await investment.save()
//                       const requestUrl = Env.get('CERTIFICATE_URL') //+ investment.id
//                       await new PuppeteerServices(requestUrl, {
//                         paperFormat: 'a3',
//                         fileName: `${investment.requestType}_${investment.id}`,
//                       })
//                         .printAsPDF(investment)
//                         .catch((error) => console.error(error))
//                       console.log('Investment Certificate generated, URL, line 2439: ', requestUrl)
//                       // save the certicate url
//                       investment.certificateUrl = requestUrl
//                       await investment.save()
//                       // Send to Notification Service
//                       // New Investment Initiated and Activated
//                       Event.emit('new:investment', {
//                         id: newInvestmentId,
//                         email: newInvestmentEmail,
//                       })
//                     }
//                   }
//                   return response.status(201).json({ status: 'OK', data: investment.$original })
//                   // END
//                 }

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
// export const thousandSeparatorTypes: ThousandSeparator[] = ['comma', 'duration', 'none', 'space']


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


module.exports = {
  generateRate,
  interestDueOnPayout,
  dueForPayout,
  payoutDueDate,
  approvalRequest,
  investmentDuration,
  sendPaymentDetails,
  investmentRate,
  getTaxRate,
  getPrintServerBaseUrl,
  createNewInvestment,
}

export {
  generateRate,
  interestDueOnPayout,
  dueForPayout,
  payoutDueDate,
  approvalRequest,
  investmentDuration,
  sendPaymentDetails,
  investmentRate,
  getTaxRate,createNewInvestment
}
