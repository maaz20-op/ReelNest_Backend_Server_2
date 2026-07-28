const apiResponse = require("../utils/apiResponse");
const {
  APiResponseSuccess,
  ApiResponseError,
} = require("../utils/apiResponse");
const sendAccessAndRefreshTokenThroughCookies = require("./sendAccessAndRefreshTokenThroughCookie");

const authPaths = ["/login", "/signup", "/googlecallback", "/verify-otp"];
const apiRouteResFormate = (fn) => async (req, res) => {
  try {
    const data = await fn(req, res);
    if (!data) {
      ApiResponseError(res, "Server Error!", "Error", 304);
      return;
    }
    console.log("this url", req.url);
    if (authPaths.includes(req.url) && data[0]?.email) {
      sendAccessAndRefreshTokenThroughCookies(data[0].email, res);
    }

    APiResponseSuccess(res, data, "Success", 200);
  } catch (err) {
    console.log(err.message, err.status);
    ApiResponseError(res, err.message, "Error", err.status);
  }
};

module.exports = apiRouteResFormate;
