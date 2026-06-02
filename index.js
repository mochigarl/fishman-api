const express = require("express")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

const authRoutes = require("./routes/authRoutes")
const productRoutes = require("./routes/productRoutes")
const orderRoutes = require("./routes/orderRoutes")
const dashboardRoutes = require("./routes/dashboardRoutes")
const weatherRoutes = require("./routes/weatherRoutes")
const activityRoutes = require("./routes/activityRoutes")
const salesReportRoutes = require("./routes/salesReportRoutes")
const notificationRoutes = require("./routes/notificationRoutes")
const weatherTideRoutes = require("./routes/weatherTideRoutes")
const locationRoutes = require("./routes/locationRoutes")

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/uploads", express.static(path.join(__dirname, "uploads")))

app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/weather", weatherRoutes)
app.use("/api/activities", activityRoutes)
app.use("/api/sales-report", salesReportRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/weather-tide", weatherTideRoutes)
app.use("/api/location", locationRoutes)

app.get("/", (req, res) => {
  res.send("FishMan API running")
})

app.listen(5000, () => {
  console.log("Server running on port 5000")
})