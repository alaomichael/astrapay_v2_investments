const Env = require("@ioc:Adonis/Core/Env");
// const ACCOUNT_NUMBER = Env.get("ACCOUNT_NUMBER");
// const ACCOUNT_BANK = Env.get("ACCOUNT_BANK");
// const BENEFICIARY_NAME = Env.get("BENEFICIARY_NAME");
const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
const ASTRAPAY_WALLET_URL = Env.get("ASTRAPAY_WALLET_URL");
const CURRENT_SETTING_TAGNAME = Env.get("CURRENT_SETTING_TAGNAME");
import SettingServices from "App/Services/SettingsServices";
const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');
const randomstring = require("randomstring");

export const recoverLoanFromUserMainWallet = async function recoverLoanFromUserMainWallet(
  loanRecoveryReference, loanWallet, mainWallet, outstandingLoanWallet, loanRecoveryWallet,
  interestOnLoanWallet, amountApproved, interestDueOnLoan, description, lng, lat
): Promise<any> {
  
  try {
    // console.log("userWalletId,@ recoverLoanFromUserMainWallet line 19", userWalletId);
    // console.log("customerId,@ recoverLoanFromUserMainWallet line 20", customerId);
    // console.log("charge,@ recoverLoanFromUserMainWallet line 21", charge);

    const headers = {
      "Token": ASTRAPAY_BEARER_TOKEN
    }
    // let generateRandomNumber = Math.random().toString(36).substring(12);
    // console.log("The ASTRAPAY API random number @ recoverLoanFromUserMainWallet", generateRandomNumber);

    // let customerReference = randomstring.generate();
    // >> "XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT"
    // console.log("The ASTRAPAY API customerReference @ recoverLoanFromUserMainWallet", customerReference);

    let batchPaymentId = randomstring.generate(10);
    // >> "xqm5wXX"
    // console.log("The ASTRAPAY API batchPaymentId @ recoverLoanFromUserMainWallet", batchPaymentId);
    amountApproved = Number(amountApproved);
    interestDueOnLoan = Number(interestDueOnLoan);
    const settingsService = new SettingServices();
    const settings = await settingsService.getSettingBySettingTagName(CURRENT_SETTING_TAGNAME)
    // console.log("Admin setting line 71 @ recoverLoanFromUserMainWallet:", settings);
    //  get the loan currency
    // @ts-ignore
    let { currencyCode, loanServiceChargeAccount } = settings;
    // let approvalIsAutomated = false
    // console.log("currencyCode setting line 77:", currencyCode);
    // console.log("loanServiceChargeAccount setting line 78:", loanServiceChargeAccount);

    const payload = {
      "requestReference": loanRecoveryReference, // "Qtp49wYdRtyc6d163IqILvu9dLBFZjPS",
      "requestGrouping": loanRecoveryReference,
      "userId": "Agent",
      "loanWallet": loanWallet, // "ACC772993083878",
      "mainWallet": mainWallet, // "ACC772993083878",
      "outstandingLoanWallet": outstandingLoanWallet, // "ACC772993083878",
      "loanRecoveryWallet": loanRecoveryWallet, // "ACC772993083878",
      "interestOnLoanWallet": interestOnLoanWallet, // "ACC772993083878",
      "amount": amountApproved,
      "interest": interestDueOnLoan,
      "description": description,
      "lng": lng,
      "lat": lat,
      "batchPaymentId": batchPaymentId,
    }
    const response = await axios.post(`${ASTRAPAY_WALLET_URL}/transfer/loans/recovery`,
      payload, { headers: headers }
    )
    // console.log("The ASTRAPAY API response @ recoverLoanFromUserMainWallet line 114: ", response);
    // console.log("The ASTRAPAY API response data @ recoverLoanFromUserMainWallet line 115: ", response.data);
    //  && response.data.amountTransfered === CHARGE
    // RESPONSE BODY
    //     {
    //     "amount": 10.0,
    //     "description": "Testing recovery endpoint",
    //     "interest": 2.0,
    //     "interestOnLoanWallet": "ACC772993083878",
    //     "lat": "87654321",
    //     "lng": "1234567",
    //     "loanRecoveryWallet": "ACC772993083878",
    //     "loanWallet": "ACC772993083878",
    //     "mainWallet": "ACC772993083878",
    //     "outstandingLoanWallet": "ACC772993083878",
    //     "requestGrouping": "123group",
    //     "requestReference": "Qtp49wYdRtyc6d163IqILvu9dLBFZjPS",
    //     "transxnId": "transxn16602137498835",
    //     "userId": "Agent"
    // }
    if (response.status === 200) {
      if (response.data) {
        // console.log("The ASTRAPAY API response.data, @ recoverLoanFromUserMainWallet line 105: ", response.data);
        return response//.data;
      } else {
        // console.log("The ASTRAPAY API response, @ recoverLoanFromUserMainWallet line 108: ", response);
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
      return { status: "FAILED TO DEBIT WALLET", message: error.message }
    } else {
    return { status: "FAILED TO DEBIT WALLET", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
  }}

}
