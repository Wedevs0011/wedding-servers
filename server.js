const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const winston = require('winston');
dotenv.config();

const app = express();

// Set up CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3001', 'https://ned-x-efua-wed.we-devsgh.online'],
    methods: 'GET',
}));

// Set up logging
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'efuaxned' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

// MongoDB connection
mongoose.connect(process.env.DB_ACCESS, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', (error) => {
    logger.error('MongoDB connection error:', error);
    console.error('MongoDB connection error:', error);
});

db.once('open', () => {
    logger.info('Connected to MongoDB');
});

// Set up express-session
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const userSchema = require('./allrsvps-schemas');

const User = mongoose.model('efuaxnedrsvp', userSchema);

// Register endpoint
app.post('/rsvp', async (req, res) => {
    const { name } = req.body;

    try {
        const existingUser = await User.findOne({ name });
        if (existingUser) {
            logger.warn(`User already exists: ${name}`);
            return res.status(409).json({ error: 'User already exists' });
        }

        const uuid = uuidv4();
        const user = new User({ name, uuid });

        await user.save();
        logger.info('User saved:', user);
        res.json({ message: `Thanks for the RSVP ${name}! See you soon!` });
    } catch (error) {
        logger.error('Error during registration:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Login endpoint
app.get('/dashboard', async (req, res) => {
    try {
        const allNames = await User.find({}, 'name');
        if (!allNames || allNames.length === 0) {
            logger.warn('No names found');
            return res.status(404).json({ error: 'No names found' });
        }

        const names = allNames.map(user => user.name);
        res.json(names);
    } catch (error) {
        logger.error('Error during dashboard retrieval:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
    console.log(`Server is running on port ${port}`);
});
