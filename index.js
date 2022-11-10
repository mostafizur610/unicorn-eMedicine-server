const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middle wares
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.etkkvpu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    // console.log(req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db('unicornEmedicine').collection('services');
        const reviewCollection = client.db('unicornEmedicine').collection('reviews');

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ token });
        })

        app.get('/services', async (req, res) => {
            const limit = parseInt(req.query.limit);

            if (limit) {
                const cursor = serviceCollection.find().limit(limit).sort({ "createdAt": -1 });
                const services = await cursor.toArray();
                return res.send(services);
            }

            const cursor = serviceCollection.find().sort({ "createdAt": -1 });
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/serviceDetails/:id', async (req, res) => {
            const id = new ObjectId(req.params.id);
            const serviceQuery = { _id: id }
            const reviewQuery = { serviceId: id }
            const serviceDetails = await serviceCollection.findOne(serviceQuery);
            const reviews = await reviewCollection.find(reviewQuery).toArray();
            serviceDetails.reviews = reviews;
            // console.log(serviceDetails);
            res.send(serviceDetails);
        });

        app.post('/service', async (req, res) => {
            const name = req.body.serviceName;
            const image = req.body.imageUrl;
            const rating = req.body.rating;
            const price = req.body.price;
            const details = req.body.details;
            const createdAt = new Date();
            const updatedAt = new Date();

            const serviceData = { name, image, rating, price, details, createdAt, updatedAt }

            const data = await serviceCollection.insertOne(serviceData);
            res.send(data);
        });

        app.post('/review', async (req, res) => {
            const email = req.body.email;
            const rating = req.body.rating;
            const review = req.body.review;
            const serviceId = ObjectId(req.body.serviceId);
            const createdAt = new Date();
            const updatedAt = new Date();
            const reviewData = { email, rating, review, createdAt, updatedAt, serviceId }
            const data = await reviewCollection.insertOne(reviewData);
            res.send(data);
        });

        app.get('/review', verifyJWT, async (req, res) => {
            // console.log(req.query);
            const email = req.query.email;
            const query = { email: email }
            const reviewData = await reviewCollection.find(query).toArray();
            for (let i = 0; i < reviewData.length; i++) {
                const service = await serviceCollection.findOne({ _id: reviewData[i].serviceId });
                reviewData[i].service = service;
            }
            res.send(reviewData);
        });

        app.get('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const reviewData = await reviewCollection.findOne(query);
            res.send(reviewData);
        });

        // update
        app.put('/review/:id', async (req, res) => {
            const id = req.params.id;
            const rating = req.body.rating;
            const review = req.body.review;
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: { rating, review }
            }
            const result = await reviewCollection.updateOne(query, updatedDoc);
            res.send(result);
        })

        // delete row
        app.delete('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        })
        // delete card
        // app.delete('/services', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const result = await reviewCollection.deleteOne(query);
        //     res.send(result);
        // })
    }
    finally {

    }
}
run().catch(error => console.error());

app.get('/', (req, res) => {
    res.send('Unicorn is running away...')
})

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
})