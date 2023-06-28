/* eslint-disable eqeqeq */
/* eslint-disable prettier/prettier */
"use strict";

// import Okrarecord from "App/Models/Okrarecord";
// import OkrarecordsServices from "App/Services/OkraRecordsServices";

// import Wallet from "App/Models/Wallet";

// import Investment from "App/Models/Investment"
// import Setting from "App/Models/Setting"
// import PuppeteerServices from "App/Services/PuppeteerServices"
// import { DateTime } from 'luxon'
// const { DateTime } = require('luxon')
// const {DateTime} = Luxon
// import Env from '@ioc:Adonis/Core/Env'
const Env = require("@ioc:Adonis/Core/Env");
const axios = require("axios").default;
// const JSJoda = require('js-joda')
// const LocalDate = JSJoda.LocalDate
// const Moment = require('moment')
const API_URL = Env.get("API_URL");
const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");


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

const generateRate = (amount, duration) => {
  return new Promise((resolve, reject) => {
    if (!amount || !duration || amount <= 0)
      reject(
        new Error("Incomplete parameters or amount is less than allowed range")
      );
    let rate; //:number;
    if (parseInt(duration) >= 7 && 14 > parseInt(duration)) {
      duration = "7 days";
    } else if (parseInt(duration) >= 14 && 21 > parseInt(duration)) {
      duration = "14 days";
    } else if (parseInt(duration) >= 21 && 30 > parseInt(duration)) {
      duration = "21 days";
    } else if (parseInt(duration) >= 30 && 45 > parseInt(duration)) {
      duration = "30 days";
    } else if (parseInt(duration) >= 45 && 60 > parseInt(duration)) {
      duration = "45 days";
    } else if (parseInt(duration) >= 60 && 90 > parseInt(duration)) {
      duration = "60 days";
    } else if (parseInt(duration) >= 90 && 119 > parseInt(duration)) {
      duration = "90 days";
    } else if (parseInt(duration) >= 120) {
      duration = "120 days";
    }

    switch (duration) {
      case "7 days":
        rate = 10;
        console.log(`RATE for ${amount} investment for ${duration} days is:`, rate);
        break;
      case "14 days":
        rate = 9;
        console.log(`RATE for ${amount} investment for ${duration} days is:`, rate);
        break;
      case "21 days":
        rate = 8;
        console.log(`RATE for ${amount} investment for ${duration} days is:`, rate);
        break;
      case "30 days":
        rate = 7;
        console.log(`RATE for ${amount} investment for ${duration} days is:`, rate);
        break;
      case "45 days":
        rate = 6;
        console.log(`RATE for ${amount} investment for ${duration} days is:`, rate);
        break;
      case "60 days":
        rate = 5;
        console.log(`RATE for ${amount} investment for ${duration} days is:`, rate);
        break;
      case "90 days":
        rate = 4.5;
        console.log(`RATE for ${amount} investment for ${duration} days is:`, rate);
        break;
      case "120 days":
        rate = 4.0;
        console.log(`RATE for ${amount} investment for ${duration} days is:`, rate);
        break;
      default:
        rate = 10.5;
        console.log(`RATE for ${amount} investment for ${duration} days is:`, rate);
        break;
    }
    return resolve(rate);
  });
};

// generateRate(198, '752', 'fixed')

// generateRate(1000, '300', 'debenture')

