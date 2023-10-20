/* eslint-disable prettier/prettier */
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import SettingServices from "App/Services/SettingsServices";
import Event from "@ioc:Adonis/Core/Event";
import CreateSettingValidator from "App/Validators/CreateSettingValidator";
import { SettingType } from "App/Services/types/setting_type";
import UpdateSettingValidator from "App/Validators/UpdateSettingValidator";
import MessageQueuesServices from "App/Services/MessageQueuesServices";
import {esClient} from 'App/Services/elasticsearch';
// const { Client } = require('@elastic/elasticsearch');
// const Env = require("@ioc:Adonis/Core/Env");
// const ELASTICSEARCH_HOST = Env.get("ELASTICSEARCH_HOST");
// const ELASTICSEARCH_PORT = Env.get("ELASTICSEARCH_PORT");

export default class SettingsController {

//   public async index({ request, response }: HttpContextContract) {

//     console.log("setting query: ", request.qs());
//     const settingsService = new SettingServices();
//     const settings = await settingsService.getSettings(request.qs());
// // 
//     const query = request.qs();
//     debugger
//     const esClientInstance = new Client({ node: `${ELASTICSEARCH_HOST}:${ELASTICSEARCH_PORT}` });
//     debugger
//     // const esClientInstance = await esClient();
//     // debugger
//     const results = await esClientInstance.search({ index: 'my_setting_index', body: { query } });
//        console.log("elastic search results",results)
//     debugger
//     return response.status(200).json({
//       status: "OK",
//       data: settings
//     });
//   }

  // import { esClient } from 'App/Services/elasticsearch';


  public async index({ request, response }: HttpContextContract) {
    console.log("setting query: ", request.qs());
    const settingsService = new SettingServices();
    const settings = await settingsService.getSettings(request.qs());
    // const query = request.qs();
    // const esClientInstance = await esClient();
    // debugger
    // const results = await esClientInstance.search({ index: 'my_setting_index', body: { query } });
    // debugger
    // console.log("elastic search results", results);
    const totalCount = settings!.length;
    return response.status(200).json({
      status: "OK",
      data: settings,
      totalCount:totalCount,
    });
  }

  public async indexWithElasticSearch({ request, response }: HttpContextContract) {
    console.log("setting query: ", request.qs());
    const settingsService = new SettingServices();
    const settings = await settingsService.getSettings(request.qs());
    const query = request.qs();
    const esClientInstance = await esClient();
    debugger
    const results = await esClientInstance.search({ index: 'my_setting_index', body: { query } });
    debugger
    console.log("elastic search results", results);
    return response.status(200).json({
      status: "OK",
      data: settings
    });
  }
  // 168605200474015


