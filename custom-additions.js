// ================================================
// الإضافات الجديدة: سعر الجملة و متوسط التكلفة للمنتجات
// توضع هذه الأكواد بعد تحميل الكود الأصلي مباشرة
// ================================================

// 1. تحديث كائنات المنتجات القديمة لتشمل الحقول الجديدة
(function fixOldStock() {
    if (window.stock) {
        window.stock = window.stock.map(p => ({
            id: p.id || Date.now() + Math.random(),
            wholesalePrice: p.wholesalePrice || p.sellPrice,
            avgCost: p.avgCost || p.buyPrice,
            ...p
        }));
        localStorage.setItem('ryan_stock', JSON.stringify(window.stock));
    }
})();

// 2. تعديل دالة saveNewProduct
window.saveNewProduct = function() {
    const name = document.getElementById('new-name').value.trim();
    const sell = parseFloat(document.getElementById('new-sell').value) || 0;
    const buy = parseFloat(document.getElementById('new-buy').value) || 0;
    const wholesale = parseFloat(document.getElementById('new-wholesale').value);
    const avgCost = parseFloat(document.getElementById('new-avg-cost').value);
    if (!name || sell <= 0 || buy <= 0) {
        Swal.fire('تنبيه', 'الاسم وسعر البيع والشراء مطلوبة', 'warning');
        return;
    }
    if (window.stock.some(p => p.name === name)) {
        Swal.fire('خطأ', 'يوجد منتج بنفس الاسم بالفعل', 'error');
        return;
    }

    window.stock.push({
        id: Date.now(),
        name,
        barcode: document.getElementById('new-barcode').value.trim(),
        sellPrice: sell,
        buyPrice: buy,
        wholesalePrice: isNaN(wholesale) ? sell : wholesale,
        avgCost: isNaN(avgCost) ? buy : avgCost,
        qty: parseFloat(document.getElementById('new-qty').value) || 0,
        unit: document.getElementById('new-unit').value,
        image: window.selectedImageBase64 || null
    });
    window.saveStock();
    window.addMovement('إضافة منتج', name, parseFloat(document.getElementById('new-qty').value) || 0);
    Swal.fire('نجاح', 'تم إضافة المنتج', 'success');

    document.querySelectorAll('#add-product input').forEach(i => i.value = '');
    document.getElementById('image-preview').style.display = 'none';
    window.selectedImageBase64 = '';
    window.renderStock();
};

// 3. تعديل دالة renderStock
window.renderStock = function() {
    const tbody = document.getElementById('stock-tbody');
    if (!tbody) return;
    tbody.innerHTML = window.stock.map((p, idx) => `
        <tr>
            <td>${p.image ? `<img src="${p.image}" class="product-thumb" onclick="showLargeImage('${p.image}')">` : 'لا توجد'}</td>
            <td>${p.name}</td>
            <td>${p.qty} ${p.unit}</td>
            <td>${p.sellPrice}</td>
            <td>${p.buyPrice}</td>
            <td>${p.wholesalePrice || p.sellPrice}</td>
            <td>${p.avgCost || p.buyPrice}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="openEditProductModal(${idx})">تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${idx})">حذف</button>
            </td>
        </tr>
    `).join('');
};

// 4. تعديل دالة openEditProductModal
window.openEditProductModal = function(idx) {
    const p = window.stock[idx];
    document.getElementById('edit-product-idx').value = idx;
    document.getElementById('edit-product-name').value = p.name;
    document.getElementById('edit-product-sell').value = p.sellPrice;
    document.getElementById('edit-product-buy').value = p.buyPrice;
    document.getElementById('edit-product-wholesale').value = p.wholesalePrice || p.sellPrice;
    document.getElementById('edit-product-avg-cost').value = p.avgCost || p.buyPrice;
    document.getElementById('edit-product-qty').value = p.qty;
    document.getElementById('edit-product-unit').value = p.unit;
    document.getElementById('edit-current-image').innerHTML = p.image ? `<img src="${p.image}" style="max-width:100px; max-height:100px;">` : 'لا توجد صورة';
    document.getElementById('edit-image-preview').style.display = 'none';
    document.getElementById('edit-product-image').value = '';
    new bootstrap.Modal(document.getElementById('editProductModal')).show();
};

