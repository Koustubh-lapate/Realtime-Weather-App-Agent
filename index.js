import OpenAI from "openai";
import readlineSync from 'readline-sync';
import dotenv from 'dotenv';

dotenv.config();

const openai_api_key = process.env.OPENAI_API_KEY;

const client = new OpenAI({
    apiKey: openai_api_key,
});

//Tools
function getWeatherDetails(city = '') {
    if(city.toLowerCase() === 'patiala') return '10°C';
    if(city.toLowerCase() === 'mohali') return '14°C';
    if(city.toLowerCase() === 'banglore') return '20°C';
    if(city.toLowerCase() === 'chandigarh') return '7°C';
    if(city.toLowerCase() === 'delhi') return '8°C';
    if(city.toLowerCase() === 'pune') return '12°C';
    if(city.toLowerCase() === 'mumbai') return '22°C';
}

const tools = {
    "getWeatherDetails": getWeatherDetails
}

const SYSTEM_PROMPT = `
You are an AI Assistant with START, PLAN, ACTION, Observation and Output States.
Wait for the user prompt and first PLAN using available tools.
After Planning, Take the action with the appropriate tools and wait for the Observation based on Action.
Once you get the observations, Return the AI response based on the START prompt and observations

Strictly follow the JSON output format as in examples

Available Tools: 
- function getWeatherDetails(city: string): string
getWeatherDetails is a function that accepts city name as a string and returns the weather details

Example:
START 
{ "type": "user", "user": "What is the sum of weather of Patiala and Mohali?" }
{ "type": "plan", "plan": "I will call the getWeatherDetails for Patiala" }
{ "type": "Action", "function": "getWeatherDetails", "input": "patiala" }
{ "type": "observation", "observation": "10°C" }
{ "type": "plan", "plan": "I will call the getWeatherDetails for Mohali" }
{ "type": "Action", "function": "getWeatherDetails", "input": "mohali" }
{ "type": "observation", "observation": "14°C" }
{ "type": "output", "output": "The sum of weather of Patiala and Mohali is 24°C" }
`;

const messages = [{role: 'system', content: SYSTEM_PROMPT}];

while (true) {
    const query = readlineSync.question('Ask your Question - ');
    const q = {
        type: 'user',
        user: query,
    };
    messages.push({ role: 'user', content: JSON.stringify(q) });

    while (true) {
        const chat = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
            response_format: { type: 'json_object' },
        });

        const result = chat.choices[0].message.content;
        messages.push({ role: 'assistant', content: result });

        const call = JSON.parse(result);

        if(call.type == 'output') {
            console.log(call.output);
            break;
        }

        else if (call.type == 'action') {
            const fn = tools[call.function]
            const observation = fn(call.input)
            const obs = { type: 'observation', observation: observation };
            messages.push({ role: 'developer', content: JSON.stringify(obs) });
        }
    }
}