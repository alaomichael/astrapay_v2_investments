const Env = require("@ioc:Adonis/Core/Env");
// const ACCOUNT_NUMBER = Env.get("ACCOUNT_NUMBER");
// const ACCOUNT_BANK = Env.get("ACCOUNT_BANK");
// const BENEFICIARY_NAME = Env.get("BENEFICIARY_NAME");
// const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
const ORCHESTRATOR_URL = Env.get("ORCHESTRATOR_URL");
import RfiRecordsServices from "App/Services/RfiRecordsServices";
// const TRANSACTION_PREFIX = Env.get("TRANSACTION_PREFIX");
import SettingServices from "App/Services/SettingsServices";
// import { DateTime } from "luxon";
const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');
// const randomstring = require("randomstring");

export const creditUserWallet = async function creditUserWallet(
    amount, lng, lat, customerReference,
    beneficiaryName,
    beneficiaryAccountNumber,
    beneficiaryAccountName,
    beneficiaryEmail,
    beneficiaryPhoneNumber,
    rfiCode, description
): Promise<any> {

    try {
        let amountConvertedToKobo = amount * 100;
        // let userWalletId = walletId;
        // console.log("userWalletId,@ creditUserWallet line 19", userWalletId);
        // console.log("customerId,@ creditUserWallet line 20", customerId);
        // console.log("charge,@ creditUserWallet line 21", charge);

        // let generateRandomNumber = Math.random().toString(36).substring(12);
        // console.log("The ASTRAPAY API random number @ creditUserWallet", generateRandomNumber);

        // let customerReference = randomstring.generate();
        // >> "XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT"
        // console.log("The ASTRAPAY API customerReference @ creditUserWallet", customerReference);

        // let batchPaymentId = randomstring.generate(10);

        const settingsService = new SettingServices();
        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)

        // Get Rfi Record
        const rfiRecordsService = new RfiRecordsServices();
        const rfiRecords = await rfiRecordsService.getRfiRecordByRfiRecordRfiCode(rfiCode)
        // debugger
        // console.log("Admin setting line 47 @ creditUserWallet:", settings);
        //  get the loan currency
        // @ts-ignore
        let { currencyCode, investmentWalletId, payoutWalletId, rfiName } = settings;
        let senderAccountNumber = payoutWalletId;
        let senderAccountName = rfiName;
        // @ts-ignore
        let { phone, email } = rfiRecords
        let senderEmail = email;
        let senderPhoneNumber = phone;
        let senderName = rfiName;
        // let approvalIsAutomated = false
        console.log("investmentWalletId setting line 59:", investmentWalletId);

        // let reference = DateTime.now() + randomstring.generate(4);
        // customerReference = `${TRANSACTION_PREFIX}-${reference}-${customerReference}`;
        // console.log("Customer Transaction Reference , line 69 ==================")
        // console.log(customerReference);
        // debugger;
        const headers = {
            "correlation-id": "68678989IO09",
            "signature": "5DJJI56UTUTJGGHI97979789GJFIR8589549",
            "client-app": "OCTANTIS_MOBILE",
            "lng": lng,
            "lat": lat,
            "ffi-code": 's8',//rfiCode,// "s8",
            "user-principal": "58699700JJK",
            "user-id": senderAccountNumber,//senderName,// "investment-service"
        };

        const payload = {
            "batchDetail": {
                "customerReference": customerReference,
                "currency": "NGN",
                "customerMetadata": {
                    "cool": "cool"
                },
                "notifications": [
                    {
                        "channel": "SMS",
                        "handle": beneficiaryPhoneNumber,
                        "recipientName": beneficiaryName,
                        "eventType": "TRANSACTION_SUCCESS"
                    }
                ]
            },
            "sender": {
                "senderName": senderName,
                "senderAccountNumber": senderAccountNumber,
                "senderAccountName": senderAccountName,
                "senderPhoneNumber": senderPhoneNumber,
                "senderEmail": senderEmail,
                "senderBankId": 's8',//rfiCode,//"s8",
                "ofiCode": 's8',//rfiCode,// "s8",
                "lng": lng,
                "lat": lat
            },
            "beneficiaries": [
                {
                    "amount": amountConvertedToKobo,
                    "customerReference": customerReference,
                    "beneficiaryName": beneficiaryName,
                    "beneficiaryAccountNumber": beneficiaryAccountNumber,
                    "beneficiaryAccountName": beneficiaryAccountName,
                    "beneficiaryPhoneNumber": beneficiaryPhoneNumber,
                    "beneficiaryEmail": beneficiaryEmail,
                    "beneficiaryBankId": 's8',//rfiCode,// "s8",
                    "bfiCode": 's8',//rfiCode,// "s8",
                    "description": description,//` ${amount} investment for ${senderName}. `,
                    "product": "Funds transfer",// "product": "WALLET_TO_WALLET_TRANSFER",
                    "subproduct": "mobilebanking.investment.fundstransfer.wallettowallet",// "subproduct": "WALLET_TO_WALLET_TRANSFER",
                    "customerMetadata": {
                        "cool": "cool"
                    },
                    "notifications": [
                        {
                            "channel": "SMS",
                            "handle": beneficiaryPhoneNumber,
                            "recipientName": beneficiaryName,
                            "eventType": "TRANSACTION_SUCCESS"
                        }
                    ]
                }
            ]
        }
        // debugger
        console.log("rfiCode", rfiCode);
        // const response1 = await axios.post(`${ORCHESTRATOR_URL}/orchestrator-${rfiCode}/api/v1/fundstransfers`,
        const response1 = await axios.post(`${ORCHESTRATOR_URL}/fundstransfers`,
            payload, { headers: headers }
        )
        // console.log("The ASTRAPAY API response @ creditUserWallet line 131: ", response1);
        // debugger
        // console.log("The ASTRAPAY API response data @ creditUserWallet line 133: ", response1.data);
        // console.log("The ASTRAPAY API response data @ creditUserWallet line 134: ", response1.status);
        //  && response.data.amountTransfered === CHARGE

        if (response1.status == 200) {
            // console.log("The ASTRAPAY API response, @ creditUserWallet line 118: ", response.data);
            // debugger
            // Authorize Transaction
            let { batchId } = response1.data.transactions[0];
            let headers = {
                'correlation-id': '68678989IO09',
                'signature': '5DJJI56UTUTJGGHI97979789GJFIR8589549',
                'client-app': 'OCTANTIS_MOBILE',
                'lng': lng,
                'lat': lat,
                'ofi-code': 's8',// rfiCode,//'s8',
                'user-principal': '58699700JJK',
                'user-id': senderAccountNumber,//senderName,// "investment-service"
            };
            const payload = {
                "batchId": batchId,
                "action": "AUTHORIZED",
                "authorizations": [
                    {
                        "requiredAuthorityId": "12345",
                        "requiredAuthorityName": "Mock authority",
                        "authorityId": "12345",
                        "authorityName": "Mock authority",
                        "authorityActionAt": "2022-10-07T14:59:44.604",
                        "authorityAction": "AUTHORIZED"
                    }
                ]
            }
            console.log("rfiCode", rfiCode);
            // const response = await axios.post(`${ORCHESTRATOR_URL}/orchestrator-${rfiCode}/api/v1/fundstransfers/authorizations`,
            const response = await axios.post(`${ORCHESTRATOR_URL}/fundstransfers/authorizations`,
                payload, { headers: headers }
            )
            debugger
            // console.log("The ASTRAPAY API response data @ creditUserWallet line 169: ", response.data);
            // console.log("The ASTRAPAY API response data @ creditUserWallet line 170: ", response.status);
            //  && response.data.amountTransfered === CHARGE


            if (response.status == 200) {
                console.log("The ASTRAPAY API response data @ creditUserWallet line 183: ", response.data);
                debugger
                // return response.data;
                return response;
            } else {
                // return;
                throw Error(response);
            }
        } else {
            // return;
            throw Error(response1);
        }
    } catch (error) {
        console.error("creditUserWallet method line 191", error);
        // console.error("creditUserWallet method line 187",error.response.data.errorCode);
        // console.error("creditUserWallet method line 188",error.response.data.errorMessage);
        // console.error("creditUserWallet method line 189",error.message);
        // console.error("creditUserWallet method line 190",error.data);
        debugger
        // code: 'ETIMEDOUT',
        if (error.response == undefined) {
            console.error("creditUserWallet method line 199", error.data);
            console.error("creditUserWallet method line 200", error.code);
            console.error("creditUserWallet method line 201", error.errorMessage);
            console.error("creditUserWallet method line 202", error.message);
            debugger
            return { status: "FAILED TO CREDIT WALLET", message: error.message, errorCode: error.code, errorMessage: error.errorMessage }
        } else {
            console.error("creditUserWallet method line 204", error.response.data);
            console.error("creditUserWallet method line 205", error.response.data.errorCode);
            console.error("creditUserWallet method line 206", error.response.data.error);
            console.error("creditUserWallet method line 206", error.response.data.message);
            debugger
            // return { status: "FAILED TO CREDIT WALLET", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
            return { status: "FAILED TO CREDIT WALLET", message: error.response.data.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.error }
        }
    }

}