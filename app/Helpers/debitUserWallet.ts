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

export const debitUserWallet = async function debitUserWallet(
    amount, lng, lat, investmentRequestReference,
    senderName,
    senderAccountNumber,
    senderAccountName,
    senderPhoneNumber,
    senderEmail,
    rfiCode, userId,
): Promise<any> {
    // connect to Okra
    try {
        let amountConvertedToKobo = amount * 100;
        // let userWalletId = walletId;
        // console.log("userWalletId,@ debitUserWallet line 19", userWalletId);
        // console.log("customerId,@ debitUserWallet line 20", customerId);
        // console.log("charge,@ debitUserWallet line 21", charge);

        // let generateRandomNumber = Math.random().toString(36).substring(12);
        // console.log("The ASTRAPAY API random number @ debitUserWallet", generateRandomNumber);

        // let customerReference = randomstring.generate();
        // >> "XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT"
        // console.log("The ASTRAPAY API customerReference @ debitUserWallet", customerReference);

        // let batchPaymentId = randomstring.generate(10);

        const settingsService = new SettingServices();
        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)

        // Get Rfi Record
        const rfiRecordsService = new RfiRecordsServices();
        const rfiRecords = await rfiRecordsService.getRfiRecordByRfiRecordRfiCode(rfiCode)
        // debugger
        // console.log("Admin setting line 47 @ debitUserWallet:", settings);
        //  get the loan currency
        // @ts-ignore
        let { currencyCode, investmentWalletId, payoutWalletId, rfiName } = settings;
        let beneficiaryAccountNumber = investmentWalletId;
        let beneficiaryAccountName = rfiName;
        // @ts-ignore
        let { phone, email } = rfiRecords
        let beneficiaryEmail = email;
        let beneficiaryPhoneNumber = phone;
        let beneficiaryName = rfiName;
        // let approvalIsAutomated = false
        // console.log("payoutWalletId setting line 60:", payoutWalletId);
        // console.log("loanServiceChargeAccount setting line 61:", loanServiceChargeAccount);

        const headers = {
            "correlation-id": "68678989IO09",
            "signature": "5DJJI56UTUTJGGHI97979789GJFIR8589549",
            "client-app": "investment_service",
            "lng": lng,
            "lat": lat,
            "ffi-code": rfiCode,//'s8',//rfiCode,// "s8",
            "rfi-code": rfiCode,
            "user-principal": "58699700JJK",
            "user-id": userId,// "investment-service"
        };

        const payload = {
            "batchDetail": {
                "customerReference": investmentRequestReference,
                "currency": "NGN",
                "customerMetadata": {
                    "cool": "cool"
                },
                "notifications": [
                    {
                        "channel": "SMS",
                        "handle": phone,
                        "recipientName": rfiName,
                        "eventType": "TRANSACTION_SUCCESS"
                    },
                    {
                        "channel": "SMS",
                        "handle": senderPhoneNumber,
                        "recipientName": senderName,
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
                "senderBankId": "s8",//rfiCode,// "s8",
                "ofiCode": "s8",//rfiCode,// "s8",
                "lng": lng,
                "lat": lat
            },
            "beneficiaries": [
                {
                    "amount": amountConvertedToKobo,
                    "customerReference": investmentRequestReference,
                    "beneficiaryName": rfiName,
                    "beneficiaryAccountNumber": beneficiaryAccountNumber,
                    "beneficiaryAccountName": beneficiaryAccountName,
                    "beneficiaryPhoneNumber": beneficiaryPhoneNumber,
                    "beneficiaryEmail": beneficiaryEmail,
                    "beneficiaryBankId": "s8",// rfiCode,//"s8",
                    "bfiCode": "s8",//rfiCode,// "s8",
                    "description": ` ${currencyCode} ${amount} investment for ${senderName}. `,
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
        // console.log("The ASTRAPAY API response @ debitUserWallet line 128: ", payload);
        // console.log("rfiCode", rfiCode);
        debugger
        // const response1 = await axios.post(`${ORCHESTRATOR_URL}/orchestrator-${rfiCode}/api/v1/fundstransfers`,
        const response1 = await axios.post(`${ORCHESTRATOR_URL}/fundstransfers`,
            payload, { headers: headers }
        )
        // console.log("The ASTRAPAY API response @ debitUserWallet line 131: ", response1);
        debugger
        // console.log("The ASTRAPAY API response data @ debitUserWallet line 133: ", response1.data);
        // console.log("The ASTRAPAY API response data @ debitUserWallet line 134: ", response1.status);
        //  && response.data.amountTransfered === CHARGE

        if (response1.status == 200) {
            // console.log("The ASTRAPAY API response, @ debitUserWallet line 118: ", response.data);
            // debugger
            // Authorize Transaction
            let { batchId } = response1.data.transactions[0];
            let headers = {
                'correlation-id': '68678989IO09',
                'signature': '5DJJI56UTUTJGGHI97979789GJFIR8589549',
                'client-app': 'investment_service',
                'lng': lng,
                'lat': lat,
                'ofi-code': rfiCode,// "s8",//rfiCode,// 's8',
                'user-principal': '58699700JJK',
                "user-id": userId,// "investment-service"
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

            // debugger
            // console.log("rfiCode", rfiCode);
            // const response = await axios.post(`${ORCHESTRATOR_URL}/orchestrator-${rfiCode}/api/v1/fundstransfers/authorizations`,
            const response = await axios.post(`${ORCHESTRATOR_URL}/fundstransfers/authorizations`,
                payload, { headers: headers }
            )
            debugger
            // console.log("The ASTRAPAY API response data @ debitUserWallet line 169: ", response.data);
            // console.log("The ASTRAPAY API response data @ debitUserWallet line 170: ", response.status);
            //  && response.data.amountTransfered === CHARGE

            if (response.status == 200) {
                // console.log("The ASTRAPAY API response data @ debitUserWallet line 180: ", response.data);
                // debugger
                // return response.data;
                return response;
            } else {
                throw Error(response);
            }
        } else {
            // console.log("The ASTRAPAY API response @ debitUserWallet line 183: ", response1.code);
            // debugger
            throw Error(response1);
            // return response1;
        }
    } catch (error) {
        console.error("debitUserWallet method line 191", error);
        // console.error("debitUserWallet method line 187",error.response.data.errorCode);
        // console.error("debitUserWallet method line 188",error.response.data.errorMessage);
        // console.error("debitUserWallet method line 189",error.message);
        // console.error("debitUserWallet method line 190",error.data);
        debugger
        // code: 'ETIMEDOUT',
        // if (error.response == undefined) {
        //     console.error("debitUserWallet method line 199", error.data);
        //     console.error("debitUserWallet method line 200", error.code);
        //     console.error("debitUserWallet method line 201", error.errorMessage);
        //     // debugger
        //     return { status: "FAILED TO DEBIT WALLET", message: error.message, errorCode: error.code, errorMessage: error.errorMessage }
        // } else {
        //     console.error("debitUserWallet method line 204", error.response.data);
        //     console.error("debitUserWallet method line 205", error.response.code);
        //     console.error("debitUserWallet method line 206", error.response.errorMessage);
        //     // debugger
        //     // return { status: "FAILED TO DEBIT WALLET", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
        //     return { status: "FAILED TO DEBIT WALLET", message: error.message, errorCode: error.response.data.code, errorMessage: error.response.data.errorMessage }
        // }
        if (error.response == undefined) {
            // console.error("debitUserWallet method line 199", error.data);
            // console.error("debitUserWallet method line 200", error.code);
            // console.error("debitUserWallet method line 201", error.errorMessage);
            // console.error("debitUserWallet method line 202", error.message);
            debugger
            return { status: "FAILED TO DEBIT WALLET", message: error.message, errorCode: error.code, errorMessage: error.errorMessage }
        } else {
            // console.error("debitUserWallet method line 204", error.response.data);
            // console.error("debitUserWallet method line 205", error.response.data.errorCode);
            // console.error("debitUserWallet method line 206", error.response.data.error);
            // console.error("debitUserWallet method line 206", error.response.data.message);
            debugger
            // return { status: "FAILED TO DEBIT WALLET", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
            return { status: "FAILED TO DEBIT WALLET", message: error.response.data.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.error }
        }
    }

}