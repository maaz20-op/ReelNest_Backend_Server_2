const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { googleConfigCallback } = require("../controller/auth/googleController");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        "https://reel-nest-backend.vercel.app/api/v1/auth/google/callback",
    },
    googleConfigCallback,
  ),
);
