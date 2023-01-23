// // import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

// export default class TypesController {}

import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Type from "App/Models/Type";
import CreateTypeValidator from "App/Validators/CreateTypeValidator";
import { TypeType } from "App/Services/types/type_type";
import TypesServices from "App/Services/TypesServices";
import UpdateTypeValidator from "App/Validators/UpdateTypeValidator";
import AppException from "App/Exceptions/AppException";
import TenuresServices from "App/Services/TenuresServices";
// const Env = require("@ioc:Adonis/Core/Env");
// const SUPER_ADMIN_EMAIL_ADDRESS = Env.get("SUPER_ADMIN_EMAIL_ADDRESS");
// import { sendNotification } from "App/Helpers/sendNotification";
import { sendNotificationWithoutPdf } from "App/Helpers/sendNotificationWithoutPdf";

export default class TypesController {
    public async index({ params, request, response }: HttpContextContract) {
        try {
            const typesService = new TypesServices();
            let typeArray: any[] = [];
            console.log("Types params: ", params);
            // const { walletId, accountOpeningId, requestType, approvalStatus, remark } = request.qs();
            console.log("Types query: ", request.qs());
            let { limit } = request.qs();
            // if (!limit) throw new Error("Limit query parameter is required for this request.");
            const type = await typesService.getTypes(request.qs()); // Type.all();
            let sortedTypes = type;
            console.log("type line 29 ===================");
            console.log(type);
            if (limit) {
                sortedTypes = sortedTypes.slice(0, Number(limit));
            }
            if (sortedTypes.length < 1) {
                return response.status(200).json({
                    status: "FAILED",
                    message: "no type request matched your search",
                    data: [],
                });
            }
            for (let index = 0; index < sortedTypes.length; index++) {
                const type = sortedTypes[index];
                console.log("type line 89 ===================");
                console.log(type);
                // let typeWithOtherDetails = {
                //     ...type.$original,
                //     // accountOpeningDetails: accountOpening.$original
                // };
                // console.log("typeWithOtherDetails line 58 ===================");
                // console.log(typeWithOtherDetails);
                // typeArray.push(typeWithOtherDetails);
                typeArray.push(type);
                // console.log("typeArray line 61 ===================");
                // console.log(typeArray);
            }

            return response.status(200).json({
                status: "OK",
                data: typeArray,
                // data: sortedTypes.map((type) => type.$original),
            });
        } catch (error) {
            console.log("Error line 69", error.messages);
            console.log("Error line 70", error.message);
            if (error.code === 'E_APP_EXCEPTION') {
                console.log(error.codeSt)
                let statusCode = error.codeSt ? error.codeSt : 500
                return response.status(parseInt(statusCode)).json({
                    status: "FAILED",
                    message: error.messages,
                    hint: error.message
                });
            }
            return response.status(500).json({
                status: "FAILED",
                message: error.messages,
                hint: error.message
            });
        }
    }



    public async showByTypeId({ params, request, response, }: HttpContextContract) {
        console.log("Type params: ", params);
        const { typeId } = request.params();
        console.log("Type params typeId: ", typeId);
        try {
            const typesService = new TypesServices();
            // let type = await Type.query().where({ id: typeId }).preload("timelines", (query) => {query.orderBy("createdAt", "desc"); }).first();
            let type = await typesService.getTypeByTypeId(typeId);
            if (!type) return response.json({ status: "FAILED", data: [] });
            // let updatedResponseWithType = {
            //     ...type.$original,
            //     // @ts-ignore
            //     // verificationRecords: type.$preloaded.verificationRecords.map(
            //     //     (verificationRecord) => verificationRecord.$original
            //     // ),
            // };
            // debugger
            return response
                .status(200)
                .json({ status: "OK", data: type });
        } catch (error) {
            console.log("Error line 101", error.messages);
            console.log("Error line 103", error.message);
            if (error.code === 'E_APP_EXCEPTION') {
                console.log(error.codeSt)
                let statusCode = error.codeSt ? error.codeSt : 500
                return response.status(parseInt(statusCode)).json({
                    status: "FAILED",
                    message: error.messages,
                    hint: error.message
                });
            }
            return response.status(500).json({
                status: "FAILED",
                message: error.messages,
                hint: error.message
            });
        }
    }

