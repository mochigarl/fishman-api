const getOrdersByPhone = (req, res) => {
  const { phone } = req.params

  const sql = "SELECT * FROM orders WHERE phone LIKE ? ORDER BY id DESC"

  db.query(sql, [`%${phone}%`], (err, result) => {
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
