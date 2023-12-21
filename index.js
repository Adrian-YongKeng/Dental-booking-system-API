let express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { DATABASE_URL } = process.env;
require('dotenv').config();

let app = express()
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    require: true,
  },
});

async function getPostgresVersion() {
  const client = await pool.connect();
  try {
    const response = await client.query('SELECT version()');
    console.log(response.rows[0]);
  } finally {
    client.release();
  }
}

getPostgresVersion();

//Posts endpoint 
app.post('/bookings', async (req, res) => {
  const { name, email, phonenumber, services, comment, bookingdate, bookingtime, userid } = req.body;
  const client = await pool.connect();
  try {
    //check if user exists
    //const userExists = await client.query('SELECT id FROM users WHERE id = $1', [user_id]);
    //if (userExists.rows.length > 0) {
    //user exists, add post 
    const post = await client.query('INSERT INTO bookings (name, email, phonenumber, services, comment, bookingdate, bookingtime, userid, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP) RETURNING *', [name, email, phonenumber, services, comment, bookingdate, bookingtime, userid]);
    //send new post data back to client 
    res.json(post.rows[0]);
    //} else {
    //user doesnot exist 
    //res.status(404).json({ error: "User does not exist" });
    //}
  } catch (error) {
    console.log(error.stack);
    res.status(500).json({ error: "Something went wrong, please try again later!" });
  } finally {
    client.release();
  }
})
//endpoint togetposts 
app.get('/bookings/:userid', async (req, res) => {
  const { userid } = req.params;
  const client = await pool.connect();
  try {
    const post = await client.query('SELECT * FROM bookings WHERE userid = $1', [userid]);
    if (post.rows.length > 0) {
      res.json(post.rows);
    } else {
      res.status(404).json({ error: "Booking not found" });
    }
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ error: "An error occurrred, please try again." });
  } finally {
    client.release();
  }
})
//edit post
app.put('/bookings/:bookingid', async (req, res) => {
  const { bookingid } = req.params;
  const { name, email, phonenumber, services, comment, bookingdate, bookingtime } = req.body;// extract the updated content from the request body
  const client = await pool.connect();

  try { //perform UPDATE operation
    await client.query('UPDATE  Bookings SET name= $1, email= $2, phonenumber= $3, services= $4, comment= $5, bookingdate= $6, bookingtime= $7 WHERE bookingid = $8', [name, email, phonenumber, services, comment, bookingdate, bookingtime, bookingid]);
    res.json({ message: "Booking updated successfully" });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ error: "An error occurrred, please try again." });
  } finally {
    client.release();
  }
})
//delete post
app.delete('/bookings/:bookingid', async (req, res) => {
  const { bookingid } = req.params;
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM bookings WHERE bookingid = $1', [bookingid]);
    res.json({ message: "Booking Deleted Successfully" });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({ error: "An error occurrred, please try again." });
  } finally {
    client.release();
  }
});



app.get('/', (req, res) => {
  res.status(200).json({ message: "Welcome to the twitter API!" })
})

app.listen(3000, () => {
  console.log('App is listening on port 3000');
})