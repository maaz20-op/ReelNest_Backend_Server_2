const express = require("express");
const isLoggedIn = require("../../../../middlewares/isLoggedIn");
const apiRouteResFormate = require("../../../../utils/ApiRoute");
const { getMessages } = require("../../../../controller/app/message");
const router = express.Router();

router.get("/", isLoggedIn, apiRouteResFormate(getMessages));

module.exports = router;
