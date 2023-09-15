
const Env = require("@ioc:Adonis/Core/Env");
const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
const ASTRAPAY_WALLET_URL = Env.get("ASTRAPAY_WALLET_URL");

const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');
// const randomstring = require("randomstring");

export const disburseApprovedLoan = async function disburseApprovedLoan(
    requestReference, customerLoanWallet, amount, outstandingLoanWalletId,loanFundingAccount,
    customerSavingsAccount, description?, lng?, lat?
): Promise<any> {
    try {
        // console.log("requestReference,line 15", requestReference);
        // console.log("customerLoanWallet,line 16", customerLoanWallet);
        // console.log("amount,line 20", amount);
        // console.log("description,line 21", description);
        // console.log("outstandingLoanWalletId,line 22", outstandingLoanWalletId);
        // console.log("loanFundingAccount,line 23", loanFundingAccount);
        // console.log("customerSavingsAccount,line 24", customerSavingsAccount);
        // console.log("lng,line 25", lng);
        // console.log("lat,line 26", lat);
        const headers = {
            "Token": ASTRAPAY_BEARER_TOKEN
        }
        const payload = {
            "requestReference": requestReference,
            "requestGrouping": "",
            "userId": "Agent",
            "loanWallet": customerLoanWallet,
            "amount": amount,
            "description": description,
            "outstandingLoanWallet":outstandingLoanWalletId,
            "loanFundingAccount":loanFundingAccount,
            "customerSavingsAccount":customerSavingsAccount,
            "lng": lng,
            "lat": lat
        }
        // "batchPaymentId": batchPaymentId,
        // "customerReference": customerReference

        const response = await axios.post(`${ASTRAPAY_WALLET_URL}/transfer/loans/payout`,
            payload, { headers: headers }
        )
        // console.log("The ASTRAPAY API response status: @  disburseApprovedLoan line 43 ", response.status);
        // console.log("The ASTRAPAY API response: @  disburseLoan line 44 ", response.data);

        //        {
        //     "amount": 10.0,
        //     "customerSavingsAccount": "0101489316",
        //     "description": "Testing payout endpoint",
        //     "lat": "87654321",
        //     "lng": "1234567",
        //     "loanFundingAccount": "0101489316",
        //     "loanWallet": "ACC772993083878",
        //     "outstandingLoanWallet": "ACC-0000000094",
        //     "requestGrouping": "123group",
        //     "requestReference": "Qtp49wYdRtyc6d163IqILvu9dLBFZjPS",
        //     "transxnId": "transxn16590841145852",
        //     "userId": "Agent"
        // }
        
        if (response.status === 200) {
            // console.log("The ASTRAPAY API response, line 47 @ disburseApprovedLoan: ", response.data);
            return response.data;
        } else {
            return;
        }
    } catch (error) {
        console.error(error.response.data.errorCode);
        console.error(error.response.data.errorMessage);
        console.error(error.message);
        if (error.response == undefined) {
          return { status: "FAILED TO DISBURSE LOAN TO WALLET", message: error.message }
        } else {
        return {
            status: "FAILED TO DISBURSE LOAN TO WALLET",
            message: error.message,
            errorCode: error.response.data.errorCode,
            errorMessage: error.response.data.errorMessage
        }
    }}

}