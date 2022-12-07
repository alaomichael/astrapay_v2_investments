const Env = require("@ioc:Adonis/Core/Env");
const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
const ASTRAPAY_WALLET_URL = Env.get("ASTRAPAY_WALLET_URL");

const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');
// const randomstring = require("randomstring");

export const disburseLoan = async function disburseLoan(
    requestReference, customerLoanWallet, customerMainWallet, loanFundingWallet, outstandingLoanWallet, amount, description?, lng?, lat?
): Promise<any> {
    try {
        // console.log("requestReference,line 15", requestReference);
        // console.log("customerLoanWallet,line 16", customerLoanWallet);
        // console.log("customerMainWallet,line 17", customerMainWallet);
        // console.log("loanFundingWallet,line 18", loanFundingWallet);
        // console.log("outstandingLoanWallet,line 19", outstandingLoanWallet);
        // console.log("amount,line 20", amount);
        // console.log("description,line 21", description);
        // console.log("lng,line 22", lng);
        // console.log("lat,line 23", lat);

        const headers = {
            "Token": ASTRAPAY_BEARER_TOKEN
        }

        // let generateRandomNumber = Math.random().toString(36).substring(12);
        // console.log("The ASTRAPAY API random number", generateRandomNumber);

        // let customerReference = randomstring.generate();
        // // >> "XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT"
        // console.log("The ASTRAPAY API customerReference", customerReference);
        // let batchPaymentId = randomstring.generate(10);
        // // >> "xqm5wXX"
        // console.log("The ASTRAPAY API batchPaymentId", batchPaymentId);

        const payload = {
            "requestReference": requestReference,
            "requestGrouping": "",
            "userId": "Agent",
            "customerLoanWallet": customerLoanWallet,
            "customerMainWallet": customerMainWallet,
            "loanFundingWallet": loanFundingWallet,
            "outstandingLoanWallet": outstandingLoanWallet,
            "amount": amount,
            "description": description,
            "lng": lng,
            "lat": lat
        }
        // "batchPaymentId": batchPaymentId,
        // "customerReference": customerReference

        const response = await axios.post(`${ASTRAPAY_WALLET_URL}/loan/disbursement`,
            payload, { headers: headers }
        )
        // console.log("The ASTRAPAY API response status: @  disburseLoan line 43 ", response.status);
        // console.log("The ASTRAPAY API response: @  disburseLoan line 44 ", response.data);
        
        //    {
        //     "amount": 50.0,
        //     "customerLoanWallet": "ACC772993083878",
        //     "customerMainWallet": "ACC-0000000094",
        //     "description": "Test",
        //     "lat": "87654321",
        //     "lng": "1234567",
        //     "loanFundingWallet": "ACC-0000000094",
        //     "outstandingLoanWallet": "ACC-0000000094",
        //     "requestGrouping": "322gjjgj46",
        //     "requestReference": "wYIGrpAQ7jGegSS90Y3iMHY4FJ7ZQxrn",
        //     "userId": "Agent",
        //     "transxnId": "transxn16584048131401"
        // }
        if (response.status === 200) {
            // console.log("The ASTRAPAY API response, line 47 @ disburseLoan: ", response.data);
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
        return { status: "FAILED TO DISBURSE LOAN TO WALLET", 
        message: error.message, 
        errorCode: error.response.data.errorCode, 
        errorMessage: error.response.data.errorMessage }
    }}

}