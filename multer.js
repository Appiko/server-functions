const PORT = 3700
var express = require('express')
var multer = require('multer')
var helmet = require('helmet')

var app = express();

app.use(helmet());

const FCM = require('fcm-node')
const serverKey = require('./sense-ele-firebase-service-account.json')
const fcm = new FCM(serverKey)


let fileName = '';
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/r/')
    },
    filename: function (req, file, cb) {
        console.log("GOT " + file.originalname);
        const extension = file.originalname.split('.').pop();
        fileName = `multer/${file.originalname.split('.')[0]}-${Date.now()}.${extension}`;
        cb(null, fileName);
    }
})
var upload = multer({ storage: storage });


app.post('/image', upload.single('image'), function (req, res, next) {
    if (req.file) {
        const message = {
            to: '/topics/image',
            notification: {
                title: `🚨🚨 Alert!! 🐘🏃`,
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
                console.log(`Sent alert for image`)
            }
        })
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
})

app.listen(PORT, () => console.log(PORT));