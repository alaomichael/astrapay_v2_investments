import SettingsServices from "App/Services/SettingsServices";

const Env = require("@ioc:Adonis/Core/Env");
// const CERTIFICATE_URL = Env.get("CERTIFICATE_URL");
const NOTIFICATION_WITHOUT_PDF_MESSAGE_URL = Env.get("NOTIFICATION_WITHOUT_PDF_MESSAGE_URL");

const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');

export const sendNotificationWithoutPdf = async function sendNotificationWithoutPdf(messageKey, rfiCode, investment,): Promise<any> {
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
            currencyCode,
        } = settings

        let { id, firstName, lastName, amount, duration, rolloverType, phone, email, investmentType,
            investmentTypeName, startDate, payoutDate, interestDueOnInvestment,
            totalAmountToPayout, isRolloverActivated, datePayoutWasDone, penalty, investmentCompletionDate } = investment;
        // debugger
        let principalDueForPayout = amount;
        let interestDueForPayout = interestDueOnInvestment;
        let completionDate = investmentCompletionDate;
        if (investment.firstName == undefined) {
            let { first_name, last_name, rollover_type, investment_type,
                investment_type_name, start_date, payout_date, interest_due_on_investment,
                total_amount_to_payout, is_rollover_activated, date_payout_was_done, investment_completion_date } = investment;
            // debugger
            // Update the value of the variables
            firstName = first_name;
            lastName = last_name;
            rolloverType = rollover_type;
            investmentType = investment_type;
            investmentTypeName = investment_type_name;
            startDate = start_date;
            payoutDate = payout_date;
            interestDueForPayout = interest_due_on_investment;
            // principalDueForPayout = amount;
            totalAmountToPayout = total_amount_to_payout;
            isRolloverActivated = is_rollover_activated;
            datePayoutWasDone = date_payout_was_done;
            completionDate = investment_completion_date;
        }
        // debugger
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
            amountPaid = ` ${currencyCode} ${interestDueForPayout}`;
            amountRollover = ` ${currencyCode} ${amount}`;
            rolloverType = "Rollover Principal only";
        } else if (rolloverType == "102") {
            // Rollover Principal and Interest 
            amountPaid = ` ${currencyCode} ${0}`;
            amountRollover = ` ${currencyCode} ${totalAmountToPayout}`;
            rolloverType = "Rollover Principal and Interest"
        } else if (rolloverType == "103") {
            // Rollover Interest only
            amountPaid = ` ${currencyCode} ${amount}`;
            amountRollover = ` ${currencyCode} ${interestDueForPayout}`;
            rolloverType = "Rollover Interest only"
        }
        let metadata;
        let customerName = ` ${firstName} ${lastName}`;
        let recepients: any[] = [];
        // debugger
        if (messageKey == "initiation") {
            let subject = "Investment Initiation";
            // recepients = [
                // {
                //     "channel": "email",
                //     "handle": email,
                //     "name": `${firstName} ${lastName}`
                // },
            //     {
            //         "channel": "email",
            //         "handle": initiationNotificationEmail,
            //         "name": `${rfiName}`
            //     },
            // ];
            for (let index = 0; index < initiationNotificationEmail.length; index++) {
                try {
                    const receiverDetails = initiationNotificationEmail[index];
                    // debugger
                    console.log(" receiverDetails , line 116", receiverDetails);
                    let receiverName = receiverDetails.name ? receiverDetails.name : rfiName;
                    // debugger;
                   let payload =     {
                    "channel": "email",
                    "handle": receiverDetails.email,
                    "name": receiverName//receiverDetails.name,
                };
                debugger
                await recepients.push(payload);
                } catch (error) {
                    console.log("Error line 125 =====================:", error);
                    throw error;
                }
            }

            let customerDetails =   {
                "channel": "email",
                "handle": email,
                "name": `${firstName} ${lastName}`
            };
            await  recepients.push(customerDetails);

            messageKey = "investment_initiation",
                metadata = {
                    "subject": subject,
                    "customerName": customerName,
                    "amount": ` ${currencyCode} ${amount}`,
                    "duration": duration,
                    "rolloverType": rolloverType,
                    "customerPhone": phone,
                    "customerEmail": email,
                    "investmentType": investmentType,
                    "investmentTypeName": investmentTypeName,
                    "investmentId": id,
                }
        } else if (messageKey == "approval") {
            let subject = "Investment Approval";
            // recepients = [
            //     {
            //         "channel": "email",
            //         "handle": email,
            //         "name": customerName,
            //     },
            //     {
            //         "channel": "email",
            //         "handle": initiationNotificationEmail,
            //         "name": `${rfiName}`
            //     },
            // ];

            for (let index = 0; index < initiationNotificationEmail.length; index++) {
                try {
                    const receiverDetails = initiationNotificationEmail[index];
                    // debugger
                    console.log(" receiverDetails , line 169", receiverDetails);
                    // debugger;
                    let receiverName = receiverDetails.name ? receiverDetails.name : rfiName;
                    // debugger;
                   let payload =     {
                    "channel": "email",
                    "handle": receiverDetails.email,
                    "name": receiverName//receiverDetails.name,
                };
                debugger
                 await  recepients.push(payload);
                } catch (error) {
                    console.log("Error line 179 =====================:", error);
                    throw error;
                }
            }

            let customerDetails =   {
                "channel": "email",
                "handle": email,
                "name": customerName,
            };
            await recepients.push(customerDetails);
            messageKey = "investment_approval",
                metadata = {
                    "subject": subject,
                    "customerName": customerName,
                    "amount": ` ${currencyCode} ${amount}`,
                    "duration": duration,
                    "rolloverType": rolloverType,
                    "customerPhone": phone,
                    "customerEmail": email,
                    "investmentType": investmentType,
                    "investmentTypeName": investmentTypeName,
                    "investmentId": id,

                }
        } else if (messageKey == "activation") {
            let subject = "Investment Activation";
            // recepients = [
            //     {
            //         "channel": "email",
            //         "handle": activationNotificationEmail,
            //         "name": `${rfiName}`
            //     },
            // ];
            for (let index = 0; index < activationNotificationEmail.length; index++) {
                try {
                    const receiverDetails = activationNotificationEmail[index];
                    // debugger
                    console.log(" receiverDetails , line 217", receiverDetails);
                    // debugger;
                    let receiverName = receiverDetails.name ? receiverDetails.name : rfiName;
                    // debugger;
                   let payload =     {
                    "channel": "email",
                    "handle": receiverDetails.email,
                    "name": receiverName//receiverDetails.name,
                };
                debugger
                 await  recepients.push(payload);
                } catch (error) {
                    console.log("Error line 228 =====================:", error);
                    throw error;
                }
            }

            messageKey = "investment_activation",
                metadata = {
                    "subject": subject,
                    "customerName": customerName,
                    "amount": ` ${currencyCode} ${amount}`,
                    "duration": duration,
                    "startDate": startDate,
                    "payoutDate": payoutDate,
                    "investmentId": id,
                }
        } else if (messageKey == "maturity") {
            let subject = "Investment Maturity";
            // recepients = [
            //     {
            //         "channel": "email",
            //         "handle": email,
            //         "name": customerName,
            //     },
            //     {
            //         "channel": "email",
            //         "handle": maturityNotificationEmail, // approvalNotificationEmail
            //         "name": `${rfiName}`, // Admin or Company Name
            //     },
            // ];
            for (let index = 0; index < maturityNotificationEmail.length; index++) {
                try {
                    const receiverDetails = maturityNotificationEmail[index];
                    // debugger
                    console.log(" receiverDetails , line 261", receiverDetails);
                    // debugger;
                    let receiverName = receiverDetails.name ? receiverDetails.name : rfiName;
                    // debugger;
                   let payload =     {
                    "channel": "email",
                    "handle": receiverDetails.email,
                    "name": receiverName//receiverDetails.name,
                };
                debugger
                 await  recepients.push(payload);
                } catch (error) {
                    console.log("Error line 271 =====================:", error);
                    throw error;
                }
            }

            let customerDetails =   {
                "channel": "email",
                "handle": email,
                "name": customerName,
            };
            await recepients.push(customerDetails);

            messageKey = "investment_maturity",
                metadata = {
                    "subject": subject,
                    "customerName": customerName,
                    "amount": ` ${currencyCode} ${amount}`,
                    "duration": duration,
                    "investmentId": id,
                    "startDate": startDate,
                    "payoutDate": payoutDate,
                    "interestDueForPayout": ` ${currencyCode} ${interestDueForPayout}`,
                    "principalDueForPayout": ` ${currencyCode} ${principalDueForPayout}`,
                    "totalAmountDueForPayout": ` ${currencyCode} ${totalAmountToPayout}`,
                    "rollOverStatus": rolloverStatus,
                }
        } else if (messageKey == "payout") {
            let subject = "Investment Payout";
            // recepients = [
            //     {
            //         "channel": "email",
            //         "handle": email,
            //         "name": customerName,
            //     },
            //     {
            //         "channel": "email",
            //         "handle": payoutNotificationEmail,
            //         "name": `${rfiName}`, // Admin or Company Name
            //     },
            // ];
            for (let index = 0; index < payoutNotificationEmail.length; index++) {
                try {
                    const receiverDetails = payoutNotificationEmail[index];
                    // debugger
                    console.log(" receiverDetails , line 315", receiverDetails);
                    // debugger;
                    let receiverName = receiverDetails.name ? receiverDetails.name : rfiName;
                    // debugger;
                   let payload =     {
                    "channel": "email",
                    "handle": receiverDetails.email,
                    "name": receiverName//receiverDetails.name,
                };
                debugger
                 await  recepients.push(payload);
                } catch (error) {
                    console.log("Error line 325 =====================:", error);
                    throw error;
                }
            }

            let customerDetails =   {
                "channel": "email",
                "handle": email,
                "name": customerName,
            };
            await recepients.push(customerDetails);
            messageKey = "investment_payout",
                metadata = {
                    "subject": subject,
                    "customerName": customerName,
                    "investmentType": investmentType,
                    "investmentTypeName": investmentTypeName,
                    "investmentId": id,
                    "amountPaid": amountPaid,
                    "paymentDate": datePayoutWasDone,
                    "startDate": startDate,
                    "payoutDate": payoutDate,
                }
        } else if (messageKey == "rollover") {
            let subject = "Investment Rollover";
            // recepients = [
            //     {
            //         "channel": "email",
            //         "handle": email,
            //         "name": customerName,
            //     },
            //     {
            //         "channel": "email",
            //         "handle": rolloverNotificationEmail,
            //         "name": `${rfiName}`, // Admin or Company Name
            //     },
            // ];
            for (let index = 0; index < rolloverNotificationEmail.length; index++) {
                try {
                    const receiverDetails = rolloverNotificationEmail[index];
                    // debugger
                    console.log(" receiverDetails , line 366", receiverDetails);
                    // debugger;
                    let receiverName = receiverDetails.name ? receiverDetails.name : rfiName;
                    // debugger;
                   let payload =     {
                    "channel": "email",
                    "handle": receiverDetails.email,
                    "name": receiverName//receiverDetails.name,
                };
                debugger
                 await  recepients.push(payload);
                } catch (error) {
                    console.log("Error line 375 =====================:", error);
                    throw error;
                }
            }

            let customerDetails =   {
                "channel": "email",
                "handle": email,
                "name": customerName,
            };
            await recepients.push(customerDetails);
            messageKey = "investment_rollover",
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
        } else if (messageKey == "liquidation") {
            let subject = "Investment Liquidation";
            // recepients = [
            //     {
            //         "channel": "email",
            //         "handle": email,
            //         "name": customerName,
            //     },
            //     {
            //         "channel": "email",
            //         "handle": liquidationNotificationEmail,
            //         "name": `${rfiName}`, // Admin or Company Name
            //     },
            // ];
            for (let index = 0; index < liquidationNotificationEmail.length; index++) {
                try {
                    const receiverDetails = liquidationNotificationEmail[index];
                    // debugger
                    console.log(" receiverDetails , line 415", receiverDetails);
                    // debugger;
                    let receiverName = receiverDetails.name ? receiverDetails.name : rfiName;
                    // debugger;
                   let payload =     {
                    "channel": "email",
                    "handle": receiverDetails.email,
                    "name": receiverName//receiverDetails.name,
                };
                debugger
                 await  recepients.push(payload);
                } catch (error) {
                    console.log("Error line 425 =====================:", error);
                    throw error;
                }
            }

            let customerDetails =   {
                "channel": "email",
                "handle": email,
                "name": customerName,
            };
            await recepients.push(customerDetails);
            messageKey = "investment_liquidation",
                metadata = {
                    "subject": subject,
                    "customerName": customerName,
                    "duration": duration,
                    "investmentId": id,
                    "amountPaid": ` ${currencyCode} ${totalAmountToPayout}`, //totalAmountToPayout,
                    "startDate": startDate,
                    "payoutDate": payoutDate,
                    "liquidationDate": completionDate,
                    "penaltyDeducted": ` ${currencyCode} ${penalty}`,
                }
        }
        // debugger
        const payload = {
            "messageKey": messageKey,//"otp_notification_sms",
            "rfiId": rfiCode,//"6533ty3848484934hfhf84",
            "metadata": metadata,
            "recepients": recepients,
        }
        console.log("payload,line 459", payload);
        debugger
        console.log("NOTIFICATION_WITHOUT_PDF_MESSAGE_URL,line 461", NOTIFICATION_WITHOUT_PDF_MESSAGE_URL);
        const response = await axios.post(`${NOTIFICATION_WITHOUT_PDF_MESSAGE_URL}/notification`,
            payload,// { headers: headers }
        )
        // console.log("The API response status: @ sendNotificationWithoutPdf line 465 ", response);
        // console.log("The API response status: @ sendNotificationWithoutPdf line 466 ", response.status);
        // console.log("The API response: @ sendNotificationWithoutPdf line 467 ", response.data);
        //         {
        //         {
        //     "status": "success",
        //     "message": "messages sent successfully",
        //     "data": null
        // }
        console.log("The API response, line 474: ", response.status);
        // debugger
        if (response.status === 200) {
            // console.log("The  API response, line 477: ", response.data);
            return response.data;
        } else {
            // return;
            throw Error(response);
        }
    } catch (error) {
        console.log("The API response error: @ sendNotificationWithoutPdf line 484 ");
        console.error(error);
        console.error(error.message);
        if (error.response == undefined) {
            return { status: "FAILED TO SEND NOTIFICATION", message: error.message }
        } else {
            return { status: "FAILED TO SEND NOTIFICATION", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
        }
    }

}