from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime, timezone
from dotenv import dotenv_values
import cohere
import asyncio
import uuid
import os
import traceback
import json


env_vars = dotenv_values(".env")
api_key = env_vars.get("COHERE_API_KEY") or os.getenv("COHERE_API_KEY")

if not api_key:
    raise RuntimeError("COHERE_API_KEY not found in environment")

KNOWLEDGE = ''


with open("knowledge.json", "r", encoding="utf-8") as f:
    KNOWLEDGE = json.load(f)


co = cohere.AsyncClient(api_key)


MODEL_NAME = "command-r-plus"  

app = FastAPI(
    title="AI Chatbot API",
    description="A FastAPI server to interact with Cohere API using streamed responses",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://devin-bot.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic Models ---
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    timestamp: str

class ResetResponse(BaseModel):
    message: str

async def call_cohere_stream_with_retry(prompt: str, max_retries: int = 5, initial_delay: float = 1.0) -> str:
    delay = initial_delay
    for attempt in range(max_retries):
        try:
            stream = co.chat_stream(
                message=prompt,
                model=MODEL_NAME,
                documents=KNOWLEDGE,
                temperature=0.3,
                preamble=(
                    "You are a helpful assistant that only answers questions "
                    "using the provided business knowledge. "
                    "If the question is unrelated to the documents, respond politely with: "
                    "'I'm sorry, I can only answer questions related to Zordly or its services.'"
                ),
                prompt_truncation="AUTO"
            )

            ai_response = ""
            async for event in stream:
                if event.event_type == "text-generation":
                    ai_response += event.text

            return ai_response.strip()

        except Exception as e:
            print(f"Attempt {attempt+1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(delay)
                delay *= 2
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Cohere API call failed after {max_retries} retries: {e}"
                )

# --- API Endpoints ---
@app.get("/", response_model=Dict[str, str])
async def root():
    return {"message": "AI Chatbot API is running!"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_message: ChatMessage):
    try:
        session_id = chat_message.session_id or str(uuid.uuid4())
        ai_response = await call_cohere_stream_with_retry(chat_message.message)

        return ChatResponse(
            response=ai_response,
            session_id=session_id,
            timestamp=datetime.now(timezone.utc).isoformat()
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

@app.get("/health", response_model=Dict[str, str])
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.post("/reset-chat/{session_id}", response_model=ResetResponse)
async def reset_chat(session_id: str):
    return {"message": f"Session ID '{session_id}' reset (no session state stored)."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# from typing import Dict, List
# import httpx
# import os
# from dotenv import load_dotenv
# from fastapi.middleware.cors import CORSMiddleware

# load_dotenv()

# app = FastAPI(
#     title="AI Chatbot API",
#     description="A FastAPI server to interact with Gemini API using streamed responses",
#     version="1.0.0"
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["https://devin-bot.vercel.app", "http://localhost:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

# # app = FastAPI()
# sessions: Dict[str, List[Dict]] = {}

# # Input model
# class ChatRequest(BaseModel):
#     session_id: str
#     message: str

# @app.get("/")
# def root():
#     return {"message": "Welcome to Gemini Chatbot API (direct REST)"}

# @app.get("/health")
# def health():
#     return {"status": "ok"}

# @app.post("/chat")
# async def chat(data: ChatRequest):
#     session_id = data.session_id
#     user_message = data.message

#     # Create session history if not exists
#     if session_id not in sessions:
#         sessions[session_id] = []

#     # Add user message to history
#     sessions[session_id].append({"role": "user", "parts": [user_message]})

#     payload = {
#         "contents": sessions[session_id]
#     }

#     async with httpx.AsyncClient() as client:
#         response = await client.post(
#             f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
#             json=payload
#         )

#     if response.status_code == 200:
#         result = response.json()
#         model_reply = result["candidates"][0]["content"]["parts"][0]["text"]
#         # Save assistant response to session
#         sessions[session_id].append({"role": "model", "parts": [model_reply]})
#         return {"response": model_reply}
#     else:
#         raise HTTPException(status_code=response.status_code, detail=response.text)

# @app.delete("/reset-chat/{session_id}")
# def reset_chat(session_id: str):
#     if session_id in sessions:
#         del sessions[session_id]
#         return {"message": f"Chat session '{session_id}' reset."}
#     else:
#         raise HTTPException(status_code=404, detail="Session not found")


# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)


# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import Optional, Dict
# from datetime import datetime, timezone
# from dotenv import dotenv_values
# import google.generativeai as genai
# import asyncio
# import uuid
# import os
# import traceback

# # --- Load environment variables ---
# env_vars = dotenv_values(".env")
# api_key = env_vars.get("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")

# if not api_key:
#     raise RuntimeError("GEMINI_API_KEY not found in environment")

# genai.configure(api_key=api_key)

# # --- Model Configuration ---
# MODEL_NAME = "gemini-2.0-flash"

# # --- FastAPI App Setup ---
# app = FastAPI(
#     title="AI Chatbot API",
#     description="A FastAPI server to interact with Gemini API using streamed responses",
#     version="1.0.0"
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["https://devin-bot.vercel.app", "http://localhost:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# model = genai.GenerativeModel(MODEL_NAME)

# # --- Pydantic Models ---
# class ChatMessage(BaseModel):
#     message: str
#     session_id: Optional[str] = None

# class ChatResponse(BaseModel):
#     response: str
#     session_id: str
#     timestamp: str

# class ResetResponse(BaseModel):
#     message: str

# # --- Helper Function to Stream with Retry---
# async def call_gemini_stream_with_retry( 
#     prompt: str,
#     max_retries: int = 5,
#     initial_delay: float = 1.0
# ) -> str:
#     delay = initial_delay

#     for attempt in range(max_retries):
#         try:
         
#             chat_session = model.start_chat(history=[])
#             stream = await chat_session.send_message_async(prompt, stream=True)

#             ai_response = ""
#             async for chunk in stream:
#                 if hasattr(chunk, "text") and chunk.text:
#                     ai_response += chunk.text

#             return ai_response

#         except Exception as e:
#             print(f"Attempt {attempt+1}/{max_retries} failed: {e}")
#             if attempt < max_retries - 1:
#                 await asyncio.sleep(delay)
#                 delay *= 2
#             else:
#                 raise HTTPException(
#                     status_code=500,
#                     detail=f"Gemini API call failed after {max_retries} retries: {e}"
#                 )

# # --- API Endpoints ---
# @app.get("/", response_model=Dict[str, str])
# async def root():
#     return {"message": "AI Chatbot API is running!"}

# @app.post("/chat", response_model=ChatResponse)
# async def chat_endpoint(chat_message: ChatMessage):
#     try:
#         session_id = chat_message.session_id or str(uuid.uuid4())
#         ai_response = await call_gemini_stream_with_retry(chat_message.message)

#         return ChatResponse(
#             response=ai_response,
#             session_id=session_id,
#             timestamp=datetime.now(timezone.utc).isoformat()
#         )

#     except HTTPException as e:
#         raise e
#     except Exception as e:
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

# @app.get("/health", response_model=Dict[str, str])
# async def health_check():
#     return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# @app.post("/reset-chat/{session_id}", response_model=ResetResponse)
# async def reset_chat(session_id: str):
#     # Session management removed; stateless handling
#     return {"message": f"Session ID '{session_id}' reset (no session state stored)."}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)


# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import List, Dict, Optional, Any
# from datetime import datetime, timezone
# import google.generativeai as genai
# import uuid
# import os
# import time 
# from dotenv import dotenv_values
# import asyncio




# env_vars = dotenv_values(".env")

# # key = env_vars["GEMINI_API_KEY"]





# genai.configure(api_key='AIzaSyChbzqwF1gyTC4LtZxsqMZb09sAY_pZ2x4')
# # genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# # if not os.getenv("GEMINI_API_KEY"):
# #     raise Exception("GEMINI_API_KEY not found in environment")

# # Initialize the Gemini model.

# # MODEL_NAME = "gemini-2.5-flash-preview-05-20"
# MODEL_NAME = "gemini-2.0-flash"
# model = genai.GenerativeModel(MODEL_NAME)


# app = FastAPI(
#     title="AI Chatbot API",
#     description="A FastAPI server to interact with the Gemini API, maintaining chat sessions.",
#     version="1.0.0"
# )


# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["https://devin-bot.vercel.app","http://localhost:5173"], 
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # In-memory store of chat sessions.

# chat_sessions: Dict[str, genai.ChatSession] = {}

# class ChatMessage(BaseModel):
#     """
#     Pydantic model for the chat request body.
#     Expects a user message and an optional session_id.
#     """
#     message: str
#     session_id: Optional[str] = None

# class ChatResponse(BaseModel):
#     """
#     Pydantic model for the chat response body.
#     Returns the model's response, the session_id, and a timestamp.
#     """
#     response: str
#     session_id: str
#     timestamp: str

# class ResetResponse(BaseModel):
#     """
#     Pydantic model for the reset-chat response.
#     """
#     message: str

# # --- Helper Functions ---


# async def call_gemini_stream_with_retry(
#     chat_session,
#     prompt: str,
#     max_retries: int = 5,
#     initial_delay: float = 1.0
# ) -> str:
#     delay = initial_delay

#     for i in range(max_retries):
#         try:
#             stream = await chat_session.send_message_async(prompt, stream=True)
#             ai_response = ""
#             async for chunk in stream:
#                 if hasattr(chunk, "text") and chunk.text:
#                     ai_response += chunk.text
#             return ai_response

#         except Exception as e:
#             print(f"Attempt {i+1}/{max_retries} failed: {e}")
#             if i < max_retries - 1:
#                 await asyncio.sleep(delay)  # ✅ FIXED HERE
#                 delay *= 2
#             else:
#                 raise HTTPException(
#                     status_code=500,
#                     detail=f"Gemini API call failed after {max_retries} retries: {e}"
#                 )

# # --- API Routes ---

# @app.get("/", response_model=Dict[str, str])
# async def root():
#     """
#     Root endpoint for the API.
#     Returns a simple welcome message.
#     """
#     return {"message": "AI Chatbot API is running!"}



# @app.post("/chat", response_model=ChatResponse)
# async def chat_endpoint(chat_message: ChatMessage):
#     """
#     Handles chat interactions with the Gemini model.

#     Receives a user message, generates or retrieves a session,
#     sends the message to Gemini, and returns the model's response.
#     """
#     try:
#         # Generate a new session ID if not provided
#         session_id = chat_message.session_id or str(uuid.uuid4())

#         # If session does not exist, start a new chat session
#         if session_id not in chat_sessions:
#             # model.start_chat initializes a new chat session
#             chat_sessions[session_id] = model.start_chat(history=[]) # Start with empty history

#         chat_session = chat_sessions[session_id]

#         # Send message to Gemini and stream response with retry logic
#         ai_response = await call_gemini_stream_with_retry(chat_session, chat_message.message)

#         return ChatResponse(
#             response=ai_response,
#             session_id=session_id,
#             timestamp=datetime.now(timezone.utc).isoformat()
#         )

#     except HTTPException as e:
#         # Re-raise HTTPException if it came from call_gemini_stream_with_retry
#         raise e
#     except Exception as e:
#         import traceback
#         traceback.print_exc() # For debugging purposes
#         raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

# @app.post("/reset-chat/{session_id}", response_model=ResetResponse)
# async def reset_chat(session_id: str):
#     """
#     Resets a specific chat session by removing it from memory.
#     """
#     if session_id in chat_sessions:
#         del chat_sessions[session_id]
#         return {"message": f"Chat session '{session_id}' reset successfully."}
#     else:
#         raise HTTPException(status_code=404, detail=f"Session ID '{session_id}' not found.")

# @app.get("/health", response_model=Dict[str, str])
# async def health_check():
#     """
#     Health check endpoint.
#     Returns a simple status message and timestamp to indicate the server is running.
#     """
#     return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)




# import os
# import time
# import google.generativeai as genai
# from fastapi import FastAPI, Request, HTTPException
# from fastapi.responses import HTMLResponse, JSONResponse
# from pydantic import BaseModel
# from typing import List, Dict, Any

# # --- Configuration ---
# # Configure the Gemini API client.
# # The API key is left as an empty string as per instructions,
# # assuming the environment will provide it at runtime.
# genai.configure(api_key="")

# # Initialize the Gemini model.
# # Using 'gemini-2.5-flash-preview-05-20' as specified.
# MODEL_NAME = "gemini-2.5-flash-preview-05-20"
# model = genai.GenerativeModel(MODEL_NAME)

# # --- FastAPI Application Setup ---
# app = FastAPI(
#     title="Gemini Chat API",
#     description="A simple FastAPI server to interact with the Gemini API.",
#     version="1.0.0"
# )

# # In-memory storage for chat history.
# # This will be reset when the server restarts.
# # For a production application, consider using a database.
# chat_history: List[Dict[str, str]] = []

# # --- Pydantic Models for Request/Response Validation ---

# class ChatRequest(BaseModel):
#     """
#     Pydantic model for the chat request body.
#     Expects a single field: 'message'.
#     """
#     message: str

# class ChatResponse(BaseModel):
#     """
#     Pydantic model for the chat response body.
#     Returns the model's response.
#     """
#     response: str

# class HistoryResetResponse(BaseModel):
#     """
#     Pydantic model for the reset-chat response.
#     """
#     message: str

# # --- Helper Functions ---

# async def call_gemini_with_retry(
#     history: List[Dict[str, str]],
#     prompt: str,
#     max_retries: int = 5,
#     initial_delay: float = 1.0
# ) -> str:
#     """
#     Calls the Gemini API with exponential backoff.

#     Args:
#         history (List[Dict[str, str]]): The current chat history.
#         prompt (str): The user's new prompt.
#         max_retries (int): Maximum number of retries.
#         initial_delay (float): Initial delay in seconds before the first retry.

#     Returns:
#         str: The model's generated response.

#     Raises:
#         HTTPException: If the API call fails after all retries.
#     """
#     delay = initial_delay
#     for i in range(max_retries):
#         try:
#             # Create a chat session with the existing history.
#             # The new prompt is sent as part of the `send_message` call.
#             chat_session = model.start_chat(history=history)
#             response = await chat_session.send_message_async(prompt)
            
#             # Extract text from the response.
#             # Check if candidates and parts exist before accessing.
#             if response.candidates and response.candidates[0].content.parts:
#                 return response.candidates[0].content.parts[0].text
#             else:
#                 raise ValueError("Gemini API response did not contain expected text content.")

#         except Exception as e:
#             print(f"Attempt {i+1}/{max_retries} failed: {e}")
#             if i < max_retries - 1:
#                 time.sleep(delay)
#                 delay *= 2  # Exponential backoff
#             else:
#                 raise HTTPException(status_code=500, detail=f"Gemini API call failed after multiple retries: {e}")

# # --- API Routes ---

# @app.get("/", response_class=HTMLResponse)
# async def read_root():
#     """
#     Root endpoint for the API.
#     Returns a simple welcome message in HTML.
#     """
#     return """
#     <!DOCTYPE html>
#     <html>
#     <head>
#         <title>Gemini Chat API</title>
#         <style>
#             body { font-family: Arial, sans-serif; margin: 40px; background-color: #f4f4f4; color: #333; }
#             h1 { color: #0056b3; }
#             p { margin-bottom: 10px; }
#             code { background-color: #e2e2e2; padding: 2px 4px; border-radius: 3px; }
#             .container { max-width: 800px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
#         </style>
#     </head>
#     <body>
#         <div class="container">
#             <h1>Welcome to the Gemini Chat API!</h1>
#             <p>This is a simple FastAPI server demonstrating integration with the Gemini API.</p>
#             <p>Available endpoints:</p>
#             <ul>
#                 <li><code>GET /health</code>: Check the server's health.</li>
#                 <li><code>POST /chat</code>: Send a message to the Gemini model.</li>
#                 <li><code>POST /reset-chat</code>: Clear the chat history.</li>
#             </ul>
#             <p>To interact, use tools like cURL or a client-side application to send POST requests to <code>/chat</code> with a JSON body like <code>{"message": "Hello, Gemini!"}</code>.</p>
#         </div>
#     </body>
#     </html>
#     """

# @app.get("/health", response_model=Dict[str, str])
# async def health_check():
#     """
#     Health check endpoint.
#     Returns a simple status message to indicate the server is running.
#     """
#     return {"status": "ok", "message": "Server is healthy and running."}

# @app.post("/chat", response_model=ChatResponse)
# async def chat_with_gemini(request: ChatRequest):
#     """
#     Handles chat interactions with the Gemini model.

#     Receives a user message, adds it to the chat history,
#     sends the history to the Gemini API, and returns the model's response.
#     """
#     user_message = request.message
#     print(f"Received message: {user_message}")

#     # Add the user's message to the chat history
#     chat_history.append({"role": "user", "parts": [user_message]})

#     try:
#         # Call the Gemini API with the current chat history
#         model_response_text = await call_gemini_with_retry(chat_history, user_message)

#         # Add the model's response to the chat history
#         chat_history.append({"role": "model", "parts": [model_response_text]})

#         return ChatResponse(response=model_response_text)

#     except HTTPException as e:
#         # Re-raise HTTPException if it came from call_gemini_with_retry
#         raise e
#     except Exception as e:
#         # Catch any other unexpected errors
#         print(f"An unexpected error occurred during chat: {e}")
#         raise HTTPException(status_code=500, detail=f"An internal server error occurred: {e}")

# @app.post("/reset-chat", response_model=HistoryResetResponse)
# async def reset_chat_history():
#     """
#     Resets the in-memory chat history.
#     """
#     global chat_history
#     chat_history = []
#     print("Chat history has been reset.")
#     return HistoryResetResponse(message="Chat history has been reset successfully.")


# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)




# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import List, Dict, Optional
# from datetime import datetime, timezone
# import google.generativeai as genai
# import os
# import uuid
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv()

# # Initialize FastAPI app
# app = FastAPI(title="AI Chatbot API", version="1.0.0")

# # Enable CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173", "https://your-frontend-domain.vercel.app"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Configure Gemini
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# if not os.getenv("GEMINI_API_KEY"):
#     raise Exception("GEMINI_API_KEY not found in environment")

# # Use Gemini client
# gemini_client = genai.Client()

# # In-memory store of chat sessions (persistent per session_id)
# chat_sessions: Dict[str, any] = {}

# # Input & Output schemas
# class ChatMessage(BaseModel):
#     message: str
#     session_id: Optional[str] = None

# class ChatResponse(BaseModel):
#     response: str
#     session_id: str
#     timestamp: str

# @app.get("/")
# async def root():
#     return {"message": "AI Chatbot API is running!"}

# @app.post("/chat", response_model=ChatResponse)
# async def chat_endpoint(chat_message: ChatMessage):
#     try:
#         # Generate or retrieve session
#         session_id = chat_message.session_id or str(uuid.uuid4())

#         if session_id not in chat_sessions:
#             # Start a new chat session with Gemini
#             chat_sessions[session_id] = gemini_client.chats.create(model="gemini-1.5-flash")  # or "gemini-1.5-pro"

#         chat = chat_sessions[session_id]

#         # Send message and stream response
#         stream = chat.send_message_stream(chat_message.message)
#         ai_response = ""
#         for chunk in stream:
#             ai_response += chunk.text

#         return ChatResponse(
#             response=ai_response,
#             session_id=session_id,
#             timestamp=datetime.now(timezone.utc).isoformat()
#         )

#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

# @app.post("/reset-chat/{session_id}")
# async def reset_chat(session_id: str):
#     """Reset a specific chat session"""
#     if session_id in chat_sessions:
#         del chat_sessions[session_id]
#     return {"message": "Chat session reset successfully"}

# @app.get("/health")
# async def health_check():
#     return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)




# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import List, Dict, Optional
# import google.generativeai as genai
# import os
# from dotenv import load_dotenv
# import uuid
# from datetime import datetime

# # Load environment variables
# load_dotenv()

# app = FastAPI(title="AI Chatbot API", version="1.0.0")

# # Configure CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173", "https://your-frontend-domain.vercel.app"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Configure Gemini AI
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# if not os.getenv("GEMINI_API_KEY"):
#     raise Exception("GEMINI_API_KEY not found in environment")

# # In-memory storage for chat sessions
# chat_sessions: Dict[str, List[Dict]] = {}

# class ChatMessage(BaseModel):
#     message: str
#     session_id: Optional[str] = None

# class ChatResponse(BaseModel):
#     response: str
#     session_id: str
#     timestamp: str

# @app.get("/")
# async def root():
#     return {"message": "AI Chatbot API is running!"}

# @app.post("/chat", response_model=ChatResponse)
# async def chat_endpoint(chat_message: ChatMessage):
#     try:
#         # Generate session ID if not provided
#         session_id = chat_message.session_id or str(uuid.uuid4())
        
#         # Initialize session if it doesn't exist
#         if session_id not in chat_sessions:
#             chat_sessions[session_id] = []
        
#         # Add user message to session history
#         user_message = {
#             "role": "user",
#             "content": chat_message.message,
#             "timestamp": datetime.now().isoformat()
#         }
#         chat_sessions[session_id].append(user_message)
        
#         # Initialize Gemini model
#         model = genai.GenerativeModel('gemini-pro')
        
#         # Build conversation history for context
#         conversation_history = []
#         for msg in chat_sessions[session_id]:
#             if msg["role"] == "user":
#                 conversation_history.append(f"User: {msg['content']}")
#             else:
#                 conversation_history.append(f"Assistant: {msg['content']}")
        
#         # Create prompt with context
#         if len(conversation_history) > 1:
#             context = "\n".join(conversation_history[:-1])  # All except current message
#             prompt = f"Previous conversation:\n{context}\n\nUser: {chat_message.message}\n\nAssistant:"
#         else:
#             prompt = f"User: {chat_message.message}\n\nAssistant:"
        
#         # Generate response from Gemini
#         response = model.generate_content(prompt)
#         ai_response = response.text
        
#         # Add AI response to session history
#         ai_message = {
#             "role": "assistant",
#             "content": ai_response,
#             "timestamp": datetime.utcnow().isoformat()
#         }
#         chat_sessions[session_id].append(ai_message)
        
#         # Limit session history to last 20 messages to prevent memory issues
#         if len(chat_sessions[session_id]) > 20:
#             chat_sessions[session_id] = chat_sessions[session_id][-20:]
        
#         return ChatResponse(
#             response=ai_response,
#             session_id=session_id,
#             timestamp=datetime.utcnow().isoformat()
#         )
        
#     except Exception as e:
#             import traceback
#             traceback.print_exc()  # 👈 prints detailed error in terminal
#             raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

# @app.post("/reset-chat/{session_id}")
# async def reset_chat(session_id: str):
#     """Reset a specific chat session"""
#     if session_id in chat_sessions:
#         del chat_sessions[session_id]
#     return {"message": "Chat session reset successfully"}

# @app.get("/health")
# async def health_check():
#     return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)