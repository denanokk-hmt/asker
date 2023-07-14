'use strict';
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

//config
const conf = require(REQUIRE_PATH.configure);
const credentials = conf.google_sheets_credentials
const token = conf.google_sheets_token

//System modules
const parser = require(`${REQUIRE_PATH.modules}/linkage/csv/parser`)

let spreadsheetData = {}


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = token;

// Load client secrets from a local file.
function getCredit() {
  const credit = fs.readFileSync(credentials, {encoding: "utf-8"});
  const oAuth2Client = authorize(JSON.parse(credit));
  return oAuth2Client
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  const token = fs.readFileSync(TOKEN_PATH, {encoding: "utf-8"});
  if (!token) {
    return getNewToken(oAuth2Client);
  }
  oAuth2Client.setCredentials(JSON.parse(token));
  return oAuth2Client;
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      return oAuth2Client;
    });
  });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
async function sheetReader(auth, spreadsheetId, range) {
  const sheets = await google.sheets({version: 'v4', auth});
  const data = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: range,
  });
  return data
}

/**
 * Get spreadsheet response. and save in newesst array
 * @param {*} spreadsheetId
 * @param {*} range 
 */
const getAskerAnswer = async (spreadsheetId, range) => {
  
  //Get Spreadsheet credit.
  const credit = await getCredit()
  
  //Get Spreadsheet data.
  const sheet = await sheetReader(credit, spreadsheetId, range, (err, res) => {
    if (err) {
      console.log('The API returned an error: ' + err);
      throw new Error(err)
    }
  }).then(results => {
    return results
  })
  .catch(err => {
    throw new Error(err)
  });
  
  //Save in Array
  if (!sheet.data.values) {
    return null
  } else if (sheet.data.values.length) {
    return sheet.data.values
  } else {
    console.log('No data found.');
  }
}
module.exports.funcAnswers = getAskerAnswer

/**
 * Get spreadsheet response. and save in newesst array
 * @param {*} client 
 */
const getAskerResponse = async (client, spreadsheetId, range) => {
  
  //Get Spreadsheet credit.
  const credit = await getCredit()
  
  //Get Spreadsheet data.
  const sheet = await sheetReader(credit, spreadsheetId, range, (err, res) => {
    if (err) {
      console.log('The API returned an error: ' + err);
      throw new Error(err)
    }
  }).then(results => {
    return results
  })
  .catch(err => {
    throw new Error(err)
  });
  
  //Save in Array
  if (sheet.data.values.length) {
    spreadsheetData[client] = parser.parseData(sheet.data.values)
    return spreadsheetData[client]
  } else {
    console.log('No data found.');
    throw new Error('No data found.')
  }
}
module.exports.funcResponse = getAskerResponse