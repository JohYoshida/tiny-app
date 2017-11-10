// requirements
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

// use ejs
app.set("view engine", "ejs");
// set up body-parser
app.use(bodyParser.urlencoded({extended: true}));
// set up cookie-session
app.use(cookieSession({
  name: "session",
  keys: ["secret"]
}));

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

// mimic a database
const urlDatabase = {
  "b2xVn2": {
    id: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userID: "test"
  },
  "9sm5xK": {
    id: "9sm5xK",
    longURL: "http://www.google.ca",
    userID: "test"
  },
  "a0Iul2": {
    id: "a0Iul2",
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "XrRsgr": {
    id: "XrRsgr",
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  }
};

// store user data
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("test", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "test": {
    id: "test",
    email: "test@test.com",
    password: bcrypt.hashSync("test", 10)
  }
};

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

// return a subset of the urlDatabase that belongs to user with id
function urlsForUser(id) {
  const filteredDatabase = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filteredDatabase[url] = urlDatabase[url];
    }
  }
  return filteredDatabase;
}

// checks whether a given URL id exists in the database
function verifyURL(id) {
  let exists = false;
  for (let url in urlDatabase) {
    if (urlDatabase[url].id === id) {
      exists = true;
    }
  }
  return exists;
}

function constructTemplate(req) {
  let template = { urls: urlDatabase,
                   user: users[req.session.user_id]
                 };
  return template;
}


// APP LOGIC

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  let filteredDatabase = {};
  let user = users[req.session.user_id];
  if (user) {
    filteredDatabase = urlsForUser(user.id);
  }
  let templateVars = constructTemplate(req);
  templateVars["filteredURLs"] = filteredDatabase;
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = constructTemplate(req);
  if (!templateVars.user) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = constructTemplate(req);
  templateVars["shortURL"] = req.params.id;
  if (!verifyURL(req.params.id)) {
    res.send("Error: That TinyURL doesn't exist.");
  }
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  if (!verifyURL(req.params.id)) {
    res.send("Error: That TinyURL doesn't exist.");
  }
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  let templateVars = constructTemplate(req);
  res.render("login", templateVars);
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  let templateVars = { user: users[req.session.user_id] };
  res.render("register", templateVars);
});



app.post("/urls", (req, res) => {
  let URLid = generateRandomString();
  urlDatabase[URLid] = { id: URLid,
                         longURL: req.body.longURL,
                         userID: req.session.user_id
                       };
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  let user = users[req.session.user_id];
  let creator = urlDatabase[req.params.id].userID;
  if (!user || user.id !== creator) {
    res.status(403);
    res.send("Error 403 Forbidden: Only the creator can update this TinyURL");
  }
  urlDatabase[req.params.id].longURL = req.body.update;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  let user = users[req.session.user_id];
  let creator = urlDatabase[req.params.id].userID;
  if (!user || user.id !== creator) {
    res.status(403);
    res.send("Error 403 Forbidden: Only the creator can update this TinyURL");
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  let error = false;
  for (let user in users) {
    if (users[user].email === req.body.email) {
      if (bcrypt.compareSync(req.body.password, users[user].password)) {
        req.session.user_id = users[user].id;
        res.redirect("/");
      } else {
        error = true;
      }
    } else {
      error = true;
    }
  }
  if (error) {
    res.status(403);
    res.send("Error 403 Forbidden: User with that email or password can't be found.");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
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
  const hashedPass = bcrypt.hashSync(req.body.password, 10);
  users[id] = { id: id,
                email: req.body.email,
                password: hashedPass
              };
  req.session.user_id = id;
  res.redirect("/urls");
});
