const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');

require('dotenv').config();

const port = process.env.PORT || 5000;

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }));

app.use(express.json());

async function main(){
    await mongoose.connect(process.env.DB_CONNECTION_STRING);
    console.log('Connected to MongoDB');
}

main().catch(console.error);

app.use('/api/login', require('./routes/login'));
app.use('/api/refresh-token', require('./routes/refreshToken'));
app.use('/api/registro', require('./routes/registro'));
app.use('/api/reservas', require('./routes/reservas'));
app.use('/api/signout', require('./routes/signout'));
app.use('/api/user', require('./routes/user'));

app.get('/', (req, res) => { 
    res.send('Hello World');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});