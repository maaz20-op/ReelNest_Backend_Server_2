const userModel = require("../../models/user-model");
const addLoginEmailToQueue = require("../../queues/emailQueue");
const sendAccessAndRefreshTokenThroughCookies = require("../../utils/sendAccessAndRefreshTokenThroughCookie");

// authentication using googleCallboogle passport strategy

module.exports.googleCallback = async (req, res) => {
  try {
    let userEmail = req.user;
    console.log("REUESTED USRR", userEmail);
    if (!userEmail) throw new Error("Google LogedIn failed!");
    let user = await userModel.findOne({ email: userEmail });
    if (!user) throw new Error("Failed to Login");
    sendAccessAndRefreshTokenThroughCookies(user?.email, res);
    res.redirect("https://reel-nest-frontend.vercel.app");
  } catch (err) {
    res.redirect("https://reel-nest-frontend.vercel.app/login");
  }
};

module.exports.googleConfigCallback = async function (
  accessToken,
  refreshToken,
  profile,
  done,
) {
  try {
    let userEmail = profile.emails[0].value;
    done(null, userEmail);
  } catch (err) {
    done(err, false);
  }
};
