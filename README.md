# Bandwidth Messaging Demo App

This is a simple app made to demo the usage of Bandwidth's messaging API--it sends all of its users a text message with the weather for the day at 8 am at their desired location. In order to run this project, you must have node, npm, and sqlite3 installed. 

install dependencies: 
```
npm install . 
```
create database:
```
sqlite3 users.db
.read init.sql
.exit
```

Configure .env:
```
echo "BANDWIDTH_PASSWORD=your_password" >> .env
echo "BANDWIDTH_USER=your_user" >> .env
echo "WEATHER_API_KEY=your_openweather_apikey" >> .env
echo "FROM_PHONE=your_application_phone" >> .env
echo "applicationId=your_appId" >> .env
```

run:
```
npm start
```

When running the application locally, you can visit localhost:4000/register to add users from an html form. 