    public async store({ request, response, loginUserData }: HttpContextContract) {
        try {
            await request.validate(CreateTypeValidator);
            const typesService = new TypesServices()
            const tenuresService = new TenuresServices();

            const { rfiRecordId, typeName, quantityIssued, quantityAvailableForIssue, availableTypes, currencyCode, isAutomated,
                features, requirements, lng, lat, tagName, rfiCode, status, createdBy, lowestAmount, highestAmount, duration,
                interestRate, isRolloverAllowed, minimumAllowedPeriodOfInvestment, maximumAllowedPeriodOfInvestment, description } = request.body();
            const payload: TypeType = {
                rfiRecordId: rfiRecordId,
                typeName: typeName,
                quantityIssued: quantityIssued,
                quantityAvailableForIssue: quantityAvailableForIssue,
                availableTypes: availableTypes,
                currencyCode: currencyCode,
                isAutomated: isAutomated,
                features: features,
                requirements: requirements,
                lng: lng,
                lat: lat,
                tagName: tagName,
                rfiCode: rfiCode,
                // remark: remark,
                status: status,
                createdBy: createdBy,
                lowestAmount: lowestAmount,
                highestAmount: highestAmount,
                description: description,
                interestRate: interestRate,
                isRolloverAllowed: isRolloverAllowed,
                minimumAllowedPeriodOfInvestment: minimumAllowedPeriodOfInvestment,
                maximumAllowedPeriodOfInvestment: maximumAllowedPeriodOfInvestment,
            }
// debugger
            // TODO: Uncomment to use LoginUserData
            console.log("loginUserData  ==================", loginUserData)
            // // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
            // if (!loginUserData) throw new AppException({ message: `Unauthorized to access this resource.`, codeSt: "401" })
            // console.log(" Login User Data line 131 =========================");
            // console.log(loginUserData);
            // console.log(" Login User Roles line 133 =========================");
            // console.log(loginUserData.roles);
            // let { roles, biodata } = loginUserData;

            // console.log("Admin roles , line 137 ==================")
            // console.log(roles)
            // // @ts-ignore
            // let { fullName } = biodata;
            // let loginAdminFullName = fullName;
            // console.log("Login Admin FullName, line 142 ==================")
            // console.log(loginAdminFullName)
            // payload.createdBy = createdBy !== undefined ? createdBy : loginAdminFullName;
            payload.createdBy = createdBy !== undefined ? createdBy : "loginAdminFullName";
            const type = await typesService.createType(payload);
            // console.log("New type details, line 146 =========");
            // console.log(type);
            const tenures = duration;
            console.log("The new investment type:", type);
            console.log("A New Type has been Created.");
            // create type tenure/duration
            const typeTenure = await tenuresService.createTenure(tenures, type.id);
            console.log("The new investment tenure:", typeTenure);

            return response
                .status(201)
                .json({
                    status: "OK",
                    data: type//.$original 
                });
        } catch (error) {
            console.log("Error line 155 ==========================================");
            console.error(error);
            // return response.status(404).json({
            //     status: "FAILED",
            //     message: "your type creation request was not successful, please try again.",
            // });
            console.log("Error line 161", error.messages);
            console.log("Error line 162", error.message);
            if (error.code === 'E_APP_EXCEPTION') {
                console.log(error.codeSt)
                let statusCode = error.codeSt ? error.codeSt : 500
                return response.status(parseInt(statusCode)).json({
                    status: "FAILED",
                    message: error.messages,
                    hint: error.message
                });
            }
            return response.status(500).json({
                status: "FAILED",
                message: error.messages,
                hint: error.message
            });

        }
    }

