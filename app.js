const envFile = `.env.${process.env.NODE_ENV || "development"}`;
let dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
console.log(process.env.MONGO_URI);
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

const express = require("express");
const app = express();
const path = require("path");
const moment = require("moment");
const axios = require("axios");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const MongoStore = require("connect-mongo");
const { Server } = require("socket.io");
const http = require("http");
const server = http.createServer(app);
const userModel = require("./models/user-model");
const helmet = require("helmet");
const io = new Server(server);
const userWatcherStreams = require("./changeStreams/userWatcher");
const passport = require("passport");
require("./config/googlePassport");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
//  require message connections of sockets
const messageSocketsConnection = require("./socket/message-sockets-connection");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const checkOrigin = require("./middlewares/securityMiddlewares");
const postModel = require("./models/post-model");
const commentModel = require("./models/comment-model");
require("./queues/emailQueue");

const msgModel = require("./models/message-model");
const pinModel = require("./models/pin-model");
//userWatcherStreams()
messageSocketsConnection(io);

// 📁 Public folder
app.use(express.static(path.join(__dirname, "public")));

// passport setup
app.use(passport.initialize());

// 🔐 Middlewares for cookies
app.use(cookieParser());

// ✅ Session Store using MongoDB
app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  }),
);

// app.use(helmet());
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],

//       imgSrc: [
//         "'self'",
//         "https://res.cloudinary.com",
//         "https://freeimage.host",
//         "https://iili.io",
//       ],

//       styleSrc: [
//         "'self'",
//         "'unsafe-inline'",
//         "https://cdnjs.cloudflare.com",
//         "https://fonts.googleapis.com",
//       ],

//       connectSrc: ["'self'", "https://api.cloudinary.com", "ws:", "http:"],

//       mediaSrc: ["'self'", "https://res.cloudinary.com"],

//       scriptSrc: [
//         "'self'",
//         "https://cdnjs.cloudflare.com",
//         "https://widget.cloudinary.com",
//       ],
//       fontSrc: [
//         "'self'",
//         "https://cdnjs.cloudflare.com",
//         "https://fonts.gstatic.com",
//         "'unsafe-inline'",
//       ],
//       frameAncestors: ["'none'"],
//     },
//     reportViolations: true,
//     reportUri: "/csp-violation",
//   }),
// );

//app.use(checkOrigin); //check is origin is trusted site e.g reelnest.com

// 📢 Flash messages for EJS views
app.use(function (req, res, next) {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});
app.use((req, res, next) => {
  console.log(req.url);
  next();
});

app.use(
  cors({
    origin: ["http://localhost:5173", "https://reel-nest-frontend.vercel.app"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Allows the backend to receive/send cookies
  }),
);

app.options("*", cors());

// 🧠 Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🖼️ View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// 📁 Routes

// mounting of routes
app.use("/api/v1", require("./routes/api/v1/index")); // use for api v1 response, save fall back for index.js if package.json has main feild

app.locals.moment = moment;

app.get("/csp-violation", function (req, res) {
  console.log("Some voilation made");
  res.send("Some voilation of helmet is made");
});

app.get("/all", async function (req, res) {
  const user = await userModel.findOne({ fullname: "Maaz Javed" });
  user.followers = user.followers.filter(
    (id) => id.toString() !== user?._id.toString(),
  );
  await user.save();
  res.json(user);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, function () {
  console.log(`🚀 Server is running on port ${PORT}...`);
});

module.exports = app;
