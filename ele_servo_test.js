
const app = require('express')()
const helmet = require('helmet')
const fs = require('fs')
const path = require('path')

app.use(helmet())


const APP_NAME = "ELE SERVO TEST"
const PORT = 3335

const APP_BUFFER_TIME_MS = 2000
const LOG_FILE = "log"
const ERR_FILE = "err"
const DIR_NAME = "ele-servo-logs"



let t0, t1, t2, t3;
const timers = [t0, t1, t2, t3];
timers.length = 4;


let dir = path.join(__dirname, DIR_NAME);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    console.log(`Creating dir ${dir}`);
}

app.listen(PORT, () => console.log(`${APP_NAME} listening on port ${PORT}`))

function logToFile(id, isErr = false) {
    console.log(`logging ${id}`);
    let filePath = `${dir}/${isErr ? ERR_FILE : LOG_FILE}`;
    let fileContents;
    if (isErr) {
        fileContents = `False RF packet from ${id}`
    } else {
        fileContents = `Didn't receive RF for ${id}`
    }

    fileContents = fileContents + '\t\t' + Date() + '\n';

    fs.appendFile(filePath, fileContents, function (err) {
        if (err) {
            console.log(err);
        }
    });
}

app.get(`/:id`, (req, res) => {
    id = req.params.id;
    try {
        if (id > (timers.length - 1)) { throw Error(`${id} is greater than ${timers.length - 1}`); }
        timers[id] = setTimeout(logToFile, APP_BUFFER_TIME_MS, id)
        res.sendStatus(200);
    } catch (error) {
        console.dir(error);
        res.send(400);
    }
})

app.get(`/rx/:id`, (req, res) => {
    id = req.params.id;
    try {
        console.log(timers[id]);
        if (timers[id] == undefined) {
            logToFile(id, true);
        } else {
            clearTimeout(timers[id]);
        }
        res.sendStatus(200)
    } catch (error) {
        console.error(error)
        res.sendStatus(400)
    }
})



