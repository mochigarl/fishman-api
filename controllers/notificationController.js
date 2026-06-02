const db = require("../config/db")

const getNotifications = (req, res) => {
  const notifications = []

  const ordersSql = `
    SELECT id, status, created_at, confirmed_at, completed_at
    FROM orders
    ORDER BY id DESC
    LIMIT 10
  `

  const productsSql = `
    SELECT id, name, stock, status
    FROM products
    WHERE stock <= 5 OR status = 'Out of Stock'
    ORDER BY stock ASC
    LIMIT 10
  `

  db.query(ordersSql, (err, orderResults) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    orderResults.forEach((order) => {
      if (order.created_at) {
        notifications.push({
          type: "order",
          title: `Order #${order.id} received`,
          message: "A new customer order has been placed.",
          time: order.created_at
        })
      }

      if (order.confirmed_at) {
        notifications.push({
          type: "order",
          title: `Order #${order.id} confirmed`,
          message: "This order has been confirmed.",
          time: order.confirmed_at
        })
      }

      if (order.completed_at) {
        notifications.push({
          type: "order",
          title: `Order #${order.id} completed`,
          message: "This order has been completed.",
          time: order.completed_at
        })
      }
    })

    db.query(productsSql, (err, productResults) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      const now = new Date().toISOString()

      productResults.forEach((product) => {
        if (product.status === "Out of Stock" || Number(product.stock) === 0) {
          notifications.push({
            type: "stock",
            title: `${product.name} is out of stock`,
            message: "This product is no longer available for customers.",
            time: now
          })
        } else if (Number(product.stock) <= 5) {
          notifications.push({
            type: "stock",
            title: `${product.name} is low stock`,
            message: `Only ${product.stock} units left.`,
            time: now
          })
        }
      })

      notifications.sort((a, b) => new Date(b.time) - new Date(a.time))
      res.json(notifications.slice(0, 20))
    })
  })
}

module.exports = {
  getNotifications
}