// Get decimal place
const getDecimalPlace = (n, r = 2) => {
  let valueToReturn;
  const numToSeparate = n; //12345;
  // const arrayOfDigits = Array.from(String(numToSeparate), Number);
  // console.log(arrayOfDigits);   //[1,2,3,4,5]
  const arrayOfDigits02 = numToSeparate.toString().split("");
  // console.log(arrayOfDigits02);
  let indexOfDecimalPoint = arrayOfDigits02.indexOf(".");
  // console.log(indexOfDecimalPoint);
  // console.log(arrayOfDigits02[indexOfDecimalPoint + r + 2]);
  // console.log(arrayOfDigits02[indexOfDecimalPoint + r + 3]);
  if (arrayOfDigits02[indexOfDecimalPoint + r + 1] >= 4 && arrayOfDigits02[indexOfDecimalPoint + r + 2] >= 4 && arrayOfDigits02[indexOfDecimalPoint + r + 3] >= 5) {
    // console.log("The value of the first next digit is", n.toString()[indexOfDecimalPoint + r + 1]);
    // console.log("The value of the next digit is", n.toString()[indexOfDecimalPoint + r + 2]);
    // console.log("The value of the next digit after the one above is", n.toString()[indexOfDecimalPoint + r + 3]);
    let valueToAdd = 1 * 10 ** (-(r)); // eg 0.0001;
    // console.log(valueToAdd);
    valueToReturn = (Math.round(Math.round(n * 10 ** (r + 1)) / 10) / 10 ** r);
    // console.log("valueToReturn line 132 ================");
    // console.log(valueToReturn);
    // console.log("valueToReturn.toString()[r] line 134 ================");
    // console.log(valueToReturn.toString()[r]);
    if ((r == 1 && valueToReturn.toString()[r] != undefined) || (valueToAdd <= 0.01 && valueToReturn.toString()[r] < 5)) {
      valueToReturn = valueToReturn + valueToAdd;
      // console.log("valueToReturn line 138 ================");
      // console.log(valueToReturn);
      valueToReturn = Number(valueToReturn.toFixed(r));
      // console.log("valueToReturn line 141 ================");
      // console.log(valueToReturn);
    }
  } else {
    valueToReturn = (Math.round(Math.round(n * 10 ** (r + 1)) / 10) / 10 ** r)
  }
  console.log(n + ' rounded to ' + r + ' decimal places is ' + valueToReturn);
  return valueToReturn
}

// var testNum = 5.9567654; //5.54489;//12376543.0045345//12376543.345345345345; //134.9567654;
// var decPl = 2;
// var testRes = getDecimalPlace(testNum, decPl);
// alert(testNum + ' rounded to ' + decPl + ' decimal places is ' + testRes);
// console.log(testNum + ' rounded to ' + decPl + ' decimal places is ' + testRes);


// Generate Return on Investment
const interestDueOnInvestment = (amount, rate, duration) => {
  return new Promise((resolve, reject) => {
    if (!amount || !rate || !duration || amount <= 0 || rate < 0) {
      reject(
        new Error("Incomplete parameters or rate/amount is less than allowed range")
      );
    }


    let interestDue;
    let interestDueDaily;
    let decPl = 2;
    // TODO: Comment this out after testing and working fine
    // Testing code start
    let interestRateByDuration = (rate) * (duration / 365);
    // console.log("Interest rate on investment for 365 days, @ utils line 174:", rate)
    // console.log(`Interest rate by investment duration for ${duration} day(s), @ utils line 175:`, interestRateByDuration)
    // convert to decimal places
    interestRateByDuration = Number(getDecimalPlace(interestRateByDuration, decPl))
    // console.log(`Interest rate by investment duration for ${duration} day(s), in ${decPl} dp, @ InvestmentsController line 177:`, interestRateByDuration);
    // Testing code end
    // Formal due investment interest calculation based on amount and interest rate
    // interestDue = amount * (rate / 100);
    // New due investment interest calculation based on amount and interest rate and duration
    interestDue = amount * (rate / 100) * (duration / 365);
    // console.log("interestDue @utils, line 184 is =========================");
    // console.log(interestDue);
    // interestDue = Number(interestDue.toFixed(2)); // reduce the interestDue to 2dp string and convert to number
    interestDue = Number(getDecimalPlace(interestDue, decPl)); // reduce the interestDue to 2dp string and convert to number
    // console.log("typeof interestDue @utils, line 188 is =========================");
    // console.log(typeof interestDue);
    // console.log("interestDue @utils, line 190 is =========================");
    // console.log(interestDue);
    interestDueDaily = interestDue / duration;
    let day = "day";
    if (duration > 1) {
      day = "days";
    }
    // console.log(
    //   `Interest due for your investment of ${amount} for ${duration} ${day} is ${interestDue}`
    // );
    // console.log(
    //   `Interest due daily for your investment of ${amount} for ${duration} ${day} is ${interestDueDaily}`
    // );
    return resolve(interestDue);
  });
};

// interestDueOnInvestment(20, 20, 1)
// interestDueOnInvestment(20, 20, 7)
// interestDueOnInvestment(20, 20, 14)
// interestDueOnInvestment(20, 20, 21)
// interestDueOnInvestment(20, 20, 28)
// interestDueOnInvestment(20, 20, 30)
// interestDueOnInvestment(20, 20, 60)
// interestDueOnInvestment(20, 20, 90)
// interestDueOnInvestment(20, 20, 120)

