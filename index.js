const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();
const sqlite3 = require('sqlite3');
const qs = require('querystring');
const PORT = 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const weatherKey = process.env.WEATHER_API_KEY;
let url = 'https://api.openweathermap.org/data/2.5/weather';


/// open database in memory
let db = new sqlite3.Database('users.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
});

// cron job
cron.schedule("* * * * *", () => {
    console.log('running a job every minute');
    // Get all phone numbers then call getWeather
    query = `
        SELECT users.Phone, City FROM users 
        INNER JOIN locations on users.Phone=locations.Phone
    `;
    db.all(query, [], getWeather);
});

// Sends weather for each location to a user
const getWeather = async (err, rows) => {
    for (i in rows) {
        let body = await axios.get(url, { params: {q: rows[i].City, units: 'imperial', appid: weatherKey} });
        let msg = "Your weather report today for " + body.data.name + ":\nIt will be " + body.data.main.temp + " degrees today!";
        sendMessage(rows[i].Phone, msg);
    }
}

// Send page to allow user to register
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname + '/register.html'));
})

//Registers a new user
app.post('/register', (req, res) => {
    console.log(req.body);
    db.run(`INSERT INTO users (Name, Phone) VALUES (?, ?)`, [req.body.name, req.body.phone], (err, rows) => {
        db.run(`INSERT INTO locations (City, Phone) VALUES (?, ?)`, [req.body.location, req.body.phone], (err, rows) => {
            res.send("Successfully registered new user!");
        })
    })
});


app.post('/messages', (req, res) => {
    res.send('message recieved');
})

app.listen(PORT, () => {
    console.log("Server running on " + PORT);
});

// Use Bandwidth API to send a message
const sendMessage = async (num, message) => {

    let config = {
        auth: {
            username: process.env.BANDWIDTH_USER,
            password: process.env.BANDWIDTH_PASSWORD
        },
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    };

    //Need to use stringify for urlencoded
    let body = qs.stringify({ "grant_type": "client_credentials" });
    let msgBody = {
        "applicationId": process.env.applicationId,
        "to": num,
        "from": process.env.FROM_PHONE,
        "text": message
    };

    try {
        // get token for authorization
        const token = await axios.post('https://id.bandwidth.com/api/v1/oauth2/token', body, config);

        // send message
        const response = await axios.post(process.env.MESSAGING_URL, msgBody, { headers: {
            Authorization: `Bearer ${token.data.access_token}`
        }})
        console.log(response);
    }
    catch (e) {
        console.log(e);
    }

}
