import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './db/index.js';

dotenv.config();

const port = process.env.PORT || 3000;

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log('Server started');
        });
    })
    .catch((error) => {
        console.log('Mongodb connection error ', error);
        process.exit(1);
    });
