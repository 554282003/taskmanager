const dotenv = require('dotenv');
const {app} = require('./app');
const dbConnection = require('./utils/dbConfig');

dotenv.config()
dbConnection().then(() => {
    // console.log('Database connected');
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on http://localhost:${process.env.PORT || 8000}`);
    });
}).catch((err) => {
    console.log("Database connection failed", err);
})
