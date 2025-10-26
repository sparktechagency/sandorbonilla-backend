import { v4 as uuidv4 } from 'uuid';
import { User } from '../app/modules/user/user.model';
import { Order } from '../app/modules/order/order.model';


// Generate Registration Number for User
export const generateRegistrationNumber = async (prefix: string): Promise<string> => {
    let uniqueId: string;
    let isDuplicate = true;

    // Try generating a unique ID for the user until we find one that's not in the database
    while (isDuplicate) {
        uniqueId = uuidv4().replace(/-/g, '').slice(0, 10); // Generate and clean UUID
        const registrationNo = `${prefix}${uniqueId}`;

        // Check if the generated registration number already exists in the User model
        const existingUser = await User.findOne({ registrationNo });
        if (!existingUser) {
            isDuplicate = false;  // No duplicate found, exit the loop
        }
    }

    return `${prefix}${uniqueId!}`;  // Return the unique registration number for the user
};

// Generate Order Number for Order
export const generateOrderNumber = async (prefix: string): Promise<string> => {
    let uniqueId: string;
    let isDuplicate = true;

    // Try generating a unique ID for the order until we find one that's not in the database
    while (isDuplicate) {
        uniqueId = uuidv4().replace(/-/g, '').slice(0, 10); // Generate and clean UUID
        const orderNumber = `${prefix}${uniqueId}`;

        // Check if the generated order number already exists in the Order model
        const existingOrder = await Order.findOne({ orderNumber });
        if (!existingOrder) {
            isDuplicate = false;  // No duplicate found, exit the loop
        }
    }

    return `${prefix}${uniqueId!}`;  // Return the unique order number for the order
};

