const express = require("express");
const router = express.Router();
const seriesController = require("../controllers/seriesController");

router.get("/", seriesController.getSeries);
router.post("/", seriesController.createSeries);
router.delete("/:id", seriesController.deleteSeries);
router.post("/:seriesId/episodes", seriesController.addEpisode);
router.delete("/episodes/:id", seriesController.deleteEpisode);

module.exports = router;
