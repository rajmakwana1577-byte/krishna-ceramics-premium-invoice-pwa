document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. DATA MASTER DATASETS
    // ==========================================
    const PARTY_MASTER = [
        { id: "p1", name: "Royal Heritage Hotels Pvt Ltd", gstin: "24AAAAA1234A1Z0", state: "Gujarat", stateCode: 24 },
        { id: "p2", name: "Ambika Marbles & Tiles Delhi", gstin: "07BBBBB5678B2Z1", state: "Delhi", stateCode: 7 },
        { id: "p3", name: "Maruti Surface Distributors", gstin: "24CCCCC9876C1Z2", state: "Gujarat", stateCode: 24 },
        { id: "p4", name: "Jaipur Design Studio", gstin: "08DDDDD4321D3Z4", state: "Rajasthan", stateCode: 8 }
    ];

    const PRODUCT_MASTER = [
        { id: "prd1", name: "Statvario Imperial Polished GVT", hsn: "6907", size: "800x1600", unit: "Boxes", gstRate: 18, price: 850.00 },
        { id: "prd2", name: "Carara White Premium Quartz", hsn: "6802", size: "700x3000", unit: "Sq.Ft", gstRate: 18, price: 320.00 },
        { id: "prd3", name: "Neo-Classic Matt Finish Porcelain", hsn: "6907", size: "600x1200", unit: "Boxes", gstRate: 18, price: 540.00 },
        { id: "prd4", name: "Royal Gold Metallic Highlighter", hsn: "6907", size: "300x600", unit: "Pcs", gstRate: 12, price: 180.00 }
    ];

    const TRANSPORT_MASTER = [
        { id: "t1", name: "Shree Balaji Logistics", defaultVehicle: "GJ-03-AT-4592" },
        { id: "t2", name: "Khalsa Cargo Carriers", defaultVehicle: "PB-11-XX-8821" },
        { id: "t3", name: "Marwar Surface Transport", defaultVehicle: "RJ-14-PC-0943" }
    ];

    const SOURCE_STATE_CODE = 24;

    // ==========================================
    // 2. DOM ELEMENT REGISTRY
    // ==========================================
    const viewHome = document.getElementById('view-home');
    const viewInvoicePanel = document.getElementById('view-invoice-panel');
    const initiateInvoiceBtn = document.getElementById('btn-initiate-invoice');
    const backToHomeBtn = document.getElementById('btn-back-to-home');
    
    const partySelect = document.getElementById('party-select');
    const partyGstin = document.getElementById('party-gstin');
    const partyState = document.getElementById('party-state');
    
    const transportSelect = document.getElementById('transport-select');
    const transportVehicle = document.getElementById('transport-vehicle');
    
    const productRowsContainer = document.getElementById('product-rows-container');
    const appendRowBtn = document.getElementById('btn-append-row');

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

    // ==========================================
    // 3. NAVIGATION & ICON SETUP
    // ==========================================
    function syncLucideIcons() {
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    if (initiateInvoiceBtn) {
        initiateInvoiceBtn.addEventListener('click', () => {
            viewHome.classList.remove('active');
            viewInvoicePanel.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            initiateInvoiceDefaults();
        });
    }

    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            viewInvoicePanel.classList.remove('active');
            viewHome.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function loadDropdownMasters() {
        partySelect.innerHTML = '<option value="">Select Premium Business Client</option>';
        PARTY_MASTER.forEach(party => {
            const opt = document.createElement('option');
            opt.value = party.id;
            opt.textContent = party.name;
            partySelect.appendChild(opt);
        });

        transportSelect.innerHTML = '<option value="">Select Registered Transport Fleet</option>';
        TRANSPORT_MASTER.forEach(trans => {
            const opt = document.createElement('option');
            opt.value = trans.id;
            opt.textContent = trans.name;
            transportSelect.appendChild(opt);
        });
    }

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

    transportSelect.addEventListener('change', (e) => {
        const selectedTrans = TRANSPORT_MASTER.find(t => t.id === e.target.value);
        if (selectedTrans) {
            transportVehicle.value = selectedTrans.defaultVehicle;
        } else {
            transportVehicle.value = '';
        }
    });

    // ==========================================
    // 4. COMPUTATION ENGINE
    // ==========================================
    function initiateInvoiceDefaults() {
        productRowsContainer.innerHTML = '';
        partySelect.value = '';
        partyGstin.value = '';
        partyState.value = '';
        partyState.dataset.stateCode = '';
        transportSelect.value = '';
        transportVehicle.value = '';
        
        spawnProductRowSlot();
        calculateMasterInvoiceLedger();
    }

    function spawnProductRowSlot() {
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

        prdSelect.addEventListener('change', (e) => {
            const prd = PRODUCT_MASTER.find(p => p.id === e.target.value);
            if (prd) {
                rowElement.querySelector('.row-hsn').value = prd.hsn;
                rowElement.querySelector('.row-size').value = prd.size;
                rowElement.querySelector('.row-unit').value = prd.unit;
                rowElement.querySelector('.row-gst').value = `${prd.gstRate}%`;
                rowElement.querySelector('.row-gst').dataset.rate = prd.gstRate;
                rateInput.value = prd.price.toFixed(2);
            } else {
                rowElement.querySelector('.row-hsn').value = '';
                rowElement.querySelector('.row-size').value = '';
                rowElement.querySelector('.row-unit').value = '';
                rowElement.querySelector('.row-gst').value = '';
                rowElement.querySelector('.row-gst').dataset.rate = 0;
                rateInput.value = '0.00';
            }
            calculateSingleRowOutput(rowElement);
        });

        [qtyInput, rateInput, discInput].forEach(input => {
            input.addEventListener('input', () => calculateSingleRowOutput(rowElement));
        });

        deleteBtn.addEventListener('click', () => {
            if (productRowsContainer.querySelectorAll('.product-row-component').length > 1) {
                rowElement.remove();
                reindexRowBadges();
                calculateMasterInvoiceLedger();
            }
        });
    }

    function calculateSingleRowOutput(rowElement) {
        const qty = parseFloat(rowElement.querySelector('.row-qty').value) || 0;
        const rate = parseFloat(rowElement.querySelector('.row-rate').value) || 0;
        const discPct = parseFloat(rowElement.querySelector('.row-disc').value) || 0;
        
        const baseGross = qty * rate;
        const discAmount = baseGross * (discPct / 100);
        const dynamicRowNetTaxable = baseGross - discAmount;
        
        rowElement.querySelector('.row-calculated-amount').textContent = `₹${dynamicRowNetTaxable.toFixed(2)}`;
        rowElement.querySelector('.row-calculated-amount').dataset.taxableVal = dynamicRowNetTaxable;

        calculateMasterInvoiceLedger();
    }

    function reindexRowBadges() {
        productRowsContainer.querySelectorAll('.product-row-component').forEach((row, index) => {
            row.querySelector('.row-count-badge').textContent = `Item #${index + 1}`;
        });
    }

    function calculateMasterInvoiceLedger() {
        let cumulativeTaxableValue = 0;
        let cumulativeCgst = 0;
        let cumulativeSgst = 0;
        let cumulativeIgst = 0;

        const clientStateCode = parseInt(partyState.dataset.stateCode) || 0;
        const isInterstate = clientStateCode > 0 && clientStateCode !== SOURCE_STATE_CODE;

        productRowsContainer.querySelectorAll('.product-row-component').forEach(row => {
            const rowTaxable = parseFloat(row.querySelector('.row-calculated-amount').dataset.taxableVal) || 0;
            const rowGstRate = parseFloat(row.querySelector('.row-gst').dataset.rate) || 0;
            
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

        const grossFinalCombinedTotal = cumulativeTaxableValue + cumulativeCgst + cumulativeSgst + cumulativeIgst;
        const mathematicallyRoundedTotal = Math.round(grossFinalCombinedTotal);
        const roundOffAdjustment = mathematicallyRoundedTotal - grossFinalCombinedTotal;

        valTaxable.textContent = `₹${cumulativeTaxableValue.toFixed(2)}`;
        valCgst.textContent = `₹${cumulativeCgst.toFixed(2)}`;
        valSgst.textContent = `₹${cumulativeSgst.toFixed(2)}`;
        valIgst.textContent = `₹${cumulativeIgst.toFixed(2)}`;
        valRoundoff.textContent = `${roundOffAdjustment >= 0 ? '+' : ''}₹${roundOffAdjustment.toFixed(2)}`;
        valGrandtotal.textContent = `₹${mathematicallyRoundedTotal.toFixed(2)}`;

        if (isInterstate) {
            containerIgst.style.display = 'flex';
            containerCgst.style.display = 'none';
            containerSgst.style.display = 'none';
        } else {
            containerIgst.style.display = 'none';
            containerCgst.style.display = 'flex';
            containerSgst.style.display = 'flex';
        }

        valWords.textContent = transformNumberToWords(mathematicallyRoundedTotal);
    }

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
    // 5. PREMIUM PRINT ENGINE (PDF GENERATOR)
    // ==========================================
    if (btnGeneratePdfUi) {
        btnGeneratePdfUi.addEventListener('click', () => {
            // Check verification mapping first
            if(!partySelect.value) {
                alert("Validation Exception: Please map a Customer Party before printing.");
                return;
            }

            // Sync structural descriptors
            document.getElementById('p-inv-no').textContent = document.getElementById('inv-number').value;
            document.getElementById('p-inv-date').textContent = document.getElementById('inv-date').value;
            
            const currentParty = PARTY_MASTER.find(p => p.id === partySelect.value);
            document.getElementById('p-party-name').textContent = currentParty.name;
            document.getElementById('p-party-gstin').textContent = currentParty.gstin;
            document.getElementById('p-party-state').textContent = partyState.value;

            const currentTrans = TRANSPORT_MASTER.find(t => t.id === transportSelect.value);
            document.getElementById('p-trans-name').textContent = currentTrans ? currentTrans.name : 'N/A';
            document.getElementById('p-trans-vehicle').textContent = transportVehicle.value || 'N/A';

            // Sync dynamic rows
            const printTableBody = document.getElementById('print-table-body');
            printTableBody.innerHTML = '';
            
            productRowsContainer.querySelectorAll('.product-row-component').forEach((row, i) => {
                const prdSelect = row.querySelector('.row-product-select');
                const prdObj = PRODUCT_MASTER.find(p => p.id === prdSelect.value);
                if(!prdObj) return;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${i + 1}</td>
                    <td><strong>${prdObj.name}</strong></td>
                    <td>${row.querySelector('.row-hsn').value}</td>
                    <td>${row.querySelector('.row-size').value}</td>
                    <td>${row.querySelector('.row-unit').value}</td>
                    <td class="text-right">${row.querySelector('.row-qty').value}</td>
                    <td class="text-right">${parseFloat(row.querySelector('.row-rate').value).toFixed(2)}</td>
                    <td class="text-right">${parseFloat(row.querySelector('.row-disc').value).toFixed(2)}%</td>
                    <td class="text-right">${row.querySelector('.row-gst').value}</td>
                    <td class="text-right">${row.querySelector('.row-calculated-amount').textContent}</td>
                `;
                printTableBody.appendChild(tr);
            });

            // Sync calculations block
            document.getElementById('p-val-taxable').textContent = valTaxable.textContent;
            document.getElementById('p-val-cgst').textContent = valCgst.textContent;
            document.getElementById('p-val-sgst').textContent = valSgst.textContent;
            document.getElementById('p-val-igst').textContent = valIgst.textContent;
            document.getElementById('p-val-roundoff').textContent = valRoundoff.textContent;
            document.getElementById('p-val-grandtotal').textContent = valGrandtotal.textContent;
            document.getElementById('p-val-words').textContent = valWords.textContent;

            // Handle interstate tax view flags
            const clientStateCode = parseInt(partyState.dataset.stateCode) || 0;
            if (clientStateCode > 0 && clientStateCode !== SOURCE_STATE_CODE) {
                document.getElementById('p-box-igst').style.display = 'flex';
                document.getElementById('p-box-cgst').style.display = 'none';
                document.getElementById('p-box-sgst').style.display = 'none';
            } else {
                document.getElementById('p-box-igst').style.display = 'none';
                document.getElementById('p-box-cgst').style.display = 'flex';
                document.getElementById('p-box-sgst').style.display = 'flex';
            }

            // Trigger Print Engine
            window.print();
        });
    }

    if (appendRowBtn) { appendRowBtn.addEventListener('click', spawnProductRowSlot); }
    loadDropdownMasters();
});
