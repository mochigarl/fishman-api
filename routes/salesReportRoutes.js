const express = require("express")
const router = express.Router()
const { getSalesReport } = require("../controllers/salesReportController")

router.get("/", getSalesReport)

module.exports = router