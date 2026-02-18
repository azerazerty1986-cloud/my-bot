// ================== إدارة العملاء والموردين المتكاملة ==================

// ================== إدارة العملاء ==================
const customerModule = (function() {
    let customers = JSON.parse(localStorage.getItem('ryan_customers')) || [];
    
    // ================== هيكلة البيانات ==================
    customers = customers.map(c => {
        if (typeof c === 'string') {
            return {
                id: Date.now() + Math.random(),
                name: c,
                phone: '',
                secondaryPhone: '',
                governorate: '',
                city: '',
                street: '',
                address: '',
                taxNumber: '',
                commercialRegister: '',
                email: '',
                maxDebt: 0,
                alertDays: 0,
                notes: '',
                createdAt: new Date().toISOString(),
                totalInvoices: 0,
                totalPurchases: 0,
                lastInvoiceDate: null
            };
        }
        return {
            id: c.id || Date.now() + Math.random(),
            name: c.name || '',
            phone: c.phone || '',
            secondaryPhone: c.secondaryPhone || '',
            governorate: c.governorate || '',
            city: c.city || '',
            street: c.street || '',
            address: c.address || '',
            taxNumber: c.taxNumber || '',
            commercialRegister: c.commercialRegister || '',
            email: c.email || '',
            maxDebt: c.maxDebt || 0,
            alertDays: c.alertDays || 0,
            notes: c.notes || '',
            createdAt: c.createdAt || new Date().toISOString(),
            totalInvoices: c.totalInvoices || 0,
            totalPurchases: c.totalPurchases || 0,
            lastInvoiceDate: c.lastInvoiceDate || null
        };
    });

    // ================== حفظ البيانات ==================
    function saveCustomers() {
        localStorage.setItem('ryan_customers', JSON.stringify(customers));
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

    // ================== إضافة عميل جديد (بسيط) ==================
    function addCustomer() {
        const name = document.getElementById('new-customer')?.value.trim();
        const phone = document.getElementById('new-customer-phone')?.value.trim() || '';
        
        if (!name) {
            _showNotification('تنبيه', 'اسم العميل مطلوب', 'warning');
            return;
        }

        const newCustomer = {
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
            maxDebt: 0,
            alertDays: 0,
            notes: '',
            createdAt: new Date().toISOString(),
            totalInvoices: 0,
            totalPurchases: 0,
            lastInvoiceDate: null
        };

        customers.push(newCustomer);
        saveCustomers();
        renderCustomers();
        
        if (document.getElementById('new-customer')) {
            document.getElementById('new-customer').value = '';
        }
        
        _showNotification('نجاح', 'تم إضافة العميل', 'success');
    }

    // ================== إضافة عميل كامل (نموذج متقدم) ==================
    function saveNewCustomer() {
        const name = document.getElementById('new-customer-name')?.value.trim();
        const phone = document.getElementById('new-customer-phone')?.value.trim() || '';
        const secondaryPhone = document.getElementById('new-customer-phone2')?.value.trim() || '';
        const governorate = document.getElementById('new-customer-governorate')?.value.trim() || '';
        const city = document.getElementById('new-customer-city')?.value.trim() || '';
        const street = document.getElementById('new-customer-street')?.value.trim() || '';
        const address = document.getElementById('new-customer-address')?.value.trim() || '';
        const taxNumber = document.getElementById('new-customer-tax')?.value.trim() || '';
        const commercialRegister = document.getElementById('new-customer-commercial')?.value.trim() || '';
        const email = document.getElementById('new-customer-email')?.value.trim() || '';
        const maxDebt = parseFloat(document.getElementById('new-customer-max-debt')?.value) || 0;
        const alertDays = parseInt(document.getElementById('new-customer-alert-days')?.value) || 0;
        const notes = document.getElementById('new-customer-notes')?.value.trim() || '';

        if (!name) {
            _showNotification('تنبيه', 'اسم العميل مطلوب', 'warning');
            return;
        }

        if (customers.some(c => c.name === name)) {
            _showNotification('تنبيه', 'يوجد عميل بنفس الاسم بالفعل', 'warning');
            return;
        }

        const newCustomer = {
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
            maxDebt: maxDebt,
            alertDays: alertDays,
            notes: notes,
            createdAt: new Date().toISOString(),
            totalInvoices: 0,
            totalPurchases: 0,
            lastInvoiceDate: null
        };

        customers.push(newCustomer);
        saveCustomers();
        
        const modal = document.getElementById('addCustomerModal');
        if (modal) {
            bootstrap.Modal.getInstance(modal)?.hide();
        }
        
        renderCustomers();
        _clearCustomerForm();
        
        _showNotification('نجاح', 'تم إضافة العميل بنجاح', 'success');
    }

    // ================== إفراغ نموذج العميل ==================
    function _clearCustomerForm() {
        const fields = [
            'new-customer-name', 'new-customer-phone', 'new-customer-phone2',
            'new-customer-governorate', 'new-customer-city', 'new-customer-street',
            'new-customer-address', 'new-customer-tax', 'new-customer-commercial',
            'new-customer-email', 'new-customer-max-debt', 'new-customer-alert-days',
            'new-customer-notes'
        ];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }

    // ================== البحث عن العملاء ==================
    function searchCustomers() {
        const searchTerm = document.getElementById('search-customer')?.value.toLowerCase().trim() || '';
        
        let filteredCustomers = customers;
        
        if (searchTerm !== '') {
            filteredCustomers = customers.filter(c => 
                c.name.toLowerCase().includes(searchTerm) || 
                (c.phone && c.phone.includes(searchTerm))
            );
        }
        
        renderFilteredCustomers(filteredCustomers);
    }

    // ================== عرض العملاء المفلترين ==================
    function renderFilteredCustomers(filteredCustomers) {
        const tbody = document.getElementById('customers-tbody');
        if (!tbody) return;

        if (filteredCustomers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center p-4 text-muted">
                        <i class="material-icons-round" style="font-size:48px;">search_off</i>
                        <p>لا توجد نتائج للبحث</p>
                    </td>
                </tr>
            `;
            return;
        }

        const invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];

        tbody.innerHTML = filteredCustomers.map((c, idx) => {
            const originalIndex = customers.findIndex(item => item.id === c.id);
            
            const customerInvoices = invoices.filter(inv => inv.customer === c.name);
            const invoiceCount = customerInvoices.length;
            const totalPurchases = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
            const totalDue = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
            const isOverdue = totalDue > c.maxDebt && c.maxDebt > 0;
            
            return `
            <tr>
                <td>${c.name}</td>
                <td>${c.phone || '-'}</td>
                <td>${c.secondaryPhone || '-'}</td>
                <td>${c.city || '-'}</td>
                <td>
                    <span class="badge ${isOverdue ? 'bg-danger' : 'bg-success'}">
                        ${totalDue.toFixed(2)} دج / ${c.maxDebt} دج
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="customerModule.showCustomerDetails(${originalIndex})">
                        <i class="material-icons-round">visibility</i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="customerModule.editCustomer(${originalIndex})">
                        <i class="material-icons-round">edit</i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="customerModule.deleteCustomer(${originalIndex})">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `}).join('');

        updateCustomerSelect();
    }

    // ================== عرض جميع العملاء ==================
    function renderCustomers() {
        renderFilteredCustomers(customers);
        updateCustomerSelect();
    }

    // ================== تحديث قائمة العملاء في المبيعات ==================
    function updateCustomerSelect() {
        const select = document.getElementById('sale-customer');
        if (select) {
            select.innerHTML = '<option value="">اختر العميل</option>' + 
                customers.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }
    }

    // ================== عرض تفاصيل العميل ==================
    function showCustomerDetails(index) {
        const customer = customers[index];
        if (!customer) return;

        const invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
        const customerInvoices = invoices.filter(inv => inv.customer === customer.name);
        const totalPurchases = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const invoiceCount = customerInvoices.length;

        Swal.fire({
            title: 'تفاصيل العميل',
            html: `
                <div style="text-align:right; max-height:400px; overflow-y:auto;">
                    <table class="table table-sm table-bordered">
                        <tr><th style="width:40%">الاسم:</th><td>${customer.name}</td></tr>
                        <tr><th>الهاتف:</th><td>${customer.phone || '-'}</td></tr>
                        <tr><th>هاتف آخر:</th><td>${customer.secondaryPhone || '-'}</td></tr>
                        <tr><th>المحافظة:</th><td>${customer.governorate || '-'}</td></tr>
                        <tr><th>المدينة:</th><td>${customer.city || '-'}</td></tr>
                        <tr><th>الشارع:</th><td>${customer.street || '-'}</td></tr>
                        <tr><th>العنوان:</th><td>${customer.address || '-'}</td></tr>
                        <tr><th>الرقم الضريبي:</th><td>${customer.taxNumber || '-'}</td></tr>
                        <tr><th>السجل التجاري:</th><td>${customer.commercialRegister || '-'}</td></tr>
                        <tr><th>البريد الإلكتروني:</th><td>${customer.email || '-'}</td></tr>
                        <tr><th>الحد الأقصى للمديونية:</th><td>${customer.maxDebt} دج</td></tr>
                        <tr><th>أيام التنبيه:</th><td>${customer.alertDays} يوم</td></tr>
                        <tr><th>ملاحظات:</th><td>${customer.notes || '-'}</td></tr>
                        <tr class="table-info"><th>إجمالي المشتريات:</th><td>${totalPurchases.toFixed(2)} دج</td></tr>
                        <tr class="table-info"><th>عدد الفواتير:</th><td>${invoiceCount}</td></tr>
                    </table>
                </div>
            `,
            confirmButtonText: 'إغلاق',
            width: '600px'
        });
    }

    // ================== تعديل العميل ==================
    function editCustomer(index) {
        const customer = customers[index];
        if (!customer) return;

        Swal.fire({
            title: 'تعديل العميل',
            html: `
                <div style="text-align:right; max-height:400px; overflow-y:auto;">
                    <input type="text" id="edit-name" class="form-control mb-2" value="${customer.name}" placeholder="اسم العميل *">
                    <input type="text" id="edit-phone" class="form-control mb-2" value="${customer.phone || ''}" placeholder="رقم الهاتف">
                    <input type="text" id="edit-secondary-phone" class="form-control mb-2" value="${customer.secondaryPhone || ''}" placeholder="رقم هاتف آخر">
                    <input type="text" id="edit-governorate" class="form-control mb-2" value="${customer.governorate || ''}" placeholder="المحافظة">
                    <input type="text" id="edit-city" class="form-control mb-2" value="${customer.city || ''}" placeholder="المدينة">
                    <input type="text" id="edit-street" class="form-control mb-2" value="${customer.street || ''}" placeholder="الشارع">
                    <input type="text" id="edit-address" class="form-control mb-2" value="${customer.address || ''}" placeholder="العنوان كامل">
                    <input type="text" id="edit-tax" class="form-control mb-2" value="${customer.taxNumber || ''}" placeholder="الرقم الضريبي">
                    <input type="text" id="edit-commercial" class="form-control mb-2" value="${customer.commercialRegister || ''}" placeholder="رقم السجل التجاري">
                    <input type="email" id="edit-email" class="form-control mb-2" value="${customer.email || ''}" placeholder="البريد الإلكتروني">
                    <div class="input-group mb-2">
                        <input type="number" id="edit-max-debt" class="form-control" value="${customer.maxDebt}" placeholder="الحد الأقصى للمديونية">
                        <span class="input-group-text">دج</span>
                    </div>
                    <input type="number" id="edit-alert-days" class="form-control mb-2" value="${customer.alertDays}" placeholder="أيام التنبيه">
                    <textarea id="edit-notes" class="form-control" placeholder="ملاحظات" rows="2">${customer.notes || ''}</textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'حفظ',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                const name = document.getElementById('edit-name').value.trim();
                if (!name) {
                    Swal.showValidationMessage('اسم العميل مطلوب');
                    return false;
                }
                return {
                    name: name,
                    phone: document.getElementById('edit-phone').value.trim(),
                    secondaryPhone: document.getElementById('edit-secondary-phone').value.trim(),
                    governorate: document.getElementById('edit-governorate').value.trim(),
                    city: document.getElementById('edit-city').value.trim(),
                    street: document.getElementById('edit-street').value.trim(),
                    address: document.getElementById('edit-address').value.trim(),
                    taxNumber: document.getElementById('edit-tax').value.trim(),
                    commercialRegister: document.getElementById('edit-commercial').value.trim(),
                    email: document.getElementById('edit-email').value.trim(),
                    maxDebt: parseFloat(document.getElementById('edit-max-debt').value) || 0,
                    alertDays: parseInt(document.getElementById('edit-alert-days').value) || 0,
                    notes: document.getElementById('edit-notes').value.trim()
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const updated = result.value;
                customers[index] = { ...customer, ...updated };
                saveCustomers();
                renderCustomers();
                _showNotification('نجاح', 'تم تعديل العميل', 'success');
            }
        });
    }

    // ================== حذف العميل ==================
    function deleteCustomer(idx) {
        const customer = customers[idx];
        
        _showConfirmation('تأكيد الحذف', `حذف العميل "${customer.name}"؟`, () => {
            customers.splice(idx, 1);
            saveCustomers();
            renderCustomers();
            _showNotification('تم', 'تم حذف العميل', 'success');
        });
    }

    // ================== عرض فواتير العميل ==================
    function showCustomerInvoices(customerIndex) {
        const customer = customers[customerIndex];
        if (!customer) return;
        
        document.getElementById('selected-customer-name').textContent = customer.name;
        
        const invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
        const customerInvoices = invoices.filter(inv => inv.customer === customer.name);
        
        const tbody = document.getElementById('customer-invoices-tbody');
        if (tbody) {
            if (customerInvoices.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center p-3 text-muted">لا توجد فواتير</td></tr>';
            } else {
                tbody.innerHTML = customerInvoices.map(inv => `
                    <tr>
                        <td>#${inv.number || ''}</td>
                        <td>${inv.date || ''}</td>
                        <td>${inv.items ? inv.items.length : 0}</td>
                        <td class="fw-bold">${(inv.total || 0).toFixed(2)} دج</td>
                    </tr>
                `).join('');
            }
        }
        
        document.querySelector('#customers .table-responsive').style.display = 'none';
        document.getElementById('customer-invoices-view').style.display = 'block';
    }

    // ================== إخفاء فواتير العميل ==================
    function hideCustomerInvoices() {
        document.querySelector('#customers .table-responsive').style.display = 'block';
        document.getElementById('customer-invoices-view').style.display = 'none';
    }

    // ================== تصدير الوحدة ==================
    return {
        customers,
        addCustomer,
        saveNewCustomer,
        renderCustomers,
        showCustomerDetails,
        editCustomer,
        deleteCustomer,
        searchCustomers,
        showCustomerInvoices,
        hideCustomerInvoices
    };
})();

