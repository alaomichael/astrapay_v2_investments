const Env = require("@ioc:Adonis/Core/Env");
const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
const ASTRAPAY_WALLET_URL= Env.get("ASTRAPAY_WALLET_URL");

const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');
const randomstring = require("randomstring");

export const createNewLoanWallet = async function createNewLoanWallet(
    holderName, holderId, walletType
): Promise<any> {
    // connect to Okra
    try {
        console.log("holderName,line 25", holderName);
        console.log("holderId,line 26", holderId);
        console.log("walletType,line 27", walletType);
        const headers = {
            "Token": ASTRAPAY_BEARER_TOKEN
        }

        let generateRandomNumber = Math.random().toString(36).substring(12);
        console.log("The ASTRAPAY API random number", generateRandomNumber);

        let customerReference = randomstring.generate();
        // >> "XwPp9xazJ0ku5CZnlmgAx2Dld8SHkAeT"
        console.log("The ASTRAPAY API customerReference", customerReference);
        let batchPaymentId = randomstring.generate(10);
        // >> "xqm5wXX"
        console.log("The ASTRAPAY API batchPaymentId", batchPaymentId);

        const payload = {
            "holderName": holderName,
            "holderId": holderId,
            "walletType": walletType,
        }
        // "batchPaymentId": batchPaymentId,
        // "customerReference": customerReference

        const response = await axios.post(`${ASTRAPAY_WALLET_URL}/wallets`,
            payload, { headers: headers }
        )
        // console.log("The ASTRAPAY API response status: @ createNewLoanwallet line 43 ", response.status);
        // console.log("The ASTRAPAY API response: @ createNewLoanwallet line 44 ", response.data);

//         The ASTRAPAY API response:  {
//   accOfficer: '07060825698',
//   availableBalance: 0,
//   balance: 0,
//   billpaymentDailyLimit: 0,
//   blockWithdrawal: true,
//   dailyLimitHolderPreference: 0,
//   enableDailyLimitHolderPreference: false,
//   fundsTransferDailyLimit: 0,
//   holderId: '08144964388',
//   holderName: 'Akinpelumi Akinlade',
//   raiseVoucherDailyLimit: 0,
//   redeemVoucherDailyLimit: 0,
//   sagamyToWalletDailyLimit: 0,
//   type: 'LOAN',
//   walletId: 'ACC772993083878',
//   walletToSagamyDailyLimit: 0,
//   walletToWalletDailyLimit: 0,
//   withdrawalLimit: 0
// }

        if (response.status === 200) {
            // console.log("The ASTRAPAY API response, line 47: ", response.data);
            return response.data;
        } else {
            return;
        }
    } catch (error) {
        console.error(error.response.data.errorCode);
        console.error(error.response.data.errorMessage);
        console.error(error.message);
         if (error.response == undefined) {
           return { status: "FAILED TO CREATE WALLET", message: error.message }
      } else {
        return { status: "FAILED TO CREATE WALLET", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
    }}

}