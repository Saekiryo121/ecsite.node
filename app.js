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

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
