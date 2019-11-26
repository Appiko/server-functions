const APP_NAME = "Image upload"
const PORT = 3600



const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const helmet = require('helmet')
const path = require('path')
var stringify = require('json-stringify-safe')
const fs = require('fs')
const serveIndex = require('serve-index')

app.use(helmet())
app.use(bodyParser.json())
app.use(bodyParser.raw({ type: 'image/png', limit: '50mb' }))



app.use('/uploads', serveIndex((path.join(__dirname, 'uploads'))));
app.use('/uploads', express.static((path.join(__dirname, 'uploads'))));
const FCM = require('fcm-node')
const serverKey = require('./sense-ele-firebase-service-account.json')
const fcm = new FCM(serverKey)


app.listen(PORT, () => {
    console.log(`${APP_NAME} listening on port ${PORT}...`)
})

app.get('/image', function (req, res, next) {
    res.send(`Get working`);
});

app.post('/image/:filename', function (req, res) {

    fileName = `${req.params.filename}_${Date.now()}.${req.params.filename.split('.').pop()}`
    saveImage(fileName, req.body);

    res.sendStatus(200);

    const message = {
        to: `/topics/image`,
        notification: {
            title: "New Image captured",
            body: fileName,
            click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        data: {
            title: "New Image captured",
            body: fileName,
        }
    }

    fcm.send(message, function (err, response) {
        if (err) {
            console.log(`Something has gone wrong! ${err}`)

            res.status(500).send(`Something went wrong! ${err}🚨🚨`)
        } else {
            console.log(`Sent alert for new image`)
        }
    })
});


function saveImage(filename, data) {
    var myBuffer = new Buffer.alloc(data.length);
    for (var i = 0; i < data.length; i++) {
        myBuffer[i] = data[i];
    }
    fs.writeFile('./uploads/r/' + filename, myBuffer, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });
}