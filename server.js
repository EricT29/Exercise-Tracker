var path = require("path");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
const express = require("express");
const { exit } = require("process");
const app = express();
const port = process.env.PORT || 3000;
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname + "/")));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  if (req.cookies["exercises"]) {
    res.render("index.ejs", { exercises: req.cookies["exercises"] });
  } else {
    res.render("index.ejs");
  }
});

app.get("/weights", (req, res) => {
  res.render("weights.ejs");
});

app.get("/cardio", (req, res) => {
  res.render("cardio.ejs");
});

app.get("/progress", (req, res) => {
  var cookie = req.cookies["exercises"];
  aWeekAgo = new Date();
  aWeekAgo.setDate(new Date().getDate() - 7);

  if (cookie) {
    for (let i = 0; i < cookie.length; i++) {
      let dueDates = cookie[i]["dueDates"].split(",");
      for (let j = 0; j < dueDates.length; j++) {
        oldDate = dueDates[j];
        if (oldDate <= aWeekAgo) {
          newDate = new Date();
          while (newDate.getDay() != oldDate.getDay()) {
            newDate.setDate(newDate.getDate() + 1);
          }
          cookie[i]["dueDates"][j] = newDate;
        }
      }
    }
    res.cookie("exercises", cookie, {
      expires: new Date(Date.now() + 604800000),
    });
    res.render("progress.ejs", { exercises: req.cookies["exercises"] });
  } else {
    res.render("progress.ejs");
  }
});

app.get("/overview", (req, res) => {
  var cookie = req.cookies["exercises"];
  res.render("overview.ejs", { exercises: cookie });
});

app.post("/add-exercise", (req, res) => {
  var exerciseValues = req.body;
  var cookie = req.cookies["exercises"];
  if (cookie) {
    cookie.push(exerciseValues);
  } else {
    cookie = [exerciseValues];
  }
  console.log(cookie);
  res.cookie("exercises", cookie, {
    expires: new Date(Date.now() + 604800000),
  });
  res.render("index.ejs", { exercises: cookie });
});

app.post("/complete-exercise", (req, res) => {
  var today = new Date().getDay();
  var exerciseValues = req.body;
  var cookie = req.cookies["exercises"];
  var numDays = cookie[exerciseValues["index"]]["numDays"].split(",");
  var complete = cookie[exerciseValues["index"]]["complete"].split(",");
  var boolIndex = numDays.indexOf(today.toString());
  complete[boolIndex] = "true";
  cookie[exerciseValues["index"]]["complete"] = complete.toString();
  res.cookie("exercises", cookie, {
    expires: new Date(Date.now() + 604800000),
  });
  res.render("index.ejs", { exercises: cookie });
});

app.post("/edit-exercise", (req, res) => {
  var exerciseValues = req.body;
  var cookie = req.cookies["exercises"];
  let isMainPage = JSON.parse(exerciseValues["isMainPage"]);
  var toEdit = cookie[exerciseValues["index"]];
  toEdit["name"] = exerciseValues["ex-name"];
  if (JSON.parse(exerciseValues["isCardio"])) {
    if (toEdit["minutes"] != exerciseValues["ex-minutes"]) {
      toEdit["minutes"] = exerciseValues["ex-minutes"];
      toEdit["minutesHist"] = toEdit["minutesHist"]
        .concat(",")
        .concat(exerciseValues["ex-minutes"]);
    }
  } else {
    if (toEdit["sets"] != exerciseValues["ex-sets"]) {
      toEdit["sets"] = exerciseValues["ex-sets"];
      toEdit["setsHist"] = toEdit["setsHist"]
        .concat(",")
        .concat(exerciseValues["ex-sets"]);
    }
    if (toEdit["reps"] != exerciseValues["ex-reps"]) {
      toEdit["reps"] = exerciseValues["ex-reps"];
      toEdit["repsHist"] = toEdit["repsHist"]
        .concat(",")
        .concat(exerciseValues["ex-reps"]);
    }
    if (toEdit["weight"] != exerciseValues["ex-weight"]) {
      toEdit["weight"] = exerciseValues["ex-weight"];
      toEdit["weightHist"] = toEdit["weightHist"]
        .concat(",")
        .concat(exerciseValues["ex-weight"]);
    }
  }
  cookie[exerciseValues["index"]] = toEdit;
  res.cookie("exercises", cookie, {
    expires: new Date(Date.now() + 604800000),
  });
  isMainPage
    ? res.render("index.ejs", { exercises: cookie })
    : res.render("progress.ejs", { exercises: cookie });
});

app.post("/delete-exercise", (req, res) => {
  var exerciseValues = req.body;
  var cookie = req.cookies["exercises"];
  let isMainPage = JSON.parse(exerciseValues["isMainPage"]);
  cookie.splice(exerciseValues["index"], 1);
  if (cookie.length === 0) {
    res.clearCookie("exercises");
    isMainPage
      ? res.render("index.ejs")
      : res.render("progress.ejs", { exercises: cookie });
  } else {
    res.cookie("exercises", cookie, {
      expires: new Date(Date.now() + 604800000),
    });
    isMainPage
      ? res.render("index.ejs", { exercises: cookie })
      : res.render("progress.ejs", { exercises: cookie });
  }
});

app.get("/mod/:status/:index/:day", (req, res) => {
  var cookie = req.cookies["exercises"];
  let index = req.params["index"];
  let status = req.params["status"];
  let day = req.params["day"];
  if (status === "gold") {
    var complete = cookie[index]["complete"].split(",");
    complete[day] = "true";
    cookie[index]["complete"] = complete.toString();
  } else if (status === "red") {
    var complete = cookie[index]["complete"].split(",");
    complete[day] = "false";
    cookie[index]["complete"] = complete.toString();
    var dueDates = cookie[index]["dueDates"].split(",");
    var newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() - 3);
    dueDates[day] = newDueDate.toDateString();
    cookie[index]["dueDates"] = dueDates.toString();
  } else if (status === "blue") {
    var complete = cookie[index]["complete"].split(",");
    complete[day] = "false";
    cookie[index]["complete"] = complete.toString();
    var dueDates = cookie[index]["dueDates"].split(",");
    var newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + 7);
    dueDates[day] = newDueDate.toDateString();
    cookie[index]["dueDates"] = dueDates.toString();
  }
  console.log(cookie);
  res.cookie("exercises", cookie, {
    expires: new Date(Date.now() + 604800000),
  });
  res.render("progress.ejs", { exercises: cookie });
});

app.get("/clear", (req, res) => {
  var cookie = req.cookies["exercises"];
  cookie = [];
  res.cookie("exercises", cookie, {
    expires: new Date(Date.now() - 1),
  });
  res.render("index.ejs", { exercises: cookie });
});

const server = app.listen(port, () => console.log(`Listening on port ${port}`));
