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

export const creditUserWallet = async function creditUserWallet(
    amount, lng, lat, investmentId,
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
        // console.log("loanServiceChargeAccount setting line 60:", loanServiceChargeAccount);

        const headers = {
            "correlation-id": "68678989IO09",
            "signature": "5DJJI56UTUTJGGHI97979789GJFIR8589549",
            "client-app": "OCTANTIS_MOBILE",
            "lng": lng,
            "lat": lat,
            "ffi-code": "S8",
            "user-principal": "58699700JJK"
        };

        const payload = {
            "batchDetail": {
                "customerReference": investmentId,
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
                "senderBankId": "S8",
                "ofiCode": "S8",
                "lng": lng,
                "lat": lat
            },
            "beneficiaries": [
                {
                    "amount": amountConvertedToKobo,
                    "customerReference": investmentId,
                    "beneficiaryName": beneficiaryName,
                    "beneficiaryAccountNumber": beneficiaryAccountNumber,
                    "beneficiaryAccountName": beneficiaryAccountName,
                    "beneficiaryPhoneNumber": beneficiaryPhoneNumber,
                    "beneficiaryEmail": beneficiaryEmail,
                    "beneficiaryBankId": "S8",
                    "bfiCode": "S8",
                    "description": description,//` ${amount} investment for ${senderName}. `,
                    "product": "WALLET_TO_WALLET_TRANSFER",
                    "subproduct": "WALLET_TO_WALLET_TRANSFER",
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
                'ofi-code': 'S8',
                'user-principal': '58699700JJK'
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

            // console.log("The ASTRAPAY API response data @ creditUserWallet line 169: ", response.data);
            // console.log("The ASTRAPAY API response data @ creditUserWallet line 170: ", response.status);
            //  && response.data.amountTransfered === CHARGE


            if (response.status == 200) {
                // debugger
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
            debugger
            return { status: "FAILED TO CREDIT WALLET", message: error.message, errorCode: error.code, errorMessage: error.errorMessage }
        } else {
            console.error("creditUserWallet method line 204", error.response.data);
            console.error("creditUserWallet method line 205", error.response.code);
            console.error("creditUserWallet method line 206", error.response.errorMessage);
            debugger
            // return { status: "FAILED TO CREDIT WALLET", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
            return { status: "FAILED TO CREDIT WALLET", message: error.message, errorCode: error.response.data.code, errorMessage: error.response.data.errorMessage }
        }    }

}