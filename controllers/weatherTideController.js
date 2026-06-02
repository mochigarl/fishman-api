const axios = require("axios")
require("dotenv").config()

const getWeatherTide = async (req, res) => {
  try {
    const { lat, lon } = req.query

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and longitude are required" })
    }

    const stormglassKey = process.env.STORMGLASS_API_KEY
    const now = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 2)

    const startIso = now.toISOString()
    const endIso = end.toISOString()

    // WEATHER FROM OPEN-METEO
    const weatherRes = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude: lat,
        longitude: lon,
        current: [
          "temperature_2m",
          "relative_humidity_2m",
          "precipitation",
          "cloud_cover",
          "wind_speed_10m",
          "wind_direction_10m",
          "weather_code",
          "is_day"
        ].join(","),
        hourly: [
          "temperature_2m",
          "precipitation_probability",
          "weather_code"
        ].join(","),
        daily: [
          "weather_code",
          "temperature_2m_max",
          "temperature_2m_min",
          "precipitation_probability_max"
        ].join(","),
        forecast_days: 7,
        timezone: "auto"
      }
    })

    const weatherData = weatherRes.data

    // TIDE FROM STORMGLASS (OPTIONAL / FAIL SAFE)
    let seaLevels = []
    let extremes = []

    if (stormglassKey) {
      try {
        const [seaLevelRes, extremesRes] = await Promise.all([
          axios.get("https://api.stormglass.io/v2/tide/sea-level/point", {
            params: {
              lat,
              lng: lon,
              start: startIso,
              end: endIso
            },
            headers: { Authorization: stormglassKey }
          }),
          axios.get("https://api.stormglass.io/v2/tide/extremes/point", {
            params: {
              lat,
              lng: lon,
              start: startIso,
              end: endIso
            },
            headers: { Authorization: stormglassKey }
          })
        ])

        seaLevels = seaLevelRes.data?.data || []
        extremes = extremesRes.data?.data || []
      } catch (tideError) {
        console.log("Tide fetch failed:", tideError.response?.data || tideError.message)
      }
    }

    const getClosestPoint = (list, key = "time") => {
      if (!list.length) return null

      let closest = list[0]
      let minDiff = Math.abs(new Date(list[0][key]) - now)

      for (const item of list) {
        const diff = Math.abs(new Date(item[key]) - now)
        if (diff < minDiff) {
          minDiff = diff
          closest = item
        }
      }

      return closest
    }

    const currentSeaLevel = getClosestPoint(seaLevels, "time")

    const nextHigh =
      extremes.find((item) => new Date(item.time) > now && item.type === "high") || null

    const nextLow =
      extremes.find((item) => new Date(item.time) > now && item.type === "low") || null

    let tideTrend = "Unavailable"
    if (nextHigh && nextLow) {
      tideTrend =
        new Date(nextHigh.time) < new Date(nextLow.time) ? "Rising" : "Falling"
    }

    const hourly = []
    const hourlyTime = weatherData.hourly?.time || []
    const hourlyTemp = weatherData.hourly?.temperature_2m || []
    const hourlyRain = weatherData.hourly?.precipitation_probability || []
    const hourlyCode = weatherData.hourly?.weather_code || []

    for (let i = 0; i < Math.min(8, hourlyTime.length); i++) {
      hourly.push({
        time: hourlyTime[i],
        temp: hourlyTemp[i],
        chanceOfRain: hourlyRain[i],
        weatherCode: hourlyCode[i]
      })
    }

    const daily = []
    const dailyTime = weatherData.daily?.time || []
    const dailyMax = weatherData.daily?.temperature_2m_max || []
    const dailyMin = weatherData.daily?.temperature_2m_min || []
    const dailyRain = weatherData.daily?.precipitation_probability_max || []
    const dailyCode = weatherData.daily?.weather_code || []

    for (let i = 0; i < dailyTime.length; i++) {
      daily.push({
        date: dailyTime[i],
        maxTemp: dailyMax[i],
        minTemp: dailyMin[i],
        chanceOfRain: dailyRain[i],
        weatherCode: dailyCode[i]
      })
    }

    return res.json({
      location: {
        name: "Current Location",
        region: "",
        country: "",
        lat: Number(lat),
        lon: Number(lon),
        timezone: weatherData.timezone || null
      },
      weather: {
        time: weatherData.current?.time || null,
        airTemperature: weatherData.current?.temperature_2m ?? null,
        humidity: weatherData.current?.relative_humidity_2m ?? null,
        precipitation: weatherData.current?.precipitation ?? null,
        cloudCover: weatherData.current?.cloud_cover ?? null,
        windSpeed: weatherData.current?.wind_speed_10m ?? null,
        windDirection: weatherData.current?.wind_direction_10m ?? null,
        weatherCode: weatherData.current?.weather_code ?? null,
        isDay: weatherData.current?.is_day ?? null
      },
      forecast: {
        hourly,
        daily
      },
      tide: {
        current_level_m: currentSeaLevel?.sg ?? null,
        current_time: currentSeaLevel?.time ?? null,
        next_high: nextHigh
          ? { time: nextHigh.time, height_m: nextHigh.height }
          : null,
        next_low: nextLow
          ? { time: nextLow.time, height_m: nextLow.height }
          : null,
        trend: tideTrend
      }
    })
  } catch (error) {
    console.log("Weather/Tide error:", error.response?.data || error.message)
    return res.status(500).json({
      error: "Failed to fetch weather data",
      details: error.response?.data || error.message
    })
  }
}

module.exports = { getWeatherTide }