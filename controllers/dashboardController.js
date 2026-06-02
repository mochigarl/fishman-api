const db = require("../config/db")

const getDashboardStats = (req, res) => {
  const stats = {
    totalSales: 0,
    todayOrders: 0,
    pendingOrders: 0,
    recentOrders: [],
    salesAnalytics: [],
    topProducts: []
  }

  const totalSalesSql = `
    SELECT IFNULL(SUM(total_price), 0) AS totalSales
    FROM orders
  `

  const todayOrdersSql = `
    SELECT COUNT(*) AS todayOrders
    FROM orders
    WHERE DATE(created_at) = CURDATE()
  `

  const pendingOrdersSql = `
    SELECT COUNT(*) AS pendingOrders
    FROM orders
    WHERE status = 'Pending'
  `

  const recentOrdersSql = `
    SELECT id, customer_name, status, total_price, created_at
    FROM orders
    ORDER BY id DESC
    LIMIT 5
  `

  const analyticsSql = `
    SELECT DATE(created_at) AS orderDate, IFNULL(SUM(total_price), 0) AS total
    FROM orders
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DATE(created_at)
    ORDER BY orderDate ASC
  `

  const allOrderItemsSql = `
    SELECT items
    FROM orders
  `

  db.query(totalSalesSql, (err, totalSalesResult) => {
    if (err) return res.status(500).json({ error: err.message })

    stats.totalSales = Number(totalSalesResult[0].totalSales)

    db.query(todayOrdersSql, (err, todayOrdersResult) => {
      if (err) return res.status(500).json({ error: err.message })

      stats.todayOrders = todayOrdersResult[0].todayOrders

      db.query(pendingOrdersSql, (err, pendingOrdersResult) => {
        if (err) return res.status(500).json({ error: err.message })

        stats.pendingOrders = pendingOrdersResult[0].pendingOrders

        db.query(recentOrdersSql, (err, recentOrdersResult) => {
          if (err) return res.status(500).json({ error: err.message })

          stats.recentOrders = recentOrdersResult

          db.query(analyticsSql, (err, analyticsResult) => {
            if (err) return res.status(500).json({ error: err.message })

            stats.salesAnalytics = analyticsResult.map((row) => ({
              date: row.orderDate,
              total: Number(row.total)
            }))

            db.query(allOrderItemsSql, (err, itemRows) => {
              if (err) return res.status(500).json({ error: err.message })

              const productMap = {}

              itemRows.forEach((row) => {
                try {
                  const items = JSON.parse(row.items)

                  items.forEach((item) => {
                    if (!productMap[item.name]) {
                      productMap[item.name] = 0
                    }
                    productMap[item.name] += Number(item.quantity)
                  })
                } catch (e) {
                  console.log("JSON parse error:", e)
                }
              })

              stats.topProducts = Object.entries(productMap)
                .map(([name, quantity]) => ({ name, quantity }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5)

              res.json(stats)
            })
          })
        })
      })
    })
  })
}

module.exports = {
  getDashboardStats
}