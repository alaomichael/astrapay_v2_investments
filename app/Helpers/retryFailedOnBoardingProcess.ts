const Env = require("@ioc:Adonis/Core/Env");
const ASTRAPAY_BEARER_TOKEN = Env.get("ASTRAPAY_BEARER_TOKEN");
const API_URL = Env.get("API_URL");
const axios = require("axios").default;
// @ts-ignore
const { URLSearchParams } = require('url');

export const retryFailedOnBoardingProcess = async function retryFailedOnBoardingProcess(walletId, userId, fullName, customerId, lng?, lat?): Promise<any> {
    // connect to Okra
    try {
        // console.log("walletId,line 15", walletId);
        // console.log("customerId,line 18", customerId);
        // console.log("userId,line 16", userId);
        // console.log("fullName,line 17", fullName);
        // console.log("lng,line 19", lng);
        // console.log("lat,line 20", lat);

        const headers = {
            "Token": ASTRAPAY_BEARER_TOKEN
        }

        const payload = {
            "walletId": walletId,
            "userId": userId,
            "fullName": fullName,
            "customerId": customerId,
            "lng": lng,
            "lat": lat
        }
        const response = await axios.post(`${API_URL}/loans/onboarding`,
            payload, { headers: headers }
        )
        // console.log("The ASTRAPAY API response status: @  retryFailedOnBoardingProcess line 43 ", response.status);
        // console.log("The ASTRAPAY API response: @  retryFailedOnBoardingProcess line 44 ", response.data);
        if (response.status == 200) {
            // console.log("The ASTRAPAY API response, line 47 @ retryFailedOnBoardingProcess: ", response.data);
            return response.data;
        } else {
            return;
        }
    } catch (error) {
        console.error(error.response.data.errorCode);
        console.error(error.response.data.errorMessage);
        console.error(error.message);
        if(error.response == undefined){
           return { status: "FAILED TO ONBOARD", message: error.message } 
        }else{
        return {
            status: "FAILED TO ONBOARD",
            message: error.message,
            errorCode: error.response.data.errorCode,
            errorMessage: error.response.data.errorMessage
        }}
    }

}