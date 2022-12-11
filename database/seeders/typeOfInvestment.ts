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
                                        console.log(rfiRecord)
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
                                            // check if type name is existing
                                            const type_getter = await Type.findBy('type_name', currentType.typeName)
                                            if (!type_getter) {
                                                currentType.rfiRecordId = rfiRecord.id;
                                                currentType.rfiCode = rfiRecord.rfiCode;
                                                await Type.create(currentType)
                                            } else if (type_getter) {
                                                currentType.rfiRecordId = rfiRecord.id;
                                                await Type.updateOrCreate(type_getter.$original, currentType)
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
                                    // let currentType = types[index];
                                    // currentType.rfiRecordId = rfiRecord_getter.id;
                                    // await Type.create(currentType)
                                    let currentType = types[index];
                                    // check if type name is existing
                                    const type_getter = await Type.findBy('type_name', currentType.typeName)
                                    if (!type_getter) {
                                        currentType.rfiRecordId = rfiRecord.id;
                                        currentType.rfiCode = rfiRecord.rfiCode;
                                      let newInvestmentType =  await Type.create(currentType)
                                        let { duration } = currentType;
                                      for (let index = 0; index < duration.length; index++) {
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
                                        await Type.updateOrCreate(type_getter.$original, currentType)
                                    }

                                }
                            }
                        }


           
                // Then create each (Registered Financial Institution, RFI) or Rfi record
                // for (let index = 0; index < rfiRecords.length; index++) {
                //     rfiRecord = rfiRecords[index]
                //     const rfiRecord_getter = await RfiRecord.findBy('rfi_name', rfiRecord.rfiName)
                //     if (!rfiRecord_getter) {
                //         await RfiRecord.create(rfiRecord)
                //             .then(async (rfiRecord) => {
                //                 // console.log(generalVerificationRequirement)
                //                 console.log(rfiRecord)
                //                 // Then create settings for each (Registered Financial Institution, RFI) or Rfi record
                //                 // check if the rfi/RFI is already created
                //                 for (let index = 0; index < settings.length; index++) {
                //                     const setting = settings[index]
                //                     const rfiRecord_getter = await RfiRecord.findBy('rfi_name', setting.rfiName)
                //                     const settingRecord_getter = await Setting.findBy('rfi_name', setting.rfiName)
                //                     // if RFI record exist and setting is not existing, create a new setting
                //                     if (rfiRecord_getter && !settingRecord_getter) {
                //                         await Setting.create(setting)
                //                         // .then(async (setting) => {
                //                         //     // console.log(generalVerificationRequirement)
                //                         //     // console.log(rfiRecord)
                //                         //     // console.log(setting)
                //                         // })
                //                     }
                //                 }

                               
                //                 // new code end
                //                 // create type for RFI
                //                 for (let index = 0; index < types.length; index++) {
                //                     // let currentType = types[index];
                //                     // currentType.rfiRecordId = rfiRecord.id;
                //                     // await Type.create(currentType)
                //                     let currentType = types[index];
                //                     // check if type name is existing
                //                     const type_getter = await Type.findBy('type_name', currentType.typeName)
                //                     if (!type_getter) {
                //                         currentType.rfiRecordId = rfiRecord.id;
                //                         currentType.rfiCode = rfiRecord.rfiCode;
                //                         await Type.create(currentType)
                //                     } else if (type_getter) {
                //                         currentType.rfiRecordId = rfiRecord.id;
                //                         await Type.updateOrCreate(type_getter.$original, currentType)
                //                     }

                //                 }

                //             })
                //     } else if (rfiRecord_getter) {
                //         // console.log(generalVerificationRequirement)
                //         console.log(rfiRecord)
                //         // Then create settings for each (Registered Financial Institution, RFI) or Rfi record
                //         // check if the rfi/RFI is already created
                //         for (let index = 0; index < settings.length; index++) {
                //             const setting = settings[index]
                //             const rfiRecord_getter = await RfiRecord.findBy('rfi_name', setting.rfiName)
                //             const settingRecord_getter = await Setting.findBy('rfi_name', setting.rfiName)
                //             // if RFI record exist and setting is not existing, create a new setting
                //             if (rfiRecord_getter && !settingRecord_getter) {
                //                 await Setting.create(setting)
                //                     .then(async (setting) => {
                //                         // console.log(generalVerificationRequirement)
                //                         // console.log(rfiRecord)
                //                         console.log(setting)
                //                     })
                //             }
                //         }

                //         // create type for RFI
                //         for (let index = 0; index < types.length; index++) {
                //             // let currentType = types[index];
                //             // currentType.rfiRecordId = rfiRecord_getter.id;
                //             // await Type.create(currentType)
                //             let currentType = types[index];
                //             // check if type name is existing
                //             const type_getter = await Type.findBy('type_name', currentType.typeName)
                //             if (!type_getter) {
                //                 currentType.rfiRecordId = rfiRecord.id;
                //                 currentType.rfiCode = rfiRecord.rfiCode;
                //                 await Type.create(currentType)
                //             } else if (type_getter) {
                //                 currentType.rfiRecordId = rfiRecord.id;
                //                 await Type.updateOrCreate(type_getter.$original, currentType)
                //             }
                //         }
                //     }
                // }
    }
}
