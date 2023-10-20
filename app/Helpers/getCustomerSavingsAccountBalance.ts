const Env = require("@ioc:Adonis/Core/Env");
const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
const SAGAMY_URL = Env.get("SAGAMY_URL");

const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');
// const randomstring = require("randomstring");

export const getCustomerSavingsAccountBalance = async function getCustomerSavingsAccountBalance(
  accountNumber
): Promise<any> {
  try {
    // console.log("accountNumber, line 25", accountNumber);
    
    const headers = {
      "Token": ASTRAPAY_BEARER_TOKEN
    }
    // console.log("Before AXIOS CALL ,@ getCustomerSavingsAccountBalance ==================================================");

    const response = await axios.get(`${SAGAMY_URL}/validate/${accountNumber}`, { headers: headers });
    // console.log("After AXIOS CALL,@ getCustomerSavingsAccountBalance ==================================================");
    // console.log("The ASTRAPAY API response,line 24: ", response.data.payload);
    // debugger;
        // {
        //     "payload": {
        //         "accountBalance": 59.5375,
        //         "accountName": "ADAM ALAKA",
        //         "accountNumber": "0101472574",
        //         "accountType": "INDIVIDUAL SAVINGS ACCOUNT",
        //         "branchId": 1,
        //         "bvnNumber": "22366249419",
        //         "customerName": "ADAM ALAKA",
        //         "objectID": 0,
        //         "phoneNumber": "08144964388",
        //         "status": "Active/Unblocked"
        //     },
        //     "responseCode": 0
        // }

    if (response.status === 200) {
      //  && response.data.payload
      // console.log("The ASTRAPAY API response,@ getCustomerSavingsAccountBalance line 68: ", response.data.payload);
      // debugger;
      return response.data.payload.accountBalance;
    } else {
      return;
    }
  } catch (error) {
    console.log(error.config)
    console.log("==================================================");
    console.error(error.response);
    console.error(error.message);
    if (error.response == undefined) {
      return { status: "FAILED TO FETCH CUSTOMER SAVINGS ACCOUNT BALANCE", message: error.message }
    } else {
      return { status: "FAILED TO FETCH CUSTOMER SAVINGS ACCOUNT BALANCE", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
    }
  }

}
