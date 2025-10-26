import jsPDF from 'jspdf';

/**
 * Generates a Certificate of Employment PDF
 * @param {Object} request - The COE request object
 * @param {string} request.name - Guard's full name
 * @param {string} request.guardId - Guard's ID
 * @param {string} request.purpose - Purpose of the COE request
 * @param {string} request.id - Request ID for document number
 * @param {Object} options - Optional configuration
 * @param {string} options.companyName - Company name (default: "JPM SECURITY AGENCY")
 * @param {string} options.companyAddress - Company address
 * @param {string} options.companyPhone - Company phone
 * @param {string} options.companyEmail - Company email
 * @param {string} options.position - Guard position (default: "Security Guard")
 * @param {string} options.employmentStart - Employment start date
 * @param {string} options.employmentEnd - Employment end date
 * @param {string} options.salary - Monthly salary
 * @param {string} options.workSchedule - Work schedule
 * @param {number} options.validityDays - Certificate validity in days (default: 30)
 * @returns {jsPDF} The generated PDF document
 */

export const generateCOEPDF = (request, options = {}) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- HEADER IMAGE ---
  const headerImage = options.headerImage || null; // Base64 or imported image
  if (headerImage) {
    // Place the header across the top
    // Adjust width/height depending on your image’s ratio
    doc.addImage(headerImage, "PNG", 15, 10, pageWidth - 30, 30);
  }

  // --- COE CONTENT DATA ---
  const employeeName = request.name || "_____________________";
  const position = options.position || "Security Guard";
  const employmentStart = options.employmentStart || "__________";
  const employmentEnd = options.employmentEnd || "current date";
  const salary = options.salary || "_____________________";
  const purpose = request.purpose || "_____________________";
  const issuedDate = options.issuedDate || new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const location = options.location || "Indang, Cavite";
  const signatory = options.signatory || "KYLE CHRISTOPHER E. PASTRANA";
  const signatoryTitle = options.signatoryTitle || "HR and Head Administrator";
  const companyShort = options.companyShort || "JPMSA Corp.";

  // --- TITLE ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CERTIFICATE OF EMPLOYMENT", pageWidth / 2, 60, { align: "center" });

  // --- BODY CONTENT ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  const lines = [
    "This is to certify that",
    "",
    employeeName,
    "",
    "has been employed in",
    "",
    "JPM SECURITY AGENCY CORP",
    "",
    "as",
    "",
    position,
    "",
    `from ${employmentStart} to ${employmentEnd},`,
    "",
    `with compensation of ${salary} per month.`,
    "",
    `This certification is issued upon the request of the aforementioned name for ${purpose} purpose.`,
    "",
    `Given this ${issuedDate} at ${location}.`,
  ];

  let y = 85;
  lines.forEach((line) => {
    doc.text(line, pageWidth / 2, y, { align: "center" });
    y += 8;
  });

  // --- SIGNATORY ---
  y += 25;
  doc.setFont("helvetica", "bold");
  doc.text(signatory, pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(signatoryTitle, pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.text(companyShort, pageWidth / 2, y, { align: "center" });

  // --- FOOTER NOTE ---
  y = 285;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "This document is computer-generated and does not require a signature.",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  return doc;
};

/**
 * Generates and downloads a COE PDF
 * @param {Object} request - The COE request object
 * @param {Object} options - Optional configuration
 * @param {string} options.fileName - Custom filename (optional)
 * @returns {string} The generated filename
 */
export const generateAndDownloadCOE = (request, options = {}) => {
  const doc = generateCOEPDF(request, options);
  
  // Generate filename
  const guardName = request.name.replace(/\s+/g, '_');
  const documentNumber = `COE-${request.id}-${new Date().getFullYear()}`;
  const fileName = options.fileName || `COE_${guardName}_${documentNumber}.pdf`;
  
  // Save the PDF
  doc.save(fileName);
  
  return fileName;
};

/**
 * Generates a COE PDF as base64 string (for storage or API)
 * @param {Object} request - The COE request object
 * @param {Object} options - Optional configuration
 * @returns {string} Base64 encoded PDF
 */
export const generateCOEAsBase64 = (request, options = {}) => {
  const doc = generateCOEPDF(request, options);
  return doc.output('datauristring');
};

/**
 * Generates a COE PDF as blob (for API uploads)
 * @param {Object} request - The COE request object
 * @param {Object} options - Optional configuration
 * @returns {Blob} PDF blob
 */
export const generateCOEAsBlob = (request, options = {}) => {
  const doc = generateCOEPDF(request, options);
  return doc.output('blob');
};

// Default export
export default {
  generateCOEPDF,
  generateAndDownloadCOE,
  generateCOEAsBase64,
  generateCOEAsBlob
};
