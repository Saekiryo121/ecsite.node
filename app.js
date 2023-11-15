const path = require("path");
const express = require("express");
const ejs = require("ejs");
const app = express();
const bodyParser = require("body-parser");
const port = 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const mysql = require("mysql2");

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "RyoArata0213",
  database: "express_db",
});


app.get("/", (req, res) => {
  const sql = "SELECT * FROM allMenu";
  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    res.render("index", {
      allMenu: result,
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
    cartItems.forEach(item => {
      totalPrice += item.price;
    });

    res.render("cart", { cartItems, totalPrice });
  });
});


app.post("/add-to-cart", (req, res) => {
  const newItem = req.body;

  console.log(newItem);

  if (newItem && newItem.menu && newItem.menu.imagePath) {
    const insertSql = "INSERT INTO cart (imagePath, name, price) VALUES (?, ?, ?)";
    const insertValues = [newItem.menu.imagePath, newItem.menu.name, newItem.menu.price];

    con.query(insertSql, insertValues, (err, result) => {
      if (err) {
        console.error(err);
        return res.json({ success: false, error: "Failed to add item to cart" });
      }

      const selectSql = "SELECT * FROM cart";
      con.query(selectSql, (err, cartItems, fields) => {
        if (err) throw err;

        let totalPrice = 0;
        cartItems.forEach(item => {
          totalPrice += item.price;
        });

        res.json({ success: true });
      });
    });
  } else {
    console.error('Item or imagePath not available.');
    return res.json({ success: false, error: "Item information not available." });
  }
});



app.listen(port, () => console.log(`Example app listening on port ${port}!`));
