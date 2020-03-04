const APP_NAME = "get_medium"
const PORT = 3200




const app = require('express')()
const bodyParser = require('body-parser')
const helmet = require('helmet')
const axios = require('axios')

app.use(helmet())
app.use(bodyParser.json())

app.listen(PORT, () => {
	console.log(`${APP_NAME} listening on port ${PORT}...`)
})

app.get('/alert', (req, res) => {

	let queryByte = req.query.q;
	console.log(queryByte);

	let node;
	switch (queryByte) {
		case 'A':
			node = '4c:56:9c:9f:7f:b5'
		case 'B':
			node = 'cc:3f:70:e1:bc:f7'
		case 'C':
			node = 'f2:5d:cf:3f:cb:da'
		case 'D':
			node = 'e4:34:d4:dd:7c:9a'
		case 'E':
			node = '28:f0:7b:4c:99:1e'
	}

	if (node != undefined) {
		const query = { "query": `mutation MyMutation { insert_alert(objects: {node_id: "${node}", gateway_id: "a1:b2:c0:a1:b0:c0"}) { affected_rows } }` };

		const axiosQuery = {
			method: 'POST',
			url: process.env.GQLENDPOINT,
			data: query,
			headers: {
				'x-hasura-admin-secret': process.env.HASURASECRET,
			},
		};



		axios(axiosQuery)
			.then((x) => { console.log(x['data']); res.status(200).send("DONE"); })
			.catch((e) => { console.log(e); });
	} else {
		res.send(res.status(400).send("No nodes"));
	}

});

