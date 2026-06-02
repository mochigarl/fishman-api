const express = require("express")
const router = express.Router()
const { getRecentActivities } = require("../controllers/activityController")

router.get("/", getRecentActivities)

module.exports = router