const Env = require("@ioc:Adonis/Core/Env");
const OPENCAGE_API_KEY = Env.get("OPENCAGE_API_KEY");
const opencage = require('opencage-api-client');
// const { URLSearchParams } = require('url');


export const getUserCurrentLocation = async function getUserCurrentLocation(lat,lng): Promise<any> {
  // connect to OpenCageData API
  try {
    // console.log("lat, line 13", lat);
    // console.log("lng, line 14", lng);
    const response = await opencage.geocode({ q: `${lat}, ${lng}`, key: OPENCAGE_API_KEY })
    // console.log("line 21 ================================================== ");
    // console.log(response.results[0]);            

// {
//   annotations: {
//     DMS: { lat: "7° 22' 5.34000'' N", lng: "3° 52' 3.00216'' E" },
//     MGRS: '31NEJ9574214539',
//     Maidenhead: 'JJ17wi48ci',
//     Mercator: { x: 430528.198, y: 817012.901 },
//     OSM: {
//       edit_url: 'https://www.openstreetmap.org/edit?way=123344699#map=17/7.36815/3.86750',
//       note_url: 'https://www.openstreetmap.org/note/new#map=17/7.36815/3.86750&layers=N',
//       url: 'https://www.openstreetmap.org/?mlat=7.36815&mlon=3.86750#map=17/7.36815/3.86750'
//     },
//     UN_M49: { regions: [Object], statistical_groupings: [Array] },
//     callingcode: 234,
//     currency: {
//       alternate_symbols: [],
//       decimal_mark: '.',
//       html_entity: '&#x20A6;',
//       iso_code: 'NGN',
//       iso_numeric: '566',
//       name: 'Nigerian Naira',
//       smallest_denomination: 50,
//       subunit: 'Kobo',
//       subunit_to_unit: 100,
//       symbol: '₦',
//       symbol_first: 1,
//       thousands_separator: ','
//     },
//     flag: '🇳🇬'  ,
//     geohash: 's16cbj24x69qyfm353vh',
//     qibla: 64.09,
//     roadinfo: {
//       drive_on: 'right',
//       road: 'unnamed road',
//       road_type: 'residential',
//       speed_in: 'km/h'
//     },
//     sun: { rise: [Object], set: [Object] },
//     timezone: {
//       name: 'Africa/Lagos',
//       now_in_dst: 0,
//       offset_sec: 3600,
//       offset_string: '+0100',
//       short_name: 'WAT'
//     },
//     what3words: { words: 'shelf.stubble.awkward' }
//   },
//   bounds: {
//     northeast: { lat: 7.3682958, lng: 3.8681176 },
//     southwest: { lat: 7.3678954, lng: 3.867266 }
//   },
//   components: {
//     'ISO_3166-1_alpha-2': 'NG',
//     'ISO_3166-1_alpha-3': 'NGA',
//     'ISO_3166-2': [ 'NG-OY' ],
//     _category: 'road',
//     _type: 'road',
//     city: 'Ibadan',
//     continent: 'Africa',
//     country: 'Nigeria',
//     country_code: 'ng',
//     county: 'Ibadan South West',
//     road: 'unnamed road',
//     road_type: 'residential',
//     state: 'Oyo State'
//   },
//   confidence: 9,
//   formatted: 'unnamed road, Ibadan, Oyo State, Nigeria',
//   geometry: { lat: 7.36815, lng: 3.8675006 }
// }

    if (response.status.code === 200) {
          if (response && response.results.length > 0) {
        // console.log("line 119 ================================================== ");
        // console.log("The ASTRAPAY API response,@ getUserCurrentLocation line 99: ", response.results[0].components);
        return response.results[0].components;
      }
    } else {
      // console.log("The ASTRAPAY API response,,@ getUserCurrentLocation line 103: ", response);
      return response;
    }
  } catch (error) {
    console.log(error.config)
    console.log("line 126 ================================================== ");
    console.log(error.response);
    // console.error(error.response.data.errorCode);
    // console.error(error.response.data.errorMessage);
    console.error(error.message);
    if (error.response == undefined) {
      return { status: "FAILED TO FETCH USER CURRENT LOCATION", message: error.message }
    } else {
      return { status: "FAILED TO FETCH USER CURRENT LOCATION", message: error.message, errorCode: error.response.data.errorCode, errorMessage: error.response.data.errorMessage }
    }
  }

}



