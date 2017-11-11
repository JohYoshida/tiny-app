// requirements
const express = require("express");
const methodOverride = require("method-override");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

// use ejs
app.set("view engine", "ejs");
// override with the X-HTTP-Method-Override header in the request
app.use(methodOverride("_method"));
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
    userID: "test",
    visits: 1,
    visitors: {"test": ["10:30, 2017-10-6"]},
    uniques: ["test"]
  },
  "9sm5xK": {
    id: "9sm5xK",
    longURL: "http://www.google.ca",
    userID: "test",
    visits: 1,
    visitors: {"test": ["10:30, 2017-10-6"]},
    uniques: ["test"]
  },
  "a0Iul2": {
    id: "a0Iul2",
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
    visits: 1,
    visitors: {"a0Iul2": ["10:30, 2017-10-6"]},
    uniques: ["userRandomID"]
  },
  "XrRsgr": {
    id: "XrRsgr",
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
    visits: 1,
    visitors: {"XrRsgr": ["10:30, 2017-10-6"]},
    uniques: ["userRandomID"]
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

// constructs a template object for use in rendering views
function constructTemplate(req) {
  let template = { urls: urlDatabase,
                   user: users[req.session.user_id]
                 };
  return template;
}

function isUniqueVisitor(req, user) {
  let uniques = urlDatabase[req.params.shortURL].uniques;
  for (let id in uniques) {
    if (user === uniques[id]) {
      return true;
    }
  }
  return false;
}

// APP LOGIC

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  let filteredDatabase = {};
  let templateVars = constructTemplate(req);
  let user = users[req.session.user_id];
  // find URLs associated with logged in user
  if (user) {
    filteredDatabase = urlsForUser(user.id);
  }
  templateVars["filteredURLs"] = filteredDatabase;
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = constructTemplate(req);
  if (!templateVars.user) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = constructTemplate(req);
  templateVars["shortURL"] = req.params.id;
  if (!verifyURL(req.params.id)) {
    res.status(404).send("Error 404: That TinyURL doesn't exist.");
  } else {
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (!verifyURL(req.params.shortURL)) {
    res.status(404).send("Error 404: That TinyURL doesn't exist.");
  }
  let longURL = urlDatabase[req.params.shortURL].longURL;
  // increment visit count
  urlDatabase[req.params.shortURL].visits += 1;
  // get time
  let date = new Date().toUTCString();
  // give anonymous users a visitor id
  if (!req.session.user_id) {
    req.session.visitor_id = generateRandomString();
    urlDatabase[req.params.shortURL].uniques.push(req.session.visitor_id);
    urlDatabase[req.params.shortURL].visitors[req.session.visitor_id] = [date];
  } else {
    // check if logged in user has visited this TinyURL
    if (!isUniqueVisitor(req, req.session.user_id)) {
      urlDatabase[req.params.shortURL].uniques.push(req.session.user_id);
    }
    if (urlDatabase[req.params.shortURL].visitors[req.session.user_id]) {
      urlDatabase[req.params.shortURL].visitors[req.session.user_id].push(date);
    } else {
      urlDatabase[req.params.shortURL].visitors[req.session.user_id] = [date];
    }
  }


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
  let templateVars = constructTemplate(req);
  res.render("register", templateVars);
});

app.post("/urls", (req, res) => {
  let URLid = generateRandomString();
  // get the date
  let date = new Date().toUTCString();
  // add a new TinyURL to the database
  urlDatabase[URLid] = { id: URLid,
                         longURL: req.body.longURL,
                         userID: req.session.user_id,
                         visits: 1,
                         visitors: {URLid: date},
                         uniques: [URLid]
                       };
  res.redirect("/urls");
});

app.put("/urls/:id", (req, res) => {
  let user = users[req.session.user_id];
  let creator = urlDatabase[req.params.id].userID;
  // if not logged in or not the creator, send an error
  if (!user || user.id !== creator) {
    res.status(403).send("Error 403 Forbidden: Only the creator can update this TinyURL");
  } else {
    // update the TinyURL
    urlDatabase[req.params.id].longURL = req.body.update;
    res.redirect("/urls");
  }
});

app.delete("/urls/:id", (req, res) => {
  let user = users[req.session.user_id];
  let creator = urlDatabase[req.params.id].userID;
  // if not logged in or not the creator, send an error
  if (!user || user.id !== creator) {
    res.status(403).send("Error 403 Forbidden: Only the creator can update this TinyURL");
  }
  // delete the TinyURL
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  let error = false;
  for (let user in users) {
    // compare provided email with users database
    if (users[user].email === req.body.email) {
      // compare provided password with user password hash
      if (bcrypt.compareSync(req.body.password, users[user].password)) {
        // log user in and redirect
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
    res.status(403).send("Error 403 Forbidden: User with that email or password can't be found.");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Error 400: Email or password field is empty");
  }
  for (let user in users) {
    // compare provided email with user database
    if (req.body.email === users[user].email) {
      res.status(400).send("Error 400: That email is already registered");
    }
  }
  // create a user id, hash password, and add user to user database
  let id = generateRandomString();
  const hashedPass = bcrypt.hashSync(req.body.password, 10);
  users[id] = { id: id,
                email: req.body.email,
                password: hashedPass
              };
  // set cookie
  req.session.user_id = id;
  res.redirect("/urls");
});
