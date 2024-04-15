const { MongoClient } = require("mongodb");

const connectionUrl = "mongodb://localhost:27017";
const dbName = "Poizon";

let db;
let mongoClient;

const init = () =>
    MongoClient.connect(connectionUrl, { useNewUrlParser: true }).then(
        (client) => {
            mongoClient = client
            db = client.db(dbName);
        }
    );

const getCategories = async () => {
    const collection = db.collection("Categories");
    const result = await collection.find().toArray();
    return result;
};

const getProductsByBrand = async (brand) => {
    const collection = db.collection("Products");
    const result = await collection.find({vendor: brand}).toArray();
    return result;
};

const close = () => {
    mongoClient.close()
}

module.exports = { init, getCategories, getProductsByBrand, close };
