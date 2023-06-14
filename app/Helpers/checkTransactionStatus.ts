const Env = require("@ioc:Adonis/Core/Env");
// const ACCOUNT_NUMBER = Env.get("ACCOUNT_NUMBER");
// const ACCOUNT_BANK = Env.get("ACCOUNT_BANK");
// const BENEFICIARY_NAME = Env.get("BENEFICIARY_NAME");
// const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
const ORCHESTRATOR_URL = Env.get("ORCHESTRATOR_URL");
// import RfiRecordsServices from "App/Services/RfiRecordsServices";
// const CURRENT_SETTING_TAGNAME = Env.get("CURRENT_SETTING_TAGNAME");
// import SettingServices from "App/Services/SettingsServices";
const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');
// const randomstring = require("randomstring");

export const checkTransactionStatus = async function checkTransactionStatus(
    investmentRequestReference
): Promise<any> {

    try {
        // let amountConvertedToKobo = amount * 100;
        // let userWalletId = walletId;
        // console.log("userWalletId,@ checkTransactionStatus line 19", userWalletId);
        // console.log("customerId,@ checkTransactionStatus line 20", customerId);
        // console.log("charge,@ checkTransactionStatus line 21", charge);

        // let generateRandomNumber = Math.random().toString(36).substring(12);
        // console.log("The API random number @ checkTransactionStatus", generateRandomNumber);

        // let customerReference = randomstring.generate();
        // >> "XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT"
        // console.log("The API customerReference @ checkTransactionStatus", customerReference);

        // let batchPaymentId = randomstring.generate(10);

        // const settingsService = new SettingServices();
        // const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)

        // Get Rfi Record
        // const rfiRecordsService = new RfiRecordsServices();
        // const rfiRecords = await rfiRecordsService.getRfiRecordByRfiRecordRfiCode(rfiCode)
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
            "lng": "3.7877",
            "lat": "7.5677",
            "ffi-code": "s8",
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
        //         "senderBankId": "s8",
        //         "ofiCode": "s8",
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
        //             "beneficiaryBankId": "s8",
        //             "bfiCode": "s8",
        //             "description": ` ${currencyCode} ${amount} investment for ${senderName}. `,
        //             "product": "Funds transfer",// "product": "WALLET_TO_WALLET_TRANSFER",
        //             "subproduct": "mobilebanking.investment.fundstransfer.wallettowallet",// "subproduct": "WALLET_TO_WALLET_TRANSFER",
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
        // console.log("The API response @ checkTransactionStatus line 131: ", response);
        // debugger
        // console.log("The API response data @ checkTransactionStatus line 128: ", response.data);
        // console.log("The API response data @ checkTransactionStatus line 129: ", response.status);
        //  && response.data.amountTransfered === CHARGE

        if (response.status == 200) {
            console.log("The API response, @ checkTransactionStatus line 133: ", response.data);
            debugger
            // {
            //     "id": "defddb06-c27d-4255-aa6a-2d483ed8de40",
            //     "correlationId": "68678989IO09",
            //     "transactionId": "16759132994525197",
            //     "customerReference": "16708830553194Kt90",
            //     "batchId": "aee5adf2-d32c-44a1-b3cd-9be941c7b48b",
            //     "indexInBatch": 0,
            //     "performedBy": "485885869",
            //     "description": " NGN 38 investment for Tomiwa Folalu. ",
            //     "product": "Funds transfer",
            //     "subproduct": "mobilebanking.investment.fundstransfer.wallettowallet",
            //     "process": "WALLET_TO_WALLET_TRANSFER",
            //     "senderFirstName": "Tomiwa Folalu",
            //     "senderOtherName": "Tomiwa Folalu",
            //     "senderAccountNumber": "12345678",
            //     "senderAccountName": "Tomiwa Folalu",
            //     "senderPhoneNumber": "2348161885549",
            //     "senderEmail": "tomiczilla@gmail.com",
            //     "senderBankName": "Sigma Octantis",
            //     "senderBankCode": "s8",
            //     "senderBankAlias": "s8",
            //     "senderBankCategory": "SIGMA_OCTANTIS",
            //     "beneficiaryFirstName": "Sigma Octantis",
            //     "beneficiaryOtherName": "Sigma Octantis",
            //     "beneficiaryAccountNumber": "65656565",
            //     "beneficiaryAccountName": "Sigma Octantis",
            //     "beneficiaryPhoneNumber": "07033680599",
            //     "beneficiaryEmail": "devmichaelalao@gmail.com",
            //     "beneficiaryBankName": "Sigma Octantis",
            //     "beneficiaryBankCode": "s8",
            //     "beneficiaryBankAlias": "s8",
            //     "beneficiaryBankCategory": "SIGMA_OCTANTIS",
            //     "billerId": null,
            //     "paymentCode": null,
            //     "facilitatorName": "Jane Wood",
            //     "facilitatorId": "485885869",
            //     "facilitatorPhoneNumber": "2348079859043",
            //     "facilitatorEmail": "test@email.com",
            //     "amount": 3800,
            //     "currency": "NGN",
            //     "serviceCharge": 3000,
            //     "serviceChargeWalletHolderId": "123456",
            //     "serviceChargeWalletHolderName": "SigmaOctantis",
            //     "serviceChargeWalletIdentifier": "1234567",
            //     "serviceChargeWalletName": "Mock Service Charge Wallet",
            //     "vat": 225,
            //     "vatWalletHolderId": "123456",
            //     "vatWalletHolderName": "SigmaOctantis",
            //     "vatWalletIdentifier": "1234567",
            //     "vatWalletName": "Mock vat Wallet",
            //     "commissionWalletHolderId": "12345",
            //     "commissionWalletHolderName": "SigmaOctantis",
            //     "commissionWalletIdentifier": "1234567",
            //     "commissionWalletName": "Mock commission Wallet",
            //     "lng": "64532111",
            //     "lat": "12234435",
            //     "transactionStatus": "AWAITING_APPROVAL",
            //     "screenStatus": "AWAITING_APPROVAL",
            //     "createdAt": "2023-02-09T04:28:20.417098",
            //     "updatedAt": "2023-02-09T04:28:20.417098",
            //     "systemMetadata": null,
            //     "customerMetadata": {
            //         "cool": "cool"
            //     },
            //     "timeline": [
            //         {
            //             "id": "04bd6a4e-e2c3-40fd-819a-fb8ae93f03be",
            //             "transactionId": "defddb06-c27d-4255-aa6a-2d483ed8de40",
            //             "transactionStatus": "AWAITING_APPROVAL",
            //             "createdAt": "2023-02-09T04:28:20.418097",
            //             "updatedAt": "2023-02-09T04:28:20.418097",
            //             "systemMetadata": null
            //         }
            //     ],
            //     "commissions": [],
            //     "clientApp": "OCTANTIS_MOBILE",
            //     "userAgent": "PostmanRuntime/7.30.1",
            //     "ffiCode": "s8",
            //     "ffiName": "s8",
            //     "ofiCode": "s8",
            //     "ofiName": "s8",
            //     "bfiCode": "s8",
            //     "bfiName": "s8",
            //     "notifiable": {
            //         "id": "cb3dbc59-cf32-49ed-b647-d17c70e6dfa2",
            //         "createdAt": "2023-02-09T04:28:20.417098",
            //         "updatedAt": "2023-02-09T04:28:20.417098",
            //         "notifications": [
            //             {
            //                 "id": "8470432e-25c3-4882-8534-a30c7da72949",
            //                 "notifiableId": "cb3dbc59-cf32-49ed-b647-d17c70e6dfa2",
            //                 "channel": "SMS",
            //                 "handle": "07033680599",
            //                 "recipientName": "Sigma Octantis",
            //                 "walletToBillId": "12345678",
            //                 "walletToBillName": "Mock Wallet",
            //                 "eventType": "TRANSACTION_SUCCESS",
            //                 "createdAt": "2023-02-09T04:28:20.417098",
            //                 "updatedAt": "2023-02-09T04:28:20.417098"
            //             }
            //         ]
            //     },
            //     "authorizable": {
            //         "id": "65cad0cd-1df2-4d3e-9c3b-7e985caaa40a",
            //         "createdAt": "2023-02-09T04:28:20.296422",
            //         "updatedAt": "2023-02-09T04:28:20.296422",
            //         "authorizations": [
            //             {
            //                 "id": "e881f905-7f5a-46b6-903f-ed67110d8b44",
            //                 "authorizableId": "65cad0cd-1df2-4d3e-9c3b-7e985caaa40a",
            //                 "requiredAuthorityId": "12345",
            //                 "requiredAuthorityName": "Mock authority",
            //                 "authorityId": null,
            //                 "authorityName": null,
            //                 "authorityActionAt": null,
            //                 "authorityAction": null,
            //                 "createdAt": "2023-02-09T04:28:20.412112",
            //                 "updatedAt": "2023-02-09T04:28:20.412112"
            //             }
            //         ]
            //     },
            //     "tenant": null,
            //     "senderWalletIdentifier": "12345678",
            //     "senderWalletName": "Tomiwa Folalu",
            //     "senderWalletHolderId": "5886990",
            //     "senderWalletHolderName": "MockWalletHolder",
            //     "beneficiaryWalletIdentifier": "65656565",
            //     "beneficiaryWalletName": "Sigma Octantis",
            //     "beneficiaryWalletHolderId": "5886990",
            //     "beneficiaryWalletHolderName": "MockWalletHolder"
            // }
            // Return the first object in the array
            return response[0];
        } else {
            console.log("The API response @ checkTransactionStatus line 269: ", response.code);
            // debugger
            throw Error(response);
            // return response;
        }
    } catch (error) {
        console.error("checkTransactionStatus method line 275", error);
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
