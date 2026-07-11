/**
 * Krishna Ceramics Premium GST Invoice Generator PWA
 * MODULE: Premium PDF/Print Generation Engine
 */

window.generatePremiumInvoicePDF = function() {
    // 1. लाइव डेटा एलिमेंट्स को कैप्चर करना
    const invNumber = document.getElementById('inv-number')?.value || 'N/A';
    const invDate = document.getElementById('inv-date')?.value || new Date().toLocaleDateString('en-IN');
    
    const partySelect = document.getElementById('party-select');
    const partyName = partySelect?.options[partySelect.selectedIndex]?.text || 'Walk-in Customer';
    const partyGstin = document.getElementById('party-gstin')?.value || 'N/A';
    const partyState = document.getElementById('party-state')?.value || 'N/A';
    
    const transportSelect = document.getElementById('transport-select');
    const transportName = transportSelect?.options[transportSelect.selectedIndex]?.text || 'N/A';
    const transportVehicle = document.getElementById('transport-vehicle')?.value || 'N/A';
    
    const taxableVal = document.getElementById('val-taxable')?.textContent || '₹0.00';
    const cgstVal = document.getElementById('val-cgst')?.textContent || '₹0.00';
    const sgstVal = document.getElementById('val-sgst')?.textContent || '₹0.00';
    const igstVal = document.getElementById('val-igst')?.textContent || '₹0.00';
    const roundOff = document.getElementById('val-roundoff')?.textContent || '₹0.00';
    const grandTotal = document.getElementById('val-grandtotal')?.textContent || '₹0.00';
    const amountInWords = document.getElementById('val-words')?.textContent || 'Zero Only';

    // 2. लाइव प्रोडक्ट रो का डेटा निकालना
    let productRowsHTML = '';
    const rowComponents = document.querySelectorAll('#product-rows-container .product-row-component');
    
    rowComponents.forEach((row, index) => {
        const prdSelect = row.querySelector('.row-product-select');
        const prdName = prdSelect?.options[prdSelect.selectedIndex]?.text || 'Premium Surface Slab';
        const hsn = row.querySelector('.row-hsn')?.value || '-';
        const size = row.querySelector('.row-size')?.value || '-';
        const unit = row.querySelector('.row-unit')?.value || '-';
        const qty = row.querySelector('.row-qty')?.value || '0';
        const rate = row.querySelector('.row-rate')?.value || '0.00';
        const disc = row.querySelector('.row-disc')?.value || '0.00';
        const gst = row.querySelector('.row-gst')?.value || '0%';
        const amount = row.querySelector('.row-calculated-amount')?.textContent || '₹0.00';

        productRowsHTML += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; text-align: center;">${index + 1}</td>
                <td style="padding: 8px;"><strong>${prdName}</strong></td>
                <td style="padding: 8px; text-align: center;">${hsn}</td>
                <td style="padding: 8px; text-align: center;">${size}</td>
                <td style="padding: 8px; text-align: center;">${unit}</td>
                <td style="padding: 8px; text-align: right;">${qty}</td>
                <td style="padding: 8px; text-align: right;">${parseFloat(rate).toFixed(2)}</td>
                <td style="padding: 8px; text-align: right;">${parseFloat(disc).toFixed(2)}%</td>
                <td style="padding: 8px; text-align: center;">${gst}</td>
                <td style="padding: 8px; text-align: right; font-weight: 600;">${amount}</td>
            </tr>
        `;
    });

    // 3. इंटरस्टेट टैक्स (IGST vs CGST/SGST) का विज़ुअल डिसीजन
    const isIgstActive = document.getElementById('container-igst')?.style.display === 'flex';
    let taxBreakdownHTML = '';
    
    if (isIgstActive) {
        taxBreakdownHTML = `<div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>IGST:</span><strong>${igstVal}</strong></div>`;
    } else {
        taxBreakdownHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>CGST:</span><strong>${cgstVal}</strong></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>SGST:</span><strong>${sgstVal}</strong></div>
        `;
    }

    // 4. एक नया हिडन प्रिंट फ्रेम या विंडो कंस्ट्रक्ट करना जो मौजूदा UI को बिना छुए बैकएंड पर काम करे
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Tax Invoice — ${invNumber}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; color: #000000; margin: 0; padding: 40px; font-size: 12px; line-height: 1.5; background: #fff; }
                @page { size: A4 portrait; margin: 10mm; }
                .header-table, .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .brand-title { font-size: 26px; font-weight: 700; color: #040814; margin: 0; letter-spacing: 0.5px; }
                .brand-subtitle { font-size: 10px; text-transform: uppercase; color: #d4af37; font-weight: 600; letter-spacing: 1px; margin: 2px 0 8px 0; }
                .badge { font-size: 16px; font-weight: 700; border: 1.5px solid #000; padding: 6px 16px; display: inline-block; letter-spacing: 1px; }
                .grid-box { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; margin-bottom: 20px; }
                .card { border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; }
                .card-title { font-size: 9px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; letter-spacing: 0.5px; text-transform: uppercase; color: #475569; }
                .main-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .main-table th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 8px; font-size: 9px; text-transform: uppercase; font-weight: 600; }
                .summary-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 20px; margin-bottom: 20px; }
                .total-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
                .grand-highlight { border-top: 2px double #000; padding-top: 8px; font-size: 15px; font-weight: 700; color: #040814; }
                .words-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 30px; font-size: 11px; }
                .footer-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; align-items: flex-start; }
                .signature-space { text-align: center; font-size: 12px; }
            </style>
        </head>
        <body>
            <!-- Header Block -->
            <table class="header-table">
                <tr>
                    <td>
                        <h1 class="brand-title">KRISHNA CERAMICS</h1>
                        <div class="brand-subtitle">Premium Architectural Surfaces & Luxury Slabs</div>
                        <p style="margin:0; color:#475569;">8-A National Highway, Morbi - 363642, Gujarat, India</p>
                        <p style="margin:2px 0 0 0; color:#475569;">Email: contact@krishnaceramics.com | Mobile: +91 99999 88888</p>
                    </td>
                    <td style="text-align: right; vertical-align: top;">
                        <div class="badge">TAX INVOICE</div>
                        <p style="margin:10px 0 0 0;"><strong>Invoice No:</strong> ${invNumber}</p>
                        <p style="margin:4px 0 0 0;"><strong>Date:</strong> ${invDate}</p>
                        <p style="margin:4px 0 0 0;"><strong>GSTIN:</strong> 24AAAAA0000A1Z5</p>
                    </td>
                </tr>
            </table>

            <!-- Party & Logistics Split Row -->
            <div class="grid-box">
                <div class="card">
                    <div class="card-title">Billed To (Party Details)</div>
                    <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>${partyName}</strong></p>
                    <p style="margin: 2px 0;"><strong>GSTIN:</strong> ${partyGstin}</p>
                    <p style="margin: 2px 0;"><strong>State of Supply:</strong> ${partyState}</p>
                </div>
                <div class="card">
                    <div class="card-title">Logistics & Transport</div>
                    <p style="margin: 0 0 4px 0;"><strong>Carrier Transport:</strong> ${transportName}</p>
                    <p style="margin: 2px 0;"><strong>Vehicle Number:</strong> ${transportVehicle}</p>
                </div>
            </div>

            <!-- Product Table Ledger -->
            <table class="main-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">#</th>
                        <th style="width: 40%; text-align: left;">Product Description</th>
                        <th style="width: 8%;">HSN</th>
                        <th style="width: 10%;">Size</th>
                        <th style="width: 7%;">Unit</th>
                        <th style="width: 6%; text-align: right;">Qty</th>
                        <th style="width: 8%; text-align: right;">Rate</th>
                        <th style="width: 6%; text-align: right;">Disc</th>
                        <th style="width: 6%;">GST</th>
                        <th style="width: 12%; text-align: right;">Taxable Amt</th>
                    </tr>
                </thead>
                <tbody>
                    ${productRowsHTML}
                </tbody>
            </table>

            <!-- Summary Block -->
            <div class="summary-grid">
                <div class="card">
                    <div class="card-title">Bank Account Details</div>
                    <p style="margin: 2px 0;"><strong>Bank Name:</strong> HDFC Bank Ltd</p>
                    <p style="margin: 2px 0;"><strong>Account Name:</strong> KRISHNA CERAMICS</p>
                    <p style="margin: 2px 0;"><strong>A/C Number:</strong> 50200088884444</p>
                    <p style="margin: 2px 0;"><strong>IFSC Code:</strong> HDFC0000123</p>
                    <p style="margin: 2px 0;"><strong>Branch:</strong> Morbi Highway Branch</p>
                </div>
                <div class="print-totals-box" style="display: flex; flex-direction: column; justify-content: flex-start; gap: 4px; padding: 6px;">
                    <div class="total-row"><span>Taxable Value:</span><strong>${taxableVal}</strong></div>
                    ${taxBreakdownHTML}
                    <div class="total-row"><span>Round Off Adjustment:</span><strong>${roundOff}</strong></div>
                    <div class="total-row grand-highlight"><span>Grand Total:</span><strong>${grandTotal}</strong></div>
                </div>
            </div>

            <!-- Amount in Words -->
            <div class="words-box">
                <strong>Amount in Words:</strong> <span style="text-transform: capitalize;">${amountInWords}</span>
            </div>

            <!-- Institutional Footer Declaration -->
            <div class="footer-grid">
                <div style="font-size: 10px; color: #475569; line-height: 1.4;">
                    <p style="margin: 0 0 4px 0; font-weight: 600; color: #040814;">Terms & Conditions:</p>
                    <p style="margin: 0;">1. Goods once sold will not be taken back or exchanged.</p>
                    <p style="margin: 2px 0 0 0;">2. Disputes, if any, are subject to Morbi jurisdiction only.</p>
                </div>
                <div class="signature-space">
                    <p style="margin: 0 0 40px 0;">For, <strong>KRISHNA CERAMICS</strong></p>
                    <p style="margin: 0; font-weight: 600;">Authorized Signatory</p>
                    <p style="margin: 2px 0 0 0; color: #475569; font-size: 10px;">(Manpreet Kaur)</p>
                </div>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
};
