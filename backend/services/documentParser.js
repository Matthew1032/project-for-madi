const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const MAX_TEXT_LENGTH = 8000; // Truncate before sending to Claude to manage token cost

/**
 * Extracts plain text from an uploaded file buffer.
 * @param {Buffer} buffer - Raw file buffer from multer memoryStorage
 * @param {string} mimetype - MIME type of the uploaded file
 * @returns {Promise<string>} Extracted plain text
 */
async function parseDocument(buffer, mimetype) {
  let text = '';

  if (mimetype === 'application/pdf') {
    const result = await pdfParse(buffer);
    text = result.text;
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or Word (.docx) document.');
  }

  // Normalise whitespace and truncate
  text = text.replace(/\s+/g, ' ').trim();

  if (!text) {
    throw new Error('No readable text found in the document.');
  }

  return text.slice(0, MAX_TEXT_LENGTH);
}

module.exports = { parseDocument };
