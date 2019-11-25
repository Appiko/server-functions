const APP_NAME = "Image upload"
const PORT = 3200




const app = require('express')()
const bodyParser = require('body-parser')
const helmet = require('helmet')

app.use(helmet())
app.use(bodyParser.json())

const FCM = require('fcm-node')
const serverKey = require('./sense-ele-firebase-service-account.json')
const fcm = new FCM(serverKey)

const multer = require('multer')
const storage = multer.diskStorage(
    {
        destination: './uploads/',
        filename: function (req, file, cb) {
            console.log("GOT " + file.originalname);
            const extension = file.originalname.split('.').pop();
            cb(null, `${file.originalname.split('.')}-${Date.now()}.${extension}`);
        }
    }
);
const upload = multer({ storage: storage });


app.listen(PORT, () => {
    console.log(`${APP_NAME} listening on port ${PORT}...`)
})
app.get('/image', upload.single('image'), function (req, res, next) {


    const message = {
        to: '/topics/image',
        notification: {
            title: `🚨🚨 Alert!! 🐘🏃`,
            body: `Image captured`,
        },
    }

    fcm.send(message, function (err, response) {
        if (err) {
            console.log(`Something has gone wrong! ${err}`)

            res.status(500).send(`Something went wrong! ${err}🚨🚨`)
        } else {
            console.log(`Sent alert for node ${node}`)
        }
    })
    res.send(`Sent alert for node ${node}`);
});
