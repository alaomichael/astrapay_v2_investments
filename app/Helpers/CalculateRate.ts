/* eslint-disable prettier/prettier */
'use strict'
const generateRate = (amount, period) => {
  return new Promise((resolve, reject) => {
    if (!amount || !period || amount <= 0) reject(new Error('Incomplete parameters'))
    let rate
    console.log(parseInt(period))
    console.log(parseInt(period) > 731)
    if (period > 1000)
    switch (period) {
      case '180':
        rate = 0.06
        console.log('RATE:', rate)
        break
      case '300':
        rate = 0.07
        console.log('RATE:', rate)
        break
      case 'above 1000':
        rate = 0.1
        console.log('RATE:', rate)
        break
      default:
        rate = 0.05
        console.log('RATE:', rate)
        break
    }
    return resolve(rate)
  })
}

generateRate(10, '756')
// @ts-ignore
// export generateRate
