const Env = require("@ioc:Adonis/Core/Env");
// const ACCOUNT_NUMBER = Env.get("ACCOUNT_NUMBER");
const ACCOUNT_BANK = Env.get("ACCOUNT_BANK");
// const BENEFICIARY_NAME = Env.get("BENEFICIARY_NAME");
const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
const ASTRAPAY_WALLET_URL = Env.get("ASTRAPAY_WALLET_URL");

const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');
const randomstring = require("randomstring");

export const creditUserWallet = async function creditUserWallet(
    senderId, senderWalletId, beneficiaryWalletId, beneficiaryName, amount,
): Promise<any> {
    // connect to Okra
    try {
        // sender will be debited, while beneficiary will be credited
        // console.log("senderWalletId,line 20",  senderWalletId);
        // console.log("beneficiaryWalletId,line 21", beneficiaryWalletId);
        // console.log("amount,line 22", typeof amount);

        const headers = {
            "Token": ASTRAPAY_BEARER_TOKEN
        }
        // let generateRandomNumber = Math.random().toString(36).substring(12);
        // console.log("The ASTRAPAY API random number", generateRandomNumber);

        let customerReference = randomstring.generate();
        // >> "XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT"
        // console.log("The ASTRAPAY API customerReference", customerReference);

        let batchPaymentId = randomstring.generate(10);
        // >> "xqm5wXX"
        // console.log("The ASTRAPAY API batchPaymentId", batchPaymentId);
               let CHARGE = Number(amount);

        // const payload = {
        //     "accountBank": `${ACCOUNT_BANK}`,
        //     "accountNumber": `${ACCOUNT_NUMBER}`,
        //     "amount": CHARGE,
        //     "beneficiaryName": `${BENEFICIARY_NAME}`,
        //     "currency": "NGN",
        //     "customerId": customerId,
        //     "walletId": userWalletId,
        //     "debitCurrency": "NGN",
        //     "narration": "narration",
        //     "senderId": customerId,
        //     "batchPaymentId": batchPaymentId,
        //     "customerReference": customerReference
        // }

        const payload = {
            "accountBank": `${ACCOUNT_BANK}`,
            "accountNumber": beneficiaryWalletId,
            "amount": CHARGE,
            "beneficiaryName": beneficiaryName,
            "currency": "NGN",
            "customerId": senderId,
            "walletId": senderWalletId,
            "debitCurrency": "NGN",
            "narration": "narration",
            "senderId": senderId,
            "batchPaymentId": batchPaymentId,
            "customerReference": customerReference
        }

        const response = await axios.post(`${ASTRAPAY_WALLET_URL}/transfer/wallet_to_banks`,
            payload, { headers: headers }
        )
        // console.log("The ASTRAPAY API response: ", response.data);

        if (response.data.message === "Successful" && response.data.amountTransfered === CHARGE) {
            // console.log("The ASTRAPAY API response, line 53: ", response.data);
            return response.data;
        } else {
            return;
        }
    } catch (error) {
        console.error(error.response.data.errorCode);
        console.error(error.response.data.errorMessage);
        console.error(error.message);
        if (error.response == undefined) {
        return { status: "FAILED TO CREDIT WALLET", message: error.message }
      } else {
        return { status: "FAILED TO CREDIT WALLET", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
    }}

}