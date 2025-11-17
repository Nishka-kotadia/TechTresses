const invoiceService = require('../services/invoiceService');

class InvoiceController {
  // Generate PDF invoice
  async generateInvoice(req, res) {
    try {
      const { clientName, amount, gstApplicable, tds, bankDetails, userId } = req.body;

      // Validation
      if (!clientName || !amount || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Client name, amount, and user ID are required'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }

      // Get invoice data with user bank details
      const invoiceData = await invoiceService.getInvoiceData(userId, {
        clientName,
        amount,
        gstApplicable: gstApplicable || false,
        tds: tds || false,
        bankDetails
      });

      // Generate PDF
      const pdfBuffer = await invoiceService.generateInvoice(invoiceData);

      // Set response headers for PDF download
      const filename = `invoice-${clientName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate invoice',
        error: error.message
      });
    }
  }

  // Get invoice preview (without generating PDF)
  async getInvoicePreview(req, res) {
    try {
      const { clientName, amount, gstApplicable, tds, userId } = req.body;

      // Validation
      if (!clientName || !amount || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Client name, amount, and user ID are required'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }

      // Calculate invoice amounts
      let basicAmount = amount;
      let gstAmount = 0;
      let tdsAmount = 0;
      let totalAmount = amount;

      if (gstApplicable) {
        gstAmount = Math.round(amount * 0.18);
        totalAmount += gstAmount;
      }

      if (tds) {
        tdsAmount = Math.round(amount * 0.10);
        totalAmount -= tdsAmount;
      }

      const preview = {
        clientName,
        basicAmount,
        gstApplicable,
        gstAmount,
        tds,
        tdsAmount,
        totalAmount,
        invoiceNumber: `INV-${Date.now()}`,
        date: new Date().toLocaleDateString('en-IN')
      };

      res.status(200).json({
        success: true,
        message: 'Invoice preview generated successfully',
        data: preview
      });

    } catch (error) {
      console.error('Error generating invoice preview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate invoice preview',
        error: error.message
      });
    }
  }

  // Calculate invoice amounts
  async calculateInvoiceAmounts(req, res) {
    try {
      const { amount, gstApplicable, tds } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid amount is required'
        });
      }

      let basicAmount = amount;
      let gstAmount = 0;
      let tdsAmount = 0;
      let totalAmount = amount;

      if (gstApplicable) {
        gstAmount = Math.round(amount * 0.18);
        totalAmount += gstAmount;
      }

      if (tds) {
        tdsAmount = Math.round(amount * 0.10);
        totalAmount -= tdsAmount;
      }

      const calculation = {
        basicAmount,
        gstApplicable: gstApplicable || false,
        gstAmount,
        tds: tds || false,
        tdsAmount,
        totalAmount,
        netReceivable: Math.max(0, totalAmount)
      };

      res.status(200).json({
        success: true,
        message: 'Invoice amounts calculated successfully',
        data: calculation
      });

    } catch (error) {
      console.error('Error calculating invoice amounts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate invoice amounts',
        error: error.message
      });
    }
  }

  // Get invoice templates
  async getInvoiceTemplates(req, res) {
    try {
      const templates = [
        {
          id: 'standard',
          name: 'Standard Invoice',
          description: 'Basic invoice with client details and amount breakdown',
          features: ['Client details', 'Amount breakdown', 'TDS/GST calculation', 'Bank details']
        },
        {
          id: 'detailed',
          name: 'Detailed Invoice',
          description: 'Comprehensive invoice with project details and terms',
          features: ['Client details', 'Project description', 'Itemized billing', 'Tax breakdown', 'Payment terms', 'Bank details']
        },
        {
          id: 'simple',
          name: 'Simple Invoice',
          description: 'Minimal invoice with essential information only',
          features: ['Client name', 'Amount', 'Basic tax info', 'Payment details']
        }
      ];

      res.status(200).json({
        success: true,
        message: 'Invoice templates retrieved successfully',
        data: templates
      });

    } catch (error) {
      console.error('Error getting invoice templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve invoice templates',
        error: error.message
      });
    }
  }
}

module.exports = new InvoiceController();