// Check Investment due for payout
// export const dueForPayout =
const dueForRepayment = (created_at, duration) => {
  return new Promise((resolve, reject) => {
    if (!created_at || !duration) {
      reject(
        new Error(
          "Invalid or incomplete parameters or out of range, please try again."
        )
      );
    }

    // Get numbers of days difference between two dates
    function getNumberOfDays(start, end) {
      const date1 = new Date(start);
      const date2 = new Date(end);

      // One day in milliseconds
      const oneDay = 1000 * 60 * 60 * 24;

      // Calculating the time difference between two dates
      const diffInTime = date2.getTime() - date1.getTime();

      // Calculating the no. of days between two dates
      const diffInDays = Math.round(diffInTime / oneDay);

      return diffInDays;
    }

    // console.log('From Date Comparism function:', getNumberOfDays('2/1/2021', '3/1/2021'))

    // function getNumberOfDays2(start, end) {
    //   const start_date = new LocalDate.parse(start)
    //   const end_date = new LocalDate.parse(end)

    //   return JSJoda.ChronoUnit.DAYS.between(start_date, end_date)
    // }

    // console.log('From Js-Joda:', getNumberOfDays2('2021-02-01', '2022-04-29'))

    let isDueForRepayment;
    // console.log("Current Date line 159 utils.ts: " + created_at);
    let investmentCreationDate = new Date(created_at).getTime();
    let durationToMs = parseInt(duration) * 24 * 60 * 60 * 1000;
    let investmentRepaymentDate = new Date(durationToMs + investmentCreationDate).getTime();
    let investmentDuration;
    let currentDate = new Date().getTime();

    // let verificationCodeExpiresAt = DateTime.now().plus({ hours: 2 })
    // let testingPayoutDate = DateTime.now().plus({ days: duration })
    // console.log('verificationCodeExpiresAt : ' + verificationCodeExpiresAt + ' from now')
    // console.log('Testing Payout Date: ' + testingPayoutDate)

    // console.log('Current Date: ' + currentDate)
    // console.log('duration converted to Ms: ' + durationToMs)
    // console.log(`Your investment was created on ${new Date(investmentCreationDate).toDateString()}`)
    // console.log(`Investment Payout Date is ${new Date(investmentRepaymentDate).toDateString()} `)
    investmentDuration = Number(getNumberOfDays(
      new Date(investmentCreationDate).toLocaleDateString(),
      new Date(currentDate).toLocaleDateString()
    ));

    // console.log(
    //   'From Date Comparism function 2:',
    //   getNumberOfDays(
    //     new Date(investmentCreationDate).toLocaleDateString(),
    //     new Date(currentDate).toLocaleDateString()
    //   )
    // )
    let day = "day";
    investmentDuration = Number(investmentDuration)
    if (investmentDuration > 1) {
      day = "days";
    }
    // console.log("Investment duration is : " + investmentDuration + ` ${day}`);
    if (currentDate >= investmentRepaymentDate || investmentDuration >= parseInt(duration)) {
      isDueForRepayment = true;
      // investmentRepaymentDate = new Date(investmentRepaymentDate).toLocaleString()
      // console.log(`Your investment is due for repayment on ${new Date(investmentRepaymentDate).toDateString()}`);
    } else {
      isDueForRepayment = false;
      // console.log(`Your investment will be due for repayment on ${new Date(investmentRepaymentDate).toDateString()}`);
    }
    return resolve(isDueForRepayment);
  });
};

// dueForPayout('2022-04-29 10:02:07.58+01', '190')

// Get numbers of days difference between two dates
const investmentDuration = async function getNumberOfDays(start, end) {
  const date1 = new Date(start);
  const date2 = new Date(end);

  // One day in milliseconds
  const oneDay = 1000 * 60 * 60 * 24;

  // Calculating the time difference between two dates
  const diffInTime = (await date2.getTime()) - date1.getTime();

  // Calculating the no. of days between two dates
  const diffInDays = await Math.round(diffInTime / oneDay);
  // console.log("Duration of the investment is: ", diffInDays);
  // let currentDate = new Date().toISOString() //.toLocaleString()
  // console.log('currentDate : ', currentDate)

  return diffInDays;
};

// let currentDate = new Date().toISOString()
// investmentDuration('2022-04-30 10:02:07.58+01', currentDate)

