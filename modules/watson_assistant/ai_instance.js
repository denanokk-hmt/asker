'use strict';

//Watson
const AssistantV1 = require('watson-developer-cloud/assistant/v1');
const aiInstance = (AssistantV1, watson) => {
  return new AssistantV1({
    username : watson.CONVERSATION_USERNAME,
    password : watson.CONVERSATION_PASSWORD,
    version : '2019-08-24',
    url : watson.URL
  });
}

//Instance watson conversation
const watsonInstance = (credentials, client) => {
  let ai_instances = []
  for(let i in credentials) {
    console.log(`=======CREDENTIAL ${client} ============`)
    console.log(JSON.stringify(credentials[i]))
    ai_instances.push(aiInstance(AssistantV1, credentials[i]))
  }
  return ai_instances
}
module.exports.func = watsonInstance