// ================== إدارة الموردين ==================
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

    function saveSuppliers() {
        localStorage.setItem('ryan_suppliers', JSON.stringify(suppliers));
    }

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

    // ================== إضافة مورد جديد (بسيط) ==================
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
        _clearSupplierForm();
        
        _showNotification('نجاح', 'تم إضافة المورد', 'success');
    }

    function _clearSupplierForm() {
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
        
        let filteredSuppliers = suppliers;
        
        if (searchTerm !== '') {
            filteredSuppliers = suppliers.filter(s => 
                s.name.toLowerCase().includes(searchTerm) || 
                (s.phone && s.phone.includes(searchTerm))
            );
        }
        
        renderFilteredSuppliers(filteredSuppliers);
    }

    // ================== عرض الموردين المفلترين ==================
    function renderFilteredSuppliers(filteredSuppliers) {
        const tbody = document.getElementById('suppliers-tbody');
        if (!tbody) return;

        if (filteredSuppliers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center p-4 text-muted">
                        <i class="material-icons-round" style="font-size:48px;">search_off</i>
                        <p>لا توجد نتائج للبحث</p>
                    </td>
                </tr>
            `;
            return;
        }

        const purchases = JSON.parse(localStorage.getItem('ryan_purchases')) || [];

        tbody.innerHTML = filteredSuppliers.map((s, idx) => {
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
                <td>
                    <button class="btn btn-sm btn-info" onclick="supplierModule.showSupplierDetails(${originalIndex})">
                        <i class="material-icons-round">visibility</i>
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

        updateSupplierSelect();
    }

    // ================== عرض جميع الموردين ==================
    function renderSuppliers() {
        renderFilteredSuppliers(suppliers);
        updateSupplierSelect();
    }

    // ================== تحديث قائمة الموردين في المشتريات ==================
    function updateSupplierSelect() {
        const select = document.getElementById('purchase-supplier');
        if (select) {
            select.innerHTML = '<option value="">اختر المورد</option>' + 
                suppliers.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        }
    }

    // ================== عرض تفاصيل المورد ==================
    function showSupplierDetails(index) {
        const supplier = suppliers[index];
        if (!supplier) return;

        const purchases = JSON.parse(localStorage.getItem('ryan_purchases')) || [];
        const supplierPurchases = purchases.filter(p => p.supplier === supplier.name);
        const totalPurchases = supplierPurchases.reduce((sum, p) => sum + (p.total || 0), 0);
        const purchaseCount = supplierPurchases.length;

        Swal.fire({
            title: 'تفاصيل المورد',
            html: `
                <div style="text-align:right;">
                    <table class="table table-sm table-bordered">
                        <tr><th>الاسم:</th><td>${supplier.name}</td></tr>
                        <tr><th>الهاتف:</th><td>${supplier.phone || '-'}</td></tr>
                        <tr><th>هاتف آخر:</th><td>${supplier.secondaryPhone || '-'}</td></tr>
                        <tr><th>المحافظة:</th><td>${supplier.governorate || '-'}</td></tr>
                        <tr><th>المدينة:</th><td>${supplier.city || '-'}</td></tr>
                        <tr><th>العنوان:</th><td>${supplier.address || '-'}</td></tr>
                        <tr><th>الرقم الضريبي:</th><td>${supplier.taxNumber || '-'}</td></tr>
                        <tr><th>السجل التجاري:</th><td>${supplier.commercialRegister || '-'}</td></tr>
                        <tr><th>البريد الإلكتروني:</th><td>${supplier.email || '-'}</td></tr>
                        <tr><th>ملاحظات:</th><td>${supplier.notes || '-'}</td></tr>
                        <tr class="table-info"><th>إجمالي المشتريات:</th><td>${totalPurchases.toFixed(2)} دج</td></tr>
                        <tr class="table-info"><th>عدد الفواتير:</th><td>${purchaseCount}</td></tr>
                    </table>
                </div>
            `,
            confirmButtonText: 'إغلاق',
            width: '600px'
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
                    <input type="text" id="edit-name" class="form-control mb-2" value="${supplier.name}" placeholder="اسم المورد *">
                    <input type="text" id="edit-phone" class="form-control mb-2" value="${supplier.phone || ''}" placeholder="رقم الهاتف">
                    <input type="text" id="edit-secondary-phone" class="form-control mb-2" value="${supplier.secondaryPhone || ''}" placeholder="رقم هاتف آخر">
                    <input type="text" id="edit-governorate" class="form-control mb-2" value="${supplier.governorate || ''}" placeholder="المحافظة">
                    <input type="text" id="edit-city" class="form-control mb-2" value="${supplier.city || ''}" placeholder="المدينة">
                    <input type="text" id="edit-street" class="form-control mb-2" value="${supplier.street || ''}" placeholder="الشارع">
                    <input type="text" id="edit-address" class="form-control mb-2" value="${supplier.address || ''}" placeholder="العنوان كامل">
                    <input type="text" id="edit-tax" class="form-control mb-2" value="${supplier.taxNumber || ''}" placeholder="الرقم الضريبي">
                    <input type="text" id="edit-commercial" class="form-control mb-2" value="${supplier.commercialRegister || ''}" placeholder="رقم السجل التجاري">
                    <input type="email" id="edit-email" class="form-control mb-2" value="${supplier.email || ''}" placeholder="البريد الإلكتروني">
                    <textarea id="edit-notes" class="form-control" placeholder="ملاحظات" rows="2">${supplier.notes || ''}</textarea>
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
                    secondaryPhone: document.getElementById('edit-secondary-phone').value.trim(),
                    governorate: document.getElementById('edit-governorate').value.trim(),
                    city: document.getElementById('edit-city').value.trim(),
                    street: document.getElementById('edit-street').value.trim(),
                    address: document.getElementById('edit-address').value.trim(),
                    taxNumber: document.getElementById('edit-tax').value.trim(),
                    commercialRegister: document.getElementById('edit-commercial').value.trim(),
                    email: document.getElementById('edit-email').value.trim(),
                    notes: document.getElementById('edit-notes').value.trim()
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

    // ================== عرض فواتير المورد ==================
    function showSupplierInvoices(supplierIndex) {
        const supplier = suppliers[supplierIndex];
        if (!supplier) return;
        
        document.getElementById('selected-supplier-name').textContent = supplier.name;
        
        const purchases = JSON.parse(localStorage.getItem('ryan_purchases')) || [];
        const supplierPurchases = purchases.filter(p => p.supplier === supplier.name);
        
        const tbody = document.getElementById('supplier-invoices-tbody');
        if (tbody) {
            if (supplierPurchases.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center p-3 text-muted">لا توجد فواتير</td></tr>';
            } else {
                tbody.innerHTML = supplierPurchases.map(pur => `
                    <tr>
                        <td>#${pur.number || ''}</td>
                        <td>${pur.date || ''}</td>
                        <td>${pur.items ? pur.items.length : 0}</td>
                        <td class="fw-bold text-success">${(pur.total || 0).toFixed(2)} دج</td>
                    </tr>
                `).join('');
            }
        }
        
        document.querySelector('#suppliers .table-responsive').style.display = 'none';
        document.getElementById('supplier-invoices-view').style.display = 'block';
    }

    // ================== إخفاء فواتير المورد ==================
    function hideSupplierInvoices() {
        document.querySelector('#suppliers .table-responsive').style.display = 'block';
        document.getElementById('supplier-invoices-view').style.display = 'none';
    }

    // ================== تصدير الوحدة ==================
    return {
        suppliers,
        addSupplier,
        saveNewSupplier,
        renderSuppliers,
        showSupplierDetails,
        editSupplier,
        deleteSupplier,
        searchSuppliers,
        showSupplierInvoices,
        hideSupplierInvoices
    };
})();

// ================== تصدير للاستخدام العام ==================
window.customerModule = customerModule;
window.supplierModule = supplierModule;
