import QueryBuilder from "../../builder/QueryBuilder";
import { PaymentModel } from "./payments.model";

const getMyTransactions = async (id: string, query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(PaymentModel.find({ customerId: id }), query);
    const result = await queryBuilder.fields().paginate().sort().filter().search([]).modelQuery.exec();
    const meta = await queryBuilder.countTotal();

    return {
        meta,
        result,
    }
}
const getSellerTransactions = async (id: string, query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(PaymentModel.find({ sellerId: id }), query);
    const result = await queryBuilder.fields().paginate().sort().filter().search([]).modelQuery.exec();
    const meta = await queryBuilder.countTotal();

    return {
        meta,
        result,
    }
}
export const PaymentServices = {
    getMyTransactions,
    getSellerTransactions,
}
