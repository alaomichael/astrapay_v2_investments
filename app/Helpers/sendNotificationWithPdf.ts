const Env = require("@ioc:Adonis/Core/Env");
// const CERTIFICATE_URL = Env.get("CERTIFICATE_URL");
const NOTIFICATION_WITH_PDF_MESSAGE_URL = Env.get("NOTIFICATION_WITH_PDF_MESSAGE_URL");

const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');

export const sendNotificationWithPdf = async function sendNotificationWithPdf(url, rfiCode, message, subject, recepients): Promise<any> {
        try {
        // console.log("email,line 25", email);
        // console.log("subject,line 26", subject);
        // console.log("firstName,line 27", firstName);
        // console.log("message,line 28", message);
        // const headers = {
        //     "Authorization": NOTIFICATION_MESSAGE_URL_AUTHORIZATION
        // }
        // const payload = {
        //     "email": email,
        //     "subject": subject,
        //     "firstName": firstName,
        //     "message": message,
        // };

        const payload = {
            "url": url,
            "rfiId": rfiCode,
            "message": message,
            "subject": subject,
            "recepients": recepients,
        }
        // "recepients": [
        //     {
        //         "email": "devmichaelalao@gmail.com",
        //         "name": "Michael Alao"
        //     }
        // ]

        // console.log("NOTIFICATION_WITH_PDF_MESSAGE_URL,line 34", NOTIFICATION_WITH_PDF_MESSAGE_URL);
        const response = await axios.post(`${NOTIFICATION_WITH_PDF_MESSAGE_URL}/notification/attachment`,
            payload,// { headers: headers }
        )
        // console.log("The API response status: @ sendNotificationWithPdf line 43 ", response);
        // console.log("The API response status: @ sendNotificationWithPdf line 43 ", response.status);
        // console.log("The API response: @ sendNotificationWithPdf line 44 ", response.data);
        //         {
        //         {
        //     "status": "success",
        //     "message": "messages sent successfully",
        //     "data": null
        // }
        console.log("The API response @ sendNotificationWithPdf, line 53: ", response.status);
        // debugger
        if (response.status === 200) {
            // console.log("The API response, line 56: ", response.data);
            return response.data;
        } else {
            // return;
            throw Error();
        }
    } catch (error) {
        console.log("The API response error: @ sendNotificationWithPdf line 63 ");
        // console.error(error);
        console.error(error.message);
        if (error.response == undefined) {
            return { status: "FAILED TO SEND NOTIFICATION WITH PDF ATTACHMENT", message: error.message }
        } else {
            return { status: "FAILED TO SEND NOTIFICATION WITH PDF ATTACHMENT", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
        }
    }

}