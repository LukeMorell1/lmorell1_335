const express = require("express");
const path = require("path");
const app = express();
const bodyParser = require("body-parser");
require("dotenv").config({
   path: path.resolve(__dirname, "./connection.env"),
});
const mongoose = require("mongoose");
const Stock = require("./model/Stock.js");

const portNumber = 5001;

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('styles'));

app.get("/", (req, res) => {res.render("index")});
app.get("/action", (req, res) => {res.render("action")});
app.get("/list", (req, res) => {res.render("list")});

app.post("/processAction", async (req, res) => {
  await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
  const {name, email, ticker, shares, choice} = req.body;
  let userChoice, price;
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${process.env.API_KEY}`;
  const api_res = await fetch(url);
  const data = await api_res.json();
  if(data["Error Message"]){
    return res.send("Invalid Ticker");
  }
  const daily = data['Time Series (Daily)'];
  const latest = Object.keys(daily)[0];
  const today = daily[latest];
  price = parseFloat(today['4. close']).toFixed(2);

  if(choice == "Buy") {
    userChoice = "bought";
    await Stock.findOneAndUpdate(
      {name: name, email: email, ticker: ticker}, 
      { 
        $inc: { shares: shares },
        $set: { price }
      },
      { 
        new: true,
        upsert: true, 
      }
    );

  } else {
    userChoice = "sold";
    const stock = await Stock.findOne({email: email, ticker: ticker});
    if(!stock || stock.shares < shares) {
      return res.send(`You don't own ${shares} shares of ${ticker}`);
    }
    stock.shares -= shares;
    if(stock.shares == 0) {
      await Stock.deleteOne({_id: stock._id});
    } else {
      await stock.save();
    }
  }

  mongoose.disconnect();
  output = {name: name, email: email, ticker: ticker, shares: shares, choice: userChoice, price: price};
  res.render("actionResult", output);
})
app.post("/processList", async (req, res) => {
    await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
    const {email} = req.body;
    let table = `<table border = "1"><tr><th>Name</th><th>Email</th><th>Ticker</th><th>Shares</th><th>Price</th></tr>`
    let stocks = await Stock.find({email: email});
    let total = 0;
    stocks.forEach(stock => {
      total += parseFloat(stock.price) * parseInt(stock.shares)
      table += `<tr><td>${stock.name}</td><td>${stock.email}</td><td>${stock.ticker}</td>
      <td>${stock.shares}</td><td>${stock.price}</td></tr>`
    })
    table += "</table>"
    total = total.toFixed(2);
    mongoose.disconnect();
    res.render("listResult", {table: table, total: total})
})

app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}/`);