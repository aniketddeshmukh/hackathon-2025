# report_generator.py
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import datetime

def generate_pdf_report(candidate_name, interview_date, evaluation, comments, output_path="interview_report.pdf"):
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    # Header
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, height - 50, "Candidate Interview Report")

    # Candidate Info
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 100, f"Candidate Name: {candidate_name}")
    c.drawString(50, height - 120, f"Interview Date: {interview_date}")
    c.drawString(50, height - 140, f"Role: Software Engineer")
    c.drawString(50, height - 160, f"Company: UBS")

    # Evaluation Section
    y = height - 200
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, "Evaluation Summary:")
    c.setFont("Helvetica", 12)
    for key, value in evaluation.items():
        y -= 20
        c.drawString(60, y, f"{key}: {value}/5")

    # Comments
    y -= 40
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, "Comments:")
    y -= 20
    c.setFont("Helvetica", 12)
    for line in comments.split("\n"):
        c.drawString(60, y, line)
        y -= 20

    # Footer
    y -= 40
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "✅ Recommendation: Proceed to Next Round")

    c.save()
