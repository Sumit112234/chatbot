import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={API_KEY}"

# Chat history (optional memory)
chat_history = [
    {"role": "user", "parts": [{"text": "Hello, who are you?"}]},
    {"role": "model", "parts": [{"text": "I'm Gemini, your helpful assistant."}]}
]

# New message
chat_history.append({
    "role": "user",
    "parts": [{"text": "Can you explain the difference between list and tuple in Python?"}]
})

# Request body
payload = {
    "contents": chat_history,
    "generationConfig": {
        "temperature": 0.7,
        "topK": 1,
        "topP": 1,
        "maxOutputTokens": 256
    }
}

# Make request
res = requests.post(URL, json=payload)

# Handle response
if res.status_code == 200:
    result = res.json()
    reply = result['candidates'][0]['content']['parts'][0]['text']
    print("Gemini:", reply)
else:
    print("Error:", res.status_code, res.text)


# from datetime import datetime, timezone
# import google.generativeai as genai
# import os
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv()
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


# # Initialize Gemini client and chat session
# client = genai.Client()
# chat = client.chats.create(model="gemini-1.5-flash")  # or "gemini-1.5-pro"

# print("🤖 Gemini Terminal Chatbot")
# print("Type 'exit' to quit.")
# print("--------------------------")

# # Chat loop
# while True:
#     user_input = input("You: ")

#     if user_input.lower() in ["exit", "quit"]:
#         print("👋 Exiting chat. Jai Siya Ram!")
#         break

#     # Stream AI response
#     print("Gemini:", end=" ", flush=True)
#     try:
#         response = chat.send_message_stream(user_input)
#         for chunk in response:
#             print(chunk.text, end="", flush=True)
#         print("\n")
#     except Exception as e:
#         print(f"\n❌ Error: {str(e)}\n")

# # Show chat history
# print("\n🧠 Chat History:")
# for message in chat.get_history():
#     role = "You" if message.role == "user" else "Gemini"
#     print(f"{role}: {message.parts[0].text}")

# # Timestamp
# print("\n📅 Chat ended at:", datetime.now(timezone.utc).isoformat())
