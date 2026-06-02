const db = require("../config/db")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const loginAdmin = (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" })
  }

  const sql = "SELECT * FROM admins WHERE username = ? LIMIT 1"

  db.query(sql, [username], async (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (result.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" })
    }

    const admin = result[0]

    try {
      const isMatch = await bcrypt.compare(password, admin.password)

      if (!isMatch) {
        return res.status(401).json({ error: "Invalid username or password" })
      }

      const token = jwt.sign(
        {
          id: admin.id,
          username: admin.username
        },
        "fishman_secret_key",
        { expiresIn: "1d" }
      )

      return res.json({
        message: "Login successful",
        token,
        admin: {
          id: admin.id,
          username: admin.username
        }
      })
    } catch (compareError) {
      return res.status(500).json({ error: compareError.message })
    }
  })
}

module.exports = {
  loginAdmin
}