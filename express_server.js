const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 5000; // default port 8080

// generate a random 6-digit string
function generateRandomString() {
  let string = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01232456789"
  for (var i = 0; i < 6; i++) {
    string += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return string;
}
// generateRandomString();

// use ejs
app.set("view engine", "ejs");
// set up body-parser
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  console.log(urlDatabase);  // debug statement to see POST parameters
  res.send("OK");         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { urls: urlDatabase, shortURL: req.params.id };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  console.log(req.params.id);
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
