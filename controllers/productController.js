const db = require("../config/db")

const getProducts = (req, res) => {
  const sql = "SELECT * FROM products ORDER BY id DESC"

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json(result)
  })
}

const addProduct = (req, res) => {
  const { name, category, price, stock, status } = req.body
  const image = req.file ? req.file.filename : null

  const sql =
    "INSERT INTO products (name, category, price, stock, status, image) VALUES (?, ?, ?, ?, ?, ?)"

  db.query(sql, [name, category, price, stock, status, image], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    res.json({
      message: "Product added",
      id: result.insertId
    })
  })
}

const deleteProduct = (req, res) => {
  const { id } = req.params

  db.query("DELETE FROM products WHERE id = ?", [id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    res.json({ message: "Deleted" })
  })
}

const updateProduct = (req, res) => {
  const { id } = req.params
  const { name, category, price, stock, status } = req.body
  const image = req.file ? req.file.filename : null

  let sql = ""
  let values = []

  if (image) {
    sql =
      "UPDATE products SET name=?, category=?, price=?, stock=?, status=?, image=? WHERE id=?"
    values = [name, category, price, stock, status, image, id]
  } else {
    sql =
      "UPDATE products SET name=?, category=?, price=?, stock=?, status=? WHERE id=?"
    values = [name, category, price, stock, status, id]
  }

  db.query(sql, values, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    res.json({ message: "Updated" })
  })
}

module.exports = {
  getProducts,
  addProduct,
  deleteProduct,
  updateProduct
}