// ================== إدارة المخزون ==================
const inventoryModule = (function() {
    // المتغيرات
    let stock = JSON.parse(localStorage.getItem('ryan_stock')) || [];
    let movements = JSON.parse(localStorage.getItem('ryan_movements')) || [];

    // تحويل المخزون القديم إلى كائنات بمعرفات
    stock = stock.map((p, index) => ({ id: p.id || Date.now() + index, ...p }));

    // حفظ المخزون
    function saveStock() {
        localStorage.setItem('ryan_stock', JSON.stringify(stock));
    }

    // إضافة حركة مخزون
    function addMovement(type, product, qty) {
        movements.push({
            date: new Date().toLocaleString('ar-DZ'),
            type,
            product,
            qty
        });
        if (movements.length > 100) movements = movements.slice(-100);
        localStorage.setItem('ryan_movements', JSON.stringify(movements));
    }

    // عرض المخزون
    function renderStock() {
        const tbody = document.getElementById('stock-tbody');
        tbody.innerHTML = stock.map((p, idx) => `
            <tr>
                <td>${p.image ? `<img src="${p.image}" class="product-thumb" onclick="utils.showLargeImage('${p.image}')">` : 'لا توجد'}</td>
                <td>${p.name}</td>
                <td>${p.qty} ${p.unit}</td>
                <td>${p.sellPrice}</td>
                <td>${p.buyPrice}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="inventoryModule.openEditProductModal(${idx})">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="inventoryModule.deleteProduct(${idx})">حذف</button>
                </td>
            </tr>
        `).join('');
    }

    // فتح نافذة تعديل المنتج
    function openEditProductModal(idx) {
        const p = stock[idx];
        document.getElementById('edit-product-idx').value = idx;
        document.getElementById('edit-product-name').value = p.name;
        document.getElementById('edit-product-sell').value = p.sellPrice;
        document.getElementById('edit-product-buy').value = p.buyPrice;
        document.getElementById('edit-product-qty').value = p.qty;
        document.getElementById('edit-product-unit').value = p.unit;
        document.getElementById('edit-current-image').innerHTML = p.image ? `<img src="${p.image}" style="max-width:100px; max-height:100px;">` : 'لا توجد صورة';
        document.getElementById('edit-image-preview').style.display = 'none';
        document.getElementById('edit-product-image').value = '';
        new bootstrap.Modal(document.getElementById('editProductModal')).show();
    }

    // تحديث المنتج
    function updateProduct() {
        const idx = document.getElementById('edit-product-idx').value;
        const p = stock[idx];
        const newName = document.getElementById('edit-product-name').value.trim();
        const newSell = parseFloat(document.getElementById('edit-product-sell').value);
        const newBuy = parseFloat(document.getElementById('edit-product-buy').value);
        const newQty = parseFloat(document.getElementById('edit-product-qty').value);
        const newUnit = document.getElementById('edit-product-unit').value;

        if (!newName || isNaN(newSell) || isNaN(newBuy) || isNaN(newQty)) {
            Swal.fire('خطأ', 'يرجى ملء جميع الحقول', 'error');
            return;
        }

        const fileInput = document.getElementById('edit-product-image');
        if (fileInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function(e) {
                p.image = e.target.result;
                finishUpdate();
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            finishUpdate();
        }

        function finishUpdate() {
            p.name = newName;
            p.sellPrice = newSell;
            p.buyPrice = newBuy;
            p.qty = newQty;
            p.unit = newUnit;
            saveStock();
            bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
            renderStock();
            Swal.fire('نجاح', 'تم تعديل المنتج', 'success');
        }
    }

    // حذف منتج
    function deleteProduct(idx) {
        const product = stock[idx];
        const invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
        const purchases = JSON.parse(localStorage.getItem('ryan_purchases')) || [];
        
        const usedInInvoices = invoices.some(inv => inv.items.some(item => item.productId === product.id));
        const usedInPurchases = purchases.some(pur => pur.items.some(item => item.productId === product.id));
        
        if (usedInInvoices || usedInPurchases) {
            Swal.fire({
                title: 'تحذير',
                text: 'هذا المنتج موجود في فواتير سابقة. حذفه سيؤدي إلى عدم ظهوره في تلك الفواتير عند التعديل. هل تريد المتابعة؟',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'نعم، احذف',
                cancelButtonText: 'إلغاء'
            }).then((result) => {
                if (result.isConfirmed) {
                    stock.splice(idx, 1);
                    saveStock();
                    renderStock();
                    Swal.fire('تم الحذف', 'تم حذف المنتج', 'success');
                }
            });
        } else {
            Swal.fire({
                title: 'تأكيد الحذف',
                text: 'هل أنت متأكد من حذف هذا المنتج؟',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'نعم، احذف',
                cancelButtonText: 'إلغاء'
            }).then((result) => {
                if (result.isConfirmed) {
                    stock.splice(idx, 1);
                    saveStock();
                    renderStock();
                    Swal.fire('تم الحذف', 'تم حذف المنتج', 'success');
                }
            });
        }
    }

    // حفظ منتج جديد
    // أضف هذه الدوال إلى inventory.js

// ================== إضافة منتج جديد محسن ==================
function saveNewProduct() {
    const name = document.getElementById('new-name').value.trim();
    const category = document.getElementById('new-category')?.value || 'عام';
    const sell = parseFloat(document.getElementById('new-sell').value) || 0;
    const buy = parseFloat(document.getElementById('new-buy').value) || 0;
    const wholesale = parseFloat(document.getElementById('new-wholesale')?.value) || 0;
    const qty = parseFloat(document.getElementById('new-qty').value) || 0;
    const unit = document.getElementById('new-unit').value;
    const barcode = document.getElementById('new-barcode').value.trim();
    const minStock = parseInt(document.getElementById('new-min-stock')?.value) || 5;
    const location = document.getElementById('new-location')?.value || '';
    const notes = document.getElementById('new-notes')?.value || '';
    
    if (!name || sell <= 0 || buy <= 0) {
        _showNotification('تنبيه', 'الاسم وسعر البيع والشراء مطلوبة', 'warning');
        return;
    }
    
    if (stock.some(p => p.name === name)) {
        _showNotification('خطأ', 'يوجد منتج بنفس الاسم بالفعل', 'error');
        return;
    }

    stock.push({
        id: Date.now(),
        name: name,
        category: category,
        barcode: barcode,
        sellPrice: sell,
        buyPrice: buy,
        wholesalePrice: wholesale,
        qty: qty,
        minStock: minStock,
        unit: unit,
        location: location,
        notes: notes,
        image: selectedImageBase64 || null,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        totalSales: 0,
        totalPurchases: 0
    });
    
    saveStock();
    addMovement('إضافة منتج', name, qty);
    
    _showNotification('نجاح', 'تم إضافة المنتج', 'success');
    
    // إعادة تعيين الحقول
    document.querySelectorAll('#add-product input, #add-product select').forEach(i => i.value = '');
    document.getElementById('image-preview').style.display = 'none';
    selectedImageBase64 = '';
    renderStock();
}

// ================== تعديل المنتج محسن ==================
function updateProduct() {
    const idx = document.getElementById('edit-product-idx').value;
    const p = stock[idx];
    
    const newName = document.getElementById('edit-product-name').value.trim();
    const newCategory = document.getElementById('edit-product-category')?.value || p.category;
    const newSell = parseFloat(document.getElementById('edit-product-sell').value);
    const newBuy = parseFloat(document.getElementById('edit-product-buy').value);
    const newWholesale = parseFloat(document.getElementById('edit-product-wholesale')?.value) || p.wholesalePrice;
    const newQty = parseFloat(document.getElementById('edit-product-qty').value);
    const newMinStock = parseInt(document.getElementById('edit-product-min-stock')?.value) || p.minStock;
    const newUnit = document.getElementById('edit-product-unit').value;
    const newLocation = document.getElementById('edit-product-location')?.value || p.location;
    const newNotes = document.getElementById('edit-product-notes')?.value || p.notes;

    if (!newName || isNaN(newSell) || isNaN(newBuy) || isNaN(newQty)) {
        _showNotification('خطأ', 'يرجى ملء جميع الحقول', 'error');
        return;
    }

    const fileInput = document.getElementById('edit-product-image');
    if (fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            p.image = e.target.result;
            finishUpdate();
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        finishUpdate();
    }

    function finishUpdate() {
        p.name = newName;
        p.category = newCategory;
        p.sellPrice = newSell;
        p.buyPrice = newBuy;
        p.wholesalePrice = newWholesale;
        p.qty = newQty;
        p.minStock = newMinStock;
        p.unit = newUnit;
        p.location = newLocation;
        p.notes = newNotes;
        p.lastUpdated = new Date().toISOString();
        
        saveStock();
        bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
        renderStock();
        
        _showNotification('نجاح', 'تم تعديل المنتج', 'success');
    }
}

    // حفظ منتج سريع
    function saveQuickProduct() {
        const mode = document.getElementById('quick-mode').value;
        const name = document.getElementById('quick-product-name').value.trim();
        const sellPrice = parseFloat(document.getElementById('quick-sell-price').value) || 0;
        const buyPrice = parseFloat(document.getElementById('quick-buy-price').value) || 0;
        const unit = document.getElementById('quick-unit').value;
        const qty = parseFloat(document.getElementById('quick-qty').value) || 0;
        const cartQty = parseFloat(document.getElementById('quick-cart-qty').value) || 1;
        const discount = parseFloat(document.getElementById('quick-discount').value) || 0;

        if (!name || sellPrice <= 0 || buyPrice <= 0) {
            Swal.fire('تنبيه', 'الاسم وسعر البيع والشراء مطلوبة', 'warning');
            return;
        }
        if (stock.some(p => p.name === name)) {
            Swal.fire('خطأ', 'يوجد منتج بنفس الاسم بالفعل', 'error');
            return;
        }

        const newProduct = {
            id: Date.now(),
            name,
            barcode: '',
            sellPrice,
            buyPrice,
            qty,
            unit,
            image: null
        };
        stock.push(newProduct);
        saveStock();
        addMovement('إضافة منتج', name, qty);

        if (mode === 'sale') {
            if (cartQty > newProduct.qty) {
                Swal.fire('خطأ', 'الكمية المطلوبة أكبر من المتوفر في المخزن', 'error');
                return;
            }
            const total = cartQty * sellPrice * (1 - discount / 100);
            salesModule.getCart().push({
                id: Date.now() + Math.random(),
                productId: newProduct.id,
                name,
                qty: cartQty,
                price: sellPrice,
                discount,
                total
            });
            newProduct.qty -= cartQty;
            saveStock();
            addMovement('بيع', name, cartQty);
            salesModule.renderCart();
            document.getElementById('sale-search').value = name;
            document.getElementById('search-box').style.display = 'none';
            document.getElementById('sale-qty').focus();
        } else {
            const total = cartQty * buyPrice;
            purchasesModule.getPurchaseCart().push({
                id: Date.now() + Math.random(),
                productId: newProduct.id,
                name,
                qty: cartQty,
                price: buyPrice,
                total
            });
            newProduct.qty += cartQty;
            saveStock();
            addMovement('شراء', name, cartQty);
            purchasesModule.renderPurchaseCart();
            document.getElementById('purchase-search').value = name;
            document.getElementById('purchase-search-box').style.display = 'none';
            document.getElementById('purchase-qty').focus();
        }

        bootstrap.Modal.getInstance(document.getElementById('quickAddProductModal')).hide();
        Swal.fire({
            icon: 'success',
            title: 'تمت الإضافة',
            text: `تم إضافة المنتج ${name} إلى المخزن والسلة`,
            timer: 1500,
            showConfirmButton: false
        });
    }

    // وظائف استيراد Excel
    function uploadExcelWithMapping() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls, .csv';
        
        input.onchange = function(event) {
            const file = event.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                    
                    if (rows.length < 2) {
                        Swal.fire('خطأ', 'الملف لا يحتوي على بيانات كافية.', 'error');
                        return;
                    }
                    
                    const headers = rows[0];
                    const dataRows = rows.slice(1);
                    
                    showMappingDialog(headers, dataRows);
                    
                } catch (error) {
                    console.error(error);
                    Swal.fire('خطأ', 'حدث خطأ أثناء قراءة الملف.', 'error');
                }
            };
            
            reader.readAsArrayBuffer(file);
        };
        
        input.click();
    }

    function showMappingDialog(headers, dataRows) {
        const headerOptions = headers.map((h, idx) => `<option value="${idx}">${h || `عمود ${idx+1}`}</option>`).join('');
        
        let previewHtml = '<div style="max-height:200px; overflow-y:auto; font-size:12px; border:1px solid #ddd; padding:5px;">';
        previewHtml += '<table class="table table-sm"><thead><tr>' + headers.map(h => `<th>${h || '?'}</th>`).join('') + '</tr></thead><tbody>';
        for (let i = 0; i < Math.min(5, dataRows.length); i++) {
            previewHtml += '<tr>' + dataRows[i].map(cell => `<td>${cell !== undefined && cell !== null ? cell : ''}</td>`).join('') + '</tr>';
        }
        if (dataRows.length > 5) previewHtml += '<tr><td colspan="100">...</td></tr>';
        previewHtml += '</tbody></table></div>';
        
        Swal.fire({
            title: 'تحديد الأعمدة ونطاق الصفوف',
            html: `
                <div style="text-align:right;">
                    <p class="mb-2">${previewHtml}</p>
                    <hr>
                    <div class="row g-2">
                        <div class="col-6">
                            <label>حقل الاسم:</label>
                            <select id="nameCol" class="form-select">${headerOptions}</select>
                        </div>
                        <div class="col-6">
                            <label>حقل الباركود (اختياري):</label>
                            <select id="barcodeCol" class="form-select"><option value="-1">-- بدون --</option>${headerOptions}</select>
                        </div>
                    </div>
                    <div class="row g-2 mt-2">
                        <div class="col-6">
                            <label>سعر البيع:</label>
                            <select id="sellCol" class="form-select">${headerOptions}</select>
                        </div>
                        <div class="col-6">
                            <label>سعر الشراء:</label>
                            <select id="buyCol" class="form-select">${headerOptions}</select>
                        </div>
                    </div>
                    <div class="row g-2 mt-2">
                        <div class="col-6">
                            <label>الكمية:</label>
                            <select id="qtyCol" class="form-select">${headerOptions}</select>
                        </div>
                        <div class="col-6">
                            <label>الوحدة (اختياري):</label>
                            <select id="unitCol" class="form-select"><option value="-1">قطعة (افتراضي)</option>${headerOptions}</select>
                        </div>
                    </div>
                    <hr>
                    <div class="row g-2">
                        <div class="col-6">
                            <label>صف البداية (أول صف للبيانات):</label>
                            <input type="number" id="startRow" class="form-control" value="2" min="2" max="${dataRows.length+1}">
                        </div>
                        <div class="col-6">
                            <label>صف النهاية (اختياري، اترك 0 للنهاية):</label>
                            <input type="number" id="endRow" class="form-control" value="0" min="0" max="${dataRows.length+1}">
                        </div>
                    </div>
                    <div class="mt-2">
                        <label>عند وجود منتج مكرر:</label>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="duplicateAction" id="dupSkip" value="skip" checked>
                            <label class="form-check-label" for="dupSkip">تجاهل المكرر (لا يضاف)</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="duplicateAction" id="dupUpdateQty" value="update_qty">
                            <label class="form-check-label" for="dupUpdateQty">تحديث الكمية فقط (إضافة الكمية الجديدة إلى المخزون)</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="duplicateAction" id="dupUpdateAll" value="update_all">
                            <label class="form-check-label" for="dupUpdateAll">تحديث الكمية والأسعار (استبدال الأسعار)</label>
                        </div>
                    </div>
                    <p class="text-muted mt-2">ملاحظة: صف البداية = 2 يعني تخطي الترويسة. إذا كان أول صف هو البيانات ضع 1.</p>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'استيراد',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                const nameIdx = parseInt(document.getElementById('nameCol').value);
                const barcodeIdx = parseInt(document.getElementById('barcodeCol').value);
                const sellIdx = parseInt(document.getElementById('sellCol').value);
                const buyIdx = parseInt(document.getElementById('buyCol').value);
                const qtyIdx = parseInt(document.getElementById('qtyCol').value);
                const unitIdx = parseInt(document.getElementById('unitCol').value);
                const startRow = parseInt(document.getElementById('startRow').value) - 1;
                let endRow = parseInt(document.getElementById('endRow').value);
                if (endRow === 0) endRow = dataRows.length;
                else endRow = endRow - 1;
                
                const duplicateAction = document.querySelector('input[name="duplicateAction"]:checked')?.value || 'skip';
                
                if (isNaN(nameIdx) || isNaN(sellIdx) || isNaN(buyIdx) || isNaN(qtyIdx)) {
                    Swal.showValidationMessage('يرجى اختيار الأعمدة الأساسية');
                    return false;
                }
                if (startRow < 0 || startRow >= dataRows.length || endRow < startRow || endRow >= dataRows.length) {
                    Swal.showValidationMessage('نطاق الصفوف غير صحيح');
                    return false;
                }
                
                return { nameIdx, barcodeIdx, sellIdx, buyIdx, qtyIdx, unitIdx, startRow, endRow, duplicateAction };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const { nameIdx, barcodeIdx, sellIdx, buyIdx, qtyIdx, unitIdx, startRow, endRow, duplicateAction } = result.value;
                
                let addedCount = 0;
                let updatedCount = 0;
                let skippedCount = 0;
                
                for (let i = startRow; i <= endRow; i++) {
                    const row = dataRows[i];
                    if (!row || row.length === 0) continue;
                    
                    const name = row[nameIdx] ? row[nameIdx].toString().trim() : '';
                    if (!name) {
                        skippedCount++;
                        continue;
                    }
                    
                    const sellPrice = parseFloat(row[sellIdx]) || 0;
                    const buyPrice = parseFloat(row[buyIdx]) || 0;
                    const qty = parseFloat(row[qtyIdx]) || 0;
                    const barcode = (barcodeIdx >= 0 && row[barcodeIdx] != null) ? row[barcodeIdx].toString() : '';
                    let unit = 'قطعة';
                    if (unitIdx >= 0 && row[unitIdx] != null) {
                        unit = row[unitIdx].toString();
                    }
                    
                    if (sellPrice <= 0 || buyPrice <= 0) {
                        skippedCount++;
                        continue;
                    }
                    
                    const existingProductIndex = stock.findIndex(p => p.name === name);
                    
                    if (existingProductIndex !== -1) {
                        if (duplicateAction === 'update_qty') {
                            stock[existingProductIndex].qty += qty;
                            updatedCount++;
                        } else if (duplicateAction === 'update_all') {
                            stock[existingProductIndex].qty += qty;
                            stock[existingProductIndex].sellPrice = sellPrice;
                            stock[existingProductIndex].buyPrice = buyPrice;
                            updatedCount++;
                        } else {
                            skippedCount++;
                        }
                    } else {
                        stock.push({
                            id: Date.now() + i,
                            name: name,
                            barcode: barcode,
                            sellPrice: sellPrice,
                            buyPrice: buyPrice,
                            qty: qty,
                            unit: unit,
                            image: null
                        });
                        addedCount++;
                    }
                }
                
                saveStock();
                renderStock();
                
                Swal.fire({
                    icon: 'success',
                    title: 'تم الرفع',
                    html: `تمت إضافة <b>${addedCount}</b> منتج جديد.<br>تم تحديث <b>${updatedCount}</b> منتج مكرر.<br>تخطينا <b>${skippedCount}</b> صف.`
                });
            }
        });
    }

    // إرجاع الوظائف العامة
    return {
        stock,
        movements,
        saveStock,
        addMovement,
        renderStock,
        openEditProductModal,
        updateProduct,
        deleteProduct,
        saveNewProduct,
        saveQuickProduct,
        uploadExcelWithMapping
    };
})();
