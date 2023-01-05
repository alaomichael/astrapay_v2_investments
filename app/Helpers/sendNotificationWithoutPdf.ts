import SettingsServices from "App/Services/SettingsServices";

const Env = require("@ioc:Adonis/Core/Env");
// const CERTIFICATE_URL = Env.get("CERTIFICATE_URL");
const NOTIFICATION_WITHOUT_PDF_MESSAGE_URL = Env.get("NOTIFICATION_WITHOUT_PDF_MESSAGE_URL");

const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');

export const sendNotificationWithoutPdf = async function sendNotificationWithoutPdf(messageType, rfiCode,investment,): Promise<any> {
    // connect to Okra
    try {
        // console.log("email,line 25", email);
        // console.log("subject,line 26", subject);
        // console.log("firstName,line 27", firstName);
        // console.log("message,line 28", message);
        // const headers = {
        //     "Authorization": NOTIFICATION_MESSAGE_URL_AUTHORIZATION
        // }

        //   - investment_initiation
        // - subject
        // - customerName
        // - amount
        // - duration
        // - rolloverType
        // - customerPhone
        // - customerEmail
        // - investmentType
        // - investmentTypeName
        // - investmentId
        // - recipientName

        // const payload = {
        //     "url": url,
        //     "rfiId": rfiCode,
        //     "message": message,
        //     "subject": subject,
        //     "recepients": recepients,
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

        let { id, firstName, lastName, amount, duration, rolloverType, phone, email, investmentType, investmentTypeName } = investment;
        let metadata;
        let customerName = ` ${firstName} ${lastName}`;
        let recepients;
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
                    "handle": activationNotificationEmail, // approvalNotificationEmail
                    "name": `${rfiName}`
                },
            ];
            messageType = "investment_activation",
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
                    "rolloverType": rolloverType,
                    "customerPhone": phone,
                    "customerEmail": email,
                    "investmentType": investmentType,
                    "investmentTypeName": investmentTypeName,
                    "investmentId": id,

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
                    "amount": amount,
                    "duration": duration,
                    "rolloverType": rolloverType,
                    "customerPhone": phone,
                    "customerEmail": email,
                    "investmentType": investmentType,
                    "investmentTypeName": investmentTypeName,
                    "investmentId": id,

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
                    "amount": amount,
                    "duration": duration,
                    "rolloverType": rolloverType,
                    "customerPhone": phone,
                    "customerEmail": email,
                    "investmentType": investmentType,
                    "investmentTypeName": investmentTypeName,
                    "investmentId": id,

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
                    "amount": amount,
                    "duration": duration,
                    "rolloverType": rolloverType,
                    "customerPhone": phone,
                    "customerEmail": email,
                    "investmentType": investmentType,
                    "investmentTypeName": investmentTypeName,
                    "investmentId": id,

                }
        }

        const payload = {
            "messageType": messageType,//"otp_notification_sms",
            "rfiId": rfiCode,//"6533ty3848484934hfhf84",
            "metadata": metadata,
            "recepients": recepients,
        }

        // console.log("NOTIFICATION_WITHOUT_PDF_MESSAGE_URL,line 34", NOTIFICATION_WITHOUT_PDF_MESSAGE_URL);
        const response = await axios.post(`${NOTIFICATION_WITHOUT_PDF_MESSAGE_URL}/notification`,
            payload,// { headers: headers }
        )
        // console.log("The ASTRAPAY API response status: @ sendNotificationWithoutPdf line 43 ", response);
        // console.log("The ASTRAPAY API response status: @ sendNotificationWithoutPdf line 43 ", response.status);
        // console.log("The ASTRAPAY API response: @ sendNotificationWithoutPdf line 44 ", response.data);
        //         {
        //         {
        //     "status": "success",
        //     "message": "messages sent successfully",
        //     "data": null
        // }
        console.log("The ASTRAPAY API response, line 47: ", response.status);
        debugger
        if (response.status === 200) {
            // console.log("The ASTRAPAY API response, line 47: ", response.data);
            return response.data;
        } else {
            // return;
            throw Error();
        }
    } catch (error) {
        console.log("The ASTRAPAY API response error: @ sendNotificationWithoutPdf line 51 ");
        console.error(error.message);
        if (error.response == undefined) {
            return { status: "FAILED TO SEND NOTIFICATION", message: error.message }
        } else {
            return { status: "FAILED TO SEND NOTIFICATION", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
        }
    }

}