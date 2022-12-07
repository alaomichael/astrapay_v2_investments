const Env = require("@ioc:Adonis/Core/Env");
const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
const ASTRAPAY_WALLET_URL = Env.get("ASTRAPAY_WALLET_URL");
const CURRENT_SETTING_TAGNAME = Env.get("CURRENT_SETTING_TAGNAME");
import SettingServices from "App/Services/SettingsServices";
const axios = require("axios").default;
// @ts-ignore
// const { URLSearchParams } = require('url');
// const randomstring = require("randomstring");

export const manualLoanRecoveryFromUser = async function manualLoanRecoveryFromUser(
  loanRecoveryReference, loanWallet, outstandingLoanWallet, amountRecovered,  description, lng, lat): Promise<any> {

  try {
    // console.log("userWalletId,@ manualLoanRecoveryFromUser line 19", userWalletId);
    // console.log("customerId,@ manualLoanRecoveryFromUser line 20", customerId);
    // console.log("charge,@ manualLoanRecoveryFromUser line 21", charge);

    const headers = {
      "Token": ASTRAPAY_BEARER_TOKEN
    }
    // let generateRandomNumber = Math.random().toString(36).substring(12);
    // console.log("The ASTRAPAY API random number @ manualLoanRecoveryFromUser", generateRandomNumber);

    // let customerReference = randomstring.generate();
    // >> "XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT"
    // console.log("The ASTRAPAY API customerReference @ manualLoanRecoveryFromUser", customerReference);

    // let batchPaymentId = randomstring.generate(10);
    // >> "xqm5wXX"
    // console.log("The ASTRAPAY API batchPaymentId @ manualLoanRecoveryFromUser", batchPaymentId);
    amountRecovered = Number(amountRecovered);
    const settingsService = new SettingServices();
    const settings = await settingsService.getSettingBySettingTagName(CURRENT_SETTING_TAGNAME)
    // console.log("Admin setting line 71 @ manualLoanRecoveryFromUser:", settings);
    //  get the loan currency
    // @ts-ignore
    let { currencyCode, loanServiceChargeAccount } = settings;
    // let approvalIsAutomated = false
    // console.log("currencyCode setting line 77:", currencyCode);
    // console.log("loanServiceChargeAccount setting line 78:", loanServiceChargeAccount);


    //     {
    //     "requestReference": "Qtp49wYdRtyc6d163IqILvu9dLBFZjPr",
    //     "requestGrouping": "1234group",
    //     "userId": "Agent",
    //     "loanWallet": "ACC772993083878",
    //     "outstandingLoanWallet": "ACC772993083878",
    //     "amount": 10,
    //     "description": "Testing manual recovery endpoint",
    //     "lng": "3.234567",
    //     "lat": "7.654321"
    // }

    const payload = {
      "requestReference": loanRecoveryReference, // "Qtp49wYdRtyc6d163IqILvu9dLBFZjPS",
      "requestGrouping": loanRecoveryReference,
      "userId": "Agent",
      "loanWallet": loanWallet, // "ACC772993083878",
      "outstandingLoanWallet": outstandingLoanWallet, // "ACC772993083878",
      "amount": amountRecovered,
      "description": description,
      "lng": lng,
      "lat": lat,
    }
    const response = await axios.post(`${ASTRAPAY_WALLET_URL}/transfer/loans/manual_recovery`,
      payload, { headers: headers }
    )
    // console.log("The ASTRAPAY API response @ manualLoanRecoveryFromUser line 114: ", response);
    // console.log("The ASTRAPAY API response data @ manualLoanRecoveryFromUser line 115: ", response.data);
    //  && response.data.amountTransfered === CHARGE
    // RESPONSE BODY

    //  {
    //     "amount": 10.0,
    //     "description": "Testing manual recovery endpoint",
    //     "lat": "7.654321",
    //     "lng": "3.234567",
    //     "loanWallet": "ACC772993083878",
    //     "outstandingLoanWallet": "ACC772993083878",
    //     "requestGrouping": "1234group",
    //     "requestReference": "Qtp49wYdRtyc6d163IqILvu9dLBFZjPr",
    //     "transxnId": "transxn16621223993305",
    //     "userId": "Agent"
    // }

    if (response.status === 200) {
      if (response.data) {
        // console.log("The ASTRAPAY API response.data, @ manualLoanRecoveryFromUser line 105: ", response.data);
        return response//.data;
      } else {
        // console.log("The ASTRAPAY API response, @ manualLoanRecoveryFromUser line 108: ", response);
        return response;
      }
    } else {
      return;
    }
  } catch (error) {
    console.error(error.response.data.errorCode);
    console.error(error.response.data.errorMessage);
    console.error(error.message);
    if (error.response == undefined) {
      return { status: "FAILED TO POST MANUAL RECOVERY DATA", message: error.message }
    } else {
      return { status: "FAILED TO POST MANUAL RECOVERY DATA", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
    }
  }

}
