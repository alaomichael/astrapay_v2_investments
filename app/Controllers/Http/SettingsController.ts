import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import SettingServices from "App/Services/SettingsServices";
import Event from "@ioc:Adonis/Core/Event";
import CreateSettingValidator from "App/Validators/CreateSettingValidator";
import { SettingType } from "App/Services/types/setting_type";
import UpdateSettingValidator from "App/Validators/UpdateSettingValidator";

export default class SettingsController {

  public async index({ request, response }: HttpContextContract) {

    console.log("setting query: ", request.qs());
    const settingsService = new SettingServices();
    const settings = await settingsService.getSettings(request.qs());
    return response.status(200).json({
      status: "OK",
      data: settings
    });
  }

  public async store({ request, response }: HttpContextContract) {

    try {
      await request.validate(CreateSettingValidator);
      const settingsService = new SettingServices();
      const { rfiName, rfiCode, rfiImageUrl, currencyCode,  isPayoutAutomated,
        investmentWalletId, payoutWalletId, isInvestmentAutomated, isRolloverAutomated, tagName, } = request.body();
      const payload: SettingType = {
        rfiName: rfiName,
        rfiCode: rfiCode,
        rfiImageUrl: rfiImageUrl,
        isPayoutAutomated: isPayoutAutomated,
        investmentWalletId: investmentWalletId,
        payoutWalletId: payoutWalletId,
        isInvestmentAutomated: isInvestmentAutomated,
        isRolloverAutomated: isRolloverAutomated,
        // investmentType: investmentType,
        tagName: tagName,
        currencyCode: currencyCode,
        
      }
      const setting = await settingsService.createSetting(payload);

      // Send setting Creation Message to Queue
      Event.emit("new:setting", {
        id: setting.id,
        extras: setting
      });
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
      const { rfiName, rfiCode, rfiImageUrl, currencyCode, isPayoutAutomated,
        investmentWalletId, payoutWalletId, isInvestmentAutomated, isRolloverAutomated, tagName, } = request.body();
      const payload: SettingType = {
        rfiName: rfiName,
        rfiCode: rfiCode,
        rfiImageUrl: rfiImageUrl,
        isPayoutAutomated: isPayoutAutomated,
        investmentWalletId: investmentWalletId,
        payoutWalletId: payoutWalletId,
        isInvestmentAutomated: isInvestmentAutomated,
        isRolloverAutomated: isRolloverAutomated,
        // investmentType: investmentType,
        tagName: tagName,
        currencyCode: currencyCode,
      }
      console.log("Request body validation line 100", payload);
      // get setting by id
      const selectedSetting = await settingsService.getSettingBySettingId(id);
      console.log(" Selected Setting ==============================");
      console.log(selectedSetting)
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
      console.log("Setting updated: ", setting);
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

  public async destroy({ request, response }: HttpContextContract) {
    try {
      const { id } = request.qs();
      const settingsService = new SettingServices();
      console.log("Setting query: ", request.qs());
      // get setting by id
      const selectedSetting = await settingsService.getSettingBySettingId(id);
      console.log(" Selected Setting ==============================");
      console.log(selectedSetting)

      if (selectedSetting === null || selectedSetting === undefined) {
        // throw Error(`Setting with id: ${id} does not exist.`)
        console.log(`Setting with id: ${id} does not exist.`)
        return;
      }

      const setting = await settingsService.deleteSetting(selectedSetting);
      console.log("Deleted data:", setting);
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
