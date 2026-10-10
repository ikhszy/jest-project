import supertest from "supertest";
import dotenv from 'dotenv';
import { faker } from "@faker-js/faker";

dotenv.config();
const request = supertest(process.env.BASE_URL);

export async function getProductData(order) {
    const response = await request.get('/products')

    if(response.status !== 200) {
        throw new Error(
            `GET products failed(${response.status}): ${JSON.stringify(response.body)}`
        );
    }

    return {
        productId: response.body.data[order].id,
        productName: response.body.data[order].name,
        productCategory: response.body.data[order].category,
        productPrice: response.body.data[order].price,
        productStock: response.body.data[order].stock,
        productRating: response.body.data[order].rating,
        productdescription: response.body.data[order].description
    };
}

// this will be used for products PATCH, PUT, and DELETE
export async function createProductData(token) {
    const productName = faker.book.title();
    const productCategory = "Books";
    const productPrice = faker.number.float({ min: 10, max: 200, fractionDigits: 2});
    const productStock = faker.number.int({ min: 10, max: 99});
    const productRating = faker.number.float({min: 1, max: 5, fractionDigits: 1});
    const productDescription = 'this is a test item to be deleted';

    const response = await request.post('/products')
    .set({
        "content-type": "application/json",
        authorization: `Bearer ${token}`
    })
    .send({
        name: productName,
        category: productCategory,
        price: productPrice,
        stock: productStock,
        rating: productRating,
        description: productDescription
    });

    if(response.status !== 201) {
        throw new Error(
            `GET products failed(${response.status}): ${JSON.stringify(response.body)}`
        );
    };

    return {
        productId: response.body.id,
        productName: response.body.name,
        productCategory: response.body.category,
        productPrice: response.body.price,
        productStock: response.body.stock,
        productRating: response.body.rating,
        productdescription: response.body.description
    };
}
