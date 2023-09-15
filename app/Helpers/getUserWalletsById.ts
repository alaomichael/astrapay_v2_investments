const Env = require("@ioc:Adonis/Core/Env");
// const LOAN_ASTRAPAY_BEARER_TOKEN = Env.get("LOAN_ASTRAPAY_BEARER_TOKEN");
const INVESTMENT_OCTA_WALLET_URL = Env.get("INVESTMENT_OCTA_WALLET_URL");

const axios = require("axios").default;
// @ts-ignore
// const { URLSearchParams } = require('url');
// const randomstring = require("randomstring");

export const getUserWalletsById = async function getUserWalletsById(
    userId
): Promise<any> {
    try {
        // console.log("userId, line 25", userId);

        const headers = {
            // "Token": LOAN_ASTRAPAY_BEARER_TOKEN
        }

        // let generateRandomNumber = Math.random().toString(36).substring(12);
        // console.log("The ASTRAPAY API random number", generateRandomNumber);

        // let customerReference = randomstring.generate();
        // >> "XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT"
        // console.log("The ASTRAPAY API customerReference", customerReference);

        // let batchPaymentId = randomstring.generate(10);
        // >> "xqm5wXX"
        // console.log("The ASTRAPAY API batchPaymentId", batchPaymentId);

        //         randomstring.generate({
        //             length: 12,
        //             charset: 'alphabetic'
        //         });
        //         // >> "AqoTIzKurxJi"

        //         randomstring.generate({
        //             charset: 'abc'
        //         });
        //         // >> "accbaabbbbcccbccccaacacbbcbbcbbc"

        //         randomstring.generate({
        //             charset: 'abc'
        //         }, cb);
        // // >> "cb(generatedString) {}"
        // console.log("Before AXIOS CALL ,@ getUserWalletsById ==================================================");
        // console.log(` BEFORE Axios call : ${INVESTMENT_OCTA_WALLET_URL}/${userId}`);
        // localhost:8581/api/v1/wallets/:identifier
        const response = await axios.get(`${INVESTMENT_OCTA_WALLET_URL}/wallets?holder_id=${userId}`, { headers: headers });
        // console.log("After AXIOS CALL,@ getUserWalletsById ==================================================");
        // console.log("The ASTRAPAY API response,line 51: ");
        // console.log( response);
        // debugger
        if (response.status === 200) {
            //  && response.data
            // console.log("The ASTRAPAY API response,,@ getUserWalletsById line 68: ", response.data);
            if (response) {
                // debugger;
                return response.data;
            }
        } else {
            // console.log("The ASTRAPAY API response,,@ getUserWalletsById line 58: ", response);
            debugger;
            return response;
        }
    } catch (error) {
        console.log(error.config)
        console.log("line 63 ================================================== ");
        console.log(error.response);
        // console.error(error.response.data.errorCode);
        // console.error(error.response.data.errorMessage);
        console.error(error.message);
        if (error.response == undefined) {
            return { status: "FAILED TO FETCH WALLET", message: error.message }
        } else {
            return { status: "FAILED TO FETCH WALLET", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
        }
    }

}
