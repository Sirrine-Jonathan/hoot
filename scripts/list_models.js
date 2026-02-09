const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const apiKey = "AIzaSyCZDjIeAGOpv74CiYsvhlUVotg8U9JsOcg";
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We have to use fetch or a different method to list models since the SDK 
    // doesn't have a direct listModels method in all versions.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

listModels();