  public async store({ request, response }: HttpContextContract) {

    try {
      await request.validate(CreateSettingValidator);
      const settingsService = new SettingServices();
      const { rfiName, rfiCode, rfiImageUrl, currencyCode, isPayoutAutomated, fundingSourceTerminal,
        investmentWalletId, payoutWalletId, isInvestmentAutomated, isRolloverAutomated, tagName,
        initiationNotificationEmail,activationNotificationEmail,maturityNotificationEmail,payoutNotificationEmail,
        rolloverNotificationEmail, liquidationNotificationEmail, isAllPayoutSuspended, isAllRolloverSuspended, liquidationPenalty } = request.body();
      const payload: SettingType = {
        rfiName: rfiName,
        rfiCode: rfiCode,
        rfiImageUrl: rfiImageUrl,
        isPayoutAutomated: isPayoutAutomated,
        investmentWalletId: investmentWalletId,
        payoutWalletId: payoutWalletId,
        isInvestmentAutomated: isInvestmentAutomated,
        isRolloverAutomated: isRolloverAutomated,
        fundingSourceTerminal: fundingSourceTerminal,
        // investmentType: investmentType,
        tagName: tagName,
        currencyCode: currencyCode,
        initiationNotificationEmail: initiationNotificationEmail,
        activationNotificationEmail: activationNotificationEmail,
        maturityNotificationEmail: maturityNotificationEmail,
        payoutNotificationEmail: payoutNotificationEmail,
        rolloverNotificationEmail: rolloverNotificationEmail,
        liquidationNotificationEmail: liquidationNotificationEmail,
        isAllPayoutSuspended: isAllPayoutSuspended,
        isAllRolloverSuspended: isAllRolloverSuspended,
        liquidationPenalty: liquidationPenalty,
      }
      const setting = await settingsService.createSetting(payload);

      // Send setting Creation Message to Queue
      Event.emit("new:setting", {
        id: setting.id,
        extras: setting
      });
      // const RfiRecordsService = new RfiRecordsServices()
      // debugger
      // // Emit event to ServicAccount Service 
      // if (setting) {
      //   const { id,
      //     rfiName,
      //     rfiCode,
      //     investmentWalletId,
      //     payoutWalletId, } = setting;
      //   const rfiRecord = await RfiRecordsService.getRfiRecordByRfiRecordRfiCode(rfiCode);
      //   if (setting.investmentWalletId) {
      //     console.log("setting.investmentWalletId ", setting.investmentWalletId)
      //     const serviceAccount: ServiceAccountType = {
      //       accountNumber: investmentWalletId,//"2056750534",
      //       id: id, //"7a427ed5-8f6a-4349-acd7-875d74a38329",
      //       // @ts-ignore
      //       rfiId: rfiRecord?.id,//"9d72e2a1-c7d2-41a1-9d99-6430019596a5",
      //       name: rfiName,//"Investment Deposit Wallet Service Account",
      //       accountName: rfiName,//"Astra polaris",
      //       bfiCode: rfiCode, //"apmfb",
      //       bfiName: rfiName,//"Astra Polaris",
      //       rfiCode: rfiCode,//"ASD",
      //       customerReference: `investmentWalletId_${id}`,//"123456",
      //       serviceName: "Investment Service",
      //       serviceDescription: "Investment service",
      //       serviceAccountDescription: "description",
      //       // createdAt: "2023-05-08T12:13:48.115+00:00",
      //       // updatedAt: "2023-05-08T12:24:40.358+00:00"
      //     }
      //     debugger
      //     Event.emit('service_account::send_service_account', {
      //       action: "Service Account persist",
      //       serviceAccount: serviceAccount
      //     });
      //     debugger
      //   }

      //   if (setting.payoutWalletId) {
      //     console.log("setting.payoutWalletId ", setting.payoutWalletId)
      //     const serviceAccount: ServiceAccountType = {
      //       accountNumber: payoutWalletId,//"2056750534",
      //       id: id, //"7a427ed5-8f6a-4349-acd7-875d74a38329",
      //       // @ts-ignore
      //       rfiId: rfiRecord?.id,//"9d72e2a1-c7d2-41a1-9d99-6430019596a5",
      //       name: rfiName,//"Investment Deposit Wallet Service Account",
      //       accountName: rfiName,//"Astra polaris",
      //       bfiCode: rfiCode, //"apmfb",
      //       bfiName: rfiName,//"Astra Polaris",
      //       rfiCode: rfiCode,//"ASD",
      //       customerReference: `payoutWalletId_${id}`,//"123456",
      //       serviceName: "Investment Service",
      //       serviceDescription: "Investment service",
      //       serviceAccountDescription: "description",
      //       // createdAt: "2023-05-08T12:13:48.115+00:00",
      //       // updatedAt: "2023-05-08T12:24:40.358+00:00"
      //     }
      //     debugger
      //     Event.emit('service_account::send_service_account', {
      //       action: "Service Account persist",
      //       serviceAccount: serviceAccount

      //     });
      //     debugger
      //   }
      // }
      return response.json({ status: "OK", data: setting });
    } catch (error) {
      // console.log("Error line 55", error.messages);
      // console.log("Error line 56", error.message);
      // return response.status(400).json({
      //     status: "FAILED",
      //     message: error.messages,
      //     // extraInfo: error.sqlMessage
      // });
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
      await request.validate(UpdateSettingValidator);
      const settingsService = new SettingServices();
      const { id } = request.params();
      const { rfiName, rfiCode, rfiImageUrl, currencyCode, isPayoutAutomated, fundingSourceTerminal,
        investmentWalletId, payoutWalletId, isInvestmentAutomated, isRolloverAutomated, tagName, initiationNotificationEmail,
        activationNotificationEmail, maturityNotificationEmail, payoutNotificationEmail, rolloverNotificationEmail,
        liquidationNotificationEmail, isAllPayoutSuspended, isAllRolloverSuspended, liquidationPenalty } = request.body();
      const payload: SettingType = {
        rfiName: rfiName,
        rfiCode: rfiCode,
        rfiImageUrl: rfiImageUrl,
        isPayoutAutomated: isPayoutAutomated,
        investmentWalletId: investmentWalletId,
        payoutWalletId: payoutWalletId,
        isInvestmentAutomated: isInvestmentAutomated,
        isRolloverAutomated: isRolloverAutomated,
        fundingSourceTerminal: fundingSourceTerminal,
        // investmentType: investmentType,
        tagName: tagName,
        currencyCode: currencyCode,
        initiationNotificationEmail: initiationNotificationEmail,
        activationNotificationEmail: activationNotificationEmail,
        maturityNotificationEmail: maturityNotificationEmail,
        payoutNotificationEmail: payoutNotificationEmail,
        rolloverNotificationEmail: rolloverNotificationEmail,
        liquidationNotificationEmail: liquidationNotificationEmail,
        isAllPayoutSuspended: isAllPayoutSuspended,
        isAllRolloverSuspended: isAllRolloverSuspended,
        liquidationPenalty: liquidationPenalty,
      }
      // console.log("Request body validation line 100", payload);
      // get setting by id
      const selectedSetting = await settingsService.getSettingBySettingId(id);
      // console.log(" Selected Setting ==============================");
      // console.log(selectedSetting)
      if (!selectedSetting) {
        throw new Error(`Setting with Id: ${id} does not exist, please check and try again.`);
      }
      // if (tagName) {
      //     // check if tag name is existing
      //     const settingTagNameExist = await settingsService.getSettingBySettingTagName(tagName);
      //     console.log(" settingTagNameExist ==============================");
      //     console.log(settingTagNameExist)
      //     if (settingTagNameExist !== null && settingTagNameExist!.id !== id) {
      //         // throw Error(`Setting Tag Name: ${tagName} already exists.`)
      //         console.log(`Setting Tag Name: ${tagName} already exists.`)
      //         return;
      //     }
      // }
      const setting = await settingsService.updateSetting(selectedSetting, payload);
      debugger
      // console.log("Setting updated: ", setting);
      // send to user
      return response.json({
        status: "OK",
        data: setting
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

  public async createRfiRecord({ request, response }: HttpContextContract) {
    try {
      
      const MessageQueuesService = new MessageQueuesServices()
           const content = request.body();
      const newRfiRecord = await MessageQueuesService.createRfiRecord(content);
      // console.log("newRfiRecord line 68 ===== ", newRfiRecord)
      if (!newRfiRecord) {
        throw Error();
      }
  
      return response.json({
        status: "OK",
        data: newRfiRecord
      });
    } catch (error) {
      // console.log("Error line 103", error.messages);
      // console.log("Error line 104", error.message);
      // return response.status(400).json({
      //     status: "FAILED",
      //     message: error.messages,
      //     hint: error.message,
      //     // extraInfo: error.sqlMessage
      // });
      console.log("Error line 211", error.messages);
      console.log("Error line 212", error.message);
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
  public async createRfiRecordSetting({ request, response }: HttpContextContract) {
    try {
          const MessageQueuesService = new MessageQueuesServices()
      const content = request.body();
      const { investment } = content;
      const newRfiRecordSetting = await MessageQueuesService.createRfiRecordSetting(investment);
      // console.log("newRfiRecordSetting line 259 ===== ", newRfiRecordSetting)
      if (!newRfiRecordSetting) {
        throw Error();
      }
          // send to user
      return response.json({
        status: "OK",
        data: newRfiRecordSetting
      });
    } catch (error) {
          console.log("Error line 291", error.messages);
      console.log("Error line 292", error.message);
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
      const { id } = request.qs();
      const settingsService = new SettingServices();
      console.log("Setting query: ", request.qs());
      // get setting by id
      const selectedSetting = await settingsService.getSettingBySettingId(id);
      // console.log(" Selected Setting ==============================");
      // console.log(selectedSetting)

      if (selectedSetting === null || selectedSetting === undefined) {
        // throw Error(`Setting with id: ${id} does not exist.`)
        console.log(`Setting with id: ${id} does not exist.`)
        return;
      }

      const setting = await settingsService.deleteSetting(selectedSetting);
      // console.log("Deleted data:", setting);
      return response.json({
        status: "OK",
        data: { isDeleted: setting?.$isDeleted }
      });
      // .send("Setting Deleted.");
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
