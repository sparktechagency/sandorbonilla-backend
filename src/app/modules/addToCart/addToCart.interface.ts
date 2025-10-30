import { Types } from "mongoose";

export interface ICartProduct {
  productId: Types.ObjectId; 
  name: string;             
  image: string;           
  price: number;                
  quantity: number;               
  color?: string;               
}

export interface IAddToCart {
  userId: Types.ObjectId;        
  products: ICartProduct[];      
  totalAmount?: number;         
}
