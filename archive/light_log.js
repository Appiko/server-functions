const APP_NAME = "light log"
const PORT = 3100


const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const helmet = require('helmet')
const fs = require('fs')
const path = require('path')
const serveIndex = require('serve-index');


const DIR_NAME = `${__dirname}/logs/light-logs`
app.use(helmet())
app.use(bodyParser.json())

app.use('/logs', serveIndex((path.join(__dirname, DIR_NAME))));
app.use('/logs', express.static((path.join(__dirname, DIR_NAME))));


const dir = path.join(__dirname, DIR_NAME);

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    console.log(`Creating dir ${dir}`);
}

app.listen(PORT, () => {
    console.log(`${APP_NAME} listening on port ${PORT}...`)
})

app.post('/', (req, res) => {
    const date = new Date();
    const data = req.body;
    console.log(data);

    filePath = `${dir}/${data['address']}`;
    fileContents = `${data['address']},${data['val']},${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')},${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}\n`
    fs.appendFile(filePath, fileContents, function (err) {
        if (err) {
            console.log(err);
            res.status(500).send();
            // throw err;
        }
        res.status(200).send("OK");
        console.log('Saved!');
    });

});