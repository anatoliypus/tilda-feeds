const builder = require("xmlbuilder");
const { getCategories, init, close, getProductsByBrand } = require("./db");
const fs = require("fs");

const getDate = () => {
    const d = new Date();
    const date_format_str =
        d.getFullYear().toString() +
        "-" +
        ((d.getMonth() + 1).toString().length == 2
            ? (d.getMonth() + 1).toString()
            : "0" + (d.getMonth() + 1).toString()) +
        "-" +
        (d.getDate().toString().length == 2
            ? d.getDate().toString()
            : "0" + d.getDate().toString()) +
        " " +
        (d.getHours().toString().length == 2
            ? d.getHours().toString()
            : "0" + d.getHours().toString()) +
        ":" +
        ((parseInt(d.getMinutes() / 5) * 5).toString().length == 2
            ? (parseInt(d.getMinutes() / 5) * 5).toString()
            : "0" + (parseInt(d.getMinutes() / 5) * 5).toString());
    return date_format_str;
};

const main = async (brandToGet) => {
    var obj = {
        yml_catalog: {
            shop: {
                name: "Инпойзонрос",
                company: "Инпойзонрос",
                url: "https://inpoizonros.com/",
                currencies: {
                    currency: {
                        "@id": "RUB",
                        "@rate": "1",
                    },
                },
                categories: {
                    category: [
                        {
                            "@id": 1,
                            "#text": "Все товары",
                        },
                    ],
                },
                offers: {
                    offer: [],
                },
            },
            "@date": getDate(),
        },
    };

    await init();
    const categories = await getCategories();
    const products = await getProductsByBrand(brandToGet);
    close();

    categories.forEach((v) => {
        const category = {};

        if (!v.parentId) {
            category["@parentId"] = "1";
        } else {
            category["@parentId"] = v.parentId;
        }

        category["@id"] = v.id;
        category["#text"] = v.name;

        obj.yml_catalog.shop.categories.category.push(category);
    });

    for (const v of products) {
        const offer = {};

        offer.name = v.title;

        let priceYuan = v.properties.find((v) => v.key == "Цена предложения");
        if (!priceYuan || !priceYuan.value) continue;
        priceYuan = parseInt(priceYuan.value.replace(/\D/g, ""));
        const response = await fetch(
            `https://poizonapi.ru/calculatePrice/?price=${priceYuan}`
        );
        if (!response.ok) continue;
        const json = await response.json();
        if (!(json && json.body && json.body.price)) continue;
        offer.price = json.body.price;

        offer.currencyId = "RUB";
        offer.picture = v.url;
        offer.url = `https://inpoizonros.com/catalog?productId=${v.productId}`;
        offer.vendor = v.vendor;
        offer.param = [];
        offer.id = v.productId.toString()
        offer.available = 'true'

        v.properties.forEach((v) => {
            if (v.key != "Цена предложения")
                offer.param.push({
                    "@name": v.key,
                    "#text": v.value,
                });
        });

        obj.yml_catalog.shop.offers.offer.push(offer);
    }

    var root = builder.create(obj).end({
        pretty: true,
        indent: "  ",
        newline: "\n",
        spacebeforeslash: "",
    });

    fs.writeFile("./out.xml", root, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log("success");
            process.exit(0);
        }
    });
};

main("Nike");
