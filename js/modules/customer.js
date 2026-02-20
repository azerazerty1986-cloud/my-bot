// ================== customer.js - إدارة العملاء ==================
// الرقم 20 في ترتيب الملفات - يعتمد على utils.js

const customerModule = (function() {
    // ================== البيانات ==================
    let customers = JSON.parse(localStorage.getItem('customers')) || [];
    
    // ================== تطبيع البيانات (للتأكد من هيكل موحد) ==================
    customers = customers.map(c => {
        if (typeof c === 'string') {
            return {
                id: utilsModule.generateId(),
                name: c,
                phone: '',
                secondaryPhone: '',
                email: '',
                address: '',
                taxNumber: '',
                commercialRegister: '',
                maxDebt: 0,
                discount: 0,
                notes: '',
                totalPurchases: 0,
                totalPaid: 0,
                totalDebt: 0,
                lastPurchaseDate: null,
                createdAt: new Date().toISOString()
            };
        }
        return {
            id: c.id || utilsModule.generateId(),
            name: c.name || '',
            phone: c.phone || '',
            secondaryPhone: c.secondaryPhone || '',
            email: c.email || '',
            address: c.address || '',
            taxNumber: c.taxNumber || '',
            commercialRegister: c.commercialRegister || '',
            maxDebt: c.maxDebt || 0,
            discount: c.discount || 0,
            notes: c.notes || '',
            totalPurchases: c.totalPurchases || 0,
            totalPaid: c.totalPaid || 0,
            totalDebt: c.totalDebt || 0,
            lastPurchaseDate: c.lastPurchaseDate || null,
            createdAt: c.createdAt || new Date().toISOString()
        };
    });
    
    // ================== حفظ العملاء ==================
    function saveCustomers() {
        localStorage.setItem('customers', JSON.stringify(customers));
    }
    
    // ================== إضافة عميل جديد ==================
    function addCustomer(customerData) {
        // التحقق من البيانات المطلوبة
        if (!customerData.name) {
            utilsModule.showNotification('خطأ', 'اسم العميل مطلوب', 'error');
            return null;
        }
        
        // إنشاء كائن العميل الجديد
        const newCustomer = {
            id: utilsModule.generateId(),
            name: customerData.name,
            phone: customerData.phone || '',
            secondaryPhone: customerData.secondaryPhone || '',
            email: customerData.email || '',
            address: customerData.address || '',
            taxNumber: customerData.taxNumber || '',
            commercialRegister: customerData.commercialRegister || '',
            maxDebt: parseFloat(customerData.maxDebt) || 0,
            discount: parseFloat(customerData.discount) || 0,
            notes: customerData.notes || '',
            totalPurchases: 0,
            totalPaid: 0,
            totalDebt: 0,
            lastPurchaseDate: null,
            createdAt: new Date().toISOString()
        };
        
        customers.push(newCustomer);
        saveCustomers();
        
        utilsModule.showNotification('نجاح', 'تم إضافة العميل');
        renderCustomers();
        updateCustomerSelect();
        
        return newCustomer;
    }
    
    // ================== إضافة عميل من النموذج السريع ==================
    function addCustomer() {
        const nameInput = document.getElementById('new-customer');
        const phoneInput = document.getElementById('new-customer-phone');
        
        const name = nameInput?.value.trim();
        const phone = phoneInput?.value.trim() || '';
        
        if (!name) {
            utilsModule.showNotification('تنبيه', 'اسم العميل مطلوب', 'warning');
            return;
        }
        
        addCustomer({ name, phone });
        
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';
    }
    
    // ================== إضافة عميل من النموذج الكامل ==================
    function addNewCustomer() {
        const name = document.getElementById('new-customer-name')?.value.trim();
        const phone = document.getElementById('new-customer-phone')?.value.trim() || '';
        const secondaryPhone = document.getElementById('new-customer-phone2')?.value.trim() || '';
        const email = document.getElementById('new-customer-email')?.value.trim() || '';
        const address = document.getElementById('new-customer-address')?.value.trim() || '';
        const taxNumber = document.getElementById('new-customer-tax')?.value.trim() || '';
        const commercial = document.getElementById('new-customer-commercial')?.value.trim() || '';
        const maxDebt = document.getElementById('new-customer-max-debt')?.value || 0;
        const discount = document.getElementById('new-customer-discount')?.value || 0;
        const notes = document.getElementById('new-customer-notes')?.value.trim() || '';
        
        if (!name) {
            utilsModule.showNotification('تنبيه', 'اسم العميل مطلوب', 'warning');
            return;
        }
        
        addCustomer({
            name,
            phone,
            secondaryPhone,
            email,
            address,
            taxNumber,
            commercialRegister: commercial,
            maxDebt,
            discount,
            notes
        });
        
        // مسح الحقول
        document.getElementById('new-customer-name').value = '';
        if (document.getElementById('new-customer-phone')) document.getElementById('new-customer-phone').value = '';
        if (document.getElementById('new-customer-phone2')) document.getElementById('new-customer-phone2').value = '';
        if (document.getElementById('new-customer-email')) document.getElementById('new-customer-email').value = '';
        if (document.getElementById('new-customer-address')) document.getElementById('new-customer-address').value = '';
        if (document.getElementById('new-customer-tax')) document.getElementById('new-customer-tax').value = '';
        if (document.getElementById('new-customer-commercial')) document.getElementById('new-customer-commercial').value = '';
        if (document.getElementById('new-customer-max-debt')) document.getElementById('new-customer-max-debt').value = '0';
        if (document.getElementById('new-customer-discount')) document.getElementById('new-customer-discount').value = '0';
        if (document.getElementById('new-customer-notes')) document.getElementById('new-customer-notes').value = '';
    }
    
    // ================== الحصول على جميع العملاء ==================
    function getAllCustomers() {
        return [...customers];
    }
    
    // ================== الحصول على عميل بواسطة ID ==================
    function getCustomer(id) {
        return customers.find(c => c.id == id);
    }
    
    // ================== الحصول على عميل بواسطة الاسم ==================
    function getCustomerByName(name) {
        return customers.find(c => c.name === name);
    }
    
    // ================== تحديث عميل ==================
    function updateCustomer(id, updatedData) {
        const index = customers.findIndex(c => c.id == id);
        if (index === -1) {
            utilsModule.showNotification('خطأ', 'العميل غير موجود', 'error');
            return null;
        }
        
        customers[index] = {
            ...customers[index],
            ...updatedData
        };
        
        saveCustomers();
        utilsModule.showNotification('نجاح', 'تم تحديث العميل');
        renderCustomers();
        updateCustomerSelect();
        
        return customers[index];
    }
    
    // ================== حذف عميل ==================
    function deleteCustomer(id) {
        const customer = getCustomer(id);
        if (!customer) return false;
        
        // التحقق من وجود ديون أو فواتير للعميل
        if (customer.totalDebt > 0) {
            utilsModule.showNotification('تنبيه', 'لا يمكن حذف عميل عليه ديون', 'warning');
            return false;
        }
        
        utilsModule.showConfirmation(
            'تأكيد الحذف',
            `هل أنت متأكد من حذف العميل "${customer.name}"؟`,
            () => {
                customers = customers.filter(c => c.id != id);
                saveCustomers();
                utilsModule.showNotification('تم', 'تم حذف العميل');
                renderCustomers();
                updateCustomerSelect();
            }
        );
        
        return true;
    }
    
    // ================== البحث عن العملاء ==================
    function searchCustomers(term) {
        const tbody = document.getElementById('customers-full-tbody');
        if (!tbody) return;
        
        if (!term || term.length < 2) {
            renderCustomersFull();
            return;
        }
        
        term = term.toLowerCase();
        const filtered = customers.filter(c => 
            c.name.toLowerCase().includes(term) ||
            (c.phone && c.phone.includes(term)) ||
            (c.email && c.email.toLowerCase().includes(term))
        );
        
        renderFilteredCustomers(filtered);
    }
    
    // ================== عرض العملاء في الجدول (النسخة البسيطة) ==================
    function renderCustomers() {
        const tbody = document.getElementById('customers-tbody');
        if (!tbody) return;
        
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4">لا يوجد عملاء</td></tr>';
            return;
        }
        
        tbody.innerHTML = customers.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>${c.phone || '-'}</td>
                <td>${c.email || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="customerModule.editCustomer('${c.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="customerModule.deleteCustomer('${c.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== عرض العملاء في الجدول (النسخة الكاملة) ==================
    function renderCustomersFull() {
        const tbody = document.getElementById('customers-full-tbody');
        if (!tbody) return;
        
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا يوجد عملاء</td></tr>';
            return;
        }
        
        tbody.innerHTML = customers.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>${c.phone || '-'}</td>
                <td>${c.email || '-'}</td>
                <td>${utilsModule.formatCurrency(c.totalPurchases)}</td>
                <td>${utilsModule.formatCurrency(c.totalDebt)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="customerModule.showCustomerDetails('${c.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="customerModule.editCustomerFull('${c.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="customerModule.deleteCustomer('${c.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== عرض العملاء المصفاة ==================
    function renderFilteredCustomers(filtered) {
        const tbody = document.getElementById('customers-full-tbody');
        if (!tbody) return;
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>${c.phone || '-'}</td>
                <td>${c.email || '-'}</td>
                <td>${utilsModule.formatCurrency(c.totalPurchases)}</td>
                <td>${utilsModule.formatCurrency(c.totalDebt)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="customerModule.showCustomerDetails('${c.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="customerModule.editCustomerFull('${c.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="customerModule.deleteCustomer('${c.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== تحديث قائمة العملاء في القوائم المنسدلة ==================
    function updateCustomerSelect() {
        const selects = document.querySelectorAll('.customer-select, #sale-customer');
        
        selects.forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">اختر العميل</option>' + 
                    customers.map(c => `<option value="${c.id}">${c.name} ${c.phone ? '- ' + c.phone : ''}</option>`).join('');
            }
        });
    }
    
    // ================== تعديل عميل (بسيط) ==================
    function editCustomer(id) {
        const customer = getCustomer(id);
        if (!customer) return;
        
        Swal.fire({
            title: 'تعديل العميل',
            html: `
                <div style="text-align:right;">
                    <input type="text" id="edit-name" class="form-control mb-2" value="${customer.name}" placeholder="اسم العميل">
                    <input type="text" id="edit-phone" class="form-control mb-2" value="${customer.phone || ''}" placeholder="رقم الهاتف">
                    <input type="email" id="edit-email" class="form-control mb-2" value="${customer.email || ''}" placeholder="البريد الإلكتروني">
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
                    email: document.getElementById('edit-email').value.trim()
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                updateCustomer(id, result.value);
            }
        });
    }
    
    // ================== تعديل عميل (كامل) ==================
    function editCustomerFull(id) {
        const customer = getCustomer(id);
        if (!customer) return;
        
        // يمكن إضافة نافذة تعديل كاملة هنا
        editCustomer(id);
    }
    
    // ================== عرض تفاصيل العميل ==================
    function showCustomerDetails(id) {
        const customer = getCustomer(id);
        if (!customer) return;
        
        Swal.fire({
            title: 'تفاصيل العميل',
            html: `
                <div style="text-align:right; max-height:400px; overflow-y:auto;">
                    <p><strong>الاسم:</strong> ${customer.name}</p>
                    <p><strong>الهاتف:</strong> ${customer.phone || '-'}</p>
                    <p><strong>هاتف آخر:</strong> ${customer.secondaryPhone || '-'}</p>
                    <p><strong>البريد:</strong> ${customer.email || '-'}</p>
                    <p><strong>العنوان:</strong> ${customer.address || '-'}</p>
                    <p><strong>الرقم الضريبي:</strong> ${customer.taxNumber || '-'}</p>
                    <p><strong>السجل التجاري:</strong> ${customer.commercialRegister || '-'}</p>
                    <hr>
                    <p><strong>إجمالي المشتريات:</strong> ${utilsModule.formatCurrency(customer.totalPurchases)}</p>
                    <p><strong>إجمالي المدفوع:</strong> ${utilsModule.formatCurrency(customer.totalPaid)}</p>
                    <p><strong>المديونية:</strong> ${utilsModule.formatCurrency(customer.totalDebt)}</p>
                    <p><strong>الحد الأقصى للمديونية:</strong> ${utilsModule.formatCurrency(customer.maxDebt)}</p>
                    <p><strong>نسبة الخصم:</strong> ${customer.discount}%</p>
                    <hr>
                    <p><strong>تاريخ التسجيل:</strong> ${utilsModule.formatDate(customer.createdAt)}</p>
                    <p><strong>آخر شراء:</strong> ${customer.lastPurchaseDate ? utilsModule.formatDate(customer.lastPurchaseDate) : 'لا يوجد'}</p>
                    <p><strong>ملاحظات:</strong> ${customer.notes || '-'}</p>
                </div>
            `,
            confirmButtonText: 'إغلاق',
            width: '600px'
        });
    }
    
    // ================== تحديث إحصائيات العميل بعد فاتورة ==================
    function updateCustomerStats(id, invoiceTotal) {
        const customer = getCustomer(id);
        if (!customer) return;
        
        customer.totalPurchases += invoiceTotal;
        customer.lastPurchaseDate = new Date().toISOString();
        
        // إذا كانت الفاتورة آجلة، أضفها للديون
        // هذا يتم التعامل معه في debt.js
        
        saveCustomers();
    }
    
    // ================== إضافة دين للعميل ==================
    function addDebt(id, amount) {
        const customer = getCustomer(id);
        if (!customer) return false;
        
        customer.totalDebt += amount;
        
        // التحقق من تجاوز الحد الأقصى
        if (customer.maxDebt > 0 && customer.totalDebt > customer.maxDebt) {
            utilsModule.showNotification('تحذير', 'تجاوز الحد الأقصى للمديونية', 'warning');
        }
        
        saveCustomers();
        return true;
    }
    
    // ================== سداد دين ==================
    function payDebt(id, amount) {
        const customer = getCustomer(id);
        if (!customer) return false;
        
        if (amount > customer.totalDebt) {
            utilsModule.showNotification('خطأ', 'المبلغ أكبر من المديونية', 'error');
            return false;
        }
        
        customer.totalDebt -= amount;
        customer.totalPaid += amount;
        
        saveCustomers();
        utilsModule.showNotification('نجاح', 'تم تسجيل الدفعة');
        return true;
    }
    
    // ================== الحصول على إحصائيات العملاء ==================
    function getCustomerStats() {
        return {
            totalCustomers: customers.length,
            totalPurchases: customers.reduce((sum, c) => sum + c.totalPurchases, 0),
            totalDebt: customers.reduce((sum, c) => sum + c.totalDebt, 0),
            customersWithDebt: customers.filter(c => c.totalDebt > 0).length,
            averagePurchase: customers.length > 0 
                ? customers.reduce((sum, c) => sum + c.totalPurchases, 0) / customers.length 
                : 0
        };
    }
    
    // ================== تصدير العملاء إلى CSV ==================
    function exportToCSV() {
        const headers = ['الاسم', 'الهاتف', 'هاتف آخر', 'البريد', 'العنوان', 'المشتريات', 'المدفوع', 'المديونية'];
        const data = customers.map(c => ({
            name: c.name,
            phone: c.phone,
            secondaryPhone: c.secondaryPhone,
            email: c.email,
            address: c.address,
            totalPurchases: c.totalPurchases,
            totalPaid: c.totalPaid,
            totalDebt: c.totalDebt
        }));
        
        utilsModule.exportToCSV(data, 'customers', headers);
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ customerModule initialized - الرقم 20');
        console.log(`   عدد العملاء: ${customers.length}`);
        console.log(`   إجمالي المديونية: ${utilsModule.formatCurrency(customers.reduce((sum, c) => sum + c.totalDebt, 0))}`);
        
        // عرض العملاء إذا كانت الجداول موجودة
        if (document.getElementById('customers-tbody')) {
            renderCustomers();
        }
        
        if (document.getElementById('customers-full-tbody')) {
            renderCustomersFull();
        }
        
        updateCustomerSelect();
    }
    
    // ================== واجهة الوحدة ==================
    return {
        // البيانات
        customers,
        
        // إضافة
        addCustomer,
        addNewCustomer,
        
        // استعلام
        getAllCustomers,
        getCustomer,
        getCustomerByName,
        
        // تحديث
        updateCustomer,
        deleteCustomer,
        
        // بحث
        searchCustomers,
        
        // عرض
        renderCustomers,
        renderCustomersFull,
        showCustomerDetails,
        
        // قوائم
        updateCustomerSelect,
        
        // تعديل
        editCustomer,
        editCustomerFull,
        
        // إحصائيات
        updateCustomerStats,
        addDebt,
        payDebt,
        getCustomerStats,
        
        // تصدير
        exportToCSV,
        
        // تهيئة
        init
    };
})();

// ================== تصدير للاستخدام العام ==================
window.customerModule = customerModule;

// ================== دوال مختصرة للاستخدام في HTML ==================
window.addCustomer = () => customerModule.addCustomer();
window.saveNewCustomer = () => customerModule.addNewCustomer();
window.deleteCustomer = (id) => customerModule.deleteCustomer(id);
window.showCustomerDetails = (id) => customerModule.showCustomerDetails(id);

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (customerModule && customerModule.init) {
            customerModule.init();
        }
    });
    
    document.addEventListener('html-loaded', function() {
        if (customerModule && customerModule.init) {
            customerModule.init();
        }
    });
}
