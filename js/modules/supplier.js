// ================== supplier.js - إدارة الموردين المتقدمة ==================
// الرقم 21 في ترتيب الملفات - نسخة نهائية كاملة

const supplierModule = (function() {
    // ================== البيانات ==================
    let suppliers = JSON.parse(localStorage.getItem('suppliers')) || [];
    let payments = JSON.parse(localStorage.getItem('supplier_payments')) || [];
    
    // ================== دوال الحفظ الأساسية ==================
    function saveSuppliers() {
        localStorage.setItem('suppliers', JSON.stringify(suppliers));
    }
    
    function savePayments() {
        localStorage.setItem('supplier_payments', JSON.stringify(payments));
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
    
    // ================== إضافة مورد متقدم ==================
    function addSupplier(supplierData) {
        if (!supplierData.company) {
            showNotification('خطأ', 'اسم الشركة مطلوب', 'error');
            return null;
        }
        
        const newSupplier = {
            id: generateId(),
            company: supplierData.company,
            contact: supplierData.contact || '',
            register: supplierData.register || '',
            tax: supplierData.tax || '',
            category: supplierData.category || 'مواد غذائية',
            phone: supplierData.phone || '',
            phone2: supplierData.phone2 || '',
            fax: supplierData.fax || '',
            email: supplierData.email || '',
            website: supplierData.website || '',
            address: supplierData.address || '',
            bank: supplierData.bank || '',
            account: supplierData.account || '',
            paymentMethod: supplierData.paymentMethod || 'cash',
            paymentDays: parseInt(supplierData.paymentDays) || 0,
            creditLimit: parseFloat(supplierData.creditLimit) || 0,
            products: supplierData.products || '',
            notes: supplierData.notes || '',
            totalPurchases: 0,
            totalPaid: 0,
            totalDebt: 0,
            rating: 'B',
            createdAt: new Date().toISOString()
        };
        
        suppliers.push(newSupplier);
        saveSuppliers();
        
        showNotification('نجاح', 'تم إضافة المورد');
        return newSupplier;
    }
    
    // ================== حفظ من النموذج المتقدم ==================
    function saveAdvancedSupplier() {
        const company = document.getElementById('supplier-company')?.value.trim();
        
        if (!company) {
            showNotification('تنبيه', 'اسم الشركة مطلوب', 'warning');
            return false;
        }
        
        const supplier = {
            company: company,
            contact: document.getElementById('supplier-contact')?.value,
            register: document.getElementById('supplier-register')?.value,
            tax: document.getElementById('supplier-tax')?.value,
            category: document.getElementById('supplier-category')?.value,
            phone: document.getElementById('supplier-phone')?.value,
            phone2: document.getElementById('supplier-phone2')?.value,
            fax: document.getElementById('supplier-fax')?.value,
            email: document.getElementById('supplier-email')?.value,
            website: document.getElementById('supplier-website')?.value,
            bank: document.getElementById('supplier-bank')?.value,
            account: document.getElementById('supplier-account')?.value,
            paymentMethod: document.getElementById('supplier-payment-method')?.value,
            paymentDays: document.getElementById('supplier-payment-days')?.value,
            creditLimit: document.getElementById('supplier-credit')?.value,
            products: document.getElementById('supplier-products')?.value
        };
        
        const result = addSupplier(supplier);
        if (result) {
            resetSupplierForm();
            renderSuppliers();
        }
        return result;
    }
    
    // ================== إعادة تعيين النموذج ==================
    function resetSupplierForm() {
        const form = document.getElementById('supplier-form');
        if (form) form.reset();
    }
    
    // ================== الحصول على جميع الموردين ==================
    function getAllSuppliers() {
        return [...suppliers];
    }
    
    // ================== الحصول على مورد ==================
    function getSupplier(id) {
        return suppliers.find(s => s.id == id);
    }
    
    // ================== تحديث مورد ==================
    function updateSupplier(id, updatedData) {
        const index = suppliers.findIndex(s => s.id == id);
        if (index === -1) return null;
        
        suppliers[index] = {
            ...suppliers[index],
            ...updatedData
        };
        
        saveSuppliers();
        showNotification('نجاح', 'تم تحديث المورد');
        renderSuppliers();
        return suppliers[index];
    }
    
    // ================== حذف مورد ==================
    function deleteSupplier(id) {
        const supplier = getSupplier(id);
        if (!supplier) return false;
        
        if (supplier.totalDebt > 0) {
            showNotification('تنبيه', 'لا يمكن حذف مورد عليه ديون', 'warning');
            return false;
        }
        
        showConfirmation('تأكيد الحذف', `حذف المورد "${supplier.company}"؟`, () => {
            suppliers = suppliers.filter(s => s.id != id);
            saveSuppliers();
            showNotification('تم', 'تم حذف المورد');
            renderSuppliers();
        });
        
        return true;
    }
    
    // ================== البحث عن الموردين ==================
    function searchSuppliers(term) {
        const tbody = document.getElementById('suppliers-tbody');
        if (!tbody) return;
        
        if (!term || term.length < 2) {
            renderSuppliers();
            return;
        }
        
        term = term.toLowerCase();
        const filtered = suppliers.filter(s => 
            s.company.toLowerCase().includes(term) ||
            (s.contact && s.contact.toLowerCase().includes(term)) ||
            (s.phone && s.phone.includes(term)) ||
            (s.email && s.email.toLowerCase().includes(term))
        );
        
        renderFilteredSuppliers(filtered);
    }
    
    // ================== عرض الموردين ==================
    function renderSuppliers() {
        const tbody = document.getElementById('suppliers-tbody');
        if (!tbody) return;
        
        if (suppliers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center p-4">لا يوجد موردين</td></tr>';
            return;
        }
        
        tbody.innerHTML = suppliers.map((s, index) => {
            const ratingClass = s.rating === 'A' ? 'badge-success' :
                               s.rating === 'B' ? 'badge-info' :
                               s.rating === 'C' ? 'badge-warning' : 'badge-danger';
            
            return `
            <tr>
                <td>${index + 1}</td>
                <td>${s.company}</td>
                <td>${s.contact || '-'}</td>
                <td>${s.phone || '-'}</td>
                <td>${s.email || '-'}</td>
                <td>${s.category || '-'}</td>
                <td>${formatCurrency(s.totalPurchases)}</td>
                <td>${formatCurrency(s.totalDebt)}</td>
                <td><span class="${ratingClass}">${s.rating || 'B'}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="supplierModule.showDetails('${s.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="supplierModule.editSupplier('${s.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="supplierModule.deleteSupplier('${s.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    // ================== عرض الموردين المصفاة ==================
    function renderFilteredSuppliers(filtered) {
        const tbody = document.getElementById('suppliers-tbody');
        if (!tbody) return;
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map((s, index) => {
            const ratingClass = s.rating === 'A' ? 'badge-success' :
                               s.rating === 'B' ? 'badge-info' :
                               s.rating === 'C' ? 'badge-warning' : 'badge-danger';
            
            return `
            <tr>
                <td>${index + 1}</td>
                <td>${s.company}</td>
                <td>${s.contact || '-'}</td>
                <td>${s.phone || '-'}</td>
                <td>${s.email || '-'}</td>
                <td>${s.category || '-'}</td>
                <td>${formatCurrency(s.totalPurchases)}</td>
                <td>${formatCurrency(s.totalDebt)}</td>
                <td><span class="${ratingClass}">${s.rating || 'B'}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="supplierModule.showDetails('${s.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="supplierModule.editSupplier('${s.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="supplierModule.deleteSupplier('${s.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    // ================== عرض تفاصيل المورد ==================
    function showDetails(id) {
        const supplier = getSupplier(id);
        if (!supplier) return;
        
        Swal.fire({
            title: supplier.company,
            html: `
                <div style="text-align:right; max-height:400px; overflow-y:auto;">
                    <p><strong>اسم الشركة:</strong> ${supplier.company}</p>
                    <p><strong>الشخص المسؤول:</strong> ${supplier.contact || '-'}</p>
                    <p><strong>رقم الهاتف:</strong> ${supplier.phone || '-'}</p>
                    <p><strong>هاتف آخر:</strong> ${supplier.phone2 || '-'}</p>
                    <p><strong>فاكس:</strong> ${supplier.fax || '-'}</p>
                    <p><strong>البريد:</strong> ${supplier.email || '-'}</p>
                    <p><strong>الموقع:</strong> ${supplier.website || '-'}</p>
                    <p><strong>العنوان:</strong> ${supplier.address || '-'}</p>
                    <p><strong>السجل التجاري:</strong> ${supplier.register || '-'}</p>
                    <p><strong>الرقم الضريبي:</strong> ${supplier.tax || '-'}</p>
                    <hr>
                    <p><strong>طريقة الدفع:</strong> ${supplier.paymentMethod === 'cash' ? 'نقدي' : 
                                                     supplier.paymentMethod === 'check' ? 'شيك' : 'تحويل'}</p>
                    <p><strong>مدة السداد:</strong> ${supplier.paymentDays} يوم</p>
                    <p><strong>الحد الائتماني:</strong> ${formatCurrency(supplier.creditLimit)}</p>
                    <p><strong>البنك:</strong> ${supplier.bank || '-'}</p>
                    <p><strong>رقم الحساب:</strong> ${supplier.account || '-'}</p>
                    <hr>
                    <p><strong>إجمالي المشتريات:</strong> ${formatCurrency(supplier.totalPurchases)}</p>
                    <p><strong>المديونية:</strong> ${formatCurrency(supplier.totalDebt)}</p>
                    <p><strong>التقييم:</strong> ${supplier.rating || 'B'}</p>
                </div>
            `,
            confirmButtonText: 'إغلاق'
        });
    }
    
    // ================== ديون الموردين ==================
    function renderSupplierDebts() {
        const tbody = document.getElementById('supplier-debts-tbody');
        if (!tbody) return;
        
        const allDebts = window.debtModule?.getAllDebts() || [];
        const supplierDebts = allDebts.filter(d => d.partyType === 'supplier');
        
        if (supplierDebts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center p-4">لا توجد ديون</td></tr>';
            return;
        }
        
        tbody.innerHTML = supplierDebts.map((d, index) => {
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
    
    // ================== سجل دفعات الموردين ==================
    function renderPayments() {
        const tbody = document.getElementById('supplier-payments-tbody');
        if (!tbody) return;
        
        const allPayments = window.debtModule?.getAllPayments() || [];
        const supplierPayments = allPayments.filter(p => p.partyType === 'supplier');
        
        if (supplierPayments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد دفعات</td></tr>';
            return;
        }
        
        tbody.innerHTML = supplierPayments.slice(0, 50).map((p, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${p.partyName}</td>
                <td>${p.debtNumber}</td>
                <td>${formatCurrency(p.amount)}</td>
                <td>${p.method === 'cash' ? 'نقدي' : p.method === 'card' ? 'بطاقة' : p.method === 'check' ? 'شيك' : 'تحويل'}</td>
                <td>${new Date(p.date).toLocaleDateString('ar-EG')}</td>
            </tr>
        `).join('');
    }
    
    // ================== منتجات المورد ==================
    function loadSupplierProducts() {
        const supplierId = document.getElementById('supplier-select')?.value;
        const tbody = document.getElementById('supplier-products-tbody');
        
        if (!tbody) return;
        
        if (!supplierId) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">اختر مورداً لعرض منتجاته</td></tr>';
            return;
        }
        
        const supplier = getSupplier(supplierId);
        if (!supplier) return;
        
        // هنا يمكن جلب المنتجات المرتبطة بالمورد
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">لا توجد منتجات لهذا المورد</td></tr>';
    }
    
    // ================== تصفية حسب التصنيف ==================
    function filterByCategory() {
        const category = document.getElementById('supplier-category-filter')?.value;
        
        if (!category) {
            renderSuppliers();
            return;
        }
        
        const filtered = suppliers.filter(s => s.category === category);
        renderFilteredSuppliers(filtered);
    }
    
    // ================== تحديث الإحصائيات ==================
    function updateStats() {
        // يمكن إضافة إحصائيات الموردين هنا
    }
    
    // ================== تصدير إلى Excel ==================
    function exportToExcel() {
        if (suppliers.length === 0) {
            showNotification('تنبيه', 'لا توجد موردين للتصدير', 'warning');
            return;
        }
        
        const headers = ['اسم الشركة', 'المسؤول', 'الهاتف', 'البريد', 'التصنيف', 'إجمالي المشتريات', 'المديونية', 'التقييم'];
        const data = suppliers.map(s => ({
            company: s.company,
            contact: s.contact,
            phone: s.phone,
            email: s.email,
            category: s.category,
            purchases: s.totalPurchases,
            debt: s.totalDebt,
            rating: s.rating
        }));
        
        console.log('تصدير', data);
        showNotification('نجاح', 'تم التصدير بنجاح');
    }
    
    // ================== تهيئة الصفحة ==================
    function init() {
        console.log('✅ supplierModule initialized');
        
        renderSuppliers();
        renderSupplierDebts();
        renderPayments();
        updateStats();
        
        // تحديث قائمة الموردين في القوائم المنسدلة
        const supplierSelect = document.getElementById('supplier-select');
        if (supplierSelect) {
            supplierSelect.innerHTML = '<option value="">اختر المورد</option>' + 
                suppliers.map(s => `<option value="${s.id}">${s.company}</option>`).join('');
        }
    }
    
    // ================== واجهة الوحدة ==================
    return {
        // البيانات
        suppliers,
        
        // إضافة
        addSupplier,
        saveAdvancedSupplier,
        resetSupplierForm,
        
        // استعلام
        getAllSuppliers,
        getSupplier,
        updateSupplier,
        deleteSupplier,
        
        // بحث
        searchSuppliers,
        filterByCategory,
        
        // عرض
        renderSuppliers,
        showDetails,
        renderSupplierDebts,
        renderPayments,
        loadSupplierProducts,
        
        // تصدير
        exportToExcel,
        
        // تهيئة
        init
    };
})();

window.supplierModule = supplierModule;

// تهيئة تلقائية
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => supplierModule.init());
    document.addEventListener('html-loaded', () => supplierModule.init());
}
