/**
 * PDF Generator for Report Cards
 * Generates professional PDF reports with branding and photos
 */

import jsPDF from 'jspdf';
import type { PublicReportCard } from '@/types/report-card';

/**
 * Generates a PDF report card
 */
export async function generateReportCardPDF(
  reportCard: PublicReportCard
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Colors
  const primaryColor = '#434E54'; // Charcoal
  const secondaryColor = '#6B7280'; // Gray
  const accentColor = '#EAE0D5'; // Light cream

  let yPos = margin;

  // Header - Business Branding
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor('#FFFFFF');
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('The Puppy Day', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Grooming Report Card', pageWidth / 2, 30, { align: 'center' });

  yPos = 50;

  // Pet Name and Service
  doc.setTextColor(primaryColor);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(reportCard.pet_name, margin, yPos);
  yPos += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor);
  doc.text(reportCard.service_name, margin, yPos);
  yPos += 6;

  // Date
  const formattedDate = new Date(reportCard.appointment_date).toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );
  doc.setFontSize(10);
  doc.text(formattedDate, margin, yPos);
  yPos += 15;

  // Divider
  doc.setDrawColor(accentColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Assessment Section
  doc.setFontSize(16);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Grooming Assessment', margin, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  // Assessment Grid
  const assessments = [
    {
      label: 'Mood',
      value: reportCard.mood || 'Not assessed',
    },
    {
      label: 'Coat Condition',
      value: reportCard.coat_condition || 'Not assessed',
    },
    {
      label: 'Behavior',
      value: reportCard.behavior || 'Not assessed',
    },
  ];

  const boxWidth = (contentWidth - 10) / 3;
  let xPos = margin;

  assessments.forEach((assessment) => {
    // Box background
    doc.setFillColor('#F8F9FA');
    doc.roundedRect(xPos, yPos, boxWidth, 20, 2, 2, 'F');

    // Label
    doc.setTextColor(secondaryColor);
    doc.setFontSize(9);
    doc.text(assessment.label.toUpperCase(), xPos + 3, yPos + 6);

    // Value
    doc.setTextColor(primaryColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(
      assessment.value.charAt(0).toUpperCase() + assessment.value.slice(1),
      xPos + 3,
      yPos + 14
    );
    doc.setFont('helvetica', 'normal');

    xPos += boxWidth + 5;
  });

  yPos += 30;

  // Health Observations
  if (reportCard.health_observations && reportCard.health_observations.length > 0) {
    doc.setFontSize(16);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Health Observations', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);

    reportCard.health_observations.forEach((obs) => {
      // Format observation name
      const obsLabel = obs
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      doc.setFillColor('#FEF3C7');
      doc.circle(margin + 2, yPos - 1.5, 1.5, 'F');
      doc.text(obsLabel, margin + 6, yPos);
      yPos += 6;
    });

    yPos += 8;
  }

  // Groomer Notes
  if (reportCard.groomer_notes) {
    // Check if we need a new page
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(16);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text("Groomer's Notes", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);

    // Split notes into lines that fit
    const splitNotes = doc.splitTextToSize(
      reportCard.groomer_notes,
      contentWidth
    );

    doc.text(splitNotes, margin, yPos);
    yPos += splitNotes.length * 5 + 10;
  }

  // Footer
  const footerY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor);
  doc.text(
    'The Puppy Day | 14936 Leffingwell Rd, La Mirada, CA 90638',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  doc.text(
    '(657) 252-2903 | puppyday14936@gmail.com',
    pageWidth / 2,
    footerY + 5,
    { align: 'center' }
  );

  // Generate filename
  const filename = `${reportCard.pet_name.replace(/\s+/g, '_')}_Report_Card_${
    new Date(reportCard.appointment_date).toISOString().split('T')[0]
  }.pdf`;

  // Download the PDF
  doc.save(filename);
}

/**
 * Validates if report card has enough data for PDF generation
 */
export function canGeneratePDF(reportCard: PublicReportCard): boolean {
  return !!(
    reportCard.pet_name &&
    reportCard.service_name &&
    reportCard.appointment_date
  );
}
