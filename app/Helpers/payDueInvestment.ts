
const Env = require("@ioc:Adonis/Core/Env");
const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
const ASTRAPAY_WALLET_URL = Env.get("ASTRAPAY_WALLET_URL");

const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');
// const randomstring = require("randomstring");

export const payDueInvestment = async function payDueInvestment(
    requestReference, customerLoanWallet, amount, interest, outstandingLoanWalletId, loanRepaymentAccount,
    interestOnLoanAccount, customerSavingsAccount, description?, lng?, lat?
): Promise<any> {
    // connect to Okra
    try {
        // console.log("requestReference,line 15", requestReference);
        // console.log("customerLoanWallet,line 16", customerLoanWallet);
        // console.log("amount,line 20", amount);
        // console.log("interest,line 21", interest);
        // console.log("description,line 22", description);
        // console.log("outstandingLoanWalletId,line 15", outstandingLoanWalletId);
        // console.log("loanRepaymentAccount,line 16", loanRepaymentAccount);
        // console.log("interestOnLoanAccount,line 20", interestOnLoanAccount);
        // console.log("customerSavingsAccount,line 21", customerSavingsAccount);
        // console.log("lng,line 23", lng);
        // console.log("lat,line 24", lat);
        const headers = {
            "Token": ASTRAPAY_BEARER_TOKEN
        }
        const payload = {
            "requestReference": requestReference,
            "requestGrouping": "",
            "userId": "Agent",
            "loanWallet": customerLoanWallet,
            "amount": amount,
            "interest": interest,
            "description": description,
            "outstandingLoanWallet": outstandingLoanWalletId,
            "loanRepaymentAccount": loanRepaymentAccount,
            "interestOnLoanAccount": interestOnLoanAccount,
            "customerSavingsAccount": customerSavingsAccount,
            "lng": lng,
            "lat": lat
        }
        // "batchPaymentId": batchPaymentId,
        // "customerReference": customerReference

        const response = await axios.post(`${ASTRAPAY_WALLET_URL}/transfer/loans/repayment`,
            payload, { headers: headers }
        )
        // console.log("The ASTRAPAY API response status: @  payDueInvestment line 43 ", response.status);
        // console.log("The ASTRAPAY API response: @  disburseLoan line 44 ", response.data);

        //         {
        //     "amount": 10.0,
        //     "description": "Testing payout endpoint",
        //     "lat": "87654321",
        //     "lng": "1234567",
        //     "loanWallet": "ACC772993083878",
        //     "requestGrouping": "123group",
        //     "requestReference": "Qtp49wYdRtyc6d163IqILvu9dLBFZjPS",
        //     "userId": "Agent"
        // }

        if (response.status === 200) {
           if(response.data !== undefined){
            // console.log("The ASTRAPAY API response.data, line 68 @ payDueInvestment: ", response.data);
            return response;
        } else {
          // console.log("The ASTRAPAY API response, line 71 @ payDueInvestment: ", response);
          return response;
        }
        } else {
            return;
        }
    } catch (error) {
        console.error(error.response.data.errorCode);
        console.error(error.response.data.errorMessage);
        console.error(error.message);
        if(error.response == undefined){
           return { status: "FAILED TO REPAY LOAN", message: error.message } 
        }else{
        return {
            status: "FAILED TO REPAY LOAN",
            message: error.message,
            errorCode: error.response.data.errorCode,
            errorMessage: error.response.data.errorMessage
        }
    }}

}
