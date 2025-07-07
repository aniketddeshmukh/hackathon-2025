import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from report_generator import generate_pdf_report
import datetime

import interview_engine
from interview_engine import (
    conversation_context,
    speak_async,
    openai_chat_async,
    start_streaming_recognition,
    handle_user_input,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/interview")
async def interview_ws(websocket: WebSocket):
    global conversation_context
    await websocket.accept()
    print("✅ WebSocket connected")

    shutdown_event = asyncio.Event()

    # Set callback to send AI/user messages to frontend
    async def send_to_frontend(text):
        await websocket.send_text(text)

    interview_engine.speak_callback = send_to_frontend

    # Reset conversation for new session
    conversation_context.clear()
    conversation_context.append({
        "role": "system",
        "content": (
            "You are an AI interviewer. You are not supposed to answer to Candidates if they ask.  Greet the candidate first warmly. After he replies ask technical questions "
            "about Python. Speak like a human interviewer. Keep each response short (1–2 sentences). "
            "Wait for the candidate's response before continuing. If the candidate's response is wrong, just give a short explanation "
            "about the same question and move to the next one. "
            "If the candidate responds with silence, gently say you couldn't hear or understand them and repeat the previous question only once. "
            "If the candidate responds with gibberish or a vague answer, gently say this is incorrect and repeat the question once. "
            "Do NOT ask to write code as user won't be able to write — this is a voice-only interview."
            "If user speaks any random word not related to question,  ignore it and try to guess"
        )
    })

    # Generate and send AI greeting
    greeting = await openai_chat_async(conversation_context)
    conversation_context.append({"role": "assistant", "content": greeting})
    await speak_async(greeting)

    # Start microphone listening
    loop = asyncio.get_running_loop()
    start_streaming_recognition(handle_user_input, loop, shutdown_event)

    # Handle frontend inputs
    try:
        while True:
            user_msg = await websocket.receive_text()
            print(f"[WS DEBUG] User said: {user_msg}")
            await handle_user_input(user_msg)
    except WebSocketDisconnect:
        print("❌ WebSocket disconnected")
        shutdown_event.set()
        # 🧹 Reset context
        conversation_context.clear()
        # 📝 Generate report
        generate_pdf_report(
            candidate_name="Aniket Deshmukh",
            interview_date=datetime.date.today().strftime("%B %d, %Y"),
            evaluation={
                "Communication": 4.5,
                "Technical Skills": 4.2,
                "Fluency": 4.0,
                "Listening & Clarity": 4.3,
                "Confidence": 4.4
            },
            comments=(
                "• Strong understanding of Python concepts.\n"
                "• Confident voice with smooth communication.\n"
                "• Quick and concise responses.\n"
                "• Needs slight improvement on handling trick questions.\n"
            )
        )

        print("📄 Interview report saved as PDF.")