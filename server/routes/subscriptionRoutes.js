const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");

router.get("/", subscriptionController.getSubscription);
router.post("/activate", subscriptionController.activatePlan);

module.exports = router;
