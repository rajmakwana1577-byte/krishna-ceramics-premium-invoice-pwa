/**
 * Krishna Ceramics Premium GST Invoice Generator PWA
 * CORE ENGINE - app.js (100% Live Google Sheets Operational)
 */

// ==========================================================
// 1. GLOBAL STATE & GOOGLE SHEETS REGISTRY CONFIGURATION
// ==========================================================
// आपकी वास्तविक Google Sheet ID यहाँ अपडेट कर दी गई है
const GOOGLE_SHEET_ID = "1_yXlyVvCFcSiHjqqhuji8eqsyMjDkagkfkr_mBVetls"; 

let PARTY_MASTER = [];
let PRODUCT_MASTER = [];
let TRANSPORT_MASTER = [];

const SOURCE_STATE_CODE = 24; // Base Operations: Gujarat (Krishna Ceramics)

/**
 * Robust RFC 4180 Compliant CSV Parser State-Machine
 * Flawlessly processes embedded commas, double quotes, and multiline text blocks.
 */
function parseCSVToJSON(csvText) {
    const rawLines = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    const cleanText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        const nextChar = cleanText[i + 1];

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    currentCell += '"';
                    i++; 
                } else {
                    inQuotes = false;
                }
            } else {
                currentCell += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true; 
            } else if (char === ',') {
                currentRow.push(currentCell.trim());
                currentCell = '';
            } else if (char === '\n') {
                currentRow.push(currentCell.trim());
                rawLines.push(currentRow);
                currentRow = [];
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
    }
    
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        rawLines.push(currentRow);
    }

    if (rawLines.length === 0) return [];

    // Locate the structural header anchor row to bypass internal ERP metadata banners
    let headerIndex = -1;
    for (let i = 0; i < rawLines.length; i++) {
        const rowString = rawLines[i].join(' ');
        if (rowString.toLowerCase().includes('party id') || 
            rowString.toLowerCase().includes('product id') || 
            rowString.toLowerCase().includes('transport id') ||
            rowString.toLowerCase().includes('party name') ||
            rowString.toLowerCase().includes('product name') ||
            rowString.toLowerCase().includes('transport name')) {
            headerIndex = i;
            break;
        }
    }

    // Fallback if no specific banner metadata row is found
    if (headerIndex === -1) headerIndex = 0;

    const headers = rawLines[headerIndex].map(h => h.trim());
    const results = [];

    for (let i = headerIndex + 1; i < rawLines.length; i++) {
        const rowData = rawLines[i];
        if (rowData.length === 0 || (rowData.length === 1 && rowData[0] === '')) continue;

        const recordObject = {};
        headers.forEach((header, colIndex) => {
            if (header) {
                recordObject[header] = rowData[colIndex] !== undefined ? rowData[colIndex] : '';
            }
        });
        results.push(recordObject);
    }

    return results;
}

