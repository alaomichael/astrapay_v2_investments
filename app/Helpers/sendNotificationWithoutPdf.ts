const Env = require("@ioc:Adonis/Core/Env");
// const CERTIFICATE_URL = Env.get("CERTIFICATE_URL");
const NOTIFICATION_MESSAGE_URL = Env.get("NOTIFICATION_MESSAGE_URL");

const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');

export const sendNotificationWithoutPdf = async function sendNotificationWithoutPdf(url, rfiCode, message, subject, recepients): Promise<any> {
    // connect to Okra
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

        // console.log("NOTIFICATION_MESSAGE_URL,line 34", NOTIFICATION_MESSAGE_URL);
        const response = await axios.post(`${NOTIFICATION_MESSAGE_URL}/notification`,
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