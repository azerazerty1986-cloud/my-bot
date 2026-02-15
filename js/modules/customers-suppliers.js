// ================== إدارة العملاء ==================
const customerModule = (function() {
    let customers = JSON.parse(localStorage.getItem('ryan_customers')) || [];
    customers = customers.map((c, idx) => ({ id: c.id || Date.now() + idx, name: c.name || c, phone: c.phone || '' }));

    function saveCustomers() {
        localStorage.setItem('ryan_customers', JSON.stringify(customers));
    }

    function addCustomer() {
        const name = document.getElementById('new-customer').value.trim();
        if (!name) {
            Swal.fire('تنبيه', 'أدخل اسم العميل', 'warning');
            return;
        }
        customers.push({ id: Date.now(), name, phone: '' });
        saveCustomers();
        renderCustomers();
        document.getElementById('new-customer').value = '';
        Swal.fire('نجاح', 'تم إضافة العميل', 'success');
    }

    function renderCustomers() {
        const tbody = document.getElementById('customers-tbody');
        tbody.innerHTML = customers.map((c, idx) => `
            <tr>
                <td>${c.name}</td>
                <td>${c.phone || ''}</td>
                <td><button class="btn btn-sm btn-info" onclick="customerModule.showCustomerInvoices(${idx})">عرض الفواتير</button></td>
                <td><button class="btn btn-sm btn-danger" onclick="customerModule.deleteCustomer(${idx})"><i class="material-icons-round" style="font-size:16px;">delete</i></button></td>
            </tr>
        `).join('');
        
        const select = document.getElementById('sale-customer');
        select.innerHTML = '<option value="">اختر العميل</option>' + customers.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    }

    function deleteCustomer(idx) {
        Swal.fire({
            title: 'تأكيد الحذف',
            text: 'هل أنت متأكد من حذف هذا العميل؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                customers.splice(idx, 1);
                saveCustomers();
                renderCustomers();
                hideCustomerInvoices();
                Swal.fire('تم الحذف', 'تم حذف العميل', 'success');
            }
        });
    }

    function showCustomerInvoices(customerIndex) {
        const customer = customers[customerIndex];
        document.getElementById('selected-customer-name').textContent = customer.name;
        const invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
        const customerInvoices = invoices.filter(inv => inv.customer === customer.name);
        const tbody = document.getElementById('customer-invoices-tbody');
        tbody.innerHTML = customerInvoices.map(inv => `
            <tr>
                <td>${inv.number}</td>
                <td>${inv.date}</td>
                <td>${inv.total.toFixed(2)} دج</td>
            </tr>
        `).join('');
        document.querySelector('#customers .table-custom').style.display = 'none';
        document.getElementById('customer-invoices-view').style.display = 'block';
    }

    function hideCustomerInvoices() {
        document.querySelector('#customers .table-custom').style.display = 'table';
        document.getElementById('customer-invoices-view').style.display = 'none';
    }

    function saveNewCustomer() {
        const name = document.getElementById('new-customer-name').value.trim();
        const phone = document.getElementById('new-customer-phone').value.trim();
        if (!name) {
            Swal.fire('تنبيه', 'اسم العميل مطلوب', 'warning');
            return;
        }
        customers.push({ id: Date.now(), name, phone });
        saveCustomers();
        Swal.fire('نجاح', 'تم إضافة العميل', 'success');
        document.querySelectorAll('#add-customer input').forEach(i => i.value = '');
        renderCustomers();
    }

    return {
        customers,
        addCustomer,
        renderCustomers,
        deleteCustomer,
        showCustomerInvoices,
        hideCustomerInvoices,
        saveNewCustomer
    };
})();

// ================== إدارة الموردين ==================
const supplierModule = (function() {
    let suppliers = JSON.parse(localStorage.getItem('ryan_suppliers')) || [];
    suppliers = suppliers.map((s, idx) => ({ id: s.id || Date.now() + idx, name: s.name || s, phone: s.phone || '' }));

    function saveSuppliers() {
        localStorage.setItem('ryan_suppliers', JSON.stringify(suppliers));
    }

    function addSupplier() {
        const name = document.getElementById('new-supplier').value.trim();
        if (!name) {
            Swal.fire('تنبيه', 'أدخل اسم المورد', 'warning');
            return;
        }
        suppliers.push({ id: Date.now(), name, phone: '' });
        saveSuppliers();
        renderSuppliers();
        document.getElementById('new-supplier').value = '';
        Swal.fire('نجاح', 'تم إضافة المورد', 'success');
    }

    function renderSuppliers() {
        const tbody = document.getElementById('suppliers-tbody');
        tbody.innerHTML = suppliers.map((s, idx) => `
            <tr>
                <td>${s.name}</td>
                <td>${s.phone || ''}</td>
                <td><button class="btn btn-sm btn-danger" onclick="supplierModule.deleteSupplier(${idx})"><i class="material-icons-round" style="font-size:16px;">delete</i></button></td>
            </tr>
        `).join('');
        
        const select = document.getElementById('purchase-supplier');
        select.innerHTML = '<option value="">اختر المورد</option>' + suppliers.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    }

    function deleteSupplier(idx) {
        Swal.fire({
            title: 'تأكيد الحذف',
            text: 'هل أنت متأكد من حذف هذا المورد؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                suppliers.splice(idx, 1);
                saveSuppliers();
                renderSuppliers();
                Swal.fire('تم الحذف', 'تم حذف المورد', 'success');
            }
        });
    }

    function saveNewSupplier() {
        const name = document.getElementById('new-supplier-name').value.trim();
        const phone = document.getElementById('new-supplier-phone').value.trim();
        if (!name) {
            Swal.fire('تنبيه', 'اسم المورد مطلوب', 'warning');
            return;
        }
        suppliers.push({ id: Date.now(), name, phone });
        saveSuppliers();
        Swal.fire('نجاح', 'تم إضافة المورد', 'success');
        document.querySelectorAll('#add-supplier input').forEach(i => i.value = '');
        renderSuppliers();
    }

    return {
        suppliers,
        addSupplier,
        renderSuppliers,
        deleteSupplier,
        saveNewSupplier
    };
})();
