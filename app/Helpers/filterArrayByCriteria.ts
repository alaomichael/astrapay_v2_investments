export const filterArrayByCriteria = async function filterArrayByCriteria(data, timestamp, limit) {
    // Convert the input timestamp to UTC
    const targetTimestamp = new Date(timestamp);
    const targetTimestampUTC = new Date(targetTimestamp.toISOString());
    debugger
    const filteredData = data.filter((item) => {
        // Convert attempts and maxAttempts to numbers, if necessary.
        const attempts = Number(item.attempts);
        const maxAttempts = Number(item.max_attempts);

        // Normalize all timestamps to UTC for consistent comparison
        const lastAttemptAtUTC = item.last_attempt_at ? new Date(item.last_attempt_at) : null;
        const createdAtDateUTC = new Date(item.created_at);

        // const retryPeriodUTC = new Date(createdAtDateUTC.getTime() + (Number(item.retry_period) * 24 * 60 * 60 * 1000)); // In days format
        const retryPeriodUTC = new Date(createdAtDateUTC.getTime() + (Number(item.retry_period) * 60 * 60 * 1000)); // In hours format

        debugger
        if (
            attempts < maxAttempts &&
            // (lastAttemptAtUTC === null || lastAttemptAtUTC < targetTimestampUTC || lastAttemptAtUTC > targetTimestampUTC) && // Put null values at the top
            (lastAttemptAtUTC === null || lastAttemptAtUTC < targetTimestampUTC) && // Put null values at the top

            (
                retryPeriodUTC.setUTCHours(0, 0, 0, 0) >= targetTimestampUTC.setUTCHours(0, 0, 0, 0)
                || createdAtDateUTC.setUTCHours(0, 0, 0, 0) >= targetTimestampUTC.setUTCHours(0, 0, 0, 0)
            )
        ) {
            return true;
        }
        return false;
    }
    );


    //     // Function to parse dates
    const parseDate = (dateString) => (dateString ? new Date(dateString) : null);


    // Sort the filteredData to put null lastAttemptAt values at the top
    filteredData.sort((a, b) => {
        if (a.last_attempt_at === null && b.last_attempt_at === null) {
            return 0;
        }
        if (a.last_attempt_at === null) {
            return -1;
        }
        if (b.last_attempt_at === null) {
            return 1;
        }
        // Check if lastAttemptAt is a valid date before comparing
        // @ts-ignore
        return parseDate(a.last_attempt_at).getTime() - parseDate(b.last_attempt_at).getTime();

    });



    // Apply the limit to the filtered result
    if (limit !== undefined && limit !== null && limit > 0) {
        debugger
        return filteredData.slice(0, limit);
    }
    debugger

    return filteredData;
}


// FOR TESTING PURPOSE FORMER
// export const filterArrayByCriteria = async function filterArrayByCriteria(data, timestamp, limit) {
//     // Convert the input timestamp to UTC
//     const targetTimestamp = new Date(timestamp);
//     const targetTimestampUTC = new Date(targetTimestamp.toISOString());
//     debugger
//     const filteredData = data.filter((item) => {
//         // Convert attempts and maxAttempts to numbers, if necessary.
//         const attempts = Number(item.attempts);
//         const maxAttempts = Number(item.maxAttempts);

//         // Normalize all timestamps to UTC for consistent comparison
//         const lastAttemptAtUTC = item.lastAttemptAt ? new Date(item.lastAttemptAt) : null;
//         const createdAtDateUTC = new Date(item.createdAt);
//         // const retryPeriodUTC = new Date(createdAtDateUTC.getTime() + item.retry_period);
//         const retryPeriodUTC = new Date(createdAtDateUTC.getTime() + (Number(item.retryPeriod) * 24 * 60 * 60 * 1000));

//         debugger
//         if (
//             attempts < maxAttempts &&
//             // (lastAttemptAtUTC === null || lastAttemptAtUTC < targetTimestampUTC || lastAttemptAtUTC > targetTimestampUTC) && // Put null values at the top
//             (lastAttemptAtUTC === null || lastAttemptAtUTC < targetTimestampUTC) && // Put null values at the top

