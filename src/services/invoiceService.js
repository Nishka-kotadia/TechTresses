const PDFDocument = require('pdfkit');
const User = require('../models/user');

class InvoiceService {
  // Generate PDF invoice
  async generateInvoice(invoiceData) {
    return new Promise((resolve, reject) => {
      try {
        // Create a new PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        // Buffer to store PDF data
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Invoice content
        this.addInvoiceContent(doc, invoiceData);

        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(new Error(`PDF generation failed: ${error.message}`));
      }
    });
  }

  // Add content to the invoice
  addInvoiceContent(doc, invoiceData) {
    const { clientName, amount, gstApplicable, tds, bankDetails } = invoiceData;

    // Header
    doc.fontSize(20).text('TAX INVOICE', { align: 'center' });
    doc.moveDown();

    // Invoice details
    const invoiceNumber = `INV-${Date.now()}`;
    const currentDate = new Date().toLocaleDateString('en-IN');
    
    doc.fontSize(12);
    doc.text(`Invoice Number: ${invoiceNumber}`);
    doc.text(`Date: ${currentDate}`);
    doc.moveDown();

    // Freelancer details
    doc.fontSize(14).text('Bill To:', { underline: true });
    doc.fontSize(12);
    doc.text(clientName);
    doc.moveDown();

    // Services
    doc.fontSize(14).text('Services:', { underline: true });
    doc.fontSize(12);
    doc.text('Freelance Development/Consulting Services');
    doc.moveDown();

    // Amount details
    doc.fontSize(14).text('Amount Details:', { underline: true });
    doc.fontSize(12);
    doc.text(`Basic Amount: ₹${amount.toLocaleString('en-IN')}`);

    // TDS calculation
    if (tds) {
      const tdsAmount = Math.round(amount * 0.10);
      doc.text(`TDS (10%): ₹${tdsAmount.toLocaleString('en-IN')}`);
      doc.text(`Net Amount (after TDS): ₹${(amount - tdsAmount).toLocaleString('en-IN')}`);
    }

    // GST calculation
    if (gstApplicable) {
      const gstAmount = Math.round(amount * 0.18);
      doc.text(`GST (18%): ₹${gstAmount.toLocaleString('en-IN')}`);
      doc.text(`Total Amount (with GST): ₹${(amount + gstAmount).toLocaleString('en-IN')}`);
    }

    // Total amount
    let totalAmount = amount;
    if (gstApplicable) {
      totalAmount += Math.round(amount * 0.18);
    }
    if (tds) {
      totalAmount -= Math.round(amount * 0.10);
    }

    doc.moveDown();
    doc.fontSize(14).text(`Total Amount: ₹${totalAmount.toLocaleString('en-IN')}`, { bold: true });
    doc.moveDown();

    // Bank details
    if (bankDetails) {
      doc.fontSize(14).text('Payment Details:', { underline: true });
      doc.fontSize(12);
      doc.text(`Bank Name: ${bankDetails.bankName || 'N/A'}`);
      doc.text(`Account Number: ${bankDetails.accountNumber || 'N/A'}`);
      doc.text(`IFSC Code: ${bankDetails.ifscCode || 'N/A'}`);
      doc.text(`UPI ID: ${bankDetails.upiId || 'N/A'}`);
      doc.moveDown();
    }

    // Footer
    doc.fontSize(10).text('This is a computer-generated invoice.', { align: 'center' });
    doc.text('Thank you for your business!', { align: 'center' });

    // Add note about TDS and GST
    doc.moveDown();
    doc.fontSize(9).text('Notes:', { underline: true });
    if (tds) {
      doc.text('• TDS (Tax Deducted at Source) has been deducted as per Indian tax laws.');
    }
    if (gstApplicable) {
      doc.text('• GST (Goods and Services Tax) is applicable as per current rates.');
    }
    doc.text('• Please make payment within 15 days of invoice date.');
  }

  // Get invoice data with user bank details
  async getInvoiceData(userId, invoiceData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        ...invoiceData,
        bankDetails: user.bankDetails || {}
      };
    } catch (error) {
      throw new Error(`Failed to get invoice data: ${error.message}`);
    }
  }
}

module.exports = new InvoiceService();
