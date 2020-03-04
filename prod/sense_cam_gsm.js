const PORT = 3600;

const express = require('express');
const bodyParser = require('body-parser');
const serveIndex = require('serve-index');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const FCM = require('fcm-node')
const serverKey = require(`${__dirname}/../sense-ele-firebase-service-account.json`)
const fcm = new FCM(serverKey)

const app = express();

app.use(bodyParser.raw({ type: "*/*" }));

app.use('/uploads', serveIndex((path.join(__dirname, 'uploads'))));
app.use('/uploads', express.static((path.join(__dirname, 'uploads'))));

app.listen(PORT, console.log(PORT));


app.get('/cage-closed', function (req, res) {
    const message = {
        to: `/topics/image`,
        notification: {
            title: "Cage closed",
            body: `Cage closed`,
        },
        data: {
            title: "Cage closed",
            body: `Cage closed`,
        }
    }

    fcm.send(message, function (err, response) {
        if (err) {
            console.log(`Something has gone wrong! ${err}`)
            res.status(500).send(`Something went wrong! ${err}🚨🚨`)
        } else {
            console.log(`Sent alert for cage close`)
            res.sendStatus(200);
        }
    })
})

app.post('/chunked/:filename', function (req, res) {

    fileName = `/chunked/${req.params.filename}_${Date.now()}.${req.params.filename.split('.').pop()}`
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
    fs.writeFile(`${__dirname}/uploads/r/` + filename, myBuffer, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });
}