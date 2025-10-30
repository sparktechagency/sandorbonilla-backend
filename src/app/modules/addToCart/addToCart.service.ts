import { Cart } from "./addToCart.model";

const getCartByUser = async (userId: string) => {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = await Cart.create({ userId, products: [], totalAmount: 0 });
    }
    return cart;
};
export const AddToCartService = {
    getCartByUser
}