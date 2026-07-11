document.addEventListener('DOMContentLoaded', () => {
    
    // Initialize Structural Component Icons via Lucide Engine
    function syncLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    syncLucideIcons();

    // Capture View DOM References
    const viewHome = document.getElementById('view-home');
    const viewInvoicePanel = document.getElementById('view-invoice-panel');
    
    // Capture Action Navigation Switches
    const initiateInvoiceBtn = document.getElementById('btn-initiate-invoice');
    const backToHomeBtn = document.getElementById('btn-back-to-home');

    // Route Switching Mechanics
    if (initiateInvoiceBtn && viewHome && viewInvoicePanel) {
        initiateInvoiceBtn.addEventListener('click', () => {
            viewHome.classList.remove('active');
            viewInvoicePanel.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            console.log("Navigation System: Shifted layout state to Invoice Terminal Workspace.");
        });
    }

    if (backToHomeBtn && viewHome && viewInvoicePanel) {
        backToHomeBtn.addEventListener('click', () => {
            viewInvoicePanel.classList.remove('active');
            viewHome.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            console.log("Navigation System: Returned layout context to main dashboard profile.");
        });
    }

    // --- DYNAMIC PRODUCTION ROW SPAWNER UI ONLY ---
    const productRowsContainer = document.getElementById('product-rows-container');
    const appendRowBtn = document.getElementById('btn-append-row');

    if (appendRowBtn && productRowsContainer) {
        appendRowBtn.addEventListener('click', () => {
            const currentRowsCount = productRowsContainer.querySelectorAll('.product-row-component').length + 1;
            
            const newRowMockup = document.createElement('div');
            newRowMockup.className = 'product-row-component';
            newRowMockup.innerHTML = `
                <div class="row-meta-header">
                    <span class="row-count-badge">Item #${currentRowsCount}</span>
                    <button type="button" class="btn-remove-row-slot"><i data-lucide="x"></i></button>
                </div>
                <div class="row-inputs-grid">
                    <div class="input-field-group grid-span-full">
                        <label>Product Description</label>
                        <select class="select-field">
                            <option value="">Select Premium Surface Slabs</option>
                            <option>Statvario Imperial Polished GVT</option>
                            <option>Carara White Premium Quartz</option>
                            <option>Neo-Classic Matt Finish Porcelain</option>
                        </select>
                    </div>
                    <div class="input-field-group">
                        <label>HSN</label>
                        <input type="text" value="6907" placeholder="Code">
                    </div>
                    <div class="input-field-group">
                        <label>Size</label>
                        <input type="text" placeholder="Dimensions">
                    </div>
                    <div class="input-field-group">
                        <label>Unit</label>
                        <select class="select-field">
                            <option>Boxes</option>
                            <option>Sq.Ft</option>
                            <option>Pcs</option>
                        </select>
                    </div>
                    <div class="input-field-group">
                        <label>Qty</label>
                        <input type="number" value="0" class="align-right-numeric">
                    </div>
                    <div class="input-field-group">
                        <label>Rate (₹)</label>
                        <input type="number" value="0.00" class="align-right-numeric">
                    </div>
                    <div class="input-field-group">
                        <label>Disc (%)</label>
                        <input type="number" value="0.00" class="align-right-numeric">
                    </div>
                    <div class="input-field-group">
                        <label>GST (%)</label>
                        <select class="select-field text-center-aligned">
                            <option>5%</option>
                            <option>12%</option>
                            <option selected>18%</option>
                            <option>28%</option>
                        </select>
                    </div>
                    <div class="input-field-group grid-span-double-right">
                        <label>Amount (₹)</label>
                        <div class="static-amount-output">₹0.00</div>
                    </div>
                </div>
            `;
            
            productRowsContainer.appendChild(newRowMockup);
            syncLucideIcons();
            bindRowDestructionEvent(newRowMockup.querySelector('.btn-remove-row-slot'));
        });
    }

    function bindRowDestructionEvent(deleteButton) {
        if (deleteButton) {
            deleteButton.addEventListener('click', (e) => {
                const targetRow = e.target.closest('.product-row-component');
                if (targetRow) {
                    targetRow.style.opacity = '0';
                    targetRow.style.transform = 'scale(0.95) translateY(4px)';
                    setTimeout(() => {
                        targetRow.remove();
                        // Re-index remaining item badges for structural accuracy
                        productRowsContainer.querySelectorAll('.product-row-component').forEach((row, index) => {
                            row.querySelector('.row-count-badge').textContent = `Item #${index + 1}`;
                        });
                    }, 400);
                }
            });
        }
    }

    // Bind initialization row components
    document.querySelectorAll('.btn-remove-row-slot').forEach(btn => {
        bindRowDestructionEvent(btn);
    });
});
