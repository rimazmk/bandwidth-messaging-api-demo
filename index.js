const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();
const sqlite3 = require('sqlite3');
const PORT = 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const BandwidthMessaging = require('@bandwidth/messaging');
BandwidthMessaging.Configuration.basicAuthUserName = process.env.MESSAGING_API_TOKEN;
BandwidthMessaging.Configuration.basicAuthPassword = process.env.MESSAGING_API_SECRET;
const messagingController = BandwidthMessaging.APIController;

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
cron.schedule("0 8 * * *", () => {
    console.log('running a job every minute');
    // Get all phone numbers then call getCities
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
    console.log(req.body);
    res.send('message recieved');
})

app.listen(PORT, () => {
    console.log("Server running on " + PORT);
});

// Use Bandwidth API to send a message
const sendMessage = async (num, message) => {

    let body = new BandwidthMessaging.MessageRequest({
        "applicationId": "d22c04d9-5ff4-4e1e-902f-d3364fd4d61e" ,
        "to": num,
        "from": "+19194802826",
        "text": message
    });

    try {
        const result = await messagingController.createMessage("u-axcwcuurfwxes54fxhgkytq", body);
        console.log(result);
    }
    catch (e) {
        console.log(e);
    }

}
