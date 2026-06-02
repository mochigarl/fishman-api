const db = require("../config/db")

const getRecentActivities = (req, res) => {
  const sql = `
    SELECT id, status, created_at, confirmed_at, completed_at
    FROM orders
    ORDER BY id DESC
    LIMIT 10
  `

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    const activities = []

    result.forEach((order) => {
      if (order.created_at) {
        activities.push({
          orderId: order.id,
          type: "Pending",
          title: "New order received",
          time: order.created_at
        })
      }

      if (order.confirmed_at) {
        activities.push({
          orderId: order.id,
          type: "Confirmed",
          title: "Order confirmed",
          time: order.confirmed_at
        })
      }

      if (order.completed_at) {
        activities.push({
          orderId: order.id,
          type: "Completed",
          title: "Completed & delivered",
          time: order.completed_at
        })
      }
    })

    activities.sort((a, b) => new Date(b.time) - new Date(a.time))

    res.json(activities.slice(0, 5))
  })
}

module.exports = {
  getRecentActivities
}