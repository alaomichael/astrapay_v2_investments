const NodeGeocoder = require("node-geocoder");
export const getLocation = async function getLocation(
  model,
  settings,
  walletId,
  userId?
): Promise<any> {
console.log(model);
  console.log(settings);
  console.log(walletId);
  console.log(userId);
const options = {
  provider: "freegeoip",

  // Optional depending on the providers
//   http://api.ipstack.com/102.89.41.151?access_key=cf557403a94ab3b716513aca52f5b5a8
//   fetch: customFetchImplementation,
  apiKey: "devcf557403a94ab3b716513aca52f5b5a8michael", // for Mapquest, OpenCage, Google Premier
  formatter: null, // 'gpx', 'string', ...
};

const geocoder = NodeGeocoder(options);

// Using callback
const res = await geocoder.geocode("29 champs elysée paris");
console.log("Geolocation result:", res)

}