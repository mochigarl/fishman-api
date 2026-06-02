const axios = require("axios")
require("dotenv").config()

const getWeatherByDistrict = async (req, res) => {
  try {
    const { district } = req.query

    if (!district || !district.trim()) {
      return res.status(400).json({ error: "District required" })
    }

    const apiKey = process.env.WEATHERAPI_KEY

    if (!apiKey) {
      return res.status(500).json({ error: "Weather API key not configured" })
    }

    const response = await axios.get("https://api.weatherapi.com/v1/forecast.json", {
      params: {
        key: apiKey,
        q: district.trim(),
        days: 7,
        aqi: "no",
        alerts: "no"
      }
    })

    const result = response.data

    const current = result.current
    const location = result.location
    const forecastDays = result.forecast.forecastday

    let safety = "SAFE"
    let color = "green"

    if (Number(current.wind_kph) > 20) {
      safety = "DANGEROUS"
      color = "red"
    } else if (Number(current.wind_kph) > 10) {
      safety = "CAUTION"
      color = "orange"
    }

    res.json({
      location: location.name,
      region: location.region,
      country: location.country,
      localtime: location.localtime,

      current: {
        temp_c: current.temp_c,
        condition_text: current.condition.text,
        condition_icon: current.condition.icon,
        wind_kph: current.wind_kph,
        humidity: current.humidity,
        cloud: current.cloud,
        is_day: current.is_day
      },

      daily: forecastDays.map((day) => ({
        date: day.date,
        max_temp_c: day.day.maxtemp_c,
        min_temp_c: day.day.mintemp_c,
        condition_text: day.day.condition.text,
        condition_icon: day.day.condition.icon,
        chance_of_rain: day.day.daily_chance_of_rain
      })),

      hourly: forecastDays[0].hour.slice(0, 12).map((hour) => ({
        time: hour.time,
        temp_c: hour.temp_c,
        condition_text: hour.condition.text,
        condition_icon: hour.condition.icon,
        chance_of_rain: hour.chance_of_rain
      })),

      // marine placeholder kalau kau nak tambah kemudian
      wave_height: "N/A",

      safety,
      color
    })
  } catch (err) {
    console.log("WeatherAPI error:", err.response?.data || err.message)
    res.status(500).json({ error: "Failed to fetch weather data" })
  }
}

module.exports = { getWeatherByDistrict }