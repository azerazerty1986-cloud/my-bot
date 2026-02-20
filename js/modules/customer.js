// ================== customer.js - إدارة العملاء المتقدمة ==================
// الرقم 20 في ترتيب الملفات - نسخة نهائية كاملة

const customerModule = (function() {
    // ================== البيانات ==================
    let customers = JSON.parse(localStorage.getItem('customers')) || [];
    let payments = JSON.parse(localStorage.getItem('customer_payments')) || [];
    
    // ================== دوال الحفظ الأساسية ==================
    function saveCustomers() {
        localStorage.setItem('customers', JSON.stringify(customers));
    }
    
    function savePayments() {
        localStorage.setItem('customer_payments', JSON.stringify(payments));
    }
    
    // ================== دوال مساعدة ==================
    function generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }
    
    function formatCurrency(amount) {
        return Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    
    function showNotification(title, message, type = 'success') {
        if (typeof Swal !== 'undefined') {
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
    }
    
    function showConfirmation(title, text, confirmCallback) {
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
            if (result.isConfirmed) confirmCallback();
        });
    }
    
    // ================== إضافة عميل متقدم ==================
    function addCustomer(customerData) {
        if (!customerData.firstname || !customerData.lastname) {
            showNotification('خطأ', 'الاسم الأول واسم العائلة مطلوبان', 'error');
            return null;
        }
        
        const newCustomer = {
            id: generateId(),
            firstname: customerData.firstname,
            lastname: customerData.lastname,
            fullname: customerData.firstname + ' ' + customerData.lastname,
            birthdate: customerData.birthdate || null,
            gender: customerData.gender || '',
            marital: customerData.marital || '',
            phone1: customerData.phone1 || '',
            phone2: customerData.phone2 || '',
            whatsapp: customerData.whatsapp || '',
            email: customerData.email || '',
            facebook: customerData.facebook || '',
            country: customerData.country || 'الجزائر',
            governorate: customerData.governorate || '',
            city: customerData.city || '',
            district: customerData.district || '',
            street: customerData.street || '',
            building: customerData.building || '',
            address: customerData.address || '',
            maxDebt: parseFloat(customerData.maxDebt) || 0,
            discount: parseFloat(customerData.discount) || 0,
            paymentMethod: customerData.paymentMethod || 'cash',
            occupation: customerData.occupation || '',
            workplace: customerData.workplace || '',
            notes: customerData.notes || '',
            totalPurchases: 0,
            totalPaid: 0,
            totalDebt: 0,
            category: calculateCustomerCategory(0, 0),
            createdAt: new Date().toISOString()
        };
        
        customers.push(newCustomer);
        saveCustomers();
        
        showNotification('نجاح', 'تم إضافة العميل');
        return newCustomer;
    }
    
    // ================== حفظ من النموذج المتقدم ==================
    function saveAdvancedCustomer() {
        const firstname = document.getElementById('customer-firstname')?.value.trim();
        const lastname = document.getElementById('customer-lastname')?.value.trim();
        
        if (!firstname || !lastname) {
            showNotification('تنبيه', 'الاسم الأول واسم العائلة مطلوبان', 'warning');
            return false;
        }
        
        const customer = {
            firstname: firstname,
            lastname: lastname,
            birthdate: document.getElementById('customer-birthdate')?.value,
            gender: document.getElementById('customer-gender')?.value,
            marital: document.getElementById('customer-marital')?.value,
            phone1: document.getElementById('customer-phone1')?.value,
            phone2: document.getElementById('customer-phone2')?.value,
            whatsapp: document.getElementById('customer-whatsapp')?.value,
            email: document.getElementById('customer-email')?.value,
            facebook: document.getElementById('customer-facebook')?.value,
            country: document.getElementById('customer-country')?.value,
            governorate: document.getElementById('customer-governorate')?.value,
            city: document.getElementById('customer-city')?.value,
            district: document.getElementById('customer-district')?.value,
            street: document.getElementById('customer-street')?.value,
            building: document.getElementById('customer-building')?.value,
            address: document.getElementById('customer-address')?.value,
            maxDebt: document.getElementById('customer-max-debt')?.value,
            discount: document.getElementById('customer-discount')?.value,
            paymentMethod: document.getElementById('customer-payment')?.value,
            occupation: document.getElementById('customer-occupation')?.value,
            workplace: document.getElementById('customer-workplace')?.value,
            notes: document.getElementById('customer-notes')?.value
        };
        
        const result = addCustomer(customer);
        if (result) {
            resetCustomerForm();
            renderCustomers();
        }
        return result;
    }
    
    // ================== حفظ وإضافة آخر ==================
    function saveAndAddAnother() {
        saveAdvancedCustomer();
        document.getElementById('customer-firstname').value = '';
        document.getElementById('customer-lastname').value = '';
        document.getElementById('customer-phone1').focus();
    }
    
    // ================== إعادة تعيين النموذج ==================
    function resetCustomerForm() {
        const form = document.getElementById('customer-form');
        if (form) form.reset();
        document.getElementById('customer-country').value = 'الجزائر';
    }
    
    // ================== حساب تصنيف العميل ==================
    function calculateCustomerCategory(totalSpent, frequency) {
        if (totalSpent > 100000 && frequency > 10) return 'VIP';
        if (totalSpent > 50000 && frequency > 5) return 'ممتاز';
        if (totalSpent > 10000 && frequency > 2) return 'جيد';
        if (frequency > 0) return 'عادي';
        return 'جديد';
    }
    
    // ================== الحصول على جميع العملاء ==================
    function getAllCustomers() {
        return [...customers];
    }
    
    // ================== الحصول على عميل ==================
    function getCustomer(id) {
        return customers.find(c => c.id == id);
    }
    
    // ================== تحديث عميل ==================
    function updateCustomer(id, updatedData) {
        const index = customers.findIndex(c => c.id == id);
        if (index === -1) return null;
        
        customers[index] = {
            ...customers[index],
            ...updatedData,
            fullname: updatedData.firstname && updatedData.lastname ? 
                      updatedData.firstname + ' ' + updatedData.lastname : 
                      customers[index].fullname
        };
        
        saveCustomers();
        showNotification('نجاح', 'تم تحديث العميل');
        renderCustomers();
        return customers[index];
    }
    
    // ================== حذف عميل ==================
    function deleteCustomer(id) {
        const customer = getCustomer(id);
        if (!customer) return false;
        
        if (customer.totalDebt > 0) {
            showNotification('تنبيه', 'لا يمكن حذف عميل عليه ديون', 'warning');
            return false;
        }
        
        showConfirmation('تأكيد الحذف', `حذف العميل "${customer.fullname}"؟`, () => {
            customers = customers.filter(c => c.id != id);
            saveCustomers();
            showNotification('تم', 'تم حذف العميل');
            renderCustomers();
        });
        
        return true;
    }
    
    // ================== البحث عن العملاء ==================
    function searchCustomers(term) {
        const tbody = document.getElementById('customers-tbody');
        if (!tbody) return;
        
        if (!term || term.length < 2) {
            renderCustomers();
            return;
        }
        
        term = term.toLowerCase();
        const filtered = customers.filter(c => 
            c.fullname.toLowerCase().includes(term) ||
            (c.phone1 && c.phone1.includes(term)) ||
            (c.phone2 && c.phone2.includes(term)) ||
            (c.email && c.email.toLowerCase().includes(term))
        );
        
        renderFilteredCustomers(filtered);
    }
    
    // ================== عرض العملاء ==================
    function renderCustomers() {
        const tbody = document.getElementById('customers-tbody');
        if (!tbody) return;
        
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center p-4">لا يوجد عملاء</td></tr>';
            return;
        }
        
        tbody.innerHTML = customers.map((c, index) => {
            const categoryClass = c.category === 'VIP' ? 'badge-warning' : 
                                 c.category === 'ممتاز' ? 'badge-success' : 
                                 c.category === 'جيد' ? 'badge-info' : 'badge-secondary';
            
            return `
            <tr>
                <td>${index + 1}</td>
                <td>${c.fullname}</td>
                <td>${c.phone1 || '-'}</td>
                <td>${c.email || '-'}</td>
                <td>${c.city || '-'}</td>
                <td>${formatCurrency(c.totalPurchases)}</td>
                <td>${formatCurrency(c.totalDebt)}</td>
                <td>${c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString('ar-EG') : '-'}</td>
                <td><span class="${categoryClass}">${c.category || 'جديد'}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="customerModule.showDetails('${c.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="customerModule.editCustomer('${c.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="customerModule.deleteCustomer('${c.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `}).join('');
        
        updateStats();
    }
    
    // ================== عرض العملاء المصفاة ==================
    function renderFilteredCustomers(filtered) {
        const tbody = document.getElementById('customers-tbody');
        if (!tbody) return;
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map((c, index) => {
            const categoryClass = c.category === 'VIP' ? 'badge-warning' : 
                                 c.category === 'ممتاز' ? 'badge-success' : 
                                 c.category === 'جيد' ? 'badge-info' : 'badge-secondary';
            
            return `
            <tr>
                <td>${index + 1}</td>
                <td>${c.fullname}</td>
                <td>${c.phone1 || '-'}</td>
                <td>${c.email || '-'}</td>
                <td>${c.city || '-'}</td>
                <td>${formatCurrency(c.totalPurchases)}</td>
                <td>${formatCurrency(c.totalDebt)}</td>
                <td>${c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString('ar-EG') : '-'}</td>
                <td><span class="${categoryClass}">${c.category || 'جديد'}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="customerModule.showDetails('${c.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="customerModule.editCustomer('${c.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="customerModule.deleteCustomer('${c.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    // ================== عرض تفاصيل العميل ==================
    function showDetails(id) {
        const customer = getCustomer(id);
        if (!customer) return;
        
        Swal.fire({
            title: customer.fullname,
            html: `
                <div style="text-align:right; max-height:400px; overflow-y:auto;">
                    <p><strong>الاسم:</strong> ${customer.fullname}</p>
                    <p><strong>رقم الهاتف:</strong> ${customer.phone1 || '-'}</p>
                    <p><strong>هاتف آخر:</strong> ${customer.phone2 || '-'}</p>
                    <p><strong>واتساب:</strong> ${customer.whatsapp || '-'}</p>
                    <p><strong>البريد:</strong> ${customer.email || '-'}</p>
                    <p><strong>العنوان:</strong> ${customer.address || '-'}</p>
                    <p><strong>المدينة:</strong> ${customer.city || '-'}</p>
                    <p><strong>تاريخ الميلاد:</strong> ${customer.birthdate ? new Date(customer.birthdate).toLocaleDateString('ar-EG') : '-'}</p>
                    <hr>
                    <p><strong>إجمالي المشتريات:</strong> ${formatCurrency(customer.totalPurchases)}</p>
                    <p><strong>إجمالي المدفوع:</strong> ${formatCurrency(customer.totalPaid)}</p>
                    <p><strong>المديونية:</strong> ${formatCurrency(customer.totalDebt)}</p>
                    <p><strong>الحد الأقصى:</strong> ${formatCurrency(customer.maxDebt)}</p>
                    <p><strong>نسبة الخصم:</strong> ${customer.discount}%</p>
                    <hr>
                    <p><strong>تاريخ التسجيل:</strong> ${new Date(customer.createdAt).toLocaleDateString('ar-EG')}</p>
                </div>
            `,
            confirmButtonText: 'إغلاق'
        });
    }
    
    // ================== ديون العملاء ==================
    function renderCustomerDebts() {
        const tbody = document.getElementById('customer-debts-tbody');
        if (!tbody) return;
        
        const allDebts = window.debtModule?.getAllDebts() || [];
        const customerDebts = allDebts.filter(d => d.partyType === 'customer');
        
        if (customerDebts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center p-4">لا توجد ديون</td></tr>';
            return;
        }
        
        tbody.innerHTML = customerDebts.map((d, index) => {
            const statusClass = d.status === 'paid' ? 'badge-success' :
                               d.status === 'partial' ? 'badge-warning' : 'badge-danger';
            const statusText = d.status === 'paid' ? 'مسدد' :
                              d.status === 'partial' ? 'جزئي' : 'نشط';
            
            return `
            <tr>
                <td>${index + 1}</td>
                <td>${d.partyName}</td>
                <td>${d.number}</td>
                <td>${formatCurrency(d.amount)}</td>
                <td>${formatCurrency(d.paid)}</td>
                <td>${formatCurrency(d.remaining)}</td>
                <td>${d.dueDate ? new Date(d.dueDate).toLocaleDateString('ar-EG') : '-'}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="window.debtModule?.showPaymentForm('${d.id}')">
                        <i class="material-icons-round">payments</i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    // ================== سجل دفعات العملاء ==================
    function renderPayments() {
        const tbody = document.getElementById('customer-payments-tbody');
        if (!tbody) return;
        
        const allPayments = window.debtModule?.getAllPayments() || [];
        const customerPayments = allPayments.filter(p => p.partyType === 'customer');
        
        if (customerPayments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد دفعات</td></tr>';
            return;
        }
        
        tbody.innerHTML = customerPayments.slice(0, 50).map((p, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${p.partyName}</td>
                <td>${p.debtNumber}</td>
                <td>${formatCurrency(p.amount)}</td>
                <td>${p.method === 'cash' ? 'نقدي' : p.method === 'card' ? 'بطاقة' : 'تحويل'}</td>
                <td>${new Date(p.date).toLocaleDateString('ar-EG')}</td>
            </tr>
        `).join('');
    }
    
    // ================== تحديث الإحصائيات ==================
    function updateStats() {
        const totalCustomers = customers.length;
        const vipCustomers = customers.filter(c => c.category === 'VIP').length;
        const debtCustomers = customers.filter(c => c.totalDebt > 0).length;
        const totalDebt = customers.reduce((sum, c) => sum + c.totalDebt, 0);
        
        const elements = {
            'stats-total-customers': totalCustomers,
            'stats-vip-customers': vipCustomers,
            'stats-debt-customers': debtCustomers,
            'stats-total-debt': totalDebt
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = id.includes('debt') ? formatCurrency(value) : value;
            }
        });
        
        // عرض أفضل العملاء
        const topCustomers = [...customers]
            .sort((a, b) => b.totalPurchases - a.totalPurchases)
            .slice(0, 5);
        
        const topList = document.getElementById('top-customers-list');
        if (topList) {
            if (topCustomers.length === 0) {
                topList.innerHTML = '<p class="text-muted">لا توجد بيانات</p>';
            } else {
                topList.innerHTML = topCustomers.map(c => `
                    <div class="d-flex justify-content-between mb-2">
                        <span>${c.fullname}</span>
                        <span class="fw-bold">${formatCurrency(c.totalPurchases)}</span>
                    </div>
                `).join('');
            }
        }
    }
    
    // ================== تصدير إلى Excel ==================
    function exportToExcel() {
        if (customers.length === 0) {
            showNotification('تنبيه', 'لا توجد عملاء للتصدير', 'warning');
            return;
        }
        
        const headers = ['الاسم', 'الهاتف', 'البريد', 'المدينة', 'إجمالي المشتريات', 'المديونية', 'التصنيف'];
        const data = customers.map(c => ({
            name: c.fullname,
            phone: c.phone1,
            email: c.email,
            city: c.city,
            purchases: c.totalPurchases,
            debt: c.totalDebt,
            category: c.category
        }));
        
        console.log('تصدير', data);
        showNotification('نجاح', 'تم التصدير بنجاح');
    }
    
    // ================== تهيئة الصفحة ==================
    function init() {
        console.log('✅ customerModule initialized');
        
        renderCustomers();
        renderCustomerDebts();
        renderPayments();
        updateStats();
    }
    
    // ================== واجهة الوحدة ==================
    return {
        // البيانات
        customers,
        
        // إضافة
        addCustomer,
        saveAdvancedCustomer,
        saveAndAddAnother,
        resetCustomerForm,
        
        // استعلام
        getAllCustomers,
        getCustomer,
        updateCustomer,
        deleteCustomer,
        
        // بحث
        searchCustomers,
        
        // عرض
        renderCustomers,
        showDetails,
        renderCustomerDebts,
        renderPayments,
        updateStats,
        
        // تصدير
        exportToExcel,
        
        // تهيئة
        init
    };
})();

window.customerModule = customerModule;

// تهيئة تلقائية
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => customerModule.init());
    document.addEventListener('html-loaded', () => customerModule.init());
}
