const db = require("../config/db")

const getOrders = (req, res) => {
  const sql = "SELECT * FROM orders ORDER BY id DESC"

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    const orders = result.map((order) => ({
      ...order,
      items: typeof order.items === "string" ? JSON.parse(order.items) : order.items
    }))

    res.json(orders)
  })
}

const addOrder = (req, res) => {
  const { customer_name, phone, items, total_price, remark } = req.body

  if (!customer_name || !phone || !items || !total_price) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  const itemsJson = JSON.stringify(items)

  const stockCheckPromises = items.map((item) => {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT stock, name FROM products WHERE id = ?",
        [item.product_id],
        (err, result) => {
          if (err) return reject(err)
          if (result.length === 0) {
            return reject(new Error(`Product not found: ${item.name}`))
          }

          const availableStock = Number(result[0].stock)
          if (item.quantity > availableStock) {
            return reject(
              new Error(
                `Not enough stock for ${result[0].name}. Available: ${availableStock}`
              )
            )
          }

          resolve()
        }
      )
    })
  })

  Promise.all(stockCheckPromises)
    .then(() => {
      const sql = `
        INSERT INTO orders (customer_name, phone, items, total_price, status, remark, created_at)
        VALUES (?, ?, ?, ?, 'Pending', ?, NOW())
      `

      db.query(
        sql,
        [customer_name, phone, itemsJson, total_price, remark || null],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: err.message })
          }

          const updateStockPromises = items.map((item) => {
            return new Promise((resolve, reject) => {
              db.query(
                "UPDATE products SET stock = stock - ? WHERE id = ?",
                [item.quantity, item.product_id],
                (err2) => {
                  if (err2) return reject(err2)
                  resolve()
                }
              )
            })
          })

          Promise.all(updateStockPromises)
            .then(() => {
              db.query(
                "UPDATE products SET status = 'Out of Stock' WHERE stock <= 0"
              )

              res.json({
                message: "Order submitted successfully",
                id: result.insertId
              })
            })
            .catch((stockErr) => {
              res.status(500).json({ error: stockErr.message })
            })
        }
      )
    })
    .catch((error) => {
      res.status(400).json({ error: error.message })
    })
}

const updateOrderStatus = (req, res) => {
  const { id } = req.params
  const { status } = req.body

  let sql = "UPDATE orders SET status = ?"
  const values = [status]

  if (status === "Confirmed") {
    sql += ", confirmed_at = NOW()"
  }

  if (status === "Completed") {
    sql += ", completed_at = NOW()"
  }

  if (status === "Rejected") {
    sql += ", rejected_at = NOW()"
  }

  sql += " WHERE id = ?"
  values.push(id)

  db.query(sql, values, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    res.json({ message: "Order status updated successfully" })
  })
}

const deleteOrder = (req, res) => {
  const { id } = req.params

  db.query("DELETE FROM orders WHERE id = ?", [id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    res.json({ message: "Order deleted successfully" })
  })
}

const getOrdersByPhone = (req, res) => {
  const { phone } = req.params

  const sql = "SELECT * FROM orders WHERE phone = ? ORDER BY id DESC"

  db.query(sql, [phone], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    const orders = result.map((order) => ({
      ...order,
      items: typeof order.items === "string" ? JSON.parse(order.items) : order.items
    }))

    res.json(orders)
  })
}

module.exports = {
  getOrders,
  addOrder,
  updateOrderStatus,
  deleteOrder,
  getOrdersByPhone
}