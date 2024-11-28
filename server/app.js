const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const express = require('express');
const app = express();

// //middlewares
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.use(morgan('dev'))
// app.use(
//     cors({
//         origin:["http://localhost:3000","http://localhost:3001"],
//         methods : ["GET","POST","PUT","DELETE"],
//         credentials:true
//     }))

app.use(express.static("public"));
app.use(express.static(path.resolve("./public")));

//Import all routes
const userRoutes = require('./routes/user.route.js');
const taskRoutes = require('./routes/Task.route.js');
//User Route
app.use("/api/user", userRoutes);
//Task Route
app.use("/api/task", taskRoutes);


module.exports = {app};