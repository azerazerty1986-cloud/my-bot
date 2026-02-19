// ================== إدارة العملاء والموردين ==================

// ================== إدارة العملاء ==================
const customerModule = (function() {
    let customers = JSON.parse(localStorage.getItem('ryan_customers')) || [];
    
    // تحويل العملاء القدامى إلى الشكل الجديد
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

    // حفظ العملاء
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
            createdAt: new Date().toISOString()
        };

        customers.push(newCustomer);
        saveCustomers();
        renderCustomers();
        
        if (document.getElementById('new-customer')) {
            document.getElementById('new-customer').value = '';
        }
        
        _showNotification('نجاح', 'تم إضافة العميل', 'success');
    }

    // ================== إضافة عميل كامل (مع جميع الحقول) ==================
    function saveNewCustomer() {
        console.log('محاولة حفظ عميل جديد...');
        
        // الحصول على القيم من الحقول
        const name = document.getElementById('new-customer-name')?.value.trim();
        const nickname = document.getElementById('new-customer-nickname')?.value.trim() || '';
        const phone = document.getElementById('new-customer-phone')?.value.trim() || '';
        const phone2 = document.getElementById('new-customer-phone2')?.value.trim() || '';
        const whatsapp = document.getElementById('new-customer-whatsapp')?.value.trim() || '';
        const email = document.getElementById('new-customer-email')?.value.trim() || '';
        const birthdate = document.getElementById('new-customer-birthdate')?.value || '';
        const gender = document.getElementById('new-customer-gender')?.value || '';
        
        const country = document.getElementById('new-customer-country')?.value || 'الجزائر';
        const governorate = document.getElementById('new-customer-governorate')?.value.trim() || '';
        const city = document.getElementById('new-customer-city')?.value.trim() || '';
        const district = document.getElementById('new-customer-district')?.value.trim() || '';
        const street = document.getElementById('new-customer-street')?.value.trim() || '';
        const building = document.getElementById('new-customer-building')?.value.trim() || '';
        const address = document.getElementById('new-customer-address')?.value.trim() || '';
        
        const maxDebt = parseFloat(document.getElementById('new-customer-max-debt')?.value) || 0;
        const alertDays = parseInt(document.getElementById('new-customer-alert-days')?.value) || 0;
        const discount = parseFloat(document.getElementById('new-customer-discount')?.value) || 0;
        const payment = document.getElementById('new-customer-payment')?.value || 'cash';
        const rating = document.getElementById('new-customer-rating')?.value || 'D';
        
        const taxNumber = document.getElementById('new-customer-tax')?.value.trim() || '';
        const commercial = document.getElementById('new-customer-commercial')?.value.trim() || '';
        
        const source = document.getElementById('new-customer-source')?.value || 'direct';
        const lastContact = document.getElementById('new-customer-last-contact')?.value || '';
        
        const notes = document.getElementById('new-customer-notes')?.value.trim() || '';

        // التحقق من الحقول المطلوبة
        if (!name) {
            Swal.fire({
                icon: 'warning',
                title: 'تنبيه',
                text: 'اسم العميل مطلوب'
            });
            return;
        }

        // إنشاء كائن العميل
        const newCustomer = {
            id: Date.now(),
            name: name,
            nickname: nickname,
            phone: phone,
            phone2: phone2,
            whatsapp: whatsapp,
            email: email,
            birthdate: birthdate,
            gender: gender,
            country: country,
            governorate: governorate,
            city: city,
            district: district,
            street: street,
            building: building,
            address: address || `${street}, ${district}, ${city}, ${governorate}`,
            maxDebt: maxDebt,
            alertDays: alertDays,
            discount: discount,
            paymentMethod: payment,
            rating: rating,
            taxNumber: taxNumber,
            commercialRegister: commercial,
            source: source,
            lastContact: lastContact,
            notes: notes,
            createdAt: new Date().toISOString(),
            totalPurchases: 0,
            invoiceCount: 0,
            lastInvoiceDate: null
        };

        // إضافة العميل إلى القائمة
        customers.push(newCustomer);
        saveCustomers();

        // رسالة نجاح
        Swal.fire({
            icon: 'success',
            title: 'تم الحفظ',
            text: 'تم إضافة العميل بنجاح',
            timer: 1500,
            showConfirmButton: false
        });

        // إعادة تعيين الحقول
        document.getElementById('new-customer-name').value = '';
        if (document.getElementById('new-customer-nickname')) document.getElementById('new-customer-nickname').value = '';
        if (document.getElementById('new-customer-phone')) document.getElementById('new-customer-phone').value = '';
        if (document.getElementById('new-customer-phone2')) document.getElementById('new-customer-phone2').value = '';
        if (document.getElementById('new-customer-whatsapp')) document.getElementById('new-customer-whatsapp').value = '';
        if (document.getElementById('new-customer-email')) document.getElementById('new-customer-email').value = '';
        if (document.getElementById('new-customer-birthdate')) document.getElementById('new-customer-birthdate').value = '';
        if (document.getElementById('new-customer-gender')) document.getElementById('new-customer-gender').value = '';
        
        if (document.getElementById('new-customer-governorate')) document.getElementById('new-customer-governorate').value = '';
        if (document.getElementById('new-customer-city')) document.getElementById('new-customer-city').value = '';
        if (document.getElementById('new-customer-district')) document.getElementById('new-customer-district').value = '';
        if (document.getElementById('new-customer-street')) document.getElementById('new-customer-street').value = '';
        if (document.getElementById('new-customer-building')) document.getElementById('new-customer-building').value = '';
        if (document.getElementById('new-customer-address')) document.getElementById('new-customer-address').value = '';
        
        if (document.getElementById('new-customer-max-debt')) document.getElementById('new-customer-max-debt').value = '0';
        if (document.getElementById('new-customer-alert-days')) document.getElementById('new-customer-alert-days').value = '0';
        if (document.getElementById('new-customer-discount')) document.getElementById('new-customer-discount').value = '0';
        
        if (document.getElementById('new-customer-tax')) document.getElementById('new-customer-tax').value = '';
        if (document.getElementById('new-customer-commercial')) document.getElementById('new-customer-commercial').value = '';
        
        if (document.getElementById('new-customer-last-contact')) document.getElementById('new-customer-last-contact').value = '';
        if (document.getElementById('new-customer-notes')) document.getElementById('new-customer-notes').value = '';

        // تحديث عرض العملاء
        renderCustomers();

        console.log('تم حفظ العميل:', newCustomer);
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
                <td><button class="btn btn-sm btn-info" onclick="customerModule.showCustomerInvoices(${idx})">الفواتير</button></td>
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
        // هذه دالة بسيطة - يمكن تطويرها لاحقاً
        Swal.fire('معلومات', 'سيتم إضافة عرض الفواتير قريباً', 'info');
    }

    return {
        customers,
        addCustomer,
        saveNewCustomer,
        renderCustomers,
        deleteCustomer,
        showCustomerInvoices
    };
})();

// ================== إدارة الموردين (مبسطة) ==================
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
            confirmButtonText: 'نعم',
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
        
        if (document.getElementById('new-supplier')) {
            document.getElementById('new-supplier').value = '';
        }
        
        _showNotification('نجاح', 'تم إضافة المورد', 'success');
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
        
        document.getElementById('new-supplier-name').value = '';
        if (document.getElementById('new-supplier-phone')) document.getElementById('new-supplier-phone').value = '';
        
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

    return {
        suppliers,
        addSupplier,
        saveNewSupplier,
        renderSuppliers,
        deleteSupplier
    };
})();

// ================== تصدير للاستخدام العام ==================
window.customerModule = customerModule;
window.supplierModule = supplierModule;
