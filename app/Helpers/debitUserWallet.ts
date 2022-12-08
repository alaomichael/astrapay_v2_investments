const Env = require("@ioc:Adonis/Core/Env");
// const ACCOUNT_NUMBER = Env.get("ACCOUNT_NUMBER");
const ACCOUNT_BANK = Env.get("ACCOUNT_BANK");
const BENEFICIARY_NAME = Env.get("BENEFICIARY_NAME");
const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
const ASTRAPAY_WALLET_URL = Env.get("ASTRAPAY_WALLET_URL");
const CURRENT_SETTING_TAGNAME = Env.get("CURRENT_SETTING_TAGNAME");
import SettingServices from "App/Services/SettingsServices";
const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');
const randomstring = require("randomstring");

export const debitUserWallet = async function debitUserWallet(
    walletId, customerId, charge, narration,lng,lat
): Promise<any> {
    // connect to Okra
    try {
        let userWalletId = walletId;
        console.log("userWalletId,@ debitUserWallet line 19", userWalletId);
        console.log("customerId,@ debitUserWallet line 20", customerId);
        console.log("charge,@ debitUserWallet line 21", charge);

        const headers : {
            "correlation-id": '68678989IO09',
            "signature": '5DJJI56UTUTJGGHI97979789GJFIR8589549',
            "client-app": 'OCTANTIS_MOBILE',
            "lng": lng,
            "lat": lat,
            "ofi-code": 'S8',
            "user-principal": '58699700JJK'
        },

        //         {
        //             "accountBank": "WALLET",
        // "accountNumber": "ACC-0000000096",
        // "amount": 10,
        // "beneficiaryName": "Kure-Ojo oluwashina",
        // "currency": "NGN",
        // "customerId": "08144964388",
        // "walletId": "ACC-0000000094",
        // "debitCurrency": "NGN",
        // "narration": "narration",
        // "senderId": "08144964388",
        // "batchPaymentId": "yrtyy5iw8989w",
        // "customerReference": "randtuomtNumbere965"
        // }


        // let generateRandomNumber = Math.random().toString(36).substring(12);
        // console.log("The ASTRAPAY API random number @ debitUserWallet", generateRandomNumber);

        let customerReference = randomstring.generate();
        // >> "XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT"
        // console.log("The ASTRAPAY API customerReference @ debitUserWallet", customerReference);

        let batchPaymentId = randomstring.generate(10);
        // >> "xqm5wXX"
        // console.log("The ASTRAPAY API batchPaymentId @ debitUserWallet", batchPaymentId);

        //         randomstring.generate({
        //             length: 12,
        //             charset: 'alphabetic'
        //         });
        //         // >> "AqoTIzKurxJi"

        //         randomstring.generate({
        //             charset: 'abc'
        //         });
        //         // >> "accbaabbbbcccbccccaacacbbcbbcbbc"

        //         randomstring.generate({
        //             charset: 'abc'
        //         }, cb);
        // // >> "cb(generatedString) {}"
        let CHARGE = Number(charge);
        const settingsService = new SettingServices();
        const settings = await settingsService.getSettingBySettingTagName(CURRENT_SETTING_TAGNAME)
        // console.log("Admin setting line 71 @ debitUserWallet:", settings);
        //  get the loan currency
        // @ts-ignore
        let { currencyCode, loanServiceChargeAccount } = settings;
        // let approvalIsAutomated = false
        // console.log("currencyCode setting line 77:", currencyCode);
        // console.log("loanServiceChargeAccount setting line 78:", loanServiceChargeAccount);

        const payload = {
            "accountBank": `${ACCOUNT_BANK}`,
            "accountNumber": `${loanServiceChargeAccount}`, // change to * loanServiceChargeAccount *
            "amount": CHARGE,
            "beneficiaryName": `${BENEFICIARY_NAME}`,
            "currency": "NGN",
            "customerId": customerId,
            "walletId": userWalletId,
            "debitCurrency": currencyCode,
            "narration": narration,
            "senderId": customerId,
            "batchPaymentId": batchPaymentId,
            "customerReference": customerReference
        }

        const response = await axios.post(`${ASTRAPAY_WALLET_URL}/transfer/wallet_to_banks`,
            payload, { headers: headers }
        )
        // console.log("The ASTRAPAY API response @ debitUserWallet line 114: ", response);
        // console.log("The ASTRAPAY API response data @ debitUserWallet line 115: ", response.data);
//  && response.data.amountTransfered === CHARGE
        if (response.data.message === "Successful") {
            // console.log("The ASTRAPAY API response, @ debitUserWallet line 118: ", response.data);
            return response.data;
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