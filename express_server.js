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
app.use(cookieParser());

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

// generate a random 6-digit string
function generateRandomString() {
  let string = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
                   "abcdefghijklmnopqrstuvwxyz" +
                   "01232456789";
  for (var i = 0; i < 6; i++) {
    string += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return string;
}

// mimic a database
const urlDatabase = {
  "b2xVn2": {
    id: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userID: "abcdefg"
  },
  "9sm5xK": {
    id: "9sm5xK",
    longURL: "http://www.google.ca",
    userID: "abcdefg"
  },
  "a0Iul2": {
    id: "a0Iul2",
    longURL: "http://www.lighthouselabs.ca",
    userID: "abcdefg"
  },
  "XrRsgr": {
    id: "XrRsgr",
    longURL: "http://www.lighthouselabs.ca",
    userID: "abcdefg"
  }
};

// store user data
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "abcdefg": {
    id: "abcdefg",
    email: "test@test.com",
    password: "test"
  }
}

// APP LOGIC

app.get("/", (req, res) => {
  res.redirect("/urls");
});

// Read
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase,
                       user: users[req.cookies["user_id"]]
                     };
  res.render("urls_index", templateVars);
});

// Create
app.post("/urls", (req, res) => {
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  if (!templateVars.user) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { urls: urlDatabase,
                       shortURL: req.params.id,
                       user: users[req.cookies["user_id"]]
                     };
  res.render("urls_show", templateVars);
});

// Update
app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.update;
  res.redirect("/urls");
});

// Destroy
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  templateVars = { user: users[req.cookies["user_id"]] };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  for (let user in users) {
    if (users[user].email === req.body.email) {
      if (users[user].password === req.body.password) {
        res.cookie("user_id", users[user].id);
        res.redirect("/");
      }
    }
  }
  res.status(403);
  res.send("Error 403 Forbidden: User with that email or password can't be found.")
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send("Error 400: Email or password field is empty");
  }
  for (let user in users) {
    if (req.body.email === users[user].email) {
      res.status(400);
      res.send("Error 400: That email is already registered");
    }
  }
  let id = generateRandomString();
  users[id] = { id: id,
                email: req.body.email,
                password: req.body.password
              };
  res.cookie("user_id", id);
  res.redirect("/urls");
});
