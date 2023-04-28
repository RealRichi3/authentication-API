import { createClient } from 'redis'
import { REDIS_URL } from '../config'

const redis_client = createClient({
    url: REDIS_URL
})

redis_client.on('error', (error) => {
    console.log('An error occured while connecting to REDIS')
    console.log(error)
    process.exit(1)
})

redis_client.on('connect', () => {
    console.log('Connection to REDIS database successful')
})

export default redis_client