const APP_NAME = "GSM Gateway Rx"
const PORT = 3501

const app = require('express')()
const bodyParser = require('body-parser')
const helmet = require('helmet')
const fs = require('fs')
const path = require('path')

const DIR_NAME = `/logs/uart/`

app.use(helmet())
app.use(bodyParser.text())
let dir = path.join(__dirname, DIR_NAME);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    console.log(`Creating dir ${dir}`);
}

app.listen(PORT, () => {
    console.log(`${APP_NAME} listening on port ${PORT}...`)
})



app.post('/:page', (req, res) => {
    updateFile(req.body, req.params['page']);
    res.status(200).send();
});

app.get('/contents/:page', (req, res) => {
    try {
        fs.readFile(dir + req.params['page'] + ".log", function (err, data) {
            res.writeHead(200, null, { 'Content-Type': 'text/plain' })
            res.write(data);
            res.end();
        })
    } catch (error) {
        console.log(error)
    }

});


app.all('/delete-contents/:page', (req, res) => {
    fs.writeFile(dir + req.params['page'] + ".log", "", () => res.status(200).send("DONE"));
})

function updateFile(fileContent, page) {
    fileContent = fileContent.split("\n").map(line => `${Date().replace(RegExp(" GMT.*"), '')}\t${line}\n`).join('');
    fs.appendFile(dir + page + ".log", fileContent, { flag: 'a' }, function (err) {
        if (err) throw err;
    });
}
