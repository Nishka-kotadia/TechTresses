# Freelancer Tax Buddy - Backend API

A comprehensive backend system for Indian freelancers to manage income, calculate taxes, and generate invoices with TDS and GST compliance.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone and install dependencies**
```bash
npm install
```

2. **Set up environment variables**
   - Copy `.env` file and update MongoDB URI if needed
   - Default: `mongodb://localhost:27017/freelancer-tax-buddy`

3. **Start the server**
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

4. **Server runs on** `http://localhost:3000`

## 📊 API Endpoints

### Base URL: `http://localhost:3000`

### Income Management
- `POST /api/income/addIncome` - Add new income entry
- `GET /api/income/:userId` - Get all income for a user
- `PUT /api/income/:id` - Update income entry
- `DELETE /api/income/:id` - Delete income entry
- `GET /api/income/summary/:userId` - Get income summary

### Tax Calculation
- `GET /api/tax/calculateTax?userId=...` - Calculate complete tax
- `POST /api/tax/getDeductions` - Get deduction suggestions
- `GET /api/tax/nextDueDate?userId=...` - Get upcoming due dates
- `GET /api/tax/regimeComparison?income=...` - Compare tax regimes
- `GET /api/tax/advanceTax?userId=...` - Calculate advance tax

### Invoice Generation
- `POST /api/invoice/generateInvoice` - Generate PDF invoice
- `POST /api/invoice/preview` - Get invoice preview
- `POST /api/invoice/calculate` - Calculate invoice amounts
- `GET /api/invoice/templates` - Get invoice templates

### System
- `GET /health` - Health check
- `GET /` - API documentation

## 🧪 Testing the API

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Add Income Entry
```bash
curl -X POST http://localhost:3000/api/income/addIncome \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Tech Corp",
    "amount": 50000,
    "tdsDeducted": true,
    "gstApplicable": false,
    "notes": "Website development",
    "userId": "USER_ID_FROM_DB"
  }'
```

### 3. Calculate Tax
```bash
curl "http://localhost:3000/api/tax/calculateTax?userId=USER_ID_FROM_DB"
```

### 4. Get Deductions
```bash
curl -X POST http://localhost:3000/api/tax/getDeductions \
  -H "Content-Type: application/json" \
  -d '{
    "income": 450000,
    "expenses": {
      "laptop": 40000,
      "internet": 12000
    }
  }'
```

### 5. Generate Invoice
```bash
curl -X POST http://localhost:3000/api/invoice/generateInvoice \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Design Studio",
    "amount": 30000,
    "gstApplicable": false,
    "tds": true,
    "userId": "USER_ID_FROM_DB"
  }' \
  --output invoice.pdf
```

## 💾 Sample Data

The system automatically creates sample data on first run:

### Sample User
- **Name**: John Doe
- **Email**: john@freelancer.com
- **GST Registered**: No
- **PAN**: ABCDE1234F

### Sample Income Entries
1. Tech Corp - ₹50,000 (TDS deducted)
2. Design Studio - ₹30,000 (No TDS)
3. Startup XYZ - ₹75,000 (TDS + GST applicable)

### Sample Expenses
- Laptop: ₹40,000
- Internet: ₹12,000

## 🧮 Tax Calculation Logic

### Income Tax (New Regime FY 2024-25)
- ₹0 - ₹2.5L: 0%
- ₹2.5L - ₹5L: 5%
- ₹5L - ₹7.5L: 10%
- ₹7.5L - ₹10L: 15%
- ₹10L - ₹12.5L: 20%
- ₹12.5L - ₹15L: 25%
- Above ₹15L: 30%

### TDS (Tax Deducted at Source)
- **Rate**: 10% of invoice amount
- **Applicable**: When client deducts TDS

### GST (Goods and Services Tax)
- **Threshold**: ₹20 Lakhs annual income
- **Rate**: 18% (when applicable)
- **Required**: Only for GST-registered freelancers

### Advance Tax Schedule
- **June 15**: 15% of estimated tax
- **September 15**: 45% of estimated tax
- **December 15**: 75% of estimated tax
- **March 15**: 100% of estimated tax

## 📄 Invoice Features

- **PDF Generation**: Professional invoices with PDFKit
- **TDS Breakdown**: Shows TDS deduction if applicable
- **GST Calculation**: Includes GST when applicable
- **Bank Details**: Includes freelancer's payment information
- **Invoice Numbering**: Automatic unique invoice numbers
- **Indian Currency**: Proper formatting (₹1,23,456)

## 🏗️ Project Structure

```
/src
  /models          # MongoDB schemas (User, Income)
  /services        # Business logic (TaxService, InvoiceService)
  /controllers     # Request handlers
  /routes          # API routes
  /utils           # Database connection
  app.js           # Express app configuration
server.js          # Server entry point
.env               # Environment variables
```

## 🔧 Development

### Adding New Features
1. Create/update models in `src/models/`
2. Add business logic in `src/services/`
3. Create controllers in `src/controllers/`
4. Define routes in `src/routes/`
5. Update `src/app.js` if needed

### Error Handling
- Global error handler in `src/app.js`
- Consistent error response format
- Proper HTTP status codes
- Detailed error logging

## 🚀 Deployment

### Environment Variables
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
PORT=3000
```

### Production Setup
1. Set up MongoDB Atlas
2. Configure environment variables
3. Install production dependencies
4. Start with `npm start`

## 📞 Support

Built for hackathon demo - showcases:
- ✅ Complete RESTful API
- ✅ Indian tax calculations
- ✅ PDF invoice generation
- ✅ MongoDB persistence
- ✅ Clean modular code
- ✅ Sample data for testing

Perfect for demonstrating freelancer tax management capabilities!
