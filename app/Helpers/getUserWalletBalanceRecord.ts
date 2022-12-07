const Env = require("@ioc:Adonis/Core/Env");
const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
const ASTRAPAY_WALLET_URL = Env.get("ASTRAPAY_WALLET_URL");

const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');
// const randomstring = require("randomstring");

export const getUserWalletBalanceRecord = async function getUserWalletBalanceRecord(
    startDate,
    endDate,
    walletId
): Promise<any> {
    // connect to Okra
    try {
        // console.log("startDate, line 17", startDate);
        // console.log("endDate, line 18", endDate);
        // console.log("walletId, line 19", walletId);

        const headers = {
            "Token": ASTRAPAY_BEARER_TOKEN
        }

        // let generateRandomNumber = Math.random().toString(36).substring(12);
        // console.log("The ASTRAPAY API random number", generateRandomNumber);

        // let customerReference = randomstring.generate();
        // >> "XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT"
        // console.log("The ASTRAPAY API customerReference", customerReference);
        // let batchPaymentId = randomstring.generate(10);
        // >> "xqm5wXX"
        // console.log("The ASTRAPAY API batchPaymentId", batchPaymentId);
        const response = await axios.get(`${ASTRAPAY_WALLET_URL}/wallets/account_statement?from_date=${startDate}&to_date=${endDate}&wallet_id=${walletId}`, { headers: headers });
        // console.log("The ASTRAPAY API response status: @  getUserWalletBalanceRecord line 37 ", response.status);
        // console.log("The ASTRAPAY API response,line 38: ", response);

        if (response.status === 200 && response.data) {
            // console.log("The ASTRAPAY API response, line 41: ", response.data);

            return response.data;
        } else {
            return;
        }
    } catch (error) {
        console.log(error.config)
        console.log(" The ASTRAPAY API response status: @  getUserWalletBalanceRecord line 48 ==================================================");
        console.error(error.response);
        // console.error(error.response.data.errorCode);
        // console.error(error.response.data.errorMessage);
        console.error(error.message);
      if (error.response == undefined) {
        return { status: "FAILED TO FETCH WALLET BALANCE RECORD", message: error.message }
      } else {
        return {
            status: "FAILED TO FETCH WALLET BALANCE RECORD",
            message: error.message,
            errorCode: error.response.data.errorCode,
            errorMessage: error.response.data.errorMessage
        }}
    }

}
