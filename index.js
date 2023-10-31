import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Eliasaf17",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Eliasaf", color: "teal" }
];

async function addUsers() {  //It's necessary only for the first user
  const namesFromDB = await db.query("SELECT name FROM users");

  // Extract names in an array
  const names = namesFromDB.rows.map(row => row.name);

  // Verify if the name of the last user is not in the table
  if (!names.includes(users[users.length - 1].name)) {
    // Insert the user if it does not exist in the table
    const newUser = users[users.length - 1];
    await db.query("INSERT INTO users (name, color) VALUES($1, $2)", [newUser.name, newUser.color]);
  }
}

async function getUser(){
  const result = await db.query("SELECT * FROM  users")
  const allUsers = result.rows;
  return allUsers;  //Returns an array
}

async function checkVisited() {
  const result = await db.query("SELECT vc.country_code FROM users u JOIN visited_countries vc ON u.id = vc.user_id WHERE u.id=$1", [currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries; //Returns an array
}

//Get home page
app.get("/", async (req, res) => {
  await addUsers();
  const users = await getUser();
  const countries = await checkVisited();
  const currentUSer = users.find((user) => user.id == currentUserId);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUSer.color,
  });
});

// Insert new countries
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const users = await getUser();
  const currentUSer = users.find((user) => user.id == currentUserId);

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );
    if (result.rows.length > 0) {  //Verify if the country exists
      const data = result.rows[0];
      const countryCode = data.country_code;
      const userId = currentUSer.id;
      try {
        const verification = await db.query("SELECT country_code, user_id FROM visited_countries");
        verification.rows.forEach(dict => {  //Verify if the pair code-id already exist on table
          if (dict.country_code == countryCode && dict.user_id == userId) {
            throw new Error('Country has already been added, try again.');
          }
        });
        await db.query(
          "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
          [countryCode, userId]
        );
        res.redirect("/");
      } catch (err) {
        console.log(err);
        const countries = await checkVisited();
        res.render("index.ejs", {
          countries: countries,
          total: countries.length,
          users: users,
          error: err.message,
          color: currentUSer.color
        });
      }
    } else {
      throw new Error('Country does not exist, try again'); //create an error object with this message, stop the actual execution and search a catch handler
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisited();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      error: err.message,
      color: currentUSer.color
    });
  }
});

app.post("/user", async (req, res) => {
  if (req.body.add == "new") {
    res.render("new.ejs")
  } else{
    currentUserId = req.body.user;
    res.redirect("/");
  }
  
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html 
  const newUser= await db.query("INSERT INTO users (name, color) VALUES ($1, $2) RETURNING id", [req.body.name, req.body.color]);
  currentUserId = newUser.rows[0].id;
  const users = await getUser();
  const countries = await checkVisited();
  const currentUSer = users.find((user) => user.id == currentUserId);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUSer.color,
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
