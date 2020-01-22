const APP_NAME = "Gateway Rx"
const PORT = 3333
const FILE_NAME = "recieved_requests.log"




const app = require('express')()
const bodyParser = require('body-parser')
const helmet = require('helmet')
const fs = require('fs')


app.use(helmet())
app.use(bodyParser.raw())


app.listen(PORT, () => {
    console.log(`${APP_NAME} listening on port ${PORT}...`)
})



app.post('/', (req, res) => {
    let z = [...req.body]
    updateFile(z.join(" "));
    res.status(200).send();
});

app.get('/contents', (req, res) => {
    fs.readFile(FILE_NAME, function (err, data) {
        res.writeHead(200, null, { 'Content-Type': 'text/plain' })
        res.write(data);
        res.end();
    })

});


app.all('/delete-contents', (req, res) => {
    fs.writeFile(FILE_NAME, "", () => res.status(200).send("DONE"));
})

function updateFile(fileContent) {
    fs.appendFile(FILE_NAME, fileContent + '\t' + Date() + '\n', function (err) {
        if (err) throw err;
    });
}