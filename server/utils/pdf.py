from __future__ import annotations

import base64
from typing import Any, Dict

from fpdf import FPDF


def build_report_pdf(analysis: Dict[str, Any]) -> str:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font('Helvetica', 'B', 16)
    pdf.cell(0, 10, 'Agentic Project Plan', ln=True)

    summary = analysis.get('summary', {})
    pdf.set_font('Helvetica', '', 12)
    pdf.multi_cell(0, 8, f"Total hours: {summary.get('total_hours', 'N/A')}")
    pdf.multi_cell(0, 8, f"Staffing: {summary.get('staffing', 'N/A')}")
    if 'cost_total' in summary:
        pdf.multi_cell(0, 8, f"Budget: ${summary.get('cost_total')}")

    pdf.ln(4)
    pdf.set_font('Helvetica', 'B', 13)
    pdf.cell(0, 8, 'Assignments', ln=True)
    pdf.set_font('Helvetica', '', 11)
    for employee in analysis.get('employees', [])[:10]:
        pdf.multi_cell(0, 6, f"{employee['name']}: {', '.join(employee['tasks'])}")

    pdf_bytes = pdf.output(dest='S').encode('latin1')
    encoded = base64.b64encode(pdf_bytes).decode('ascii')
    return f'data:application/pdf;base64,{encoded}'
