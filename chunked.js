var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');

var app = express();
app.use(bodyParser.raw({ type: "*/*" }));
app.listen(3000, console.log(3000));


const FCM = require('fcm-node')
const serverKey = require('./sense-ele-firebase-service-account.json')
const fcm = new FCM(serverKey)



app.post('/chunked/:filename', function (req, res) {
    // console.log(JSON.stringify(req, null, 2));
    console.log(req.headers);

    console.log(req.body);
    fileName = `chunked/${req.params.filename}_${Date.now()}.${req.params.filename.split('.').pop()}`
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