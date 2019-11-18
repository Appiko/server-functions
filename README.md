## Ele Services


### Alerting
Make sure to place the `sense-ele-firebase-service-account.json` file at the root.

Run `npm start`

### Check nodes/gateways
Set the hausra key and graphql endpoint as environment variable

`export HASURASECRET=HASURA_KEY`


`export GQLENDPOINT=GRAPH_QL_ENDPOINT`

Saving it in ~/.bash_profile is a better option

Run the checkNodes / checkGateways

`node checkGateways.js`

This should most likely be called every x mins as a cron job.