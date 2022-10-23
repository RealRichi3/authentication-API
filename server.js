require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

const app = require('./app')
const PORT = process.env.PORT || 5527
const connectDatabase = require("./db/connectDB");


async function start() {
    try {
        await connectDatabase(process.env.MONGO_URI);

        app.listen(PORT, function () {
            console.log(`Server is running on port ${PORT}....`);
        });
    } catch (error) {
        console.log(error);
    }
}

start()