    public async show({ request, response, loginUserData }: HttpContextContract) {
        try {
            const typesService = new TypesServices()
            const { typeId, } = request.params();
            console.log("Type query: ", request.qs());
            // check if the request is not existing
            let type;
            let typeRequestIsExisting = await typesService.getTypeByTypeId(typeId)
            console.log("Existing Type Request details: ", typeRequestIsExisting);
            if (!typeRequestIsExisting) {
                //    return error message to user
                // throw new Error(`Type Request with Id: ${id} does not exist, please check and try again.`);
                throw new AppException({ message: `Type Request with Id: ${typeId} does not exist, please check and try again.`, codeSt: "404" })
            }
            console.log(" Login User Data line 179 =========================");
            console.log(loginUserData);
            // TODO: Uncomment to use LoginUserData
            // // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
            // if (!loginUserData) throw new AppException({ message: `Unauthorized to access this resource.`, codeSt: "401" })
            // console.log(" Login User Data line 201 =========================");
            // console.log(loginUserData);
            // console.log(" Login User Roles line 203 =========================");
            // console.log(loginUserData.roles);
            // let { roles, biodata } = loginUserData;

            // console.log("Admin roles , line 207 ==================")
            // console.log(roles)
            // // @ts-ignore
            // let { fullName } = biodata;
            // let loginAdminFullName = fullName;
            // console.log("Login Admin FullName, line 212 ==================")
            // console.log(loginAdminFullName)
            type = typeRequestIsExisting //await typesService.getTypeByTypeId(id);
            console.log(" QUERY RESULT: ", type);
            if (!type) {
                return response
                    .status(404)
                    .json({ status: "FAILED", message: "Not Found,try again." });
            } else if (type) {
                console.log("Type Selected for Update line 221:", type);
                return response
                    .status(200)
                    .json({
                        status: "OK",
                        data: type//.map((inv) => inv.$original),
                    });
            }
        } catch (error) {
            console.log("Error line 230", error.messages);
            console.log("Error line 231", error.message);
            if (error.code === 'E_APP_EXCEPTION') {
                console.log(error.codeSt)
                let statusCode = error.codeSt ? error.codeSt : 500
                return response.status(parseInt(statusCode)).json({
                    status: "FAILED",
                    message: error.messages,
                    hint: error.message
                });
            }
            return response.status(500).json({
                status: "FAILED",
                message: error.messages,
                hint: error.message
            });

        }

    }

