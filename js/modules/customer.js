
// ================== إدارة العملاء - وحدة منفصلة ==================
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

    // ================== إضافة عميل جديد ==================
    function addCustomer() {
        const name = document.getElementById('new-customer')?.value.trim();
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
        
        if (document.getElementById('new-customer')) {
            document.getElementById('new-customer').value = '';
        }
        
        _showNotification('نجاح', 'تم إضافة العميل', 'success');
    }

    // ================== إضافة عميل كامل ==================
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

        customers.push({
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
            createdAt: new Date().toISOString()
        });

        saveCustomers();
        renderCustomers();
        _clearForm();
        
        _showNotification('نجاح', 'تم إضافة العميل', 'success');
    }

    function _clearForm() {
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
        
        let filtered = customers;
        
        if (searchTerm !== '') {
            filtered = customers.filter(c => 
                c.name.toLowerCase().includes(searchTerm) || 
                (c.phone && c.phone.includes(searchTerm))
            );
        }
        
        renderFiltered(filtered);
    }

    function renderFiltered(filtered) {
        const tbody = document.getElementById('customers-tbody');
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center p-4 text-muted">
                        <i class="material-icons-round" style="font-size:48px;">search_off</i>
                        <p>لا توجد نتائج</p>
                    </td>
                </tr>
            `;
            return;
        }

        const invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];

        tbody.innerHTML = filtered.map((c, idx) => {
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
                <td><span class="badge bg-primary">${invoiceCount}</span></td>
                <td>${totalPurchases.toFixed(2)} دج</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="customerModule.showCustomerInvoices(${originalIndex})">
                        <i class="material-icons-round">receipt</i>
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
    }

    function renderCustomers() {
        renderFiltered(customers);
        updateSelect();
    }

    function updateSelect() {
        const select = document.getElementById('sale-customer');
        if (select) {
            select.innerHTML = '<option value="">اختر العميل</option>' + 
                customers.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }
    }

    // ================== عرض فواتير العميل ==================
    function showCustomerInvoices(index) {
        const customer = customers[index];
        if (!customer) return;
        
        document.getElementById('selected-customer-name').textContent = customer.name;
        
        const invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
        const customerInvoices = invoices.filter(inv => inv.customer === customer.name);
        
        const tbody = document.getElementById('customer-invoices-tbody');
        if (tbody) {
            if (customerInvoices.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center p-3">لا توجد فواتير</td></tr>';
            } else {
                tbody.innerHTML = customerInvoices.map(inv => `
                    <tr>
                        <td>#${inv.number || ''}</td>
                        <td>${inv.date || ''}</td>
                        <td>${inv.items ? inv.items.length : 0}</td>
                        <td class="fw-bold">${(inv.total || 0).toFixed(2)} دج</td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="customerModule.showInvoiceDetails(${inv.number})">
                                <i class="material-icons-round">visibility</i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
        
        document.querySelector('#customers .table-responsive').style.display = 'none';
        document.getElementById('customer-invoices-view').style.display = 'block';
    }

    function hideCustomerInvoices() {
        document.querySelector('#customers .table-responsive').style.display = 'block';
        document.getElementById('customer-invoices-view').style.display = 'none';
    }

    function showInvoiceDetails(invoiceNumber) {
        const invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
        const invoice = invoices.find(inv => inv.number === invoiceNumber);
        
        if (!invoice) return;
        
        let itemsHtml = '';
        invoice.items.forEach((item, index) => {
            const itemTotal = item.price * item.qty * (1 - (item.discount || 0)/100);
            itemsHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>${item.price.toFixed(2)} دج</td>
                    <td>${item.discount || 0}%</td>
                    <td>${itemTotal.toFixed(2)} دج</td>
                </tr>
            `;
        });
        
        Swal.fire({
            title: `فاتورة رقم ${invoice.number}`,
            html: `
                <div style="text-align:right; max-height:400px; overflow-y:auto;">
                    <p><strong>العميل:</strong> ${invoice.customer || 'نقدي'}</p>
                    <p><strong>التاريخ:</strong> ${invoice.date}</p>
                    <p><strong>الإجمالي:</strong> ${invoice.total.toFixed(2)} دج</p>
                    <hr>
                    <table style="width:100%; font-size:12px;">
                        <thead>
                            <tr><th>#</th><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الخصم</th><th>الإجمالي</th></tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                </div>
            `,
            width: '700px',
            confirmButtonText: 'إغلاق'
        });
    }

    // ================== تعديل العميل ==================
    function editCustomer(index) {
        const customer = customers[index];
        if (!customer) return;

        Swal.fire({
            title: 'تعديل العميل',
            html: `
                <div style="text-align:right;">
                    <input type="text" id="edit-name" class="form-control mb-2" value="${customer.name}">
                    <input type="text" id="edit-phone" class="form-control mb-2" value="${customer.phone || ''}">
                    <input type="text" id="edit-city" class="form-control mb-2" value="${customer.city || ''}">
                    <input type="number" id="edit-max-debt" class="form-control mb-2" value="${customer.maxDebt}">
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
                    city: document.getElementById('edit-city').value.trim(),
                    maxDebt: parseFloat(document.getElementById('edit-max-debt').value) || 0
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
            hideCustomerInvoices();
            _showNotification('تم', 'تم حذف العميل', 'success');
        });
    }

    return {
        customers,
        addCustomer,
        saveNewCustomer,
        renderCustomers,
        editCustomer,
        deleteCustomer,
        searchCustomers,
        showCustomerInvoices,
        hideCustomerInvoices,
        showInvoiceDetails
    };
})();

window.customerModule = customerModule;
