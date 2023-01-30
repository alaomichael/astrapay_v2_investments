import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import RfiRecordServices from "App/Services/RfiRecordsServices";
import Event from "@ioc:Adonis/Core/Event";
import CreateRfiRecordValidator from "App/Validators/CreateRfiRecordValidator";
import { RfiRecordType } from "App/Services/types/rfirecord_type";
import UpdateRfiRecordValidator from "App/Validators/UpdateRfiRecordValidator";
import RfiRecordsServices from "App/Services/RfiRecordsServices";

export default class RfiRecordsController {

    public async index({ request, response }: HttpContextContract) {

        console.log("rfirecord query: ", request.qs());
        const rfirecordsService = new RfiRecordServices();
        const rfirecords = await rfirecordsService.getRfiRecords(request.qs());
        return response.status(200).json({
            status: "OK",
            data: rfirecords
        });
    }
    
    public async showByExternalRfiRecordId({ params, request, response, }: HttpContextContract) {
        console.log("RfiRecord params: ", params);
        const { externalRfiRecordId } = request.params();
        console.log("RfiRecord params externalRfiRecordId: ", externalRfiRecordId);
        try {
            const rfiRecordsService = new RfiRecordsServices();
            // let rfiRecord = await RfiRecord.query().where({ id: externalRfiRecordId }).preload("timelines", (query) => {query.orderBy("createdAt", "desc"); }).first();
            let rfiRecord = await rfiRecordsService.getRfiRecordByExternalRfiRecordId(externalRfiRecordId);
            if (!rfiRecord) return response.json({ status: "FAILED", data: [] });
            return response
                .status(200)
                .json({ status: "OK", data: rfiRecord });
        } catch (error) {
            console.log("Error line 51", error.messages);
            console.log("Error line 52", error.message);
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

    public async showByRfiRecordId({ params, request, response, }: HttpContextContract) {
        console.log("RfiRecord params: ", params);
        const { rfiRecordId } = request.params();
        console.log("RfiRecord params rfiRecordId: ", rfiRecordId);
        try {
            const rfiRecordsService = new RfiRecordsServices();
            // let rfiRecord = await RfiRecord.query().where({ id: rfiRecordId }).preload("timelines", (query) => {query.orderBy("createdAt", "desc"); }).first();
            let rfiRecord = await rfiRecordsService.getRfiRecordByRfiRecordId(rfiRecordId);
            if (!rfiRecord) return response.json({ status: "FAILED", data: [] });
            return response
                .status(200)
                .json({ status: "OK", data: rfiRecord });
        } catch (error) {
            console.log("Error line 51", error.messages);
            console.log("Error line 52", error.message);
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

    public async store({ request, response }: HttpContextContract) {

        try {
            await request.validate(CreateRfiRecordValidator);
            const rfirecordsService = new RfiRecordServices();
            const { externalRfiRecordId,rfiName, rfiCode, phone, phone2,//generalVerificationRequirementId,// phone2,
                email, website, slogan, imageUrl, address, } = request.body();
            const payload: RfiRecordType = {
                externalRfiRecordId: externalRfiRecordId,
                rfiName: rfiName,
                rfiCode: rfiCode,
                phone: phone,
                phone2: phone2,
                email: email,
                website: website,
                slogan: slogan,
                imageUrl: imageUrl,
                address: address,
                // otherInformation: otherInformation,
                // generalVerificationRequirementId: generalVerificationRequirementId,
            }
            const rfirecord = await rfirecordsService.createRfiRecord(payload);

            // Send rfirecord Creation Message to Queue
            Event.emit("new:rfirecord", {
                id: rfirecord.id,
                extras: rfirecord
            });
            return response.json({ status: "OK", data: rfirecord });
        } catch (error) {
            console.log("Error line 55", error.messages);
            console.log("Error line 56", error.message);
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

    public async update({ request, response }: HttpContextContract) {
        try {
            await request.validate(UpdateRfiRecordValidator);
            const rfirecordsService = new RfiRecordServices();
            const { id } = request.params();
            const { externalRfiRecordId,rfiName, rfiCode, phone, phone2,//generalVerificationRequirementId,    // phone2,
                email, website, slogan, imageUrl, address, //otherInformation, 
            } = request.body();
            const payload: RfiRecordType = {
                externalRfiRecordId: externalRfiRecordId,
                rfiName: rfiName,
                rfiCode: rfiCode,
                phone: phone,
                phone2: phone2,
                email: email,
                website: website,
                slogan: slogan,
                imageUrl: imageUrl,
                address: address,
                // otherInformation: otherInformation,
                // generalVerificationRequirementId: generalVerificationRequirementId,
            }
            console.log("Request body validation line 104", payload);
            // debugger
            // get rfirecord by id
            const selectedRfiRecord = await rfirecordsService.getRfiRecordByRfiRecordId(id);
            console.log(" Selected RfiRecord ==============================");
            console.log(selectedRfiRecord)
            if (!selectedRfiRecord) {
                throw new Error(`RfiRecord with Id: ${id} does not exist, please check and try again.`);
            }
            // if (tagName) {
            //     // check if tag name is existing
            //     const rfirecordTagNameExist = await rfirecordsService.getRfiRecordByRfiRecordTagName(tagName);
            //     console.log(" rfirecordTagNameExist ==============================");
            //     console.log(rfirecordTagNameExist)
            //     if (rfirecordTagNameExist !== null && rfirecordTagNameExist!.id !== id) {
            //         // throw Error(`RfiRecord Tag Name: ${tagName} already exists.`)
            //         console.log(`RfiRecord Tag Name: ${tagName} already exists.`)
            //         return;
            //     }
            // }
            const rfirecord = await rfirecordsService.updateRfiRecord(selectedRfiRecord, payload);
            console.log("RfiRecord updated: ", rfirecord);
            // send to user
            return response.json({
                status: "OK",
                data: rfirecord
            });
        } catch (error) {
            console.log("Error line 111", error.messages);
            console.log("Error line 112", error.message);
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

    public async destroy({ request, response }: HttpContextContract) {
        try {
            const { id } = request.params();
            const rfirecordsService = new RfiRecordServices();
            console.log("RfiRecord query: ", request.qs());
            // get rfirecord by id
            const selectedRfiRecord = await rfirecordsService.getRfiRecordByRfiRecordId(id);
            console.log(" Selected RfiRecord ==============================");
            console.log(selectedRfiRecord)

            if (selectedRfiRecord === null || selectedRfiRecord === undefined) {
                // throw Error(`RfiRecord with id: ${id} does not exist.`)
                console.log(`RfiRecord with id: ${id} does not exist.`)
                return;
            }

            const rfirecord = await rfirecordsService.deleteRfiRecord(selectedRfiRecord);
            console.log("Deleted data:", rfirecord);
            return response.json({
                status: "OK",
                data: { isDeleted: rfirecord?.$isDeleted }
            });
            // .send("RfiRecord Deleted.");
        }
        catch (error) {
            console.log("Error line 147", error.messages);
            console.log("Error line 148", error.message);
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
}
