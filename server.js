// importing 
import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js'
import Pusher from 'pusher'
import cors from 'cors'

// app config
const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: "1286132",
    key: "fa14fc9271ab4c159777",
    secret: "3688ef1641703705d7e4",
    cluster: "us2",
    useTLS: true
  });

// middleware
app.use(express.json());
app.use(cors());

// DB config
const connection_url = 'mongodb+srv://admin:Qj8kwjacVQ0XrVjo@cluster0.s9ho2.mongodb.net/whatsappdb?retryWrites=true&w=majority'

mongoose.connect(connection_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, err => {
    if (err) {
        console.log(err)
    }
});

const db = mongoose.connection;

db.once('open', () => {
    console.log('DB connected')

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp
                }
            );
        } else {
            console.log('Error triggering Pusher')
        }

    });
});

// ???

// api routes
app.get('/', (req, res) => res.status(200).send('hello world'))

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})

// listener
app.listen(port, () => console.log(`Listening on localhost:${port}`))


// Qj8kwjacVQ0XrVjo