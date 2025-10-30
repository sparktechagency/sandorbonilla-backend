import express from "express"
const router = express.Router()


router.get("/me", getMyCart);
router.post("/add", addItem);
router.put("/item", setItem);
router.patch("/item/:productId", updateQuantity);
router.delete("/item/:productId", removeItem);
router.delete("/clear", clearMyCart);

