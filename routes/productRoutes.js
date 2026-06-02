const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")

const {
  getProducts,
  addProduct,
  deleteProduct,
  updateProduct
} = require("../controllers/productController")

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ storage })

router.get("/", getProducts)
router.post("/", upload.single("image"), addProduct)
router.delete("/:id", deleteProduct)
router.put("/:id", upload.single("image"), updateProduct)

module.exports = router