const repaymentDueDate = (created_at, duration) => {
  return new Promise((resolve, reject) => {
    if (!created_at || !duration) {
      reject(new Error("Incomplete parameters or out of range"));
    }
    let payoutDueDate;
    let investmentCreationDate = new Date(created_at).getTime();
    let durationToMs = parseInt(duration) * 24 * 60 * 60 * 1000;
    let investmentRepaymentDate = new Date(durationToMs + investmentCreationDate).getTime();
    // let currentDate = new Date().getTime()
    // console.log('Current Date: ' + currentDate)
    // console.log('duration converted to Ms: ' + durationToMs)
    // console.log(`Your investment was created on ${new Date(investmentCreationDate).toDateString()}`)
    // console.log(`Investment Payout Date is ${new Date(investmentRepaymentDate).toDateString()} `)
    payoutDueDate = new Date(investmentRepaymentDate).toISOString(); // using .toISOString() to convert it to luxon acceptable format
    // console.log(
    //   `The payout date for investment created on ${new Date(
    //     created_at
    //   ).toDateString()} for a duration of ${duration} is ${payoutDueDate}`
    // )
    return resolve(payoutDueDate);
  });
};

// repaymentDueDate('2022-04-29 10:02:07.58+01', '200')

const approvalRequest = async function (walletId, userId, investmentId, requestType) {
  try {
    const headers = {
      "internalToken": ASTRAPAY_BEARER_TOKEN
    }
    // let requestType = 'request_investment'
    const response = await axios.post(`${API_URL}/investments/approvals`, {
      walletId,
      investmentId,
      userId,
      requestType,
    }, { headers: headers });
    // console.log(
    //   "The API response for approval request line 280: ",
    //   response.data
    // );
    if (response && response.data.status === "OK") {
      console.log("Approval request status is OK");
      return response.data;
    } else {
      console.log("Approval request status is NOT OK");
      return;
    }
  } catch (error) {
    console.error(error);
    return { status: "FAILED", message: error.message }
  }
};

const sendPaymentDetails = async function (amount, duration, investmentType) {
  try {
    const headers = {
      "internalToken": ASTRAPAY_BEARER_TOKEN
    }
    const response = await axios.get(
      `${API_URL}/admin/investments/payouts?amount=${amount}&duration=${duration}&investmentType=${investmentType}`, { headers: headers });
    // console.log("The API response: ", response.data);
    if (response.data.status === "OK" && response.data.data.length > 0) {
      return response.data.data[0].interestRate;
    } else {
      return;
    }
  } catch (error) {
    console.error(error);
    return { status: "FAILED", message: error.message }
  }
};

// console.log(
//   ' The Rate return for RATE utils.ts line 299: ',
//   sendPaymentDetails(12000, 180, 'fixed')
// )
const investmentRate = async function (payloadAmount, payloadDuration, investmentProductId?, investmentProductName?) {
  try {
    // console.log("Investment ProductName data line 409: ", investmentProductName);
    const headers = {
      "internalToken": ASTRAPAY_BEARER_TOKEN
    }
    let response;
    if (investmentProductId != null || investmentProductId != undefined){
      response = await axios.get(
        `${API_URL}/investments/products?amount=${payloadAmount}&duration=${payloadDuration}&id=${investmentProductId}`, { headers: headers });
    // console.log("The investmentProductName 414: ", investmentProductName);
    // console.log("The investmentProductId 415: ", investmentProductId);
    // console.log("The API response line 416: ", response.data);
    } else {
      response = await axios.get(
        `${API_URL}/investments/products?amount=${payloadAmount}&duration=${payloadDuration}`, { headers: headers });
    // console.log("The investmentProductName 422: ", investmentProductName);
    // console.log("The investmentProductId 423: ", investmentProductId);
    // console.log("The API response line 424: ", response.data);
    }
    
    if (response.data.status === "OK" && response.data.data.length > 0) {
      // console.log("The API response line 428: ", response.data.data[0].interestRate);
      return response.data.data[0].interestRate;
    } else {
      return;
    }
  } catch (error) {
    console.error(error);
    return { status: "FAILED", message: error.message }
  }
};

