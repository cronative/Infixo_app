const express = require("express");
const router = express.Router();
const creatorController = require("../controllers/creatorController");

router.get("/profile", creatorController.getProfile);
router.put("/profile", creatorController.updateProfile);
router.post("/socials", creatorController.upsertSocialAccount);
router.get("/public/:username", creatorController.getPublicProfile);

module.exports = router;
