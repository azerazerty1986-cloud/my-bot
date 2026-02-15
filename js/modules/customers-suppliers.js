// ================== إدارة العملاء والموردين ==================

// ================== إدارة العملاء ==================
const customerModule = (function() {
    let customers = JSON.parse(localStorage.getItem('ryan_customers')) || [];
    
    // تحويل العملاء القدامى
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
                createdAt: new Date().toISOString()
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
            createdAt: c.createdAt || new Date().toISOString()
        };
    });

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
            confirmButtonText: 'نعم، متأكد',
            cancelButtonText: 'إلغاء',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed && confirmCallback) {
                confirmCallback();
            }
        });
    }

    // ================== إضافة عميل جديد ==================
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
            createdAt: new Date().toISOString()
        };

        customers.push(newCustomer);
        saveCustomers();
        renderCustomers();
        
        document.getElementById('new-customer').value = '';
        if (document.getElementById('new-customer-phone')) {
            document.getElementById('new-customer-phone').value = '';
        }
        
        _showNotification('نجاح', 'تم إضافة العميل', 'success');
    }

    // ================== عرض العملاء ==================
    function renderCustomers() {
        const tbody = document.getElementById('customers-tbody');
        if (!tbody) return;

        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-muted"><i class="material-icons-round" style="font-size:48px;">people</i><p>لا يوجد عملاء</p></td></tr>';
            return;
        }

        tbody.innerHTML = customers.map((c, idx) => `
            <tr>
                <td>${c.name}</td>
                <td>${c.phone || '-'}</td>
                <td><button class="btn btn-sm btn-info" onclick="customerModule.showCustomerInvoices(${idx})">عرض الفواتير</button></td>
                <td><button class="btn btn-sm btn-danger" onclick="customerModule.deleteCustomer(${idx})"><i class="material-icons-round" style="font-size:16px;">delete</i></button></td>
            </tr>
        `).join('');

        // تحديث قائمة العملاء في المبيعات
        const select = document.getElementById('sale-customer');
        if (select) {
            select.innerHTML = '<option value="">اختر العميل</option>' + 
                customers.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }
    }

    // ================== عرض فواتير العميل ==================
    function showCustomerInvoices(customerIndex) {
        const customer = customers[customerIndex];
        document.getElementById('selected-customer-name').textContent = customer.name;
        
        const invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
        const customerInvoices = invoices.filter(inv => inv.customer === customer.name);
        
        const tbody = document.getElementById('customer-invoices-tbody');
        if (tbody) {
            tbody.innerHTML = customerInvoices.map(inv => `
                <tr><td>#${inv.number}</td><td>${inv.date}</td><td>${inv.total.toFixed(2)} دج</td></tr>
            `).join('');
        }
        
        document.querySelector('#customers .table-custom').style.display = 'none';
        document.getElementById('customer-invoices-view').style.display = 'block';
    }

    function hideCustomerInvoices() {
        document.querySelector('#customers .table-custom').style.display = 'table';
        document.getElementById('customer-invoices-view').style.display = 'none';
    }

    // ================== حذف العميل ==================
    function deleteCustomer(idx) {
        const customer = customers[idx];
        _showConfirmation('تأكيد الحذف', `حذف العميل "${customer.name}"؟`, () => {
            customers.splice(idx, 1);
            saveCustomers();
            renderCustomers();
            hideCustomerInvoices();
            _showNotification('تم', 'تم حذف العميل', 'success');
        });
    }

    // ================== حفظ عميل جديد من شاشة الإضافة ==================
    function saveNewCustomer() {
        const name = document.getElementById('new-customer-name')?.value.trim();
        const phone = document.getElementById('new-customer-phone')?.value.trim() || '';
        
        if (!name) {
            _showNotification('تنبيه', 'اسم العميل مطلوب', 'warning');
            return;
        }

        customers.push({
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
            createdAt: new Date().toISOString()
        });
        
        saveCustomers();
        renderCustomers();
        
        _showNotification('نجاح', 'تم إضافة العميل', 'success');
        document.getElementById('new-customer-name').value = '';
        document.getElementById('new-customer-phone').value = '';
    }

    return {
        customers,
        addCustomer,
        renderCustomers,
        showCustomerInvoices,
        hideCustomerInvoices,
        deleteCustomer,
        saveNewCustomer
    };
})();

// ================== إدارة الموردين ==================
const supplierModule = (function() {
    let suppliers = JSON.parse(localStorage.getItem('ryan_suppliers')) || [];
    
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
            confirmButtonText: 'نعم، متأكد',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed && confirmCallback) {
                confirmCallback();
            }
        });
    }

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
        
        document.getElementById('new-supplier').value = '';
        if (document.getElementById('new-supplier-phone')) {
            document.getElementById('new-supplier-phone').value = '';
        }
        
        _showNotification('نجاح', 'تم إضافة المورد', 'success');
    }

    function renderSuppliers() {
        const tbody = document.getElementById('suppliers-tbody');
        if (!tbody) return;

        if (suppliers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4 text-muted"><i class="material-icons-round" style="font-size:48px;">business</i><p>لا يوجد موردين</p></td></tr>';
            return;
        }

        tbody.innerHTML = suppliers.map((s, idx) => `
            <tr>
                <td>${s.name}</td>
                <td>${s.phone || '-'}</td>
                <td><button class="btn btn-sm btn-danger" onclick="supplierModule.deleteSupplier(${idx})"><i class="material-icons-round" style="font-size:16px;">delete</i></button></td>
            </tr>
        `).join('');

        const select = document.getElementById('purchase-supplier');
        if (select) {
            select.innerHTML = '<option value="">اختر المورد</option>' + 
                suppliers.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        }
    }

    function deleteSupplier(idx) {
        const supplier = suppliers[idx];
        _showConfirmation('تأكيد الحذف', `حذف المورد "${supplier.name}"؟`, () => {
            suppliers.splice(idx, 1);
            saveSuppliers();
            renderSuppliers();
            _showNotification('تم', 'تم حذف المورد', 'success');
        });
    }

    function saveNewSupplier() {
        const name = document.getElementById('new-supplier-name')?.value.trim();
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
        
        _showNotification('نجاح', 'تم إضافة المورد', 'success');
        document.getElementById('new-supplier-name').value = '';
        document.getElementById('new-supplier-phone').value = '';
    }

    return {
        suppliers,
        addSupplier,
        renderSuppliers,
        deleteSupplier,
        saveNewSupplier
    };
})();

// ================== تصدير للاستخدام العام ==================
window.customerModule = customerModule;
window.supplierModule = supplierModule;
