import { types } from './../data/type';
import { rfiRecords } from './../data/rfiRecords';
import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import RfiRecord from 'App/Models/RfiRecord';
import { settings } from 'Database/data/setting';
import Setting from 'App/Models/Setting';

import Type from 'App/Models/Type';
import InvestmentTenure from 'App/Models/InvestmentTenure';

export default class extends BaseSeeder {
    public async run() {
        // Write your database queries inside the run method
        let rfiRecord;
        for (let index = 0; index < rfiRecords.length; index++) {
            rfiRecord = rfiRecords[index]
            const rfiRecord_getter = await RfiRecord.findBy('rfi_name', rfiRecord.rfiName)
            if (!rfiRecord_getter) {
                await RfiRecord.create(rfiRecord)
                    .then(async (rfiRecord) => {
                        // console.log(generalVerificationRequirement)
                        // console.log(rfiRecord)
                        // Then create settings for each (Registered Financial Institution, RFI) or Rfi record
                        // check if the rfi/RFI is already created
                        for (let index = 0; index < settings.length; index++) {
                            const setting = settings[index]
                            const rfiRecord_getter = await RfiRecord.findBy('rfi_name', setting.rfiName)
                            const settingRecord_getter = await Setting.findBy('rfi_name', setting.rfiName)
                            // if RFI record exist and setting is not existing, create a new setting
                            if (rfiRecord_getter && !settingRecord_getter) {
                                await Setting.create(setting)
                                // .then(async (setting) => {
                                //     // console.log(generalVerificationRequirement)
                                //     // console.log(rfiRecord)
                                //     console.log(setting)
                                // })
                            }
                        }


                        // create type for RFI
                        for (let index = 0; index < types.length; index++) {
                            let currentType = types[index];
                            // let { duration } = currentType;
                            // check if type name is existing
                            const type_getter = await Type.findBy('type_name', currentType.typeName)
                            if (!type_getter) {
                                currentType.rfiRecordId = rfiRecord.id;
                                currentType.rfiCode = rfiRecord.rfiCode;
                                // @ts-ignore
                                currentType.createdBy = "seeding";
                                // remove the array of duration property from currentType object
                                const { duration, ...currentTypeWithOutDurationProperty } = currentType;
                                console.log(currentTypeWithOutDurationProperty)
                                // console.log(currentType);
                                // console.log(" currentType.duration line 114 =============", currentType.duration);
                                let newInvestmentType = await Type.create(currentTypeWithOutDurationProperty)
                                for (let index = 0; index < currentType.duration.length; index++) {
                                    const currentDuration = duration[index];
                                    // create investment type tenure
                                    let tenureObject = {
                                        typeId: newInvestmentType.id,
                                        tenure: currentDuration
                                    }
                                    await InvestmentTenure.create(tenureObject)
                                }
                            } else if (type_getter) {
                                currentType.rfiRecordId = rfiRecord.id;
                                currentType.rfiCode = rfiRecord.rfiCode;
                                // @ts-ignore
                                currentType.createdBy = "seeding";
                                 // remove the array of duration property from currentType object
                                const { duration, ...currentTypeWithOutDurationProperty } = currentType;
                                // console.log(" currentTypeWithOutDurationProperty line 72 =============", currentTypeWithOutDurationProperty) 
                                // console.log(" currentType line 73 =============", currentType);
                                await Type.updateOrCreate(type_getter.$original, currentTypeWithOutDurationProperty);
                                let existingTypeTenure = await InvestmentTenure.query().where('type_id', type_getter.$original.id)
                                for (let index = 0; index < existingTypeTenure.length; index++) {
                                    // const currentExistingTypeTenure = existingTypeTenure[index];
                                    // TODO: delete currentExistingTypeTenure
                                    // console.log("currentExistingTypeTenure =============", currentExistingTypeTenure)
                                    // await InvestmentTenure. //truncate(currentExistingTypeTenure)
                                }
                                for (let index = 0; index < duration.length; index++) {
                                    const currentDuration = duration[index];
                                    // create investment type tenure
                                    let tenureObject = {
                                        typeId: type_getter.$original.id,
                                        tenure: currentDuration
                                    }
                                    await InvestmentTenure.create(tenureObject)
                                }
                            }
                        }
                    })
            } else if (rfiRecord_getter) {
                // console.log(generalVerificationRequirement)
                // console.log(rfiRecord)
                // Then create settings for each (Registered Financial Institution, RFI) or Rfi record
                // check if the rfi/RFI is already created
                for (let index = 0; index < settings.length; index++) {
                    const setting = settings[index]
                    const rfiRecord_getter = await RfiRecord.findBy('rfi_name', setting.rfiName)
                    const settingRecord_getter = await Setting.findBy('rfi_name', setting.rfiName)
                    // if RFI record exist and setting is not existing, create a new setting
                    if (rfiRecord_getter && !settingRecord_getter) {
                        await Setting.create(setting)
                        // .then(async (setting) => {
                        //     // console.log(generalVerificationRequirement)
                        //     // console.log(rfiRecord)
                        //     console.log(setting)
                        // })
                    }
                }

                // create type for RFI
                for (let index = 0; index < types.length; index++) {
                                        let currentType = types[index];
                    // let { duration } = currentType;
                    // console.log(" currentType Name line 121 =======", currentType.typeName)
                    // check if type name is existing
                    const type_getter = await Type.findBy('type_name', currentType.typeName)
                    if (!type_getter) {
                        currentType.rfiRecordId = rfiRecord_getter.id;
                        currentType.rfiCode = rfiRecord_getter.rfiCode;
                        // @ts-ignore
                        currentType.createdBy = "seeding";
                         // remove the array of duration property from currentType object
                        const { duration, ...currentTypeWithOutDurationProperty } = currentType;
                        // console.log(currentTypeWithOutDurationProperty)
                        // console.log(currentType);
                        // console.log(" currentType.duration line 135 =============", currentType.duration);
                        let newInvestmentType = await Type.create(currentTypeWithOutDurationProperty)

                        for (let index = 0; index < currentType.duration.length; index++) {
                            const currentDuration = duration[index];
                            // create investment type tenure
                            let tenureObject = {
                                typeId: newInvestmentType.id,
                                tenure: currentDuration
                            }
                            await InvestmentTenure.create(tenureObject)
                        }
                    } else if (type_getter) {
                        // console.log(" currentType.duration line 148 =============", currentType.duration);
                        currentType.rfiRecordId = rfiRecord_getter.id;
                        currentType.rfiCode = rfiRecord_getter.rfiCode;
                        // @ts-ignore
                        currentType.createdBy = "seeding";
                         // remove the array of duration property from currentType object
                        const { duration, ...currentTypeWithOutDurationProperty } = currentType;
                        // console.log(" currentTypeWithOutDurationProperty line 152 =============", currentTypeWithOutDurationProperty) // {name: 'Wisdom Geek'};
                        // console.log(" currentType line 153 =============", currentType);
                        await Type.updateOrCreate(type_getter.$original, currentTypeWithOutDurationProperty);
                        let existingTypeTenure = await InvestmentTenure.query().where('type_id', type_getter.$original.id)
                        for (let index = 0; index < existingTypeTenure.length; index++) {
                            // const currentExistingTypeTenure = existingTypeTenure[index];
                            // TODO: delete currentExistingTypeTenure
                            // console.log("currentExistingTypeTenure =============", currentExistingTypeTenure)
                            // await InvestmentTenure. //truncate(currentExistingTypeTenure)
                        }
                        for (let index = 0; index < duration.length; index++) {
                            const currentDuration = duration[index];
                            // create investment type tenure
                            let tenureObject = {
                                typeId: type_getter.$original.id,
                                tenure: currentDuration
                            }
                            await InvestmentTenure.create(tenureObject)
                        }
                    }

                }
            }
        }
    }
}
