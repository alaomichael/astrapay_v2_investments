const Env = require("@ioc:Adonis/Core/Env");
// const ACCOUNT_NUMBER = Env.get("ACCOUNT_NUMBER");
// const ACCOUNT_BANK = Env.get("ACCOUNT_BANK");
// const BENEFICIARY_NAME = Env.get("BENEFICIARY_NAME");
// const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
const ORCHESTRATOR_URL = Env.get("ORCHESTRATOR_URL");
import RfiRecordsServices from "App/Services/RfiRecordsServices";
// const CURRENT_SETTING_TAGNAME = Env.get("CURRENT_SETTING_TAGNAME");
import SettingServices from "App/Services/SettingsServices";
const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');
// const randomstring = require("randomstring");

export const checkTransactionStatus = async function checkTransactionStatus(
    investmentRequestReference
): Promise<any> {
    // connect to Okra
    try {
        // let amountConvertedToKobo = amount * 100;
        // let userWalletId = walletId;
        // console.log("userWalletId,@ checkTransactionStatus line 19", userWalletId);
        // console.log("customerId,@ checkTransactionStatus line 20", customerId);
        // console.log("charge,@ checkTransactionStatus line 21", charge);

        // let generateRandomNumber = Math.random().toString(36).substring(12);
        // console.log("The ASTRAPAY API random number @ checkTransactionStatus", generateRandomNumber);

        // let customerReference = randomstring.generate();
        // >> "XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT"
        // console.log("The ASTRAPAY API customerReference @ checkTransactionStatus", customerReference);

        // let batchPaymentId = randomstring.generate(10);

        const settingsService = new SettingServices();
        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)

        // Get Rfi Record
        const rfiRecordsService = new RfiRecordsServices();
        const rfiRecords = await rfiRecordsService.getRfiRecordByRfiRecordRfiCode(rfiCode)
        // debugger
        // console.log("Admin setting line 47 @ checkTransactionStatus:", settings);
        //  get the loan currency
        // @ts-ignore
        // let { currencyCode, investmentWalletId, payoutWalletId, rfiName } = settings;
        // let beneficiaryAccountNumber = investmentWalletId;
        // let beneficiaryAccountName = rfiName;
        // // @ts-ignore
        // let { phone, email } = rfiRecords
        // let beneficiaryEmail = email;
        // let beneficiaryPhoneNumber = phone;
        // let beneficiaryName = rfiName;
        // // let approvalIsAutomated = false
        // console.log("payoutWalletId setting line 60:", payoutWalletId);
        // console.log("loanServiceChargeAccount setting line 61:", loanServiceChargeAccount);

        const headers = {
            "correlation-id": "68678989IO09",
            "signature": "5DJJI56UTUTJGGHI97979789GJFIR8589549",
            "client-app": "OCTANTIS_MOBILE",
            "lng": lng,
            "lat": lat,
            "ffi-code": "S8",
            "user-principal": "58699700JJK"
        };

        // const payload = {
        //     "batchDetail": {
        //         "customerReference": investmentRequestReference,
        //         "currency": "NGN",
        //         "customerMetadata": {
        //             "cool": "cool"
        //         },
        //         "notifications": [
        //             {
        //                 "channel": "SMS",
        //                 "handle": phone,
        //                 "recipientName": rfiName,
        //                 "eventType": "TRANSACTION_SUCCESS"
        //             }
        //         ]
        //     },
        //     "sender": {
        //         "senderName": senderName,
        //         "senderAccountNumber": senderAccountNumber,
        //         "senderAccountName": senderAccountName,
        //         "senderPhoneNumber": senderPhoneNumber,
        //         "senderEmail": senderEmail,
        //         "senderBankId": "S8",
        //         "ofiCode": "S8",
        //         "lng": lng,
        //         "lat": lat
        //     },
        //     "beneficiaries": [
        //         {
        //             "amount": amountConvertedToKobo,
        //             "customerReference": investmentRequestReference,
        //             "beneficiaryName": rfiName,
        //             "beneficiaryAccountNumber": beneficiaryAccountNumber,
        //             "beneficiaryAccountName": beneficiaryAccountName,
        //             "beneficiaryPhoneNumber": beneficiaryPhoneNumber,
        //             "beneficiaryEmail": beneficiaryEmail,
        //             "beneficiaryBankId": "S8",
        //             "bfiCode": "S8",
        //             "description": ` ${currencyCode} ${amount} investment for ${senderName}. `,
        //             "product": "Funds transfer",// "product": "WALLET_TO_WALLET_TRANSFER",
        //             "subproduct": "mobilebanking.fundstransfer.wallettowallet",// "subproduct": "WALLET_TO_WALLET_TRANSFER",
        //             "customerMetadata": {
        //                 "cool": "cool"
        //             },
        //             "notifications": [
        //                 {
        //                     "channel": "SMS",
        //                     "handle": beneficiaryPhoneNumber,
        //                     "recipientName": beneficiaryName,
        //                     "eventType": "TRANSACTION_SUCCESS"
        //                 }
        //             ]
        //         }
        //     ]
        // }
        // debugger
        const response = await axios.get(`${ORCHESTRATOR_URL}/transactions?customerReference=${investmentRequestReference}`,
            { headers: headers }//payload,
        )
        // console.log("The ASTRAPAY API response @ checkTransactionStatus line 131: ", response);
        // debugger
        // console.log("The ASTRAPAY API response data @ checkTransactionStatus line 133: ", response.data);
        // console.log("The ASTRAPAY API response data @ checkTransactionStatus line 134: ", response.status);
        //  && response.data.amountTransfered === CHARGE

        if (response.status == 200) {
            // console.log("The ASTRAPAY API response, @ checkTransactionStatus line 118: ", response.data);
            // debugger
            return response;
        } else {
            console.log("The ASTRAPAY API response @ checkTransactionStatus line 137: ", response.code);
            // debugger
            throw Error(response);
            // return response;
        }
    } catch (error) {
        console.error("checkTransactionStatus method line 191", error);
        // console.error("checkTransactionStatus method line 187",error.response.data.errorCode);
        // console.error("checkTransactionStatus method line 188",error.response.data.errorMessage);
        // console.error("checkTransactionStatus method line 189",error.message);
        // console.error("checkTransactionStatus method line 190",error.data);
        // debugger
        // code: 'ETIMEDOUT',
        if (error.response == undefined) {
            console.error("checkTransactionStatus method line 199", error.data);
            console.error("checkTransactionStatus method line 200", error.code);
            console.error("checkTransactionStatus method line 201", error.errorMessage);
            // debugger
            return { status: "FAILED TO GET TRANSACTION STATUS", message: error.message, errorCode: error.code, errorMessage: error.errorMessage }
        } else {
            console.error("checkTransactionStatus method line 204", error.response.data);
            console.error("checkTransactionStatus method line 205", error.response.code);
            console.error("checkTransactionStatus method line 206", error.response.errorMessage);
            // debugger
            // return { status: "FAILED TO GET TRANSACTION STATUS", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
            return { status: "FAILED TO GET TRANSACTION STATUS", message: error.message, errorCode: error.response.data.code, errorMessage: error.response.data.errorMessage }
        }
    }

}