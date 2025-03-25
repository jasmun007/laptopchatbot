import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import MarkdownIt from "markdown-it";
import "./style.css";

let API_KEY = "AIzaSyDJoJ8w8OMluwPH4wGqzpwFFKgO-G13bYE";

let promptInput = document.querySelector('input[name="prompt"]'); // changed input to read only
let chatMessages = document.querySelector(".chat-messages"); // changed to chat messages instead
let sendButton = document.querySelector(".send"); // added send button

let conversationHistory = []; // Initialize conversation history

const md = new MarkdownIt();

// Function to display messages in chat
const displayMessage = (message, role) => {
  
  // create dynamic div if it don't exist
  let messageContainer = document.querySelector('.message-container');
  if (!messageContainer) {
    messageContainer = document.createElement('div');
    messageContainer.className = 'message-container has-messages';
    document.querySelector('main').insertBefore(messageContainer, document.querySelector('.input-box'));
    
    const chatMessages = document.createElement('div');
    chatMessages.className = 'chat-messages';
    messageContainer.appendChild(chatMessages);
  }

  const chatMessages = document.querySelector(".chat-messages");
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", role);
  messageDiv.innerHTML = md.render(message);
  chatMessages.appendChild(messageDiv);

  // smooth scroll
  messageContainer.scrollTo({
    top: messageContainer.scrollHeight,
    behavior: 'smooth'
  });
};

// Function to get AI response
const getResponse = async (userPrompt) => {
  let fullPrompt = `You are a specialized assistant whose sole purpose is to help users buy laptops.
  You can provide information about laptop specifications, compare models, recommend laptops based on user needs, and guide users through the purchasing process.
  You will choose for the user based on their requirements. You will assume the user doesn't know much about laptops and will reduce the amount of jargon as much as possible.
  You cannot assist with any other topics or tasks. You will only ask for the requirements once and not ask for clarification. You will assume the user is in the UK.
  You can use the internet to find specific items and provide links to the products you suggest.
  If a user asks about something unrelated to buying laptops, respond with a clear message indicating that you can only help with laptop-related matters.`;

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

  for await (let response of result.stream) {
    fullResponse += response.text();
  }

  // Display assistant's response
  displayMessage(fullResponse, "assistant");

  // response to convo history
  conversationHistory.push({
    role: "Assistant",
    message: fullResponse,
  });
};

// Event listener for send button
sendButton.addEventListener("click", async (ev) => {
  ev.preventDefault();
  const userPrompt = promptInput.value.trim();

  if (!userPrompt) {
    return;
  }

  displayMessage(userPrompt, "user");
  promptInput.value = "";
  conversationHistory.push({ role: "User", message: userPrompt });

  sendButton.disabled = true;
  sendButton.textContent = "Sending...";

  try {
    await getResponse(userPrompt);
  } catch (e) {
    displayMessage(`<hr>${e}`, "error");
  }

  sendButton.disabled = false;
  sendButton.textContent = "Send";
});
