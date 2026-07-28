const express = require("express");
const router = express.Router();
const isLoggedIn = require("../../../middlewares/isLoggedIn.js");
const util = require("util");
const isPageCache = require("../../../middlewares/redisCacheMiddleware.js");
const { setCache, makeKey } = require("../../../utils/setAndGetRedisKeys.js");

router.use("/users", require("./features/userApi"));
router.use("/posts", require("./features/postApi"));
router.use("/pins", require("./features/pinApi"));
router.use("/ai-features", require("./features/ai-huggyFaceApi.js"));
router.use("/comments", require("./features/commentApi"));
router.use("/payments", require("./features/paymentApi.js"));
router.use("/auth/local", require("./auth/local.js"));
router.use("/auth/google", require("./auth/google"));

module.exports = router;
