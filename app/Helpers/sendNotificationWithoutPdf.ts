import SettingsServices from "App/Services/SettingsServices";

const Env = require("@ioc:Adonis/Core/Env");
// const CERTIFICATE_URL = Env.get("CERTIFICATE_URL");
const NOTIFICATION_WITHOUT_PDF_MESSAGE_URL = Env.get("NOTIFICATION_WITHOUT_PDF_MESSAGE_URL");

const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');

export const sendNotificationWithoutPdf = async function sendNotificationWithoutPdf(messageType, rfiCode, investment,): Promise<any> {
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
            initiationNotificationEmail,
            activationNotificationEmail,
            maturityNotificationEmail,
            payoutNotificationEmail,
            rolloverNotificationEmail,
            liquidationNotificationEmail,
        } = settings

        let { id, firstName, lastName, amount, duration, rolloverType, phone, email, investmentType,
            investmentTypeName, startDate, payoutDate, interestDueForPayout, principalDueForPayout,
            totalAmountDueForPayout, isRolloverActivated, datePayoutWasDone, penalty } = investment.$original;
        let rolloverStatus;
        if (isRolloverActivated == true) {
            rolloverStatus = "Activated"
        } else {
            rolloverStatus = "Not Activated"
        }
        let amountPaid;
        let amountRollover;
        if (rolloverType == "101") {
            // Rollover Principal only
            // amount
            // interestDueForPayout
            // totalAmountDueForPayout
            amountPaid = ` NGN ${interestDueForPayout}`;
            amountRollover = ` NGN ${amount}`;
            rolloverType = "Rollover Principal only";
        } else if (rolloverType == "102") {
            // Rollover Principal and Interest 
            amountPaid = ` NGN ${0}`;
            amountRollover = ` NGN ${totalAmountDueForPayout}`;
            rolloverType = "Rollover Principal and Interest"
        } if (rolloverType == "103") {
            // Rollover Interest only
            amountPaid = ` NGN ${amount}`;
            amountRollover = ` NGN ${interestDueForPayout}`;
            rolloverType = "Rollover Interest only"
        }
        let metadata;
        let customerName = ` ${firstName} ${lastName}`;
        let recepients;
        debugger
        if (messageType = "initiation") {
            let subject = "Investment Initiation";
            recepients = [
                {
                    "channel": "email",
                    "handle": email,
                    "name": `${firstName} ${lastName}`
                },
                {
                    "channel": "email",
                    "handle": initiationNotificationEmail,
                    "name": `${rfiName}`
                },
            ];
            messageType = "investment_initiation",
                metadata = {
                    "subject": subject,
                    "customerName": customerName,
                    "amount": amount,
                    "duration": duration,
                    "rolloverType": rolloverType,
                    "customerPhone": phone,
                    "customerEmail": email,
                    "investmentType": investmentType,
                    "investmentTypeName": investmentTypeName,
                    "investmentId": id,
                }
        } else if (messageType = "approval") {
            let subject = "Investment Approval";
            recepients = [
                {
                    "channel": "email",
                    "handle": email,
                    "name": customerName,
                },
                {
                    "channel": "email",
                    "handle": initiationNotificationEmail,
                    "name": `${rfiName}`
                },
            ];
            messageType = "investment_approval",
                metadata = {
                    "subject": subject,
                    "customerName": customerName,
                    "amount": amount,
                    "duration": duration,
                    "rolloverType": rolloverType,
                    "customerPhone": phone,
                    "customerEmail": email,
                    "investmentType": investmentType,
                    "investmentTypeName": investmentTypeName,
                    "investmentId": id,

                }
        } else if (messageType = "activation") {
            let subject = "Investment Activation";
            recepients = [
                {
                    "channel": "email",
                    "handle": activationNotificationEmail,
                    "name": `${rfiName}`
                },
            ];
            messageType = "investment_activation",
                metadata = {
                    "subject": subject,
                    "customerName": customerName,
                    "amount": amount,
                    "duration": duration,
                    "startDate": startDate,
                    "payoutDate": payoutDate,
                    "investmentId": id,
                }
        } else if (messageType = "maturity") {
            let subject = "Investment Maturity";
            recepients = [
                {
                    "channel": "email",
                    "handle": email,
                    "name": customerName,
                },
                {
                    "channel": "email",
                    "handle": maturityNotificationEmail, // approvalNotificationEmail
                    "name": `${rfiName}`, // Admin or Company Name
                },
            ];

            messageType = "investment_maturity",
                metadata = {
                    "subject": subject,
                    "customerName": customerName,
                    "amount": amount,
                    "duration": duration,
                    "investmentId": id,
                    "startDate": startDate,
                    "payoutDate": payoutDate,
                    "interestDueForPayout": interestDueForPayout,
                    "principalDueForPayout": principalDueForPayout,
                    "totalAmountDueForPayout": totalAmountDueForPayout,
                    "rollOverStatus": rolloverStatus,
                }
        } else if (messageType = "payout") {
            let subject = "Investment Payout";
            recepients = [
                {
                    "channel": "email",
                    "handle": email,
                    "name": customerName,
                },
                {
                    "channel": "email",
                    "handle": payoutNotificationEmail,
                    "name": `${rfiName}`, // Admin or Company Name
                },
            ];

            messageType = "investment_payout",
                metadata = {
                    "subject": subject,
                    "customerName": customerName,
                    "investmentType": investmentType,
                    "investmentTypeName": investmentTypeName,
                    "investmentId": id,
                    "amountPaid": totalAmountDueForPayout,
                    "paymentDate": datePayoutWasDone,
                    "startDate": startDate,
                    "payoutDate": payoutDate,
                }
        } else if (messageType = "rollover") {
            let subject = "Investment Rollover";
            recepients = [
                {
                    "channel": "email",
                    "handle": email,
                    "name": customerName,
                },
                {
                    "channel": "email",
                    "handle": rolloverNotificationEmail,
                    "name": `${rfiName}`, // Admin or Company Name
                },
            ];

            messageType = "investment_rollover",
                metadata = {
                    "subject": subject,
                    "customerName": customerName,
                    "duration": duration,
                    "rolloverType": rolloverType,
                    "investmentId": id,
                    "amountPaid": amountPaid,
                    "startDate": startDate,
                    "payoutDate": payoutDate,
                    "amountRollover": amountRollover,

                }
        } else if (messageType = "liquidation") {
            let subject = "Investment Liquidation";
            recepients = [
                {
                    "channel": "email",
                    "handle": email,
                    "name": customerName,
                },
                {
                    "channel": "email",
                    "handle": liquidationNotificationEmail,
                    "name": `${rfiName}`, // Admin or Company Name
                },
            ];
            messageType = "investment_liquidation",
                metadata = {
                    "subject": subject,
                    "customerName": customerName,
                    "duration": duration,
                    "investmentId": id,
                    "amountPaid": totalAmountDueForPayout,
                    "startDate": startDate,
                    "payoutDate": payoutDate,
                    "liquidationDate": datePayoutWasDone,
                    "penaltyDeducted": penalty,
                }
        }

        const payload = {
            "messageType": messageType,//"otp_notification_sms",
            "rfiId": rfiCode,//"6533ty3848484934hfhf84",
            "metadata": metadata,
            "recepients": recepients,
        }
        debugger
        // console.log("NOTIFICATION_WITHOUT_PDF_MESSAGE_URL,line 266", NOTIFICATION_WITHOUT_PDF_MESSAGE_URL);
        const response = await axios.post(`${NOTIFICATION_WITHOUT_PDF_MESSAGE_URL}/notification`,
            payload,// { headers: headers }
        )
        // console.log("The ASTRAPAY API response status: @ sendNotificationWithoutPdf line 270 ", response);
        // console.log("The ASTRAPAY API response status: @ sendNotificationWithoutPdf line 271 ", response.status);
        // console.log("The ASTRAPAY API response: @ sendNotificationWithoutPdf line 272 ", response.data);
        //         {
        //         {
        //     "status": "success",
        //     "message": "messages sent successfully",
        //     "data": null
        // }
        console.log("The ASTRAPAY API response, line 279: ", response.status);
        debugger
        if (response.status === 200) {
            // console.log("The ASTRAPAY API response, line 282: ", response.data);
            return response.data;
        } else {
            // return;
            throw Error();
        }
    } catch (error) {
        console.log("The ASTRAPAY API response error: @ sendNotificationWithoutPdf line 289 ");
        console.error(error);
        console.error(error.message);
        if (error.response == undefined) {
            return { status: "FAILED TO SEND NOTIFICATION", message: error.message }
        } else {
            return { status: "FAILED TO SEND NOTIFICATION", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
        }
    }

}