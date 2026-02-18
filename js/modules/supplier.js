// ================== إدارة الموردين - وحدة منفصلة ==================
const supplierModule = (function() {
    let suppliers = JSON.parse(localStorage.getItem('ryan_suppliers')) || [];
    
    // ================== هيكلة البيانات ==================
    suppliers = suppliers.map(s => {
        if (typeof s === 'string') {
            return {
                id: Date.now() + Math.random(),
                name: s,
                phone: '',
                secondaryPhone: '',
                governorate: '',
                city: '',
                street: '',
                address: '',
                taxNumber: '',
                commercialRegister: '',
                email: '',
                notes: '',
                createdAt: new Date().toISOString()
            };
        }
        return {
            id: s.id || Date.now() + Math.random(),
            name: s.name || '',
            phone: s.phone || '',
            secondaryPhone: s.secondaryPhone || '',
            governorate: s.governorate || '',
            city: s.city || '',
            street: s.street || '',
            address: s.address || '',
            taxNumber: s.taxNumber || '',
            commercialRegister: s.commercialRegister || '',
            email: s.email || '',
            notes: s.notes || '',
            createdAt: s.createdAt || new Date().toISOString()
        };
    });

    // ================== حفظ البيانات ==================
    function saveSuppliers() {
        localStorage.setItem('ryan_suppliers', JSON.stringify(suppliers));
    }

    // ================== دوال مساعدة ==================
    function _showNotification(title, message, type = 'success') {
        Swal.fire({
            icon: type,
            title: title,
            text: message,
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    }

    function _showConfirmation(title, text, confirmCallback) {
        Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed && confirmCallback) {
                confirmCallback();
            }
        });
    }

    // ================== إضافة مورد جديد ==================
    function addSupplier() {
        const name = document.getElementById('new-supplier')?.value.trim();
        const phone = document.getElementById('new-supplier-phone')?.value.trim() || '';
        
        if (!name) {
            _showNotification('تنبيه', 'اسم المورد مطلوب', 'warning');
            return;
        }

        suppliers.push({
            id: Date.now(),
            name: name,
            phone: phone,
            secondaryPhone: '',
            governorate: '',
            city: '',
            street: '',
            address: '',
            taxNumber: '',
            commercialRegister: '',
            email: '',
            notes: '',
            createdAt: new Date().toISOString()
        });
        
        saveSuppliers();
        renderSuppliers();
        
        if (document.getElementById('new-supplier')) {
            document.getElementById('new-supplier').value = '';
        }
        
        _showNotification('نجاح', 'تم إضافة المورد', 'success');
    }

    // ================== إضافة مورد كامل ==================
    function saveNewSupplier() {
        const name = document.getElementById('new-supplier-name')?.value.trim();
        const phone = document.getElementById('new-supplier-phone')?.value.trim() || '';
        const secondaryPhone = document.getElementById('new-supplier-phone2')?.value.trim() || '';
        const governorate = document.getElementById('new-supplier-governorate')?.value.trim() || '';
        const city = document.getElementById('new-supplier-city')?.value.trim() || '';
        const street = document.getElementById('new-supplier-street')?.value.trim() || '';
        const address = document.getElementById('new-supplier-address')?.value.trim() || '';
        const taxNumber = document.getElementById('new-supplier-tax')?.value.trim() || '';
        const commercialRegister = document.getElementById('new-supplier-commercial')?.value.trim() || '';
        const email = document.getElementById('new-supplier-email')?.value.trim() || '';
        const notes = document.getElementById('new-supplier-notes')?.value.trim() || '';

        if (!name) {
            _showNotification('تنبيه', 'اسم المورد مطلوب', 'warning');
            return;
        }

        if (suppliers.some(s => s.name === name)) {
            _showNotification('تنبيه', 'يوجد مورد بنفس الاسم بالفعل', 'warning');
            return;
        }

        suppliers.push({
            id: Date.now(),
            name: name,
            phone: phone,
            secondaryPhone: secondaryPhone,
            governorate: governorate,
            city: city,
            street: street,
            address: address || `${street}, ${city}, ${governorate}`,
            taxNumber: taxNumber,
            commercialRegister: commercialRegister,
            email: email,
            notes: notes,
            createdAt: new Date().toISOString()
        });
        
        saveSuppliers();
        renderSuppliers();
        _clearForm();
        
        _showNotification('نجاح', 'تم إضافة المورد', 'success');
    }

    function _clearForm() {
        const fields = [
            'new-supplier-name', 'new-supplier-phone', 'new-supplier-phone2',
            'new-supplier-governorate', 'new-supplier-city', 'new-supplier-street',
            'new-supplier-address', 'new-supplier-tax', 'new-supplier-commercial',
            'new-supplier-email', 'new-supplier-notes'
        ];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }

    // ================== البحث عن الموردين ==================
    function searchSuppliers() {
        const searchTerm = document.getElementById('search-supplier')?.value.toLowerCase().trim() || '';
        
        let filtered = suppliers;
        
        if (searchTerm !== '') {
            filtered = suppliers.filter(s => 
                s.name.toLowerCase().includes(searchTerm) || 
                (s.phone && s.phone.includes(searchTerm))
            );
        }
        
        renderFiltered(filtered);
    }

    function renderFiltered(filtered) {
        const tbody = document.getElementById('suppliers-tbody');
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center p-4 text-muted">
                        <i class="material-icons-round" style="font-size:48px;">search_off</i>
                        <p>لا توجد نتائج</p>
                    </td>
                </tr>
            `;
            return;
        }

        const purchases = JSON.parse(localStorage.getItem('ryan_purchases')) || [];

        tbody.innerHTML = filtered.map((s, idx) => {
            const originalIndex = suppliers.findIndex(item => item.id === s.id);
            const supplierPurchases = purchases.filter(p => p.supplier === s.name);
            const invoiceCount = supplierPurchases.length;
            const totalPurchases = supplierPurchases.reduce((sum, p) => sum + (p.total || 0), 0);
            
            return `
            <tr>
                <td>${s.name}</td>
                <td>${s.phone || '-'}</td>
                <td>${s.secondaryPhone || '-'}</td>
                <td>${s.city || '-'}</td>
                <td><span class="badge bg-primary">${invoiceCount}</span></td>
                <td>${totalPurchases.toFixed(2)} دج</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="supplierModule.showSupplierInvoices(${originalIndex})">
                        <i class="material-icons-round">receipt</i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="supplierModule.editSupplier(${originalIndex})">
                        <i class="material-icons-round">edit</i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="supplierModule.deleteSupplier(${originalIndex})">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }

    function renderSuppliers() {
        renderFiltered(suppliers);
        updateSelect();
    }

    function updateSelect() {
        const select = document.getElementById('purchase-supplier');
        if (select) {
            select.innerHTML = '<option value="">اختر المورد</option>' + 
                suppliers.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        }
    }

    // ================== عرض فواتير المورد ==================
    function showSupplierInvoices(index) {
        const supplier = suppliers[index];
        if (!supplier) return;
        
        document.getElementById('selected-supplier-name').textContent = supplier.name;
        
        const purchases = JSON.parse(localStorage.getItem('ryan_purchases')) || [];
        const supplierPurchases = purchases.filter(p => p.supplier === supplier.name);
        
        const tbody = document.getElementById('supplier-invoices-tbody');
        if (tbody) {
            if (supplierPurchases.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center p-3">لا توجد فواتير</td></tr>';
            } else {
                tbody.innerHTML = supplierPurchases.map(pur => `
                    <tr>
                        <td>#${pur.number || ''}</td>
                        <td>${pur.date || ''}</td>
                        <td>${pur.items ? pur.items.length : 0}</td>
                        <td class="fw-bold text-success">${(pur.total || 0).toFixed(2)} دج</td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="supplierModule.showPurchaseDetails(${pur.number})">
                                <i class="material-icons-round">visibility</i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
        
        document.querySelector('#suppliers .table-responsive').style.display = 'none';
        document.getElementById('supplier-invoices-view').style.display = 'block';
    }

    function hideSupplierInvoices() {
        document.querySelector('#suppliers .table-responsive').style.display = 'block';
        document.getElementById('supplier-invoices-view').style.display = 'none';
    }

    function showPurchaseDetails(invoiceNumber) {
        const purchases = JSON.parse(localStorage.getItem('ryan_purchases')) || [];
        const purchase = purchases.find(p => p.number === invoiceNumber);
        
        if (!purchase) return;
        
        let itemsHtml = '';
        purchase.items.forEach((item, index) => {
            itemsHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>${item.price.toFixed(2)} دج</td>
                    <td>${(item.qty * item.price).toFixed(2)} دج</td>
                </tr>
            `;
        });
        
        Swal.fire({
            title: `فاتورة شراء رقم ${purchase.number}`,
            html: `
                <div style="text-align:right; max-height:400px; overflow-y:auto;">
                    <p><strong>المورد:</strong> ${purchase.supplier}</p>
                    <p><strong>التاريخ:</strong> ${purchase.date}</p>
                    <p><strong>الإجمالي:</strong> ${purchase.total.toFixed(2)} دج</p>
                    <hr>
                    <table style="width:100%; font-size:12px;">
                        <thead>
                            <tr><th>#</th><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                </div>
            `,
            width: '700px',
            confirmButtonText: 'إغلاق'
        });
    }

    // ================== تعديل المورد ==================
    function editSupplier(index) {
        const supplier = suppliers[index];
        if (!supplier) return;

        Swal.fire({
            title: 'تعديل المورد',
            html: `
                <div style="text-align:right;">
                    <input type="text" id="edit-name" class="form-control mb-2" value="${supplier.name}">
                    <input type="text" id="edit-phone" class="form-control mb-2" value="${supplier.phone || ''}">
                    <input type="text" id="edit-city" class="form-control mb-2" value="${supplier.city || ''}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'حفظ',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                const name = document.getElementById('edit-name').value.trim();
                if (!name) {
                    Swal.showValidationMessage('اسم المورد مطلوب');
                    return false;
                }
                return {
                    name: name,
                    phone: document.getElementById('edit-phone').value.trim(),
                    city: document.getElementById('edit-city').value.trim()
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const updated = result.value;
                suppliers[index] = { ...supplier, ...updated };
                saveSuppliers();
                renderSuppliers();
                _showNotification('نجاح', 'تم تعديل المورد', 'success');
            }
        });
    }

    // ================== حذف المورد ==================
    function deleteSupplier(idx) {
        const supplier = suppliers[idx];
        
        _showConfirmation('تأكيد الحذف', `حذف المورد "${supplier.name}"؟`, () => {
            suppliers.splice(idx, 1);
            saveSuppliers();
            renderSuppliers();
            _showNotification('تم', 'تم حذف المورد', 'success');
        });
    }

    return {
        suppliers,
        addSupplier,
        saveNewSupplier,
        renderSuppliers,
        editSupplier,
        deleteSupplier,
        searchSuppliers,
        showSupplierInvoices,
        hideSupplierInvoices,
        showPurchaseDetails
    };
})();

window.supplierModule = supplierModule;