// 5. تعديل دالة updateProduct
window.updateProduct = function() {
    const idx = document.getElementById('edit-product-idx').value;
    const p = window.stock[idx];
    const newName = document.getElementById('edit-product-name').value.trim();
    const newSell = parseFloat(document.getElementById('edit-product-sell').value);
    const newBuy = parseFloat(document.getElementById('edit-product-buy').value);
    const newWholesale = parseFloat(document.getElementById('edit-product-wholesale').value);
    const newAvgCost = parseFloat(document.getElementById('edit-product-avg-cost').value);
    const newQty = parseFloat(document.getElementById('edit-product-qty').value);
    const newUnit = document.getElementById('edit-product-unit').value;

    if (!newName || isNaN(newSell) || isNaN(newBuy) || isNaN(newQty)) {
        Swal.fire('خطأ', 'يرجى ملء جميع الحقول الأساسية', 'error');
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
        p.wholesalePrice = isNaN(newWholesale) ? newSell : newWholesale;
        p.avgCost = isNaN(newAvgCost) ? newBuy : newAvgCost;
        p.qty = newQty;
        p.unit = newUnit;
        window.saveStock();
        bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
        window.renderStock();
        Swal.fire('نجاح', 'تم تعديل المنتج', 'success');
    }
};

// 6. دوال رفع Excel المعدلة (اختياري إذا كنت تستخدمها)
window.uploadExcelWithMapping = function() {
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
                Swal.fire('خطأ', 'حدث خطأ أثناء قراءة الملف.', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
};

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
                <!-- حقول جديدة -->
                <div class="row g-2 mt-2">
                    <div class="col-6">
                        <label>سعر الجملة (اختياري):</label>
                        <select id="wholesaleCol" class="form-select"><option value="-1">-- بدون --</option>${headerOptions}</select>
                    </div>
                    <div class="col-6">
                        <label>متوسط التكلفة (اختياري):</label>
                        <select id="avgCostCol" class="form-select"><option value="-1">-- بدون --</option>${headerOptions}</select>
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
            const wholesaleIdx = parseInt(document.getElementById('wholesaleCol').value);
            const avgCostIdx = parseInt(document.getElementById('avgCostCol').value);
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
            
            return { nameIdx, barcodeIdx, sellIdx, buyIdx, wholesaleIdx, avgCostIdx, qtyIdx, unitIdx, startRow, endRow, duplicateAction };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { nameIdx, barcodeIdx, sellIdx, buyIdx, wholesaleIdx, avgCostIdx, qtyIdx, unitIdx, startRow, endRow, duplicateAction } = result.value;
            let addedCount = 0, updatedCount = 0, skippedCount = 0;
            for (let i = startRow; i <= endRow; i++) {
                const row = dataRows[i];
                if (!row || row.length === 0) continue;
                const name = row[nameIdx] ? row[nameIdx].toString().trim() : '';
                if (!name) { skippedCount++; continue; }
                const sellPrice = parseFloat(row[sellIdx]) || 0;
                const buyPrice = parseFloat(row[buyIdx]) || 0;
                const qty = parseFloat(row[qtyIdx]) || 0;
                const barcode = (barcodeIdx >= 0 && row[barcodeIdx] != null) ? row[barcodeIdx].toString() : '';
                let unit = 'قطعة';
                if (unitIdx >= 0 && row[unitIdx] != null) unit = row[unitIdx].toString();
                let wholesalePrice = (wholesaleIdx >= 0 && row[wholesaleIdx] != null) ? parseFloat(row[wholesaleIdx]) : sellPrice;
                if (isNaN(wholesalePrice)) wholesalePrice = sellPrice;
                let avgCost = (avgCostIdx >= 0 && row[avgCostIdx] != null) ? parseFloat(row[avgCostIdx]) : buyPrice;
                if (isNaN(avgCost)) avgCost = buyPrice;
                if (sellPrice <= 0 || buyPrice <= 0) { skippedCount++; continue; }
                const existingProductIndex = window.stock.findIndex(p => p.name === name);
                if (existingProductIndex !== -1) {
                    if (duplicateAction === 'update_qty') {
                        window.stock[existingProductIndex].qty += qty;
                        updatedCount++;
                    } else if (duplicateAction === 'update_all') {
                        window.stock[existingProductIndex].qty += qty;
                        window.stock[existingProductIndex].sellPrice = sellPrice;
                        window.stock[existingProductIndex].buyPrice = buyPrice;
                        window.stock[existingProductIndex].wholesalePrice = wholesalePrice;
                        window.stock[existingProductIndex].avgCost = avgCost;
                        updatedCount++;
                    } else {
                        skippedCount++;
                    }
                } else {
                    window.stock.push({
                        id: Date.now() + i,
                        name, barcode, sellPrice, buyPrice, wholesalePrice, avgCost, qty, unit, image: null
                    });
                    addedCount++;
                }
            }
            window.saveStock();
            window.renderStock();
            Swal.fire({ icon: 'success', title: 'تم الرفع', html: `تمت إضافة <b>${addedCount}</b> منتج جديد.<br>تم تحديث <b>${updatedCount}</b> منتج مكرر.<br>تخطينا <b>${skippedCount}</b> صف.` });
        }
    });
}
