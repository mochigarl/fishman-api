const db = require("../config/db")

const getSalesReport = (req, res) => {
  const { type = "daily" } = req.query

  let labelSql = ""
  let groupBySql = ""
  let orderBySql = ""
  let periodFilterSql = ""

  if (type === "daily") {
    labelSql = "DATE(completed_at)"
    groupBySql = "DATE(completed_at)"
    orderBySql = "DATE(completed_at) DESC"
    periodFilterSql = "DATE(completed_at) = CURDATE()"
  } else if (type === "weekly") {
    labelSql = "CONCAT(YEAR(completed_at), '-W', WEEK(completed_at, 1))"
    groupBySql = "YEAR(completed_at), WEEK(completed_at, 1)"
    orderBySql = "YEAR(completed_at) DESC, WEEK(completed_at, 1) DESC"
    periodFilterSql =
      "YEAR(completed_at) = YEAR(CURDATE()) AND WEEK(completed_at, 1) = WEEK(CURDATE(), 1)"
  } else if (type === "monthly") {
    labelSql = "DATE_FORMAT(completed_at, '%Y-%m')"
    groupBySql = "YEAR(completed_at), MONTH(completed_at)"
    orderBySql = "YEAR(completed_at) DESC, MONTH(completed_at) DESC"
    periodFilterSql =
      "YEAR(completed_at) = YEAR(CURDATE()) AND MONTH(completed_at) = MONTH(CURDATE())"
  } else if (type === "yearly") {
    labelSql = "YEAR(completed_at)"
    groupBySql = "YEAR(completed_at)"
    orderBySql = "YEAR(completed_at) DESC"
    periodFilterSql = "YEAR(completed_at) = YEAR(CURDATE())"
  } else {
    return res.status(400).json({ error: "Invalid report type" })
  }

  const summarySql = `
    SELECT 
      IFNULL(SUM(total_price), 0) AS totalSales,
      COUNT(*) AS totalOrders,
      IFNULL(AVG(total_price), 0) AS averageOrder
    FROM orders
    WHERE status = 'Completed'
      AND completed_at IS NOT NULL
      AND ${periodFilterSql}
  `

  const reportSql = `
    SELECT 
      ${labelSql} AS label,
      COUNT(*) AS orders,
      IFNULL(SUM(total_price), 0) AS sales
    FROM orders
    WHERE status = 'Completed'
      AND completed_at IS NOT NULL
      AND ${periodFilterSql}
    GROUP BY ${groupBySql}
    ORDER BY ${orderBySql}
  `

  const topProductsSql = `
    SELECT items
    FROM orders
    WHERE status = 'Completed'
      AND completed_at IS NOT NULL
      AND items IS NOT NULL
      AND ${periodFilterSql}
  `

  db.query(summarySql, (summaryErr, summaryResult) => {
    if (summaryErr) {
      return res.status(500).json({ error: summaryErr.message })
    }

    db.query(reportSql, (reportErr, reportResult) => {
      if (reportErr) {
        return res.status(500).json({ error: reportErr.message })
      }

      db.query(topProductsSql, (topErr, topResult) => {
        if (topErr) {
          return res.status(500).json({ error: topErr.message })
        }

        const productMap = {}

        topResult.forEach((row) => {
          let parsedItems = []

          try {
            parsedItems =
              typeof row.items === "string" ? JSON.parse(row.items) : row.items || []
          } catch {
            parsedItems = []
          }

          parsedItems.forEach((item) => {
            const name = item.name || "Unknown Product"
            const quantity = Number(item.quantity || 0)
            const sales = Number(item.price || 0) * quantity

            if (!productMap[name]) {
              productMap[name] = {
                name,
                totalQuantity: 0,
                totalSales: 0
              }
            }

            productMap[name].totalQuantity += quantity
            productMap[name].totalSales += sales
          })
        })

        const topProducts = Object.values(productMap)
          .sort((a, b) => b.totalQuantity - a.totalQuantity)
          .slice(0, 5)

        res.json({
          summary: {
            totalSales: Number(summaryResult[0]?.totalSales || 0),
            totalOrders: Number(summaryResult[0]?.totalOrders || 0),
            averageOrder: Number(summaryResult[0]?.averageOrder || 0)
          },
          rows: reportResult.map((row) => ({
            label: String(row.label),
            orders: Number(row.orders),
            sales: Number(row.sales)
          })),
          topProducts
        })
      })
    })
  })
}

module.exports = {
  getSalesReport
}