    public async update({ request, response, loginUserData }: HttpContextContract) {
        try {
            await request.validate(UpdateTypeValidator);
            const typesService = new TypesServices()
            const tenuresService = new TenuresServices();
            const { typeId, } = request.params();
            console.log("Type query: ", request.qs());
            // check if the request is not existing
            let type;
            let typeRequestIsExisting = await typesService.getTypeByTypeId(typeId)
            console.log("Existing Type Request details: ", typeRequestIsExisting);
            if (!typeRequestIsExisting) {
                //    return error message to user
                // throw new Error(`Type Request with Id: ${id} does not exist, please check and try again.`);
                throw new AppException({ message: `Type Request with Id: ${typeId} does not exist, please check and try again.`, codeSt: "404" })
            }
            console.log(" Login User Data line 248 =========================");
            console.log(loginUserData);
            // TODO: Uncomment to use LoginUserData
            // // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
            // if (!loginUserData) throw new AppException({ message: `Unauthorized to access this resource.`, codeSt: "401" })
            // console.log(" Login User Data line 967 =========================");
            // console.log(loginUserData);
            // console.log(" Login User Roles line 969 =========================");
            // console.log(loginUserData.roles);
            // let { roles, biodata } = loginUserData;

            // console.log("Admin roles , line 973 ==================")
            // console.log(roles)
            // // @ts-ignore
            // let { fullName } = biodata;
            // let loginAdminFullName = fullName;
            // console.log("Login Admin FullName, line 978 ==================")
            // console.log(loginAdminFullName)
            type = typeRequestIsExisting //await typesService.getTypeByTypeId(id);
            console.log(" QUERY RESULT: ", type);
            if (!type) {
                return response
                    .status(404)
                    .json({ status: "FAILED", message: "Not Found,try again." });
            } else if (type) {
                console.log("Type Selected for Update line 273:", type);
                let formerTypeTenures;
                const { rfiRecordId, typeName, quantityIssued, quantityAvailableForIssue, availableTypes, currencyCode, isAutomated,
                    features, requirements, lng, lat, tagName, rfiCode, status, createdBy, lowestAmount, highestAmount, duration, description,
                    interestRate, isRolloverAllowed, minimumAllowedPeriodOfInvestment, maximumAllowedPeriodOfInvestment, } = request.body();
                const payload: TypeType = {
                    rfiRecordId: rfiRecordId,
                    typeName: typeName,
                    quantityIssued: quantityIssued,
                    quantityAvailableForIssue: quantityAvailableForIssue,
                    availableTypes: availableTypes,
                    currencyCode: currencyCode,
                    isAutomated: isAutomated,
                    features: features,
                    requirements: requirements,
                    lng: lng,
                    lat: lat,
                    tagName: tagName,
                    rfiCode: rfiCode,
                    status: status,
                    createdBy: createdBy,
                    lowestAmount: lowestAmount,
                    highestAmount: highestAmount,
                    description: description,
                    interestRate: interestRate,
                    isRolloverAllowed: isRolloverAllowed,
                    minimumAllowedPeriodOfInvestment: minimumAllowedPeriodOfInvestment,
                    maximumAllowedPeriodOfInvestment: maximumAllowedPeriodOfInvestment,
                }

                // update the data
                // TODO: Uncomment to use loginAdminFullName
                // payload.createdBy = createdBy !== undefined ? createdBy : loginAdminFullName;
                // payload.processedBy = processedBy !== undefined ? processedBy : loginAdminFullName;
                // payload.assignedTo = assignedTo !== undefined ? assignedTo : loginAdminFullName;
                // payload.remark = remark !== undefined ? remark : type.remark;
                // Former Type Details
                // let formerTypeName = type.typeName;
                // let formerTypeTagName = type.tagName;
                // let formerTypeDescription = type.description;
                // let formerTypeCurrencyCode = type.currencyCode;
                // // let formerTypeFixedCharge = type.fixedCharge;
                // // let formerTypeRatedCharge = type.ratedCharge;
                // let formerTypeLowestAmount = type.lowestAmount;
                // let formerTypeHighestAmount = type.highestAmount;
                // let formerTypeInterestRate = type.interestRate;
                // let formerTypeStatus = type.status;

                let typeTenure;
                if (duration) {
                    // delete all type tenure/duration
                    formerTypeTenures = await type.$preloaded.investmentTenures.map(
                        (tenure) => tenure.tenure
                        //.$original.tenure
                    );
                    console.log("Type tenure selected: ", formerTypeTenures);
                    // delete all type tenure/duration
                    const typeTenureDelete = tenuresService.deleteRelatedTenure(typeId);
                    console.log("Type tenure deleted: ", typeTenureDelete);
                    // create new type tenure/duration
                    typeTenure = tenuresService.createTenure(duration, typeId);
                    console.log("The new investment tenure:", typeTenure);
                }

                type = await typesService.updateType(type, payload);
                // console.log("Type updated: ", type);
                await type.save();
                console.log("Update Type Request line 317:", type);

                // Send Details to notification service
                // let email, firstName;
                //                 email = SUPER_ADMIN_EMAIL_ADDRESS;
                //                 firstName = "Super Admin";
                //                 let subject = "AstraPay Investment Type Updated";
                //                 let message = `
                //                 This is to inform you, that your investment type has been updated by "loginAdminFullName".
                //                 Former investment type details are as follows:

                //                 Type Name: ${formerTypeName}
                //                 Type Tag Name: ${formerTypeTagName}
                //                 Type Description: ${formerTypeDescription}
                //                 Type Currency Code: ${formerTypeCurrencyCode}
                //                 Type Lowest Amount: ${formerTypeLowestAmount}
                //                 Type Highest Amount: ${formerTypeHighestAmount}
                //                 Type Interest Rate: ${formerTypeInterestRate}
                //                 Type Status: ${formerTypeStatus}
                //                 Type Tenures: ${formerTypeTenures}

                // ================================================================**********=============================================================================**********=============================================================================
                //                 New Investment type details are as follows:

                //                 Type Name: ${type.typeName}
                //                 Type Tag Name: ${type.tagName}
                //                 Type Description: ${type.description}
                //                 Type Currency Code: ${type.currencyCode}
                //                 Type Lowest Amount: ${type.lowestAmount}
                //                 Type Highest Amount: ${type.highestAmount}
                //                 Type Interest Rate: ${type.interestRate}
                //                 Type Status: ${type.status}
                //                 Type Tenures: ${typeTenure}

                //                 Please check your investment type.

                //                 Thank you.

                //                 AstraPay Investment.`;
                // let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                // console.log("newNotificationMessage line 439:", newNotificationMessage);
                // if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                //     console.log("Notification sent successfully");
                // } else if (newNotificationMessage.message !== "Success") {
                //     console.log("Notification NOT sent successfully");
                //     console.log(newNotificationMessage);
                // }
                // Send Notification to admin and others stakeholder
                let messageKey = "investment_type_update";
                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, type.rfiCode, type,);
                // console.log("newNotificationMessage line 449:", newNotificationMessageWithoutPdf);
                // debugger
                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                    console.log("Notification sent successfully");
                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                    console.log("Notification NOT sent successfully");
                    console.log(newNotificationMessageWithoutPdf);
                }

                // send to user
                return response
                    .status(200)
                    .json({
                        status: "OK",
                        data: type//.map((inv) => inv.$original),
                    });
            }
        } catch (error) {
            console.log("Error line 327", error.messages);
            console.log("Error line 328", error.message);
            if (error.code === 'E_APP_EXCEPTION') {
                console.log(error.codeSt)
                let statusCode = error.codeSt ? error.codeSt : 500
                return response.status(parseInt(statusCode)).json({
                    status: "FAILED",
                    message: error.messages,
                    hint: error.message
                });
            }
            return response.status(500).json({
                status: "FAILED",
                message: error.messages,
                hint: error.message
            });
        }
    }

    public async updateInterestRate({ request, response, loginUserData }: HttpContextContract) {
        try {
            await request.validate(UpdateTypeValidator);
            const typesService = new TypesServices()
            // const tenuresService = new TenuresServices();
            const { typeId, } = request.params();
            console.log("Type query: ", request.qs());
            // check if the request is not existing
            let type;
            let typeRequestIsExisting = await typesService.getTypeByTypeId(typeId)
            // console.log("Existing Type Request details: ", typeRequestIsExisting);
            if (!typeRequestIsExisting) {
                //    return error message to user
                // throw new Error(`Type Request with Id: ${id} does not exist, please check and try again.`);
                throw new AppException({ message: `Type Request with Id: ${typeId} does not exist, please check and try again.`, codeSt: "404" })
            }
            console.log(" Login User Data line 502 =========================");
            console.log(loginUserData);
            // TODO: Uncomment to use LoginUserData
            // // if (!loginUserData) throw new Error(`Unauthorized to access this resource.`);
            // if (!loginUserData) throw new AppException({ message: `Unauthorized to access this resource.`, codeSt: "401" })
            // console.log(" Login User Data line 507 =========================");
            // console.log(loginUserData);
            // console.log(" Login User Roles line 509 =========================");
            // console.log(loginUserData.roles);
            // let { roles, biodata } = loginUserData;

            // console.log("Admin roles , line 513 ==================")
            // console.log(roles)
            // // @ts-ignore
            // let { fullName } = biodata;
            // let loginAdminFullName = fullName;
            // console.log("Login Admin FullName, line 518 ==================")
            // console.log(loginAdminFullName)
            type = typeRequestIsExisting //await typesService.getTypeByTypeId(id);
            console.log(" QUERY RESULT: ", type);
            if (!type) {
                return response
                    .status(404)
                    .json({ status: "FAILED", message: "Not Found,try again." });
            } else if (type) {
                console.log("Type Selected for Update line 273:", type);
                const { interestRate, } = request.body();
                // update the data
                // TODO: Uncomment to use loginAdminFullName
                // payload.createdBy = createdBy !== undefined ? createdBy : loginAdminFullName;
                // payload.processedBy = processedBy !== undefined ? processedBy : loginAdminFullName;
                // payload.assignedTo = assignedTo !== undefined ? assignedTo : loginAdminFullName;
                // payload.remark = remark !== undefined ? remark : type.remark;
                // Former Type Details
                // let formerTypeInterestRate = type.interestRate;
                // type = await typesService.updateType(type, payload);
                let updatedInterestRate = await typesService.updateTypeInterestRate(type, interestRate);
                // console.log("Type updated: ", type);
                // await type.save();
                console.log("Update Type Request line 541:", updatedInterestRate);
                // debugger
                // Send Details to notification service
                //                 let email, firstName;
                //                 email = SUPER_ADMIN_EMAIL_ADDRESS;
                //                 firstName = "Super Admin";
                //                 let subject = "AstraPay Investment Type Updated";
                //                 let message = `
                //                 This is to inform you, that your investment type INTEREST RATE has been updated by "loginAdminFullName".
                //                 Former investment type details are as follows:

                //                 Type Interest Rate: ${formerTypeInterestRate}

                // ================================================================**********=============================================================================**********=============================================================================
                //                 New Investment type details are as follows:

                //                 Type Interest Rate: ${type.interestRate}

                //                 Please check your investment type.

                //                 Thank you.

                //                 AstraPay Investment.`;
                //                 let newNotificationMessage = await sendNotification(email, subject, firstName, message);
                //                 // console.log("newNotificationMessage line 565:", newNotificationMessage);
                //                 if (newNotificationMessage.status == 200 || newNotificationMessage.message == "Success") {
                //                     console.log("Notification sent successfully");
                //                 } else if (newNotificationMessage.message !== "Success") {
                //                     console.log("Notification NOT sent successfully");
                //                     console.log(newNotificationMessage);
                //                 }
                // Send Notification to admin and others stakeholder
                let messageKey = "investment_type_update";
                let newNotificationMessageWithoutPdf = await sendNotificationWithoutPdf(messageKey, type.rfiCode, type,);
                // console.log("newNotificationMessage line 575:", newNotificationMessageWithoutPdf);
                // debugger
                if (newNotificationMessageWithoutPdf.status == "success" || newNotificationMessageWithoutPdf.message == "messages sent successfully") {
                    console.log("Notification sent successfully");
                } else if (newNotificationMessageWithoutPdf.message !== "messages sent successfully") {
                    console.log("Notification NOT sent successfully");
                    console.log(newNotificationMessageWithoutPdf);
                }

                // send to user
                return response
                    .status(200)
                    .json({
                        status: "OK",
                        data: type//.map((inv) => inv.$original),
                    });
            }
        } catch (error) {
            console.log("Error line 603", error.messages);
            console.log("Error line 604", error.message);
            if (error.code === 'E_APP_EXCEPTION') {
                console.log(error.codeSt)
                let statusCode = error.codeSt ? error.codeSt : 500
                return response.status(parseInt(statusCode)).json({
                    status: "FAILED",
                    message: error.messages,
                    hint: error.message
                });
            }
            return response.status(500).json({
                status: "FAILED",
                message: error.messages,
                hint: error.message
            });
        }
    }

    public async destroy({ params, request, response }: HttpContextContract) {
        try {
            // const { typeId } = request.qs();
            console.log("type query line 349 =============== : ", request.qs());
            const { typeId } = params;
            console.log("typeId for query line 351 =============== : ", typeId);
            let type = await Type.query().where({
                id: typeId,
            });
            console.log(" QUERY RESULT: ", type);

            if (type.length > 0) {
                type = await Type.query()
                    .where({ id: typeId })
                    .delete();
                console.log("Deleted data:", type);
                return response
                    .status(200)
                    .json({ status: "OK", message: "Type Deleted." });
            } else {
                return response
                    .status(404)
                    .json({ status: "FAILED", message: "Invalid parameters" });
            }
        } catch (error) {
            console.log(error);
            console.error(error.messages);
            return response.status(404).json({
                status: "FAILED",
                message: error.messages.errors,
            });
        }
    }
}

