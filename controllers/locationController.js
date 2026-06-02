const axios = require("axios")

const searchLocation = async (req, res) => {
  try {
    const { q } = req.query

    if (!q || !q.trim()) {
      return res.status(400).json({ error: "Search query is required" })
    }

    const response = await axios.get("https://geocoding-api.open-meteo.com/v1/search", {
      params: {
        name: q.trim(),
        count: 8,
        language: "en",
        format: "json"
      }
    })

    const results = (response.data?.results || []).map((item) => ({
      id: `${item.id}-${item.latitude}-${item.longitude}`,
      name: item.name,
      region: item.admin1 || "",
      country: item.country || "",
      lat: item.latitude,
      lon: item.longitude
    }))

    res.json(results)
  } catch (error) {
    console.log("Location search error:", error.response?.data || error.message)
    res.status(500).json({ error: "Failed to search location" })
  }
}

module.exports = { searchLocation }