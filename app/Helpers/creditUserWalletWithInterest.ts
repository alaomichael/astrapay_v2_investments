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

export const creditUserWalletWithInterest = async function creditUserWalletWithInterest(
    amount, lng, lat, investmentRequestReference,
    beneficiaryAccountName,
    beneficiaryAccountNumber,
    beneficiaryName,
    beneficiaryPhoneNumber,
    beneficiaryEmail,
    rfiCode,

): Promise<any> {
    // connect to Okra
    try {
        // let userWalletId = walletId;
        // console.log("userWalletId,@ creditUserWalletWithInterest line 19", userWalletId);
        // console.log("customerId,@ creditUserWalletWithInterest line 20", customerId);
        // console.log("charge,@ creditUserWalletWithInterest line 21", charge);

        // let generateRandomNumber = Math.random().toString(36).substring(12);
        // console.log("The ASTRAPAY API random number @ creditUserWalletWithInterest", generateRandomNumber);

        // let customerReference = randomstring.generate();
        // >> "XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT"
        // console.log("The ASTRAPAY API customerReference @ creditUserWalletWithInterest", customerReference);

        // let batchPaymentId = randomstring.generate(10);

        const settingsService = new SettingServices();
        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)

        // Get Rfi Record
        const rfiRecordsService = new RfiRecordsServices();
        const rfiRecords = await rfiRecordsService.getRfiRecordByRfiRecordRfiCode(rfiCode)
        // debugger
        // console.log("Admin setting line 47 @ creditUserWalletWithInterest:", settings);
        //  get the loan currency
        // @ts-ignore
        let { currencyCode, investmentWalletId, payoutWalletId, rfiName, payoutNotificationEmail } = settings;
        let senderAccountNumber = payoutWalletId;
        let senderName = rfiName;
        // @ts-ignore
        let { phone, email } = rfiRecords
        let senderEmail = email;
        let senderPhoneNumber = phone;
        let senderAccountName = rfiName;
        // let approvalIsAutomated = false
        console.log("payoutNotificationEmail [0].email  line 60:", payoutNotificationEmail[0].email);
        console.log("investmentWalletId setting line 61:", investmentWalletId);
        // console.log("loanServiceChargeAccount setting line 60:", loanServiceChargeAccount);
debugger
        const headers = {
            "correlation-id": "68678989IO09",
            "signature": "5DJJI56UTUTJGGHI97979789GJFIR8589549",
            "client-app": "OCTANTIS_MOBILE",
            "lng": lng,
            "lat": lat,
            "ffi-code": 's8',//rfiCode,// "s8",
            "user-principal": "58699700JJK",
            "user-id": senderAccountNumber,
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
                        "handle": beneficiaryPhoneNumber,
                        "recipientName": beneficiaryName,
                        "eventType": "TRANSACTION_SUCCESS"
                    }, {
                        "channel": "SMS",
                        "handle": phone,
                        "recipientName": rfiName,
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
                "senderBankId": 's8',// rfiCode,//"s8",
                "ofiCode": 's8',//rfiCode,// "s8",
                "lng": lng,
                "lat": lat
            },
            "beneficiaries": [
                {
                    "amount": amount,
                    "customerReference": investmentRequestReference,
                    "beneficiaryName": beneficiaryName,
                    "beneficiaryAccountNumber": beneficiaryAccountNumber,
                    "beneficiaryAccountName": beneficiaryAccountName,
                    "beneficiaryPhoneNumber": beneficiaryPhoneNumber,
                    "beneficiaryEmail": beneficiaryEmail,
                    "beneficiaryBankId": 's8',//rfiCode,// "s8",
                    "bfiCode": 's8',//rfiCode,// "s8",
                    "description": `${currencyCode} ${amount} investment interest payout for ${beneficiaryName}. `,
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
        const response1 = await axios.post(`${ORCHESTRATOR_URL}/fundstransfers`,
            payload, { headers: headers }
        )
        // console.log("The ASTRAPAY API response @ creditUserWalletWithInterest line 131: ", response1);
        // debugger
        // console.log("The ASTRAPAY API response data @ creditUserWalletWithInterest line 133: ", response1.data);
        // console.log("The ASTRAPAY API response data @ creditUserWalletWithInterest line 134: ", response1.status);
        //  && response.data.amountTransfered === CHARGE
        debugger
        if (response1.status == 200) {
            // console.log("The ASTRAPAY API response, @ creditUserWalletWithInterest line 118: ", response.data);
            // debugger
            // Authorize Transaction
            let { batchId } = response1.data.transactions[0];
            let headers = {
                'correlation-id': '68678989IO09',
                'signature': '5DJJI56UTUTJGGHI97979789GJFIR8589549',
                'client-app': 'OCTANTIS_MOBILE',
                'lng': lng,
                'lat': lat,
                'ofi-code': 's8',//rfiCode,//'s8',
                'user-principal': '58699700JJK',
                "user-id": senderAccountNumber,
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
            const response = await axios.post(`${ORCHESTRATOR_URL}/fundstransfers/authorizations`,
                payload, { headers: headers }
            )

            // console.log("The ASTRAPAY API response data @ creditUserWalletWithInterest line 169: ", response.data);
            // console.log("The ASTRAPAY API response data @ creditUserWalletWithInterest line 170: ", response.status);
            //  && response.data.amountTransfered === CHARGE
            debugger

            if (response.status == 200) {
                console.log("The ASTRAPAY API response data @ creditUserWalletWithInterest line 177: ", response.data);
                debugger
                // return response.data;
                return response;
            } else {
                throw Error(response);
            }
        } else {
            throw Error(response1);
        }
    } catch (error) {
        console.error(error);
        console.error(error.response.data.errorCode);
        console.error(error.response.data.errorMessage);
        console.error(error.message);
        debugger
        // if (error.response == undefined) {
        //     return { status: "FAILED TO CREDIT WALLET", message: error.message }
        // } else {
        //     return { status: "FAILED TO CREDIT WALLET", message: error.response.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
        // }
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