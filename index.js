const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

function run() {

}
run();

app.get('/', (req, res) => {
    res.send('Unicorn is running away...')
})

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
})