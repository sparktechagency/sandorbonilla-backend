import { Types } from "mongoose";
import { AddItemPayload } from "./addToCart.interface";
import { Cart } from "./addToCart.model";
const calcTotal = (products: any[]) =>
    products.reduce((sum, p) => sum + p.price * p.quantity, 0);

const getCartByUser = async (userId: string) => {
    let cart = await Cart.findOne({ userId }).populate("products.productId", "images");
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
    } else {
        cart.products.push({
            productId: payload.productId,
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
    } else {
        cart.products.push({
            productId: payload.productId,
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
const toId = (v: string | Types.ObjectId) =>
    typeof v === "string" ? new Types.ObjectId(v) : v;

const safeEq = (a?: string, b?: string) =>
    (a ?? "").toString() === (b ?? "").toString();

const updateItemQuantity = async (
    userId: string,
    productId: string,
    quantity: number,
    size: string,
    color?: string
) => {
    const uid = toId(userId);
    const pid = toId(productId);
    const qty = Number(quantity);

    console.log('Input:', { userId, productId, quantity, size, color });

    const cart = await Cart.findOne({ userId: uid });
    if (!cart) {
        console.log('Cart not found');
        return null;
    }

    console.log('Cart found:', cart._id);
    console.log('Products before update:', JSON.stringify(cart.products, null, 2));

    // Find matching product index
    const idx = cart.products.findIndex((p) => {
        const productMatch = p.productId.toString() === pid.toString();
        const sizeMatch = safeEq(p.size, size);
        const colorMatch = color ? safeEq(p.color, color) : !p.color || p.color === '';

        console.log('Checking product:', {
            productId: p.productId.toString(),
            size: p.size,
            color: p.color,
            matches: { productMatch, sizeMatch, colorMatch }
        });

        return productMatch && sizeMatch && colorMatch;
    });

    console.log('Found index:', idx);

    if (idx === -1) {
        console.log('Product not found in cart');
        return cart;
    }

    // Update or remove the product
    if (qty <= 0) {
        const removed = cart.products.splice(idx, 1);
        console.log('Removed product:', removed);
    } else {
        cart.products[idx].quantity = qty;
        console.log('Updated quantity to:', cart.products[idx].quantity);
    }

    // Recalculate total
    cart.totalAmount = cart.products.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    console.log('New total amount:', cart.totalAmount);
    console.log('Products after update:', JSON.stringify(cart.products, null, 2));

    // Mark as modified and save
    cart.markModified('products');
    cart.markModified('totalAmount');

    try {
        const savedCart = await cart.save();
        console.log('Cart saved successfully');
        return savedCart;
    } catch (error) {
        console.error('Error saving cart:', error);
        throw error;
    }
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