//             (
//                 retryPeriodUTC.setUTCHours(0, 0, 0, 0) >= targetTimestampUTC.setUTCHours(0, 0, 0, 0)
//                 || createdAtDateUTC.setUTCHours(0, 0, 0, 0) >= targetTimestampUTC.setUTCHours(0, 0, 0, 0)
//             )
//         ) {
//             return true;
//         }
//         return false;
//     }
//     );


//     //     // Function to parse dates
//     const parseDate = (dateString) => (dateString ? new Date(dateString) : null);


//     // Sort the filteredData to put null lastAttemptAt values at the top
//     filteredData.sort((a, b) => {
//         if (a.lastAttemptAt === null && b.lastAttemptAt === null) {
//             return 0;
//         }
//         if (a.lastAttemptAt === null) {
//             return -1;
//         }
//         if (b.lastAttemptAt === null) {
//             return 1;
//         }
//         // Check if lastAttemptAt is a valid date before comparing
//         // @ts-ignore
//         return parseDate(a.lastAttemptAt).getTime() - parseDate(b.lastAttemptAt).getTime();

//     });



//     // Apply the limit to the filtered result
//     if (limit !== undefined && limit !== null && limit > 0) {
//         debugger
//         return filteredData.slice(0, limit);
//     }
//     debugger

//     return filteredData;
// }

