import jsPDF from 'jspdf';
import signature from '../assets/headerpdf/signature.png'

/**
 * Helper: Formats name to Title Case (e.g. "SysTem TesTer" -> "System Tester")
 */
const formatName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

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
  const headerImage = options.headerImage || null;
  if (headerImage) {
    const imgWidth = pageWidth - 50; // narrower than full width
    const imgX = (pageWidth - imgWidth) / 2; // center the image
    doc.addImage(headerImage, "PNG", imgX, 25, imgWidth, 30);
  }


  // --- COE CONTENT DATA ---
  // FIX: Apply formatting here
  const rawName = request.name || "";
  const employeeName = formatName(rawName) || "_____________________".toUpperCase();
  
  const position = options.position || "Security Guard".toUpperCase();
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
  doc.setFont("arial", "bold");
  doc.setFontSize(18);
  doc.text("CERTIFICATE OF EMPLOYMENT", pageWidth / 2, 70, { align: "center" });

  // --- BODY CONTENT (per-line customization) ---
  const bodyLines = [
    { text: "This is to certify that", font: "arial", style: "italic", size: 12 },
    { text: employeeName, font: "arial", style: "bold", size: 16 },
    { text: "has been employed in", font: "arial", style: "italic", size: 12 },
    { text: "JPM SECURITY AGENCY CORP", font: "arial", style: "bold", size: 18 },
    { text: "as", font: "arial", style: "italic", size: 12 },
    { text: position, font: "arial", style: "bold", size: 16 },
    { text: `from ${employmentStart} to ${employmentEnd},`, font: "arial", style: "italic", size: 10 },
    { text: `with compensation of ${salary} per month.`, font: "arial", style: "bolditalic", size: 12 },
    { text: `This certification is issued upon the request of the aforementioned name for ${purpose} purpose.`, font: "arial", style: "italic", size: 12 },
    { text: `Given this ${issuedDate} at ${location}.`, font: "arial", style: "normal", size: 12 },
  ];
  
  let y = 85;
  bodyLines.forEach((line) => {
    doc.setFont(line.font, line.style);
    doc.setFontSize(line.size);
    doc.text(line.text, pageWidth / 2, y, { align: "center" });
  
    // Underline employee name
    if (line.text === employeeName) {
      const textWidth = doc.getTextWidth(employeeName);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - textWidth / 2, y + 1, pageWidth / 2 + textWidth / 2, y + 1);
    }
  
    // Underline salary amount only
    if (line.text.includes(salary)) {
      const startX = pageWidth / 2 - doc.getTextWidth(line.text) / 2;
      const beforeSalary = `with compensation of `;
      const offsetX = doc.getTextWidth(beforeSalary);
      const salaryWidth = doc.getTextWidth(salary);
      doc.setLineWidth(0.5);
      doc.line(startX + offsetX, y + 1, startX + offsetX + salaryWidth, y + 1);
    }
  
    // Underline issue date
    if (line.text.includes(issuedDate)) {
      const startX = pageWidth / 2 - doc.getTextWidth(line.text) / 2;
      const offsetX = line.text.indexOf(issuedDate) * (doc.getTextWidth(line.text) / line.text.length);
      const dateWidth = doc.getTextWidth(issuedDate);
      doc.setLineWidth(0.5);
      doc.line(startX + offsetX, y + 1, startX + offsetX + dateWidth, y + 1);
    }
  
    // Underline signatory name
    if (line.text === signatory) {
      const textWidth = doc.getTextWidth(signatory);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - textWidth / 2, y + 1, pageWidth / 2 + textWidth / 2, y + 1);
    }
  
    // Adjust spacing after company name
    if (line.text === "JPM SECURITY AGENCY CORP") {
      y += 10;
    } else {
      y += line.size + 1;
    }
  });
  
  // --- SIGNATORY ---
  y += 5;
  if (signature) {
    const sigWidth = 30;
    const sigHeight = 40;
    doc.addImage(signature, "PNG", pageWidth / 2 - sigWidth / 2, y, sigWidth, sigHeight);
    y += sigHeight - 12;
  }

  // Signatory name (underlined)
  doc.setFont("arial", "normal");
  doc.text(signatory, pageWidth / 2, y, { align: "center" });
  const signWidth = doc.getTextWidth(signatory);
  doc.line(pageWidth / 2 - signWidth / 2, y + 1.5, pageWidth / 2 + signWidth / 2, y + 1.5);

  y += 6;
  doc.setFont("arial", "normal");
  doc.text(signatoryTitle, pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.text(companyShort, pageWidth / 2, y, { align: "center" });


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
  // FIX: Apply formatting to filename too for consistency
  const formattedName = formatName(request.name || "").replace(/\s+/g, '_');
  const documentNumber = `COE-${request.id || "DOC"}-${new Date().getFullYear()}`;
  const fileName = options.fileName || `COE_${formattedName}_${documentNumber}.pdf`;
  
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