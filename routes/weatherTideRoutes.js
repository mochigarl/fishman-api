const express = require("express")
const router = express.Router()
const { getWeatherTide } = require("../controllers/weatherTideController")

router.get("/", getWeatherTide)

module.exports = router