const Env = require("@ioc:Adonis/Core/Env");
const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
const ASTRAPAY_WALLET_URL = Env.get("ASTRAPAY_WALLET_URL");

const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');
// const randomstring = require("randomstring");

export const getCustomerSavingsAccount = async function getCustomerSavingsAccount(
    userId
): Promise<any> {
    try {
        // console.log("userId, line 25", userId);

        const headers = {
            "Token": ASTRAPAY_BEARER_TOKEN
        }
        // console.log("Before AXIOS CALL ,@ getCustomerSavingsAccount ==================================================");
        // console.log(` BEFORE Axios call : ${ASTRAPAY_WALLET_URL}/`);
        const response = await axios.get(`${ASTRAPAY_WALLET_URL}/linked_acc/user/${userId}`, { headers: headers });
        // console.log("After AXIOS CALL,@ getCustomerSavingsAccount ==================================================");
        // console.log("The ASTRAPAY API response,line 65: ", response);

        // [
        //     {
        //         "accountNumber": "0101472574",
        //         "bank": "SAGAMY",
        //         "linkerId": "lnk3672c4e6-eb20-4bfc-8905-cb6c2d452de3",
        //         "userId": "08144964388",
        //         "walletId": "ACC-0000000094"
        //     },
        //     {
        //         "accountNumber": "0101472574",
        //         "bank": "SAGAMY",
        //         "linkerId": "lnk8a3592d9-adc9-4ddc-8a07-3b59b5dd0c76",
        //         "userId": "08144964388",
        //         "walletId": "ACC-0000000094"
        //     }
        // ]

        if (response.status === 200 && response.data) {
            // console.log("The ASTRAPAY API response,@ getCustomerSavingsAccount line 68: ", response.data[0].accountNumber);
            return response.data[0].accountNumber;
        } else {
            return;
        }
    } catch (error) {
        console.log(error.config)
        console.log("==================================================");
        console.error(error.response);
        console.error(error.message);
      if (error.response == undefined) {
        return { status: "FAILED TO FETCH CUSTOMER SAVINGS ACCOUNT", message: error.message }
      } else {
        return { status: "FAILED TO FETCH CUSTOMER SAVINGS ACCOUNT", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
    }}

}
