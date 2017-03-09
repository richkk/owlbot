# owlbot
## Team 10 Challenge
Owlbot is a chat bot built with Node.js, Botkit, and the Google Firebase SDK. It is the bot that knows a lot about WHO,
saving information about employee roles and areas of expertise to a Firebase database. If you've ever wondered WHO in
the company can help you with a problem, Owlbot can help!

## Features
* Extremely fast deployment using open source and free technologies
* Grows more useful as users teach it
* Technology agnostic:
    * Node.js is the lingua franca of server-side applications
    * Botkit works with a variety of messaging apps
    * Firebase could be replaced with another NoSQL database for added functionality, like AWS Elasticsearch or Mongo
* Hilarious owl jokes and dank memes

## Installation
* `git clone` this repository
* Navigate to the project directory
* Install required node modules: `npm install`

## Setup Required Properties
* In the root level project directory, create a `.env` file
* In the `.env` file, add `SLACK_TOKEN=$theBotToken`, replacing `$theBotToken` with the API token for this project's Slack Bot.
* You will need to add similar properties for Firebase configurations, etc.

## Running Locally

`npm start`

## Deploying to Heroku

* Create a Heroku account and install the Heroku CLI following instructions on Heroku site
* `heroku login` to set your credentials
* `heroku create` (unless you want to use an existing Heroku deployment) - this creates a heroku remote for the app
* `git push heroku master` - this builds and deploys the app on heroku
* Once the project is deployed, ensure the environment variables are set correctly: `heroku config`
* If the configs are not correct, run `heroku config:set SLACK_TOKEN=$theBotToken`, replacing as appropriate
* Make sure the app is scaled correctly, run `heroku ps:scale worker=1` and `heroku ps:scale web=0` - this shouldn't be necessary given settings in the Procfile, but sometimes Heroku seems to ignore the Procfile