// Example usage:
// // const maxAttempts = 50;
// const timestamp = "2023-11-09T00:00:00.0+01:00"; // Replace with your timestamp
// // const retryPeriod = 3; // Replace with your retry period
// // const repaymentDate = "2023-11-03T16:00:00.000+01:00"; // Replace with your repayment date
// const limit = 4;
// // // Sample data array
// const data = [
//     {
//         "id": "cdbe090b-bf69-471b-b42b-a98d3d68cfaa",
//         "userId": "2347033680599",
//         "walletId": "7033680599",
//         "rfiRecordId": "a0af8dd6-a16c-4c93-a6fe-9e779d194028",
//         "rfiCode": "apmfb",
//         "firstName": "Michael",
//         "lastName": "Alao",
//         "phone": "2347033680599",
//         "email": "michaeltestingofsoftware@gmail.com",
//         "investorFundingWalletId": "7033680599",
//         "amount": 30,
//         "duration": 2,
//         "rolloverType": "102",
//         "rolloverTarget": 0,
//         "rolloverDone": 0,
//         "investmentTypeName": "General Investment",
//         "investmentTypeId": "e8bc9ace-470d-416b-a8a2-b8b313bd3758",
//         "investmentType": "fixed",
//         "tagName": "Test 2",
//         "currencyCode": "NGN",
//         "interestRate": 0.07,
//         "interestDueOnInvestment": 0.1,
//         "totalAmountToPayout": 30.1,
//         "penalty": null,
//         "isRequestSent": true,
//         "investmentRequestReference": "INVESTMENT-SERVICE-1698245869431wXaT-cdbe090b-bf69-471b-b42b-a98d3d68cfaa_1",
//         "principalPayoutRequestReference": null,
//         "interestPayoutRequestReference": null,
//         "isInvestmentCreated": false,
//         "startDate": null,
//         "payoutDate": null,
//         "isInvestmentCompleted": false,
//         "investmentCompletionDate": null,
//         "isRolloverActivated": true,
//         "isRolloverSuspended": false,
//         "rolloverReactivationDate": null,
//         "isPayoutAuthorized": true,
//         "isPayoutSuspended": false,
//         "payoutReactivationDate": null,
//         "isTerminationAuthorized": false,
//         "isPayoutSuccessful": false,
//         "requestType": "start_investment",
//         "approvalStatus": "pending",
//         "status": "initiated",
//         "principalPayoutStatus": "pending",
//         "interestPayoutStatus": "pending",
//         "certificateUrl": null,
//         "datePayoutWasDone": null,
//         "lng": 3.867256,
//         "lat": 7.3679976,
//         "processedBy": "automation",
//         "approvedBy": "automation",
//         "assignedTo": "automation",
//         "createdAt": "2023-11-05T15:57:49.424+01:00",
//         "updatedAt": "2023-10-25T15:57:49.478+01:00",
//         "verificationRequestAttempts": 0,
//         "numberOfAttempts": 1,
//         "maxAttempts": 50,
//         "attempts": 0,
//         "lastAttemptAt": null,
//         "retryPeriod": 4,
//         "timelines": [
//             {
//                 "id": "e99f246c-d6a2-41cf-a744-999a81934485",
//                 "investmentId": "cdbe090b-bf69-471b-b42b-a98d3d68cfaa",
//                 "userId": "2347033680599",
//                 "walletId": "7033680599",
//                 "action": "investment approval request",
//                 "message": "Michael, your investment request has been sent for approval, please wait while the investment is approved. Thank you.",
//                 "metadata": "",
//                 "createdAt": "2023-10-25T15:57:49.469+01:00",
//                 "updatedAt": "2023-10-25T15:57:49.470+01:00",
//                 "adminMessage": "Michael, investment request was sent for approval."
//             },
//             {
//                 "id": "a387487b-8c3c-4b50-8097-abb85745093d",
//                 "investmentId": "cdbe090b-bf69-471b-b42b-a98d3d68cfaa",
//                 "userId": "2347033680599",
//                 "walletId": "7033680599",
//                 "action": "investment request approval created",
//                 "message": "Michael ,your investment request approval record has just been created.",
//                 "metadata": "request type : start_investment",
//                 "createdAt": "2023-10-25T15:57:49.457+01:00",
//                 "updatedAt": "2023-10-25T15:57:49.458+01:00",
//                 "adminMessage": "Michael investment request approval record was created."
//             },
//             {
//                 "id": "06243692-98ef-4b29-9965-c63e1c8dcf00",
//                 "investmentId": "cdbe090b-bf69-471b-b42b-a98d3d68cfaa",
//                 "userId": "2347033680599",
//                 "walletId": "7033680599",
//                 "action": "investment initiated",
//                 "message": "Michael, you just initiated an investment.",
//                 "metadata": "duration: 2",
//                 "createdAt": "2023-10-25T15:57:49.424+01:00",
//                 "updatedAt": "2023-10-25T15:57:49.442+01:00",
//                 "adminMessage": "Michael, just initiated an investment."
//             }
//         ],
//         "approvals": [
//             {
//                 "id": "944a9ab8-30bc-46f2-9646-bef9588d459f",
//                 "walletId": "7033680599",
//                 "userId": "2347033680599",
//                 "investmentId": "cdbe090b-bf69-471b-b42b-a98d3d68cfaa",
//                 "requestType": "payout_investment",
//                 "approvalStatus": "pending",
//                 "assignedTo": "",
//                 "processedBy": "",
//                 "createdAt": "2023-10-25T15:57:49.466+01:00",
//                 "updatedAt": "2023-10-25T15:57:49.466+01:00",
//                 "rfiCode": "apmfb",
//                 "approvedBy": null,
//                 "email": null
//             },
//             {
//                 "id": "6c67efff-83b8-4898-be4d-991066935147",
//                 "walletId": "7033680599",
//                 "userId": "2347033680599",
//                 "investmentId": "cdbe090b-bf69-471b-b42b-a98d3d68cfaa",
//                 "requestType": "start_investment",
//                 "approvalStatus": "pending",
//                 "assignedTo": "",
//                 "processedBy": "",
//                 "createdAt": "2023-10-25T15:57:49.448+01:00",
//                 "updatedAt": "2023-10-25T15:57:49.448+01:00",
//                 "rfiCode": "apmfb",
//                 "approvedBy": null,
//                 "email": null
//             }
//         ]
//     },
//     {
//         "id": "c85a3057-43ff-4ff9-8a93-3a379a229c69",
//         "userId": "2347033680599",
//         "walletId": "7033680599",
//         "rfiRecordId": "a0af8dd6-a16c-4c93-a6fe-9e779d194028",
//         "rfiCode": "apmfb",
//         "firstName": "Michael",
//         "lastName": "Alao",
//         "phone": "2347033680599",
//         "email": "michaeltestingofsoftware@gmail.com",
//         "investorFundingWalletId": "7033680599",
//         "amount": 20,
//         "duration": 2,
//         "rolloverType": "101",
//         "rolloverTarget": 0,
//         "rolloverDone": 0,
//         "investmentTypeName": "Basic Investment",
//         "investmentTypeId": "c819987e-abd4-4a7b-937e-49dc82f2df2c",
//         "investmentType": "fixed",
//         "tagName": "Food",
//         "currencyCode": "NGN",
//         "interestRate": 0.07,
//         "interestDueOnInvestment": 0.037,
//         "totalAmountToPayout": 20.037,
//         "penalty": 0.013,
//         "isRequestSent": true,
//         "investmentRequestReference": "INVESTMENT-SERVICE-1698245825520YCiK-c85a3057-43ff-4ff9-8a93-3a379a229c69_1",
//         "principalPayoutRequestReference": "INVESTMENT-SERVICE-16982468852364txi-c85a3057-43ff-4ff9-8a93-3a379a229c69_1",
//         "interestPayoutRequestReference": "INVESTMENT-SERVICE-16982468863221F6J-c85a3057-43ff-4ff9-8a93-3a379a229c69_1",
//         "isInvestmentCreated": true,
//         "startDate": "2023-10-25T00:00:00.000+01:00",
//         "payoutDate": "2023-10-27T00:00:00.000+01:00",
//         "isInvestmentCompleted": true,
//         "investmentCompletionDate": "2023-10-25T16:14:46.490+01:00",
//         "isRolloverActivated": true,
//         "isRolloverSuspended": false,
//         "rolloverReactivationDate": null,
//         "isPayoutAuthorized": true,
//         "isPayoutSuspended": false,
//         "payoutReactivationDate": null,
//         "isTerminationAuthorized": true,
//         "isPayoutSuccessful": true,
//         "requestType": "liquidate_investment",
//         "approvalStatus": "approved",
//         "status": "liquidated",
//         "principalPayoutStatus": "completed",
//         "interestPayoutStatus": "completed",
//         "certificateUrl": null,
//         "datePayoutWasDone": "2023-10-25T00:00:00.000+01:00",
//         "lng": 3.8672602,
//         "lat": 7.3679953,
//         "processedBy": "tola ola",
//         "approvedBy": "tola ola",
//         "assignedTo": "tola ola",
//         "createdAt": "2023-11-05T15:57:05.510+01:00",
//         "updatedAt": "2023-10-25T16:14:46.498+01:00",
//         "verificationRequestAttempts": 0,
//         "numberOfAttempts": 1,
//         "maxAttempts": 50,
//         "attempts": 0,
//         "lastAttemptAt": null,
//         "retryPeriod": 3,
//         "timelines": [
//             {
//                 "id": "3cb1576b-6b61-4fcb-92c6-cb61f4646bdb",
//                 "investmentId": "c85a3057-43ff-4ff9-8a93-3a379a229c69",
//                 "userId": "2347033680599",
//                 "walletId": "7033680599",
//                 "action": "investment liquidation payout",
//                 "message": "Michael, the sum of NGN 20.037 for your liquidated investment has been paid out, please check your account. Thank you.",
//                 "metadata": "",
//                 "createdAt": "2023-10-25T16:14:46.503+01:00",
//                 "updatedAt": "2023-10-25T16:14:46.504+01:00",
//                 "adminMessage": "The sum of NGN 20.037 for Michael liquidated investment was paid out."
//             },
//             {
//                 "id": "8d2d845d-095a-4e41-ac7a-69d3e21d7d6a",
//                 "investmentId": "c85a3057-43ff-4ff9-8a93-3a379a229c69",
//                 "userId": "2347033680599",
//                 "walletId": "7033680599",
//                 "action": "investment liquidation initiated",
//                 "message": "Michael,your investment has just been sent for liquidation processing.",
//                 "metadata": "",
//                 "createdAt": "2023-10-25T16:14:44.066+01:00",
//                 "updatedAt": "2023-10-25T16:14:44.066+01:00",
//                 "adminMessage": "Michael, investment was sent for liquidation processing."
//             },
//             {
//                 "id": "3bef361b-7f6f-4e6c-84a6-6b55e2b06bd1",
//                 "investmentId": "c85a3057-43ff-4ff9-8a93-3a379a229c69",
//                 "userId": "2347033680599",
//                 "walletId": "7033680599",
//                 "action": "investment activation",
//                 "message": "Michael, your investment of NGN 20 has been activated. Thank you.",
//                 "metadata": "",
//                 "createdAt": "2023-10-25T16:12:04.204+01:00",
//                 "updatedAt": "2023-10-25T16:12:04.204+01:00",
//                 "adminMessage": "Michael investment of NGN 20 was activated."
//             },
//             {
//                 "id": "b90446ed-de0c-4178-ae45-92836b9b3a7d",
//                 "investmentId": "c85a3057-43ff-4ff9-8a93-3a379a229c69",
//                 "userId": "2347033680599",
//                 "walletId": "7033680599",
//                 "action": "investment approved",
//                 "message": "Michael, your investment request has been approved, please wait while the investment is activated. Thank you.",
//                 "metadata": "",
//                 "createdAt": "2023-10-25T16:12:02.858+01:00",
//                 "updatedAt": "2023-10-25T16:12:02.859+01:00",
//                 "adminMessage": "Michael investment request was approved."
//             },
//             {
//                 "id": "f328b32d-7474-48b1-9763-5a4770f4330d",
//                 "investmentId": "c85a3057-43ff-4ff9-8a93-3a379a229c69",
//                 "userId": "2347033680599",
//                 "walletId": "7033680599",
//                 "action": "investment approval request",
//                 "message": "Michael, your investment request has been sent for approval, please wait while the investment is approved. Thank you.",
//                 "metadata": "",
//                 "createdAt": "2023-10-25T15:57:05.562+01:00",
//                 "updatedAt": "2023-10-25T15:57:05.562+01:00",
//                 "adminMessage": "Michael, investment request was sent for approval."
//             },
//             {
//                 "id": "b264a4ad-041d-41b1-b025-989507d47d95",
//                 "investmentId": "c85a3057-43ff-4ff9-8a93-3a379a229c69",
//                 "userId": "2347033680599",
//                 "walletId": "7033680599",
//                 "action": "investment request approval created",
//                 "message": "Michael ,your investment request approval record has just been created.",
//                 "metadata": "request type : start_investment",
//                 "createdAt": "2023-10-25T15:57:05.551+01:00",
//                 "updatedAt": "2023-10-25T15:57:05.552+01:00",
//                 "adminMessage": "Michael investment request approval record was created."
//             },
//             {
//                 "id": "573b01a3-7b21-4299-95c1-2309eecc5a24",
//                 "investmentId": "c85a3057-43ff-4ff9-8a93-3a379a229c69",
//                 "userId": "2347033680599",
//                 "walletId": "7033680599",
//                 "action": "investment initiated",
//                 "message": "Michael, you just initiated an investment.",
//                 "metadata": "duration: 2",
//                 "createdAt": "2023-10-25T15:57:05.510+01:00",
//                 "updatedAt": "2023-10-25T15:57:05.536+01:00",
//                 "adminMessage": "Michael, just initiated an investment."
//             }
//         ],
//         "approvals": [
//             {
//                 "id": "36a4de32-94ef-4a4a-aaa0-fc411c912ea1",
//                 "walletId": "7033680599",
//                 "userId": "2347033680599",
//                 "investmentId": "c85a3057-43ff-4ff9-8a93-3a379a229c69",
//                 "requestType": "start_investment",
//                 "approvalStatus": "approved",
//                 "assignedTo": "tola ola",
//                 "processedBy": "tola ola",
//                 "createdAt": "2023-10-25T15:57:05.542+01:00",
//                 "updatedAt": "2023-10-25T16:12:01.261+01:00",
//                 "rfiCode": "apmfb",
//                 "approvedBy": "tola ola",
//                 "email": "etolani152@stu.ui.edu.ng"
//             },
//             {
//                 "id": "a0792c81-1001-4ff1-940c-2c7f56dbcea4",
//                 "walletId": "7033680599",
//                 "userId": "2347033680599",
//                 "investmentId": "c85a3057-43ff-4ff9-8a93-3a379a229c69",
//                 "requestType": "payout_investment",
//                 "approvalStatus": "pending",
//                 "assignedTo": "",
//                 "processedBy": "",
//                 "createdAt": "2023-10-25T15:57:05.558+01:00",
//                 "updatedAt": "2023-10-25T15:57:05.558+01:00",
//                 "rfiCode": "apmfb",
//                 "approvedBy": null,
//                 "email": null
//             }
//         ]
//     }
// ];

// const filteredData = filterArrayByCriteria(data, timestamp, limit);
// console.log(filteredData);


