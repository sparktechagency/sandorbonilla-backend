import { AddItemPayload } from "./addToCart.interface";
import { Cart } from "./addToCart.model";
const calcTotal = (products: any[]) =>
    products.reduce((sum, p) => sum + p.price * p.quantity, 0);

const getCartByUser = async (userId: string) => {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = await Cart.create({ userId, products: [], totalAmount: 0 });
    }
    return cart;
};
const addItemToCart = async (payload: AddItemPayload) => {
    const cart = await getCartByUser(payload.userId);
    const idx = cart.products.findIndex(
        (p) =>
            p.productId.toString() === payload.productId.toString() &&
            p.color === payload.color &&
            p.size === payload.size
    );

    if (idx > -1) {
        cart.products[idx].quantity += payload.quantity;
        cart.products[idx].price = payload.price;
        cart.products[idx].name = payload.name;
        cart.products[idx].image = payload.image;
    } else {
        cart.products.push({
            productId: payload.productId,
            name: payload.name,
            image: payload.image,
            size: payload.size,
            price: payload.price,
            quantity: payload.quantity,
            color: payload.color,
        } as any);
    }
    cart.totalAmount = calcTotal(cart.products);
    await cart.save();
    return cart;
};
const setItemInCart = async (payload: AddItemPayload) => {
    const cart = await getCartByUser(payload.userId);
    const idx = cart.products.findIndex(
        (p) =>
            p.productId.toString() === payload.productId.toString() &&
            p.color === payload.color &&
            p.size === payload.size
    );


    if (idx > -1) {
        cart.products[idx].quantity = payload.quantity;
        cart.products[idx].price = payload.price;
        cart.products[idx].name = payload.name;
        cart.products[idx].image = payload.image;
    } else {
        cart.products.push({
            productId: payload.productId,
            name: payload.name,
            image: payload.image,
            size: payload.size,
            price: payload.price,
            quantity: payload.quantity,
            color: payload.color,
        } as any);
    }


    cart.totalAmount = calcTotal(cart.products);
    await cart.save();
    return cart;
};

const updateItemQuantity = async (payload: AddItemPayload) => {
    const cart = await getCartByUser(payload.userId);
    const idx = cart.products.findIndex(
        (p) =>
            p.productId.toString() === payload.productId.toString() &&
            p.size === payload.size &&
            p.color === payload.color
    );


    if (idx === -1) return cart;


    if (payload.quantity <= 0) {
        cart.products.splice(idx, 1);
    } else {
        cart.products[idx].quantity = payload.quantity;
    }


    cart.totalAmount = calcTotal(cart.products);
    await cart.save();
    return cart;
};
const removeItemFromCart = async (
    userId: string,
    productId: string,
    size: string,
    color?: string
) => {
    const cart = await getCartByUser(userId);
    cart.products = cart.products.filter(
        (p) =>
            !(
                p.productId.toString() === productId.toString() &&
                p.size === size &&
                p.color === color
            )
    ) as any;


    cart.totalAmount = calcTotal(cart.products);
    await cart.save();
    return cart;
};
const clearCart = async (userId: string) => {
    const cart = await getCartByUser(userId);
    cart.products = [];
    cart.totalAmount = 0;
    await cart.save();
    return cart;
};
export const AddToCartService = {
    getCartByUser,
    addItemToCart,
    setItemInCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCart
}