// ==========================================================
// 2. CORE DOM APPLICATION ORCHESTRATION ENGINE
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Capture View DOM Targets
    const viewHome = document.getElementById('view-home');
    const viewInvoicePanel = document.getElementById('view-invoice-panel');
    
    // Capture Action Trigger Controls
    const initiateInvoiceBtn = document.getElementById('btn-initiate-invoice');
    const backToHomeBtn = document.getElementById('btn-back-to-home');
    
    const partySelect = document.getElementById('party-select');
    const partyGstin = document.getElementById('party-gstin');
    const partyState = document.getElementById('party-state');
    
    const transportSelect = document.getElementById('transport-select');
    const transportVehicle = document.getElementById('transport-vehicle');
    
    const productRowsContainer = document.getElementById('product-rows-container');
    const appendRowBtn = document.getElementById('btn-append-row');

    // Capture Valuation Output Fields
    const valTaxable = document.getElementById('val-taxable');
    const valCgst = document.getElementById('val-cgst');
    const valSgst = document.getElementById('val-sgst');
    const valIgst = document.getElementById('val-igst');
    const valRoundoff = document.getElementById('val-roundoff');
    const valGrandtotal = document.getElementById('val-grandtotal');
    const valWords = document.getElementById('val-words');

    const containerCgst = document.getElementById('container-cgst');
    const containerSgst = document.getElementById('container-sgst');
    const containerIgst = document.getElementById('container-igst');
    
    const btnGeneratePdfUi = document.getElementById('btn-generate-pdf-ui');

    // Initialize Structural Component Icons via Lucide Engine
    function syncLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // ==========================================
    // 3. REMOTE GOOGLE SHEET INGESTION SUBMODULE
    // ==========================================
    async function fetchMasterDataFromSheets() {
        try {
            console.log("Fintech Core: Initializing Parallel Ingestion from Google Sheets...");
            
            const partyUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Party_Master`;
            const productUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Product_Master`;
            const transportUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Transport_Master`;

            // Parallel execution via Promise.all() API
            const [partyRes, productRes, transportRes] = await Promise.all([
                fetch(partyUrl),
                fetch(productUrl),
                fetch(transportUrl)
            ]);

            const [partyCsv, productCsv, transportCsv] = await Promise.all([
                partyRes.text(),
                productRes.text(),
                transportRes.text()
            ]);

            // Map Remotely Fetched Parties
            const parsedParties = parseCSVToJSON(partyCsv);
            PARTY_MASTER = parsedParties.map((p, idx) => {
                let nameKey = p['Party Name'] || p['Company Name'] || Object.values(p)[1] || 'Unknown Party';
                let gstinKey = p['GSTIN'] || p['Gstin'] || '';
                let stateKey = p['State'] || 'Gujarat';
                let rawCode = 24; 
                
                if (gstinKey && gstinKey.length >= 2) {
                    rawCode = parseInt(gstinKey.substring(0, 2)) || 24;
                } else if (p['State Code']) {
                    rawCode = parseInt(p['State Code']) || 24;
                }
                
                return {
                    id: p['Party ID'] || `p-${idx}`,
                    name: nameKey,
                    gstin: gstinKey,
                    state: stateKey,
                    stateCode: rawCode
                };
            }).filter(p => p.name && !p.name.includes('Generated:') && !p.name.includes('KRISHNA TILES'));

            // Map Remotely Fetched Products (Fixed GST 18%, Manual Price Setup)
            const parsedProducts = parseCSVToJSON(productCsv);
            PRODUCT_MASTER = parsedProducts.map((p, idx) => {
                let nameKey = p['Product Name'] || Object.values(p)[1] || 'Unknown Product';
                let hsnKey = p['HSN Code'] || '6907';
                let sizeKey = p['Size'] || p['Size Dimension'] || 'Universal';
                let unitKey = p['Billing Unit'] || p['Unit'] || 'Boxes';
                
                return {
                    id: p['Product ID'] || `prd-${idx}`,
                    name: nameKey,
                    hsn: hsnKey,
                    size: sizeKey,
                    unit: unitKey, 
                    gstRate: 18,    
                    price: 0.00     
                };
            }).filter(p => p.name && !p.name.includes('Generated:') && !p.name.includes('KRISHNA TILES'));

            // Map Remotely Fetched Transports
            const parsedTransport = parseCSVToJSON(transportCsv);
            TRANSPORT_MASTER = parsedTransport.map((t, idx) => {
                let nameKey = t['Transport Name'] || t['Carrier Name'] || Object.values(t)[1] || 'Unknown Carrier';
                let vehicleKey = t['Vehicle No.'] || t['Default Vehicle Number'] || '';
                
                return {
                    id: t['Transport ID'] || `tr-${idx}`,
                    name: nameKey,
                    defaultVehicle: vehicleKey
                };
            }).filter(t => t.name && !t.name.includes('Generated:') && !t.name.includes('TRANSPORT MASTER'));

            console.log(`Fintech Core Sync Completed: ${PARTY_MASTER.length} Parties, ${PRODUCT_MASTER.length} Products, ${TRANSPORT_MASTER.length} Transporters populated.`);
            
            // Invoke Dropdown Population immediately post remote execution completion
            loadDropdownMasters();

        } catch (error) {
            console.error("Critical Google Sheets Parallel Data Sync Failure:", error);
            loadDropdownMasters();
        }
    }

    // ==========================================
    // 4. DROPDOWN INJECTION LOGIC
    // ==========================================
    function loadDropdownMasters() {
        if (partySelect) {
            partySelect.innerHTML = '<option value="">Select Premium Business Client</option>';
            PARTY_MASTER.forEach(party => {
                const opt = document.createElement('option');
                opt.value = party.id;
                opt.textContent = party.name;
                partySelect.appendChild(opt);
            });
        }

        if (transportSelect) {
            transportSelect.innerHTML = '<option value="">Select Registered Transport Fleet</option>';
            TRANSPORT_MASTER.forEach(trans => {
                const opt = document.createElement('option');
                opt.value = trans.id;
                opt.textContent = trans.name;
                transportSelect.appendChild(opt);
            });
        }
        
        // Refresh product dropdowns if rows are already generated
        if (productRowsContainer) {
            productRowsContainer.querySelectorAll('.row-product-select').forEach(select => {
                const savedValue = select.value;
                select.innerHTML = '<option value="">Select Premium Surface Slabs</option>';
                PRODUCT_MASTER.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = p.name;
                    select.appendChild(opt);
                });
                if (savedValue) select.value = savedValue;
            });
        }
    }

    // Auto-fill listeners mapping logic
    if (partySelect) {
        partySelect.addEventListener('change', (e) => {
            const selectedParty = PARTY_MASTER.find(p => p.id === e.target.value);
            if (selectedParty) {
                partyGstin.value = selectedParty.gstin;
                partyState.value = `${selectedParty.state} (${selectedParty.stateCode.toString().padStart(2, '0')})`;
                partyState.dataset.stateCode = selectedParty.stateCode;
            } else {
                partyGstin.value = '';
                partyState.value = '';
                partyState.dataset.stateCode = '';
            }
            calculateMasterInvoiceLedger();
        });
    }

    if (transportSelect) {
        transportSelect.addEventListener('change', (e) => {
            const selectedTrans = TRANSPORT_MASTER.find(t => t.id === e.target.value);
            if (selectedTrans) {
                transportVehicle.value = selectedTrans.defaultVehicle;
            } else {
                transportVehicle.value = '';
            }
        });
    }

    // ==========================================
    // 5. ROUTE VIEW TRANSITIONS
    // ==========================================
    if (initiateInvoiceBtn) {
        initiateInvoiceBtn.addEventListener('click', () => {
            if (viewHome && viewInvoicePanel) {
                viewHome.classList.remove('active');
                viewInvoicePanel.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                initiateInvoiceDefaults();
            }
        });
    }

    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            if (viewHome && viewInvoicePanel) {
                viewInvoicePanel.classList.remove('active');
                viewHome.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // ==========================================
    // 6. INVOICE COMPUTATION DYNAMICS ENGINE
    // ==========================================
    function initiateInvoiceDefaults() {
        if (productRowsContainer) productRowsContainer.innerHTML = '';
        if (partySelect) partySelect.value = '';
        if (partyGstin) partyGstin.value = '';
        if (partyState) {
            partyState.value = '';
            partyState.dataset.stateCode = '';
        }
        if (transportSelect) transportSelect.value = '';
        if (transportVehicle) transportVehicle.value = '';
        
        spawnProductRowSlot();
        calculateMasterInvoiceLedger();
    }

    function spawnProductRowSlot() {
        if (!productRowsContainer) return;
        const nextIdx = productRowsContainer.querySelectorAll('.product-row-component').length + 1;
        const rowWrapper = document.createElement('div');
        rowWrapper.className = 'product-row-component';
        
        let prdOptions = '<option value="">Select Premium Surface Slabs</option>';
        PRODUCT_MASTER.forEach(p => {
            prdOptions += `<option value="${p.id}">${p.name}</option>`;
        });

        rowWrapper.innerHTML = `
            <div class="row-meta-header">
                <span class="row-count-badge">Item #${nextIdx}</span>
                <button type="button" class="btn-remove-row-slot"><i data-lucide="x"></i></button>
            </div>
            <div class="row-inputs-grid">
                <div class="input-field-group grid-span-full">
                    <label>Product Description</label>
                    <select class="select-field row-product-select">${prdOptions}</select>
                </div>
                <div class="input-field-group">
                    <label>HSN</label>
                    <input type="text" class="row-hsn" placeholder="Code" readonly>
                </div>
                <div class="input-field-group">
                    <label>Size</label>
                    <input type="text" class="row-size" placeholder="Dimensions" readonly>
                </div>
                <div class="input-field-group">
                    <label>Unit</label>
                    <input type="text" class="row-unit" placeholder="Unit" readonly>
                </div>
                <div class="input-field-group">
                    <label>Qty</label>
                    <input type="number" class="row-qty align-right-numeric" value="1">
                </div>
                <div class="input-field-group">
                    <label>Rate (₹)</label>
                    <input type="number" class="row-rate align-right-numeric" value="0.00" step="0.01">
                </div>
                <div class="input-field-group">
                    <label>Disc (%)</label>
                    <input type="number" class="row-disc align-right-numeric" value="0.00" step="0.01">
                </div>
                <div class="input-field-group">
                    <label>GST (%)</label>
                    <input type="text" class="row-gst text-center-aligned" placeholder="%" readonly>
                </div>
                <div class="input-field-group grid-span-double-right">
                    <label>Amount (₹)</label>
                    <div class="static-amount-output row-calculated-amount">₹0.00</div>
                </div>
            </div>
        `;

        productRowsContainer.appendChild(rowWrapper);
        syncLucideIcons();
        bindRowEventOrchestration(rowWrapper);
    }

    function bindRowEventOrchestration(rowElement) {
        const prdSelect = rowElement.querySelector('.row-product-select');
        const qtyInput = rowElement.querySelector('.row-qty');
        const rateInput = rowElement.querySelector('.row-rate');
        const discInput = rowElement.querySelector('.row-disc');
        const deleteBtn = rowElement.querySelector('.btn-remove-row-slot');

        if (prdSelect) {
            prdSelect.addEventListener('change', (e) => {
                const prd = PRODUCT_MASTER.find(p => p.id === e.target.value);
                if (prd) {
                    rowElement.querySelector('.row-hsn').value = prd.hsn;
                    rowElement.querySelector('.row-size').value = prd.size;
                    rowElement.querySelector('.row-unit').value = prd.unit;
                    rowElement.querySelector('.row-gst').value = `${prd.gstRate}%`;
                    rowElement.querySelector('.row-gst').dataset.rate = prd.gstRate;
                } else {
                    rowElement.querySelector('.row-hsn').value = '';
                    rowElement.querySelector('.row-size').value = '';
                    rowElement.querySelector('.row-unit').value = '';
                    rowElement.querySelector('.row-gst').value = '';
                    rowElement.querySelector('.row-gst').dataset.rate = 0;
                }
                calculateSingleRowOutput(rowElement);
            });
        }

        [qtyInput, rateInput, discInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => calculateSingleRowOutput(rowElement));
            }
        });

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (productRowsContainer.querySelectorAll('.product-row-component').length > 1) {
                    rowElement.remove();
                    reindexRowBadges();
                    calculateMasterInvoiceLedger();
                }
            });
        }
    }

    function calculateSingleRowOutput(rowElement) {
        const qty = parseFloat(rowElement.querySelector('.row-qty').value) || 0;
        const rate = parseFloat(rowElement.querySelector('.row-rate').value) || 0;
        const discPct = parseFloat(rowElement.querySelector('.row-disc').value) || 0;
        
        const baseGross = qty * rate;
        const discAmount = baseGross * (discPct / 100);
        const dynamicRowNetTaxable = baseGross - discAmount;
        
        const amtDiv = rowElement.querySelector('.row-calculated-amount');
        if (amtDiv) {
            amtDiv.textContent = `₹${dynamicRowNetTaxable.toFixed(2)}`;
            amtDiv.dataset.taxableVal = dynamicRowNetTaxable;
        }

        calculateMasterInvoiceLedger();
    }

    function reindexRowBadges() {
        if (!productRowsContainer) return;
        productRowsContainer.querySelectorAll('.product-row-component').forEach((row, index) => {
            const badge = row.querySelector('.row-count-badge');
            if (badge) badge.textContent = `Item #${index + 1}`;
        });
    }

    function calculateMasterInvoiceLedger() {
        let cumulativeTaxableValue = 0;
        let cumulativeCgst = 0;
        let cumulativeSgst = 0;
        let cumulativeIgst = 0;

        const clientStateCode = partyState ? (parseInt(partyState.dataset.stateCode) || 0) : 0;
        const isInterstate = clientStateCode > 0 && clientStateCode !== SOURCE_STATE_CODE;

        if (productRowsContainer) {
            productRowsContainer.querySelectorAll('.product-row-component').forEach(row => {
                const amtDiv = row.querySelector('.row-calculated-amount');
                const gstInput = row.querySelector('.row-gst');
                const rowTaxable = amtDiv ? (parseFloat(amtDiv.dataset.taxableVal) || 0) : 0;
                const rowGstRate = gstInput ? (parseFloat(gstInput.dataset.rate) || 0) : 0;
                
                cumulativeTaxableValue += rowTaxable;

                if (rowTaxable > 0 && rowGstRate > 0) {
                    const calculatedTax = rowTaxable * (rowGstRate / 100);
                    if (isInterstate) {
                        cumulativeIgst += calculatedTax;
                    } else {
                        cumulativeCgst += (calculatedTax / 2);
                        cumulativeSgst += (calculatedTax / 2);
                    }
                }
            });
        }

        const grossFinalCombinedTotal = cumulativeTaxableValue + cumulativeCgst + cumulativeSgst + cumulativeIgst;
        const mathematicallyRoundedTotal = Math.round(grossFinalCombinedTotal);
        const roundOffAdjustment = mathematicallyRoundedTotal - grossFinalCombinedTotal;

        if (valTaxable) valTaxable.textContent = `₹${cumulativeTaxableValue.toFixed(2)}`;
        if (valCgst) valCgst.textContent = `₹${cumulativeCgst.toFixed(2)}`;
        if (valSgst) valSgst.textContent = `₹${cumulativeSgst.toFixed(2)}`;
        if (valIgst) valIgst.textContent = `₹${cumulativeIgst.toFixed(2)}`;
        if (valRoundoff) valRoundoff.textContent = `${roundOffAdjustment >= 0 ? '+' : ''}₹${roundOffAdjustment.toFixed(2)}`;
        if (valGrandtotal) valGrandtotal.textContent = `₹${mathematicallyRoundedTotal.toFixed(2)}`;

        if (isInterstate) {
            if (containerIgst) containerIgst.style.display = 'flex';
            if (containerCgst) containerCgst.style.display = 'none';
            if (containerSgst) containerSgst.style.display = 'none';
        } else {
            if (containerIgst) containerIgst.style.display = 'none';
            if (containerCgst) containerCgst.style.display = 'flex';
            if (containerSgst) containerSgst.style.display = 'flex';
        }

        if (valWords) valWords.textContent = transformNumberToWords(mathematicallyRoundedTotal);
    }

    // ==========================================
    // 7. NUMERIC TO ALPHABETIC CONVERSION (WORDS)
    // ==========================================
    function transformNumberToWords(num) {
        if (num === 0) return "INR Zero Only";
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        
        function convertHundreds(n) {
            let str = "";
            if (n > 99) { str += a[Math.floor(n / 100)] + "Hundred "; n %= 100; }
            if (n > 19) { str += b[Math.floor(n / 10)] + " " + a[n % 10]; } 
            else if (n > 0) { str += a[n]; }
            return str;
        }

        let rem = num; let wordResult = "";
        const crores = Math.floor(rem / 10000000); rem %= 10000000;
        if (crores > 0) wordResult += convertHundreds(crores) + "Crore ";
        const lakhs = Math.floor(rem / 100000); rem %= 100000;
        if (lakhs > 0) wordResult += convertHundreds(lakhs) + "Lakh ";
        const thousands = Math.floor(rem / 1000); rem %= 1000;
        if (thousands > 0) wordResult += convertHundreds(thousands) + "Thousand ";
        if (rem > 0) wordResult += convertHundreds(rem);
        return "INR " + wordResult.trim() + " Only";
    }

    // ==========================================
    // 8. FINAL ACTION INTEGRATIONS & INITIALIZATION
    // ==========================================
    if (btnGeneratePdfUi) {
        btnGeneratePdfUi.addEventListener('click', () => {
            if (partySelect && !partySelect.value) {
                alert("Validation Exception: Please select a Customer Party before generating the PDF.");
                return;
            }
            if (typeof window.generatePremiumInvoicePDF === 'function') {
                window.generatePremiumInvoicePDF();
            } else {
                console.error("PDF Engine Module missing or failed to initialize.");
            }
        });
    }

    if (appendRowBtn) { 
        appendRowBtn.addEventListener('click', spawnProductRowSlot); 
    }

    // Fire Live Remoting System Link Framework instead of local mock arrays
    fetchMasterDataFromSheets();
    syncLucideIcons();
});
