const express = require('express')
const morgan = require('morgan')
require('dotenv').config()

const {asyncWrapper} = require("./middlewares/asyncWrapper")
const {connectToDB} = require('./db/connectDB')
const {errorHandler} = require('./middlewares/errorHandler')


const config = process.env
const app = express()
app.use(express.json())


app.use(morgan('dev'))

// Access-Control-Allowed-Origins
app.use((req, res, next) => {
    const allowed_origins = []
    const origin = req.header.origin;

    if (allowed_origins.includes(origin)) {
        res.setHeader('Acces-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', true);

    next()
})

const authRoute = require('./routes/authRoutes')


// Auth 
app.use('/api/auth', authRoute)



app.use(errorHandler)


async function start(){
    try {
        // connerct to database
        await connectToDB(config.MONGO_URI)

        // express server init
        const PORT = config.PORT || 3343
        app.listen(PORT, ()=> {
            console.log(`Server currently listening on port ${PORT}`)
        })
    } catch (error) {
        console.log(error)
    }
}

start()




