/* eslint-disable prettier/prettier */
'use strict'
function generateRates(amount, duration, investment_type) {
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
        console.log(`RATE for ${duration} is:`, rate)
        break
      case '6 months':
        rate = 0.07
        console.log(`RATE for ${duration} is:`, rate)
        break
      case '9 months':
        rate = 0.08
        console.log(`RATE for ${duration} is:`, rate)
        break
      case '12 months':
        rate = 0.09
        console.log(`RATE for ${duration} is:`, rate)
        break
      case '1 year and 3 months':
        rate = 0.1
        console.log(`RATE for ${duration} is:`, rate)
        break
      case '1 year and 6 months':
        rate = 0.11
        console.log(`RATE for ${duration} is:`, rate)
        break
      case '1 year and 9 months':
        rate = 0.12
        console.log(`RATE for ${duration} is:`, rate)
        break
      case '2 years or more':
        rate = 0.13
        console.log(`RATE for ${duration} is:`, rate)
        break
      default:
        rate = 0.05
        console.log(`RATE for ${duration} days is:`, rate)
        break
    }
    return resolve(rate)
  })
}

generateRates(19098, '702', 'fixed')
// @ts-ignore
// export {generateRates};
module.exports.generateRates = generateRates
