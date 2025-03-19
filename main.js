
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import MarkdownIt from "markdown-it";
import "./style.css";

let API_KEY = "AIzaSyDJoJ8w8OMluwPH4wGqzpwFFKgO-G13bYE";

let form = document.querySelector("form");
let promptInput = document.querySelector('input[name="prompt"]'); //changed input to be read only
let output = document.querySelector(".output");
let sendButton = document.querySelector(".send"); //added send button

let conversationHistory = []; // Initialize conversation history

const md = new MarkdownIt();

const displayMessage = (message, role) => {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", role);
  messageDiv.innerHTML = md.render(message);
  output.appendChild(messageDiv);
  output.scrollTop = output.scrollHeight; // Scroll to bottom
};

const getResponse = async (userPrompt) => {
  let fullPrompt = `You are a specialized assistant whose sole purpose is to help users buy laptops.
  You can provide information about laptop specifications, compare models, recommend laptops based on user needs, and guide users through the purchasing process
  choose for the user based on their requirements. You will assume the user doesn't know much about laptops and will need to reduce the amount of jargon you use as much as possible.
  You cannot assist with any other topics or tasks. You will only as for the requirments once and not ask for clarification. You will assume the user is in the UK.You can use the internet to find specific items and provide links to the products you suggest.
  If a user asks you about something unrelated to buying laptops, respond with a clear message indicating that you can only help with laptop-related matters.`;

  // Add conversation history to the prompt
  if (conversationHistory.length > 0) {
    fullPrompt += "\n\nPrevious conversation:\n";
    conversationHistory.forEach((turn) => {
      fullPrompt += `${turn.role}: ${turn.message}\n`;
    });
  }

  fullPrompt += `\n\nUser: ${userPrompt}\nAssistant:`;
  
  let contents = [{ parts: [{ text: fullPrompt }] }];

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ],
  });

  const result = await model.generateContentStream({ contents });
  let fullResponse = "";

  output.innerHTML = "";
  
  for await (let response of result.stream) {
      fullResponse += response.text();
  }
  
    // Display the full response once
    displayMessage(fullResponse, "assistant");


  // Add the assistant's response to the conversation history
  conversationHistory.push({
    role: "Assistant",
    message: fullResponse,
  });
};

sendButton.addEventListener("click", async (ev) => {
    ev.preventDefault();
    const userPrompt = promptInput.value;

    if (!userPrompt) {
      return;
    }
  
    //display user prompt
    displayMessage(userPrompt, "user");

    promptInput.value = ""; // Clear input field
  
    // Add the user's prompt to the conversation history
    conversationHistory.push({ role: "User", message: userPrompt });
  
    //disable button
    sendButton.disabled = true;
    sendButton.textContent = "Sending...";
  
    try {
      await getResponse(userPrompt);
    } catch (e) {
      displayMessage("<hr>" + e, "error");
    }
  
    //enable button
    sendButton.disabled = false;
    sendButton.textContent = "Send";
  });
  
  
  
