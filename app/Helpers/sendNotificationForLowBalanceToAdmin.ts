import SettingsServices from "App/Services/SettingsServices";
import { DateTime } from "luxon";

const Env = require("@ioc:Adonis/Core/Env");
// const CERTIFICATE_URL = Env.get("CERTIFICATE_URL");
const NOTIFICATION_WITHOUT_PDF_MESSAGE_URL = Env.get("NOTIFICATION_WITHOUT_PDF_MESSAGE_URL");

const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');

export const sendNotificationForLowBalanceToAdmin = async function sendNotificationForLowBalanceToAdmin(messageKey, rfiCode, currentBalance, amountDueForPayout): Promise<any> {
    // connect to Okra
    try {
        // console.log("email,line 15", email);
        // console.log("subject,line 16", subject);
        // console.log("firstName,line 17", firstName);
        // console.log("message,line 18", message);
        // const headers = {
        //     "Authorization": NOTIFICATION_MESSAGE_URL_AUTHORIZATION
        // }
        const settingsService = new SettingsServices();
        const settings = await settingsService.getSettingBySettingRfiCode(rfiCode)
        // debugger
        if (!settings) {
            throw Error(`The Registered Financial institution with RFICODE: ${rfiCode} does not have Setting. Check and try again.`)
        }
        let {
            // isInvestmentAutomated,
            rfiName,
            // initiationNotificationEmail,
            // activationNotificationEmail,
            // maturityNotificationEmail,
            payoutNotificationEmail,
            // rolloverNotificationEmail,
            // liquidationNotificationEmail,
            currencyCode,
            payoutWalletId,
        } = settings


        let metadata;
        // let customerName = `${firstName} ${lastName}`;
        let recepients: any[] = [];
        // debugger
        if (messageKey == "insufficient_balance") {
            let subject = "Insufficient Balance";

            for (let index = 0; index < payoutNotificationEmail.length; index++) {
                try {
                    const receiverDetails = payoutNotificationEmail[index];
                    // debugger
                    // console.log(" receiverDetails , line 315", receiverDetails);
                    // debugger;
                    let receiverName = receiverDetails.name ? receiverDetails.name : rfiName;
                    // debugger;
                    let payload = {
                        "channel": "email",
                        "handle": receiverDetails.email,
                        "name": receiverName//receiverDetails.name,
                    };
                    // debugger
                    await recepients.push(payload);
                } catch (error) {
                    console.log("Error line 325 =====================:", error);
                    throw error;
                }
            }

            // let customerDetails = {
            //     "channel": "email",
            //     "handle": email,
            //     "name": customerName,
            // };
            // await recepients.push(customerDetails);

            messageKey = "investment_insufficient_fund",
                metadata = {
                    "subject": subject,
                    "payoutWalletId": payoutWalletId,
                    "currentWalletBalance": `${currencyCode} ${currentBalance}`,
                    "amountDueForPayout": `${currencyCode} ${amountDueForPayout}`,
                    "timeOfLastAttempt": DateTime.now(),
                }
            debugger
        }
        // debugger
        const payload = {
            "messageKey": messageKey,
            "rfiId": rfiCode,
            "metadata": metadata,
            "recepients": recepients,
        }
        // console.log("payload,line 459", payload);
        debugger
        // console.log("NOTIFICATION_WITHOUT_PDF_MESSAGE_URL,line 461", NOTIFICATION_WITHOUT_PDF_MESSAGE_URL);
        const response = await axios.post(`${NOTIFICATION_WITHOUT_PDF_MESSAGE_URL}/notification`,
            payload,// { headers: headers }
        )
        // console.log("The API response status: @ sendNotificationForLowBalanceToAdmin line 465 ", response);
        // console.log("The API response status: @ sendNotificationForLowBalanceToAdmin line 466 ", response.status);
        // console.log("The API response: @ sendNotificationForLowBalanceToAdmin line 467 ", response.data);
        //         {
        //         {
        //     "status": "success",
        //     "message": "messages sent successfully",
        //     "data": null
        // }
        // console.log("The API response @ sendNotificationForLowBalanceToAdmin, line 474: ", response.status);
        // debugger
        if (response.status === 200) {
            // console.log("The  API response, line 477: ", response.data);
            return response.data;
        } else {
            // return;
            throw Error(response);
        }
    } catch (error) {
        console.log("The API response error: @ sendNotificationForLowBalanceToAdmin line 484 ");
        console.error(error);
        console.error(error.message);
        if (error.response == undefined) {
            return { status: "FAILED TO SEND NOTIFICATION", message: error.message }
        } else {
            return { status: "FAILED TO SEND NOTIFICATION", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
        }
    }

}