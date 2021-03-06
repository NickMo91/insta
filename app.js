require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const connectSessionSequelize = require("connect-session-sequelize");
const SessionStore = connectSessionSequelize(session.Store);
const deserializeUserMW = require ("./middleware/deserializeUser");
const docsRoutes = require("./routes/docs");
const commentRoutes = require("./routes/comment");

const User = require("./models/user");
const sql = require("./util/sql");
const renderTemplate = require("./util/renderTemplate");

const requireLoggedIn = require("./middleware/requireLoggedIn");
const requireLoggedOut = require("./middleware/requireLoggedOut");

const app = express();
const cookieSecret = process.env.COOKIE_SECRET || "dev";


// Handles post request
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Render views using EJS
app.set("view engine", "ejs");
app.use(express.static("assets"));
app.use(cookieParser(cookieSecret));
app.use(session({
	secret: cookieSecret,
	store: new SessionStore({ db: sql }),
}));
app.use(deserializeUserMW);

// app.use(requireLoggedOut);



app.get("/signup", function(req, res) {
	renderTemplate(req, res, "Signup", "signup");
});

app.post("/signup", function(req, res) {
	User.create({
		firstname: req.body.firstName,
		lastname: req.body.lastName,
		email: req.body.email,
		username: req.body.userName,
		password: req.body.password,
	})
	.then(function(user) {
		req.session.userid = user.id;
		res.redirect("/home");
	})
	.catch(function(err) {
		console.log(err);
		renderTemplate(req, res, "Signup", "signup", {
			error: "Invalid username or password",
		});
	});
});


app.get("/", function(req, res) {
	renderTemplate(req, res, "Login", "login");
});

app.post("/", function(req, res) {
	User.findOne({
		where: {
			username: req.body.username,
		},
	})
	.then(function(user) {
		if (user) {
			user.comparePassword(req.body.password).then(function(valid) {
				console.log(user);
				if (valid) {
					req.session.userid = user.get("id");
					res.redirect("/home");
				}
				else {
					renderTemplate(req, res, "Login", "login", {
						error: "Incorrect password",
					});
				}
			});
		}
		else {
			renderTemplate(req, res, "Login", "login", {
				error: "Username not found",
			});
		}
	})
	.catch(function(err) {
		console.log(err);
		renderTemplate(req, res, "Login", "login", {
			error: "The database exploded, please try again",
		});
	});
});


app.get("/logout", function(req, res) {
	req.session.userid = null;
	req.user = null;

	console.log(req.session);
	res.redirect("/");
});



app.use("/", docsRoutes);
app.use("/", commentRoutes);

sql.sync().then(function() {
	console.log("Database initialized!");
	const port = process.env.PORT || 3000;
	app.listen(port, function() {
		console.log("Listening at http://localhost:" + port);
	});
});
