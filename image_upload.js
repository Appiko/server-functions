const APP_NAME = "Image upload"
const PORT = 3100




const app = require('express')()
const bodyParser = require('body-parser')
const helmet = require('helmet')
var stringify = require('json-stringify-safe');
const fs = require('fs');

app.use(helmet())
app.use(bodyParser.json())
app.use(bodyParser.raw({ type: 'image/png', limit: '50mb' }))

const FCM = require('fcm-node')
// const serverKey = require('./sense-ele-firebase-service-account.json')
// const fcm = new FCM(serverKey)


app.listen(PORT, () => {
    console.log(`${APP_NAME} listening on port ${PORT}...`)
})

app.get('/image', function (req, res, next) {
    res.send(`Get working`);
});

app.post('/image/:filename', function (req, res) {

    saveImage(`${req.params.filename}_${Date.now()}_${req.params.filename.split('.').pop()}`, req.body);

    const message = {
        to: '/topics/image',
        notification: {
            title: `Image`,
            body: `Image captured`,
        },
    }

    fcm.send(message, function (err, response) {
        if (err) {
            console.log(`Something has gone wrong! ${err}`)

            res.status(500).send(`Something went wrong! ${err}🚨🚨`)
        } else {
            console.log(`Sent alert for image`)
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