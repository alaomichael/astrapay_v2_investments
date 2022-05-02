/* eslint-disable prettier/prettier */
'use strict'
const generateRate = (amount, period) => {
  return new Promise((resolve, reject) => {
    if (!amount || !period || amount <= 0) reject(new Error('Incomplete parameters'))
    let rate
    if (parseInt(period) > 89 && < 180) {
      period = '3 months'
    } else if (parseInt(period) === 180 || parseInt(period) < 270) {
      period = '6 months'
    } else if (parseInt(period) === 270 || parseInt(period) < 360) {
      period = '9 months'
    } else if (parseInt(period) === 360 || parseInt(period) < 450) {
      period = '12 months'
    } else if (parseInt(period) === 450 || parseInt(period) < 540) {
      period = '1 year and 3 months'
    } else if (parseInt(period) === 540 || parseInt(period) < 630) {
      period = '1 year and 6 months'
    } else if (parseInt(period) === 630 || parseInt(period) < 720) {
      period = '1 year and 9 months'
    } else if (parseInt(period) === 720) {
      period = '2 years'
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
        rate = 0.10
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
      case '2 years':
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

generateRate(10, '89')
// @ts-ignore
// export generateRate
