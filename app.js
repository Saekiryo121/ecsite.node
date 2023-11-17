const path = require("path");
const express = require("express");
const ejs = require("ejs");
const app = express();
const bodyParser = require("body-parser");
const port = 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

const mysql = require("mysql2");

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "RyoArata0213",
  database: "express_db",
});

app.get("/", async (req, res) => {
  const sql = "SELECT * FROM allMenu";
  con.query(sql, async function (err, result, fields) {
    if (err) throw err;

    const getProductReviews = (productId) => {
      return new Promise((resolve, reject) => {
        const reviewSql = "SELECT * FROM review WHERE itemId = ?";
        con.query(reviewSql, [productId], (err, reviewResult, fields) => {
          if (err) reject(err);
          resolve(reviewResult);
        });
      });
    };

    const calculateAverageRating = (reviews) => {
      if (!reviews || reviews.length === 0) {
        return "0";
      }

      let totalRating = 0;

      reviews.forEach((review) => {
        if (typeof review.evaluation === "number") {
          totalRating += review.evaluation;
        } else if (
          typeof review.evaluation === "string" &&
          !isNaN(review.evaluation)
        ) {
          totalRating += parseFloat(review.evaluation);
        }
      });

      const averageRating = totalRating / reviews.length;
      return averageRating.toFixed(1);
    };

    const getAllMenuWithReviews = async () => {
      const allMenuWithReviews = await Promise.all(
        result.map(async (product) => {
          const reviews = await getProductReviews(product.id);
          const averageRating = calculateAverageRating(reviews);
          return {
            ...product,
            reviews: reviews,
            averageRating: averageRating,
          };
        })
      );
      return allMenuWithReviews;
    };

    const allMenuWithReviews = await getAllMenuWithReviews();

    res.render("index", {
      allMenu: allMenuWithReviews,
      pageTitle: "商品一覧ページ",
    });
  });
});

app.get("/edit/:id", (req, res) => {
  const productId = req.params.id;
  const productSql = "SELECT * FROM allMenu WHERE id = ?";
  const reviewSql = "SELECT * FROM review WHERE itemId = ?";

  con.query(productSql, [productId], (err, productResult, fields) => {
    if (err) throw err;

    con.query(reviewSql, [productId], (err, reviewResult, fields) => {
      if (err) throw err;

      res.render("edit", {
        menu: productResult,
        reviews: reviewResult,
      });
    });
  });
});

app.get("/cart", (req, res) => {
  const sql = "SELECT * FROM cart";
  con.query(sql, (err, cartItems, fields) => {
    if (err) throw err;

    let totalPrice = 0;
    cartItems.forEach((item) => {
      totalPrice += item.price;
    });

    res.render("cart", { cartItems, totalPrice });
  });
});

app.post("/add-to-cart", (req, res) => {
  const newItem = req.body;

  console.log("Received item:", newItem);

  if (!newItem.menu || !newItem.menu.imagePath) {
    return res.json({
      success: false,
      error: "Item or imagePath not available.",
    });
  }

  const insertSql =
    "INSERT INTO cart (imagePath, name, price) VALUES (?, ?, ?)";
  const insertValues = [
    newItem.menu.imagePath,
    newItem.menu.name,
    newItem.menu.price,
  ];

  con.query(insertSql, insertValues, (err, result) => {
    if (err) {
      console.error(err);
      return res.json({ success: false, error: "Failed to add item to cart" });
    }

    const selectSql = "SELECT * FROM cart";
    con.query(selectSql, (err, cartItems, fields) => {
      if (err) throw err;

      let totalPrice = 0;
      cartItems.forEach((item) => {
        totalPrice += item.price;
      });

      res.json({ success: true });
    });
  });
});

// ...

app.post("/remove-from-cart", (req, res) => {
  const itemId = req.body.itemId;

  if (!itemId) {
    return res.json({
      success: false,
      error: "Item ID not provided.",
    });
  }

  const deleteSql = "DELETE FROM cart WHERE id = ?";

  con.query(deleteSql, [itemId], (err, result) => {
    if (err) {
      console.error(err);
      return res.json({
        success: false,
        error: "Failed to remove item from cart",
      });
    }

    const selectSql = "SELECT * FROM cart";
    con.query(selectSql, (err, cartItems, fields) => {
      if (err) throw err;

      let totalPrice = 0;
      cartItems.forEach((item) => {
        totalPrice += item.price;
      });

      res.json({ success: true, totalPrice: totalPrice });
    });
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
