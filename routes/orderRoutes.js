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
router.get("/customer/:phone", getOrdersByPhone)
router.post("/", addOrder)
router.put("/:id", updateOrderStatus)
router.delete("/:id", deleteOrder)

module.exports = router