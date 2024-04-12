const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const winston = require('winston');
const WebSocket = require('ws');

dotenv.config();

const app = express();

// Set up CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3001', 'https://joeseph-x-geraldine.we-devsgh.online'],
    methods: 'GET',
}));

// Set up logging
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    // defaultMeta: { service: 'efuaxned' },
    defaultMeta: { service: 'gerixtrig' },
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

// Initialize WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    logger.info('Client connected');
  
    ws.on('message', function incoming(message) {
        logger.info('Received message:', message);
    });

    ws.on('close', function close() {
        logger.info('Client disconnected');
    });

    ws.on('error', function error(err) {
        logger.error('WebSocket error:', err);
    });
});

// Set up express-session
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const uploadSchema = require('./alluploads-schemas');
const userSchema = require('./allrsvps-schemas');

const User = mongoose.model('gerixtrigrsvp', userSchema);
const Upload = mongoose.model('gerixtrigsharedimages', uploadSchema);

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


app.post('/upload', async (req, res) => {
    const imgUrls = req.body.images;
    try {
        const upload = new Upload({
            imageUrls: imgUrls
        });
        await upload.save();

        logger.info('Images saved:', upload);

        wss.clients.forEach(client => {
            client.send('New photo uploaded');
          });

        res.json({ message: 'Images saved' });
        } catch (error) {
        // Log and send error response
        logger.error('Error during image upload:', error);
        res.status(500).json({ error: 'Error during image upload' });
    }
});


// Get all image URLs
app.get('/imageUrls', async (req, res) => {
    try {
      const uploads = await Upload.find();
      const imageUrls = uploads.flatMap(upload => upload.imageUrls); // Use flatMap to flatten the array of arrays
      res.json(imageUrls);
    } catch (error) {
      console.error('Error fetching image URLs:', error);
      res.status(500).json({ error: 'Error fetching image URLs' });
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


const port = process.env.PORT || 7000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
