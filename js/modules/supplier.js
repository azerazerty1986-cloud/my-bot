// ================== supplier.js - إدارة الموردين ==================
// الرقم 21 في ترتيب الملفات - يعتمد على utils.js

const supplierModule = (function() {
    // ================== البيانات ==================
    let suppliers = JSON.parse(localStorage.getItem('suppliers')) || [];
    
    // ================== تطبيع البيانات (للتأكد من هيكل موحد) ==================
    suppliers = suppliers.map(s => {
        if (typeof s === 'string') {
            return {
                id: utilsModule.generateId(),
                name: s,
                company: s,
                phone: '',
                secondaryPhone: '',
                email: '',
                website: '',
                address: '',
                taxNumber: '',
                commercialRegister: '',
                contactPerson: '',
                contactPosition: '',
                contactPhone: '',
                contactEmail: '',
                paymentMethod: 'cash',
                paymentDays: 0,
                creditLimit: 0,
                bankName: '',
                bankAccount: '',
                notes: '',
                totalPurchases: 0,
                totalPaid: 0,
                totalDebt: 0,
                lastPurchaseDate: null,
                createdAt: new Date().toISOString()
            };
        }
        return {
            id: s.id || utilsModule.generateId(),
            name: s.name || '',
            company: s.company || s.name || '',
            phone: s.phone || '',
            secondaryPhone: s.secondaryPhone || '',
            email: s.email || '',
            website: s.website || '',
            address: s.address || '',
            taxNumber: s.taxNumber || '',
            commercialRegister: s.commercialRegister || '',
            contactPerson: s.contactPerson || '',
            contactPosition: s.contactPosition || '',
            contactPhone: s.contactPhone || '',
            contactEmail: s.contactEmail || '',
            paymentMethod: s.paymentMethod || 'cash',
            paymentDays: s.paymentDays || 0,
            creditLimit: s.creditLimit || 0,
            bankName: s.bankName || '',
            bankAccount: s.bankAccount || '',
            notes: s.notes || '',
            totalPurchases: s.totalPurchases || 0,
            totalPaid: s.totalPaid || 0,
            totalDebt: s.totalDebt || 0,
            lastPurchaseDate: s.lastPurchaseDate || null,
            createdAt: s.createdAt || new Date().toISOString()
        };
    });
    
    // ================== حفظ الموردين ==================
    function saveSuppliers() {
        localStorage.setItem('suppliers', JSON.stringify(suppliers));
    }
    
    // ================== إضافة مورد جديد ==================
    function addSupplier(supplierData) {
        // التحقق من البيانات المطلوبة
        if (!supplierData.name) {
            utilsModule.showNotification('خطأ', 'اسم المورد مطلوب', 'error');
            return null;
        }
        
        // إنشاء كائن المورد الجديد
        const newSupplier = {
            id: utilsModule.generateId(),
            name: supplierData.name,
            company: supplierData.company || supplierData.name,
            phone: supplierData.phone || '',
            secondaryPhone: supplierData.secondaryPhone || '',
            email: supplierData.email || '',
            website: supplierData.website || '',
            address: supplierData.address || '',
            taxNumber: supplierData.taxNumber || '',
            commercialRegister: supplierData.commercialRegister || '',
            contactPerson: supplierData.contactPerson || '',
            contactPosition: supplierData.contactPosition || '',
            contactPhone: supplierData.contactPhone || '',
            contactEmail: supplierData.contactEmail || '',
            paymentMethod: supplierData.paymentMethod || 'cash',
            paymentDays: parseInt(supplierData.paymentDays) || 0,
            creditLimit: parseFloat(supplierData.creditLimit) || 0,
            bankName: supplierData.bankName || '',
            bankAccount: supplierData.bankAccount || '',
            notes: supplierData.notes || '',
            totalPurchases: 0,
            totalPaid: 0,
            totalDebt: 0,
            lastPurchaseDate: null,
            createdAt: new Date().toISOString()
        };
        
        suppliers.push(newSupplier);
        saveSuppliers();
        
        utilsModule.showNotification('نجاح', 'تم إضافة المورد');
        renderSuppliers();
        updateSupplierSelect();
        
        return newSupplier;
    }
    
    // ================== إضافة مورد من النموذج السريع ==================
    function addSupplier() {
        const nameInput = document.getElementById('new-supplier');
        const phoneInput = document.getElementById('new-supplier-phone');
        
        const name = nameInput?.value.trim();
        const phone = phoneInput?.value.trim() || '';
        
        if (!name) {
            utilsModule.showNotification('تنبيه', 'اسم المورد مطلوب', 'warning');
            return;
        }
        
        addSupplier({ name, phone });
        
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';
    }
    
    // ================== إضافة مورد من النموذج الكامل ==================
    function addNewSupplier() {
        const name = document.getElementById('new-supplier-name')?.value.trim();
        const company = document.getElementById('new-supplier-company')?.value.trim() || name;
        const phone = document.getElementById('new-supplier-phone')?.value.trim() || '';
        const secondaryPhone = document.getElementById('new-supplier-phone2')?.value.trim() || '';
        const email = document.getElementById('new-supplier-email')?.value.trim() || '';
        const website = document.getElementById('new-supplier-website')?.value.trim() || '';
        const address = document.getElementById('new-supplier-address')?.value.trim() || '';
        const taxNumber = document.getElementById('new-supplier-tax-number')?.value.trim() || '';
        const commercialReg = document.getElementById('new-supplier-commercial-reg')?.value.trim() || '';
        const contactPerson = document.getElementById('new-supplier-contact-name')?.value.trim() || '';
        const contactPosition = document.getElementById('new-supplier-contact-position')?.value.trim() || '';
        const contactPhone = document.getElementById('new-supplier-contact-phone')?.value.trim() || '';
        const contactEmail = document.getElementById('new-supplier-contact-email')?.value.trim() || '';
        const paymentMethod = document.getElementById('new-supplier-payment-method')?.value || 'cash';
        const paymentDays = document.getElementById('new-supplier-payment-days')?.value || 0;
        const creditLimit = document.getElementById('new-supplier-credit-limit')?.value || 0;
        const bankName = document.getElementById('new-supplier-bank-name')?.value.trim() || '';
        const bankAccount = document.getElementById('new-supplier-bank-account')?.value.trim() || '';
        const notes = document.getElementById('new-supplier-notes')?.value.trim() || '';
        
        if (!name) {
            utilsModule.showNotification('تنبيه', 'اسم المورد مطلوب', 'warning');
            return;
        }
        
        addSupplier({
            name,
            company,
            phone,
            secondaryPhone,
            email,
            website,
            address,
            taxNumber,
            commercialRegister: commercialReg,
            contactPerson,
            contactPosition,
            contactPhone,
            contactEmail,
            paymentMethod,
            paymentDays,
            creditLimit,
            bankName,
            bankAccount,
            notes
        });
        
        // مسح الحقول
        document.getElementById('new-supplier-name').value = '';
        if (document.getElementById('new-supplier-company')) document.getElementById('new-supplier-company').value = '';
        if (document.getElementById('new-supplier-phone')) document.getElementById('new-supplier-phone').value = '';
        if (document.getElementById('new-supplier-phone2')) document.getElementById('new-supplier-phone2').value = '';
        if (document.getElementById('new-supplier-email')) document.getElementById('new-supplier-email').value = '';
        if (document.getElementById('new-supplier-website')) document.getElementById('new-supplier-website').value = '';
        if (document.getElementById('new-supplier-address')) document.getElementById('new-supplier-address').value = '';
        if (document.getElementById('new-supplier-tax-number')) document.getElementById('new-supplier-tax-number').value = '';
        if (document.getElementById('new-supplier-commercial-reg')) document.getElementById('new-supplier-commercial-reg').value = '';
        if (document.getElementById('new-supplier-contact-name')) document.getElementById('new-supplier-contact-name').value = '';
        if (document.getElementById('new-supplier-contact-position')) document.getElementById('new-supplier-contact-position').value = '';
        if (document.getElementById('new-supplier-contact-phone')) document.getElementById('new-supplier-contact-phone').value = '';
        if (document.getElementById('new-supplier-contact-email')) document.getElementById('new-supplier-contact-email').value = '';
        if (document.getElementById('new-supplier-payment-days')) document.getElementById('new-supplier-payment-days').value = '0';
        if (document.getElementById('new-supplier-credit-limit')) document.getElementById('new-supplier-credit-limit').value = '0';
        if (document.getElementById('new-supplier-bank-name')) document.getElementById('new-supplier-bank-name').value = '';
        if (document.getElementById('new-supplier-bank-account')) document.getElementById('new-supplier-bank-account').value = '';
        if (document.getElementById('new-supplier-notes')) document.getElementById('new-supplier-notes').value = '';
    }
    
    // ================== الحصول على جميع الموردين ==================
    function getAllSuppliers() {
        return [...suppliers];
    }
    
    // ================== الحصول على مورد بواسطة ID ==================
    function getSupplier(id) {
        return suppliers.find(s => s.id == id);
    }
    
    // ================== الحصول على مورد بواسطة الاسم ==================
    function getSupplierByName(name) {
        return suppliers.find(s => s.name === name);
    }
    
    // ================== تحديث مورد ==================
    function updateSupplier(id, updatedData) {
        const index = suppliers.findIndex(s => s.id == id);
        if (index === -1) {
            utilsModule.showNotification('خطأ', 'المورد غير موجود', 'error');
            return null;
        }
        
        suppliers[index] = {
            ...suppliers[index],
            ...updatedData
        };
        
        saveSuppliers();
        utilsModule.showNotification('نجاح', 'تم تحديث المورد');
        renderSuppliers();
        updateSupplierSelect();
        
        return suppliers[index];
    }
    
    // ================== حذف مورد ==================
    function deleteSupplier(id) {
        const supplier = getSupplier(id);
        if (!supplier) return false;
        
        // التحقق من وجود ديون أو فواتير للمورد
        if (supplier.totalDebt > 0) {
            utilsModule.showNotification('تنبيه', 'لا يمكن حذف مورد عليه ديون', 'warning');
            return false;
        }
        
        utilsModule.showConfirmation(
            'تأكيد الحذف',
            `هل أنت متأكد من حذف المورد "${supplier.name}"؟`,
            () => {
                suppliers = suppliers.filter(s => s.id != id);
                saveSuppliers();
                utilsModule.showNotification('تم', 'تم حذف المورد');
                renderSuppliers();
                updateSupplierSelect();
            }
        );
        
        return true;
    }
    
    // ================== البحث عن الموردين ==================
    function searchSuppliers(term) {
        const tbody = document.getElementById('suppliers-full-tbody');
        if (!tbody) return;
        
        if (!term || term.length < 2) {
            renderSuppliersFull();
            return;
        }
        
        term = term.toLowerCase();
        const filtered = suppliers.filter(s => 
            s.name.toLowerCase().includes(term) ||
            s.company.toLowerCase().includes(term) ||
            (s.phone && s.phone.includes(term)) ||
            (s.email && s.email.toLowerCase().includes(term))
        );
        
        renderFilteredSuppliers(filtered);
    }
    
    // ================== عرض الموردين في الجدول (النسخة البسيطة) ==================
    function renderSuppliers() {
        const tbody = document.getElementById('suppliers-tbody');
        if (!tbody) return;
        
        if (suppliers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4">لا يوجد موردين</td></tr>';
            return;
        }
        
        tbody.innerHTML = suppliers.map(s => `
            <tr>
                <td>${s.name}</td>
                <td>${s.phone || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="supplierModule.editSupplier('${s.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="supplierModule.deleteSupplier('${s.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== عرض الموردين في الجدول (النسخة الكاملة) ==================
    function renderSuppliersFull() {
        const tbody = document.getElementById('suppliers-full-tbody');
        if (!tbody) return;
        
        if (suppliers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">لا يوجد موردين</td></tr>';
            return;
        }
        
        tbody.innerHTML = suppliers.map(s => `
            <tr>
                <td>${s.name}</td>
                <td>${s.company}</td>
                <td>${s.phone || '-'}</td>
                <td>${s.email || '-'}</td>
                <td>${utilsModule.formatCurrency(s.totalPurchases)}</td>
                <td>${utilsModule.formatCurrency(s.totalDebt)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="supplierModule.showSupplierDetails('${s.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="supplierModule.editSupplierFull('${s.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="supplierModule.deleteSupplier('${s.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== عرض الموردين المصفاة ==================
    function renderFilteredSuppliers(filtered) {
        const tbody = document.getElementById('suppliers-full-tbody');
        if (!tbody) return;
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(s => `
            <tr>
                <td>${s.name}</td>
                <td>${s.company}</td>
                <td>${s.phone || '-'}</td>
                <td>${s.email || '-'}</td>
                <td>${utilsModule.formatCurrency(s.totalPurchases)}</td>
                <td>${utilsModule.formatCurrency(s.totalDebt)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="supplierModule.showSupplierDetails('${s.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="supplierModule.editSupplierFull('${s.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="supplierModule.deleteSupplier('${s.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== تحديث قائمة الموردين في القوائم المنسدلة ==================
    function updateSupplierSelect() {
        const selects = document.querySelectorAll('.supplier-select, #purchase-supplier');
        
        selects.forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">اختر المورد</option>' + 
                    suppliers.map(s => `<option value="${s.id}">${s.name} ${s.phone ? '- ' + s.phone : ''}</option>`).join('');
            }
        });
    }
    
    // ================== تعديل مورد (بسيط) ==================
    function editSupplier(id) {
        const supplier = getSupplier(id);
        if (!supplier) return;
        
        Swal.fire({
            title: 'تعديل المورد',
            html: `
                <div style="text-align:right;">
                    <input type="text" id="edit-name" class="form-control mb-2" value="${supplier.name}" placeholder="اسم المورد">
                    <input type="text" id="edit-phone" class="form-control mb-2" value="${supplier.phone || ''}" placeholder="رقم الهاتف">
                    <input type="email" id="edit-email" class="form-control mb-2" value="${supplier.email || ''}" placeholder="البريد الإلكتروني">
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
                    email: document.getElementById('edit-email').value.trim()
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                updateSupplier(id, result.value);
            }
        });
    }
    
    // ================== تعديل مورد (كامل) ==================
    function editSupplierFull(id) {
        const supplier = getSupplier(id);
        if (!supplier) return;
        
        // يمكن إضافة نافذة تعديل كاملة هنا
        editSupplier(id);
    }
    
    // ================== عرض تفاصيل المورد ==================
    function showSupplierDetails(id) {
        const supplier = getSupplier(id);
        if (!supplier) return;
        
        Swal.fire({
            title: 'تفاصيل المورد',
            html: `
                <div style="text-align:right; max-height:400px; overflow-y:auto;">
                    <p><strong>الاسم:</strong> ${supplier.name}</p>
                    <p><strong>الشركة:</strong> ${supplier.company || '-'}</p>
                    <p><strong>الهاتف:</strong> ${supplier.phone || '-'}</p>
                    <p><strong>هاتف آخر:</strong> ${supplier.secondaryPhone || '-'}</p>
                    <p><strong>البريد:</strong> ${supplier.email || '-'}</p>
                    <p><strong>الموقع:</strong> ${supplier.website || '-'}</p>
                    <p><strong>العنوان:</strong> ${supplier.address || '-'}</p>
                    <p><strong>الرقم الضريبي:</strong> ${supplier.taxNumber || '-'}</p>
                    <p><strong>السجل التجاري:</strong> ${supplier.commercialRegister || '-'}</p>
                    <hr>
                    <p><strong>الشخص المسؤول:</strong> ${supplier.contactPerson || '-'}</p>
                    <p><strong>منصبه:</strong> ${supplier.contactPosition || '-'}</p>
                    <p><strong>رقمه:</strong> ${supplier.contactPhone || '-'}</p>
                    <p><strong>بريده:</strong> ${supplier.contactEmail || '-'}</p>
                    <hr>
                    <p><strong>طريقة الدفع:</strong> ${supplier.paymentMethod === 'cash' ? 'نقدي' : supplier.paymentMethod === 'check' ? 'شيك' : 'تحويل'}</p>
                    <p><strong>مدة السداد:</strong> ${supplier.paymentDays} يوم</p>
                    <p><strong>الحد الائتماني:</strong> ${utilsModule.formatCurrency(supplier.creditLimit)}</p>
                    <p><strong>البنك:</strong> ${supplier.bankName || '-'}</p>
                    <p><strong>رقم الحساب:</strong> ${supplier.bankAccount || '-'}</p>
                    <hr>
                    <p><strong>إجمالي المشتريات:</strong> ${utilsModule.formatCurrency(supplier.totalPurchases)}</p>
                    <p><strong>إجمالي المدفوع:</strong> ${utilsModule.formatCurrency(supplier.totalPaid)}</p>
                    <p><strong>المديونية:</strong> ${utilsModule.formatCurrency(supplier.totalDebt)}</p>
                    <hr>
                    <p><strong>تاريخ التسجيل:</strong> ${utilsModule.formatDate(supplier.createdAt)}</p>
                    <p><strong>آخر شراء:</strong> ${supplier.lastPurchaseDate ? utilsModule.formatDate(supplier.lastPurchaseDate) : 'لا يوجد'}</p>
                    <p><strong>ملاحظات:</strong> ${supplier.notes || '-'}</p>
                </div>
            `,
            confirmButtonText: 'إغلاق',
            width: '700px'
        });
    }
    
    // ================== تحديث إحصائيات المورد بعد فاتورة ==================
    function updateSupplierStats(id, invoiceTotal) {
        const supplier = getSupplier(id);
        if (!supplier) return;
        
        supplier.totalPurchases += invoiceTotal;
        supplier.lastPurchaseDate = new Date().toISOString();
        
        saveSuppliers();
    }
    
    // ================== إضافة دين للمورد ==================
    function addDebt(id, amount) {
        const supplier = getSupplier(id);
        if (!supplier) return false;
        
        supplier.totalDebt += amount;
        
        // التحقق من تجاوز الحد الائتماني
        if (supplier.creditLimit > 0 && supplier.totalDebt > supplier.creditLimit) {
            utilsModule.showNotification('تحذير', 'تجاوز الحد الائتماني للمورد', 'warning');
        }
        
        saveSuppliers();
        return true;
    }
    
    // ================== سداد دين لمورد ==================
    function payDebt(id, amount) {
        const supplier = getSupplier(id);
        if (!supplier) return false;
        
        if (amount > supplier.totalDebt) {
            utilsModule.showNotification('خطأ', 'المبلغ أكبر من المديونية', 'error');
            return false;
        }
        
        supplier.totalDebt -= amount;
        supplier.totalPaid += amount;
        
        saveSuppliers();
        utilsModule.showNotification('نجاح', 'تم تسجيل الدفعة');
        return true;
    }
    
    // ================== الحصول على إحصائيات الموردين ==================
    function getSupplierStats() {
        return {
            totalSuppliers: suppliers.length,
            totalPurchases: suppliers.reduce((sum, s) => sum + s.totalPurchases, 0),
            totalDebt: suppliers.reduce((sum, s) => sum + s.totalDebt, 0),
            suppliersWithDebt: suppliers.filter(s => s.totalDebt > 0).length,
            averagePurchase: suppliers.length > 0 
                ? suppliers.reduce((sum, s) => sum + s.totalPurchases, 0) / suppliers.length 
                : 0
        };
    }
    
    // ================== تصدير الموردين إلى CSV ==================
    function exportToCSV() {
        const headers = ['الاسم', 'الشركة', 'الهاتف', 'هاتف آخر', 'البريد', 'العنوان', 'المشتريات', 'المدفوع', 'المديونية'];
        const data = suppliers.map(s => ({
            name: s.name,
            company: s.company,
            phone: s.phone,
            secondaryPhone: s.secondaryPhone,
            email: s.email,
            address: s.address,
            totalPurchases: s.totalPurchases,
            totalPaid: s.totalPaid,
            totalDebt: s.totalDebt
        }));
        
        utilsModule.exportToCSV(data, 'suppliers', headers);
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ supplierModule initialized - الرقم 21');
        console.log(`   عدد الموردين: ${suppliers.length}`);
        console.log(`   إجمالي المديونية: ${utilsModule.formatCurrency(suppliers.reduce((sum, s) => sum + s.totalDebt, 0))}`);
        
        // عرض الموردين إذا كانت الجداول موجودة
        if (document.getElementById('suppliers-tbody')) {
            renderSuppliers();
        }
        
        if (document.getElementById('suppliers-full-tbody')) {
            renderSuppliersFull();
        }
        
        updateSupplierSelect();
    }
    
    // ================== واجهة الوحدة ==================
    return {
        // البيانات
        suppliers,
        
        // إضافة
        addSupplier,
        addNewSupplier,
        
        // استعلام
        getAllSuppliers,
        getSupplier,
        getSupplierByName,
        
        // تحديث
        updateSupplier,
        deleteSupplier,
        
        // بحث
        searchSuppliers,
        
        // عرض
        renderSuppliers,
        renderSuppliersFull,
        showSupplierDetails,
        
        // قوائم
        updateSupplierSelect,
        
        // تعديل
        editSupplier,
        editSupplierFull,
        
        // إحصائيات
        updateSupplierStats,
        addDebt,
        payDebt,
        getSupplierStats,
        
        // تصدير
        exportToCSV,
        
        // تهيئة
        init
    };
})();

// ================== تصدير للاستخدام العام ==================
window.supplierModule = supplierModule;

// ================== دوال مختصرة للاستخدام في HTML ==================
window.addSupplier = () => supplierModule.addSupplier();
window.saveNewSupplier = () => supplierModule.addNewSupplier();
window.deleteSupplier = (id) => supplierModule.deleteSupplier(id);
window.showSupplierDetails = (id) => supplierModule.showSupplierDetails(id);

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (supplierModule && supplierModule.init) {
            supplierModule.init();
        }
    });
    
    document.addEventListener('html-loaded', function() {
        if (supplierModule && supplierModule.init) {
            supplierModule.init();
        }
    });
}
