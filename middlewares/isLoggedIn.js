const jwt = require("jsonwebtoken");
const userModel = require("../models/user-model");
const apiRouteResFormate = require("../utils/ApiRoute");
const sendAccessAndRefreshTokenThroughCookies = require("../utils/sendAccessAndRefreshTokenThroughCookie");

const isLoggedIn = async function (req, res, next) {
  try {
    let jwtAccessToken = req.cookies.accessToken;
    let jwtRefreshToken = req.cookies.refreshToken;

    if (!jwtRefreshToken)
      return apiRouteResFormate(() => {
        return [];
      });

    let refreshTokenData = jwt.verify(
      jwtRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    if (!refreshTokenData.email) return console.log("no data");
    let backupUser = await userModel.findOne({ email: refreshTokenData.email });

    if (!backupUser?.email) return;
    if (!jwtAccessToken && jwtRefreshToken) {
      sendAccessAndRefreshTokenThroughCookies(backupUser.email, res);
      console.log("generated Access Token");
      req.user = {
        _id: backupUser._id,
        email: backupUser.email,
      };
      next();
      return;
    }

    const accessTokenData = jwt.verify(
      jwtAccessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );
    let user = await userModel.findOne({
      email: accessTokenData.email,
    });

    if (!user) return console.log("no user 2");

    req.user = {
      _id: user._id,
      email: user.email,
    };

    return next();
  } catch (err) {
    return console.log(err);
  }
};

module.exports = isLoggedIn;
