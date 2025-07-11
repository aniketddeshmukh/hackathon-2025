import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from report_generator import generate_pdf_report
import datetime
import re
from fastapi import UploadFile, File
from resume_parser import extract_resume_text
import interview_engine
from fastapi.concurrency import run_in_threadpool
from interview_engine import (
    conversation_context,
    speak_async,
    openai_chat_async,
    start_streaming_recognition,
    handle_user_input,
)
parsed_resume_data = {}  

previous_question = None  # ADD THIS GLOBAL VARIABLE AT TOP (after question_count)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_QUESTIONS = 10
question_count = 0  # Global counter to track how many AI questions were asked



@app.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    global parsed_resume_data
    parsed_resume_data = await run_in_threadpool(extract_resume_text, file)
    return parsed_resume_data


@app.websocket("/ws/interview")
async def interview_ws(websocket: WebSocket):
    global conversation_context, question_count
    await websocket.accept()
    print("✅ WebSocket connected")
    print(parsed_resume_data)
    shutdown_event = asyncio.Event()

    # ⬅️ Callback to send data to frontend
    async def send_to_frontend(text):
        await websocket.send_text(text)

    interview_engine.speak_callback = send_to_frontend

    # 🔄 Reset context and counter
    conversation_context.clear()
    question_count = 0
    previous_question = None  # reset

    conversation_context.append({
        "role": "system",
        "content": (
            "You are an AI interviewer. Ask exactly 4 different technical questions about skills given below, one at a time.\n"
            "⚠️ DO NOT repeat any previous question.\n"
            "After each user response, move on to a new question — even if the answer is wrong or unclear.\n"
            "Keep track of your own questions. Do not rephrase or ask variations of the same concept.\n"
            "After 10 questions, say 'That concludes our interview. Thanks for joining. You may now close the session.' and stop asking further questions."
            f"This is the data from candidate's resume: {parsed_resume_data}"
            "Use this info to personalize your questions by extracting skills, projects and other relivent information."

        )
    })
    # 🟢 Greet candidate
    greeting = await openai_chat_async(conversation_context)
    conversation_context.append({"role": "assistant", "content": greeting})
    await speak_async(greeting)

    # 🎙️ Start mic
    loop = asyncio.get_running_loop()
    start_streaming_recognition(handle_user_input_wrapper(websocket), loop, shutdown_event)

    try:
        while True:
            user_msg = await websocket.receive_text()
            print(f"[WS DEBUG] User said: {user_msg}")
            await handle_user_input_wrapper(websocket)(user_msg)
    except WebSocketDisconnect:
        print("❌ WebSocket disconnected")
        shutdown_event.set()
        await finalize_interview()

# -----------------------
# 🧠 Wrap user input handler
# -----------------------
# -----------------------
# 🧠 Wrap user input handler
# -----------------------
def handle_user_input_wrapper(websocket):
    async def wrapped(text):
        global question_count, previous_question

        text = text.strip()
        if not text:
            return

        if interview_engine.speak_callback:
            await interview_engine.speak_callback(f"__USER__::{text}")

        conversation_context.append({ "role": "user", "content": text })

        # if question_count >= MAX_QUESTIONS:
        #     await speak_async("Thanks. You may now close the session.")
        #     return

        # Ask AI for next response
        ai_reply = await openai_chat_async(conversation_context)

        # ✅ Prevent duplicate question
        if ai_reply.strip() == previous_question:
            print("⚠️ AI repeated last question. Asking GPT again...")
            ai_reply = await openai_chat_async(conversation_context)

        # Update state and continue
        previous_question = ai_reply
        conversation_context.append({ "role": "assistant", "content": ai_reply })
        await speak_async(ai_reply)
        question_count += 1
    return wrapped



# -----------------------
# 🧾 Finalize Interview & Generate Report
# -----------------------
async def finalize_interview():
    print("🧮 Final evaluation starting...")

    evaluation_prompt = {
        "role": "user",
        "content": (
            "Now that the interview is over, please evaluate the candidate on:\n"
            "• Communication\n"
            "• Technical Skills\n"
            "• Fluency\n"
            "• Listening & Clarity\n"
            "• Confidence\n"
            "Give each a score out of 5.\n"
            "Also provide 2–3 bullet points summarizing strengths or improvement areas.\n"
            "Finally, recommend whether they should proceed to next round. Do not procced to next round if average score is less than 4"
        )
    }

    conversation_context.append(evaluation_prompt)
    evaluation_response = await openai_chat_async(conversation_context)
    print(evaluation_response)
    # 🧠 Parse response
    lines = evaluation_response.splitlines()
    evaluation = {}
    comments = []
    summary_text = ""

    for line in lines:
        score_match = re.match(r"^(.*?):\s*([0-5](\.\d)?)", line)
        if score_match:
            key = score_match.group(1).strip()
            value = float(score_match.group(2))
            evaluation[key] = value
        elif line.strip().startswith(("•", "-")):
            comments.append(line.strip())
        elif "recommend" in line.lower():
            summary_text = line.strip()
    # 📝 Generate report
    generate_pdf_report(
    candidate_name="Aniket Deshmukh",
    interview_date=datetime.date.today().strftime("%B %d, %Y"),
    evaluation=evaluation,
    comments="\n".join(comments[:3]),  # Just bullets
    summary=summary_text  # The final recommendation line
)

    print("📄 PDF Report Saved")
    conversation_context.clear()
