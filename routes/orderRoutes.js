const express = require("express")
const router = express.Router()

const {
  getOrders,
  addOrder,
  updateOrderStatus,
  deleteOrder,
  getOrdersByPhone
} = require("../controllers/orderController")

router.get("/", getOrders)
router.post("/", addOrder)
router.put("/:id", updateOrderStatus)
router.delete("/:id", deleteOrder)
router.get("/phone/:phone", getOrdersByPhone)

module.exports = router
