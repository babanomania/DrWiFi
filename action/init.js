// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const { BasicCard, SimpleResponse, Button, dialogflow, Suggestions } = require('actions-on-google');
const fetch = require('isomorphic-fetch');

const mdash_token = 'XXXXXXXXXX';
const mdash_url = 'https://mdash.net/api/v2/devices?access_token=' + mdash_token;

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
	
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    	
	return fetch(mdash_url)
			.then((response) => {
				if( response.status < 200 ||  response.status >= 300){
					throw new Error(response.statusText);
				} else {
					return response.json();
				}
			})
			.then((json) => {
				var data = json;
				
				var network_health = data[0].shadow.state.reported.network_health;
				var last_seen = data[0].shadow.timestamp;
				
				var d = new Date(0);
				d.setUTCSeconds(last_seen);
				
				var time_diff_min = Math.ceil(( new Date() - d ) / 60000 );
				var last_seen_ago = timeSince(d);
				
				if( time_diff_min > 30 ){
					network_health = "bad";
				}
				
				var speechOutput = "Welcome to Dr WIFI!, network health is " + network_health + ", last checked " + last_seen_ago + " ago ";
				var textOutput = "home wifi health is " + network_health + ", last checked " + last_seen_ago + " ago ";
				
				console.log( "network_health " + network_health );
				console.log( "last_seen " + last_seen );
			
				let conv = agent.conv();
				conv.ask(new SimpleResponse({
					text: textOutput,
					speech: '<speak>' + speechOutput + '</speak>',
				}));
				
				agent.add(textOutput);
			});
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

	function timeSince(date) {

	  var seconds = Math.floor((new Date() - date) / 1000);

	  var interval = Math.floor(seconds / 31536000);

	  if (interval > 1) {
		return interval + " years";
	  }
	  interval = Math.floor(seconds / 2592000);
	  if (interval > 1) {
		return interval + " months";
	  }
	  interval = Math.floor(seconds / 86400);
	  if (interval > 1) {
		return interval + " days";
	  }
	  interval = Math.floor(seconds / 3600);
	  if (interval > 1) {
		return interval + " hours";
	  }
	  interval = Math.floor(seconds / 60);
	  if (interval > 1) {
		return interval + " minutes";
	  }
	  return Math.floor(seconds) + " seconds";
	}

  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://assistant.google.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/dialogflow-fulfillment-nodejs/tree/master/samples/actions-on-google
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
