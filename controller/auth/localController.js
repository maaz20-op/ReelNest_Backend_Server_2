const userModel = require("../../models/user-model");
const postModel = require("../../models/post-model");
const bcrypt = require("bcryptjs");
const sendSignupEmail = require("../../emails/signupWelcome");
const sendOptonEmail = require("../../emails/verifyOtpEmail");
const sendAccessAndRefreshTokenThroughCookies = require("../../utils/sendAccessAndRefreshTokenThroughCookie");
const generateOTP = require("../../utils/generateOTP");
const { addLoginEmailToQueue } = require("../../queues/emailQueue");
const validateLoginRequest = require("../../utils/noSQLPreventionTechniques");

// local authentication using email and password
module.exports.signupUser = async function (req) {
  try {
    console.log(req.body);
    let { fullname, username, email, password } = req.body;

    if (!fullname || !username || !email || !password) {
      throw new Error("Some field is Missing fill properly!");
    }

    if (fullname.trim().length > 18) {
      throw new Error("Full name must not exceed 18 characters");
    }
    if (username.trim().length > 12) {
      throw new Error("Username must not exceed 12 characters");
    }

    let isUserExists = await userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (isUserExists) {
      if (isUserExists.email === email) {
        throw new Error("Email already exists.");
      }
      throw new Error("Username already taken.");
    }

    const hash = await bcrypt.hash(password, 6);

    let createdUser = await userModel.create({
      fullname,
      username,
      email,
      password: hash,
    });

    // email send will be control by userWatcher (change streams) in Mongo DB

    return [createdUser];
  } catch (err) {
    return err;
  }
};

module.exports.loginUser = async function (req) {
  try {
    const validateLoginSchema = validateLoginRequest();

    const { error, value } = validateLoginSchema.validate(req.body);

    if (error) {
      throw new Error(`${error?.details[0]?.message || "Invalid Details!"}`);
    }
    console.log("val9idation librerat", value, error);

    let { email, password } = req.body;

    let user = await userModel.findOne({ email });

    if (!user) {
      throw new Error("Account Not Exists");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Wrong email or password");

    // add email of login user in  msg queue and after worker process it send to user
    addLoginEmailToQueue(user.email, user.fullname);
    return [user];
  } catch (err) {
    throw err;
  }
};

module.exports.logoutUser = async function (req) {
  try {
    // other work done in res middleware
    return ["request Reached!"];
  } catch (err) {
    return err;
  }
};

module.exports.sendLoggedInUser = async function (req) {
  try {
    const user = await userModel.findById(req?.user?._id);

    if (!user) throw new Error("User is not Authenticated");

    return [user];
  } catch (err) {
    return err;
  }
};

module.exports.sendOTP = async function (req, res) {
  try {
    let verificationEmail = req.body.email;
    if (!verificationEmail) throw new Error("No email found");
    let otp = generateOTP();
    req.session.otp = otp;
    req.session.email = verificationEmail;
    console.log("session otp", req.session.otp, req.session.email);
    sendOptonEmail(verificationEmail, req.session.otp);
    if (!req.session.email && !req.session.otp) {
      throw new Error("something went wrong!");
    }
    return [otp];
  } catch (err) {
    return err;
  }
};

module.exports.verifyOtp = async function (req) {
  try {
    let { otp } = req.body;
    let emailOTP = req.session.otp;
    let verificationEmail = req.session?.email;
    let userInputOPT = otp.toString();
    console.log(emailOTP, userInputOPT);
    if (emailOTP.toString() !== userInputOPT.toString())
      throw new Error("wrong OTP code");

    let user = await userModel.findOne({ email: req.session.email });
    if (!user) {
      throw new Error("wrong email, error");
    }

    sendSignupEmail(user.email, user.fullname);

    // delete email and otp from session
    delete req.session.otp;
    delete req.session.email;
    console.log("session after delete", req.session.otp, req.session.email);
    return [user];
  } catch (err) {
    return err;
  }
};
