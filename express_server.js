// requirements
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

// use ejs
app.set("view engine", "ejs");
// set up body-parser
app.use(bodyParser.urlencoded({extended: true}));
// set up cookie-parser
app.use(cookieParser())

// Start the server
const PORT = process.env.PORT || 5000; // default port 8080
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

// generate a random 6-digit string
function generateRandomString() {
  let string = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01232456789"
  for (var i = 0; i < 6; i++) {
    string += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return string;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// APP LOGIC

app.get("/", (req, res) => {
  res.redirect("/urls");
});

// Read
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

// Create
app.post("/urls", (req, res) => {
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  res.send("OK");         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { urls: urlDatabase, shortURL: req.params.id, username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

// Update
app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.update;
  // console.log(req.body.update);
  res.redirect("/urls");
})

// Destroy
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  console.log(req.params.id);
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});