const createNewInvestment = async function (
  payloadAmount,
  payloadDuration,
  investmentData
) {
  // console.log("Investment data line 434: ", investmentData);
  console.log("Investment payloadAmount data line 435: ", payloadAmount);
  console.log("Investment payloadDuration data line 436: ", payloadDuration);

  try {
    // let requestType = 'request_investment'
    let payload;
    // destructure / extract the needed data from the investment
    let {
      id,
      duration,
      userId,
      walletId,
      firstName,
      lastName,
      phone,
      email,
      investmentProductName,
      investmentProductId,
      customerSavingsAccount,
      investmentAccountNumber,
      bankCode,
      beneficiaryAccountNumber,
      beneficiaryAccountName,
      beneficiaryAccountBankName,
      beneficiaryAccountBankCode,
      otherAccountNumber,
      otherAccountName,
      otherAccountBankName,
      otherAccountBankCode,
      amountRequested,
      tagName,
      currencyCode,
      bvn,
      lng,
      lat,
      okraCustomerId,
      currentState,
      currentLGA,
      label
    } = investmentData;
    // copy the investment data to payload
    payload = {
      id,
      duration,
      userId,
      walletId,
      tagName,
      currencyCode,
      lng,
      lat,
      firstName,
      lastName,
      phone,
      email,
      investmentProductName,
      investmentProductId,
      customerSavingsAccount,
      investmentAccountNumber,
      bankCode,
      beneficiaryAccountNumber,
      beneficiaryAccountName,
      beneficiaryAccountBankName,
      beneficiaryAccountBankCode,
      otherAccountNumber,
      otherAccountName,
      otherAccountBankName,
      otherAccountBankCode,
      amountRequested,
      bvn,
      okraCustomerId,
      currentState,
      currentLGA,
      label
    };
    // payload.amount = payloadAmount;
    //  payload.interestRate = rate

    // get user okraCustomerId
    // let okraRecord = await Okrarecord.query().where({ userId: userId }).first();
    // const OkrarecordsService = new OkrarecordsServices();
    // let okraRecord = await OkrarecordsService.getOkrarecordByUserId(userId);
    // // console.log("Okra record Id")
    // // console.log(okraRecord);
    // if (!okraRecord) {
    //   console.log("user does not have an existing okra record,line 427 @ utils.ts");
    //   return {
    //     status: "FAILED",
    //     message: "user does not have an existing okra record, please complete your onboarding process and try again."
    //   }
    // }
    // let { customerId } = okraRecord;
    // payload.okraCustomerId = customerId;

    // console.log("PAYLOAD line 438 ===============================:", payload);
    const headers = {
      "internalToken": ASTRAPAY_BEARER_TOKEN
    }
    const response = await axios.post(`${API_URL}/investments`, payload, { headers: headers });
    // amount: payloadAmount,
    // console.log("The API response for new investment creation request line 445 @ utils.ts : ", response.data);
    if (response && response.data.status === "OK") {
      console.log("New investment created successfully, request status is OK");
      return response.data;
    } else {
      console.log("New investment request status is NOT OK");
      return response.data;
    }
  } catch (error) {
    console.log("New investment request error: line 469 =============================");
    console.error(error);
    return { status: "FAILED", message: error.message }
  }
};

// Generate Total charge on Investment
const calculateTotalCharge = (amountApproved, fixedCharge, ratedCharge, duration?) => {
  return new Promise((resolve, reject) => {
    if (!amountApproved || !fixedCharge || !ratedCharge) {
      reject(
        new Error("Incomplete parameters,amountApproved or fixedCharge or ratedCharge is missing.")
      );
    }
    let totalCharge;
    amountApproved = Number(amountApproved);
    fixedCharge = Number(fixedCharge);
    ratedCharge = Number(ratedCharge);
    totalCharge = fixedCharge + (amountApproved * (ratedCharge / 100));
    // console.log("The duration is: ", duration);
    // console.log(`The Total Charge for this investment is ${totalCharge}.`);
    return resolve(totalCharge);
  });
};

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

export const getPrintServerBaseUrl = function () {
  let host: string;
  let port: number;
  const NODE_ENV = Env.get("NODE_ENV");

  if (NODE_ENV === "production" || NODE_ENV === "testing") {
    host = Env.get("PROD_PRINT_SERVER_HOST");
    port = Env.get("PROD_PRINT_SERVER_PORT");
  } else {
    host = Env.get("DEV_PRINT_SERVER_HOST");
    port = Env.get("DEV_PRINT_SERVER_PORT");
  }

  return `http://${host}:${port}`;
};

export const isProduction = Env.get("NODE_ENV") === "production";
export const isDevelopment = Env.get("NODE_ENV") === "development";

// module.exports = {
//   generateRate,
//   interestDueOnInvestment,
//   dueForRepayment,
//   repaymentDueDate,
//   approvalRequest,
//   investmentDuration,
//   sendPaymentDetails,
//   investmentRate,
//   getPrintServerBaseUrl,
//   createNewInvestment,
//   getRecommendation
// };

export {
  generateRate,
  interestDueOnInvestment,
  dueForRepayment,
  repaymentDueDate,
  approvalRequest,
  investmentDuration,
  sendPaymentDetails,
  investmentRate,
  // getPrintServerBaseUrl,
  createNewInvestment,
  calculateTotalCharge,
  getDecimalPlace,
};
