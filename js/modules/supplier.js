// ================== إدارة الموردين ==================
const supplierModule = (function() {
    let suppliers = JSON.parse(localStorage.getItem('ryan_suppliers')) || [];
    
    // تطبيع البيانات
    suppliers = suppliers.map(s => {
        if (typeof s === 'string') {
            return {
                id: Date.now() + Math.random(),
                name: s,
                phone: '',
                email: '',
                address: '',
                notes: '',
                createdAt: new Date().toISOString()
            };
        }
        return {
            id: s.id || Date.now() + Math.random(),
            name: s.name || '',
            phone: s.phone || '',
            email: s.email || '',
            address: s.address || '',
            notes: s.notes || '',
            createdAt: s.createdAt || new Date().toISOString()
        };
    });
    
    function saveSuppliers() {
        localStorage.setItem('ryan_suppliers', JSON.stringify(suppliers));
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
    
    // إضافة مورد سريع
    function addSupplier() {
        const name = document.getElementById('new-supplier')?.value.trim();
        const phone = document.getElementById('new-supplier-phone')?.value.trim() || '';
        
        if (!name) {
            showNotification('تنبيه', 'اسم المورد مطلوب', 'warning');
            return;
        }
        
        suppliers.push({
            id: Date.now(),
            name: name,
            phone: phone,
            email: '',
            address: '',
            notes: '',
            createdAt: new Date().toISOString()
        });
        
        saveSuppliers();
        renderSuppliers();
        
        if (document.getElementById('new-supplier')) {
            document.getElementById('new-supplier').value = '';
        }
        if (document.getElementById('new-supplier-phone')) {
            document.getElementById('new-supplier-phone').value = '';
        }
        
        showNotification('نجاح', 'تم إضافة المورد', 'success');
    }
    
    // إضافة مورد كامل
    function saveNewSupplier() {
        const name = document.getElementById('new-supplier-name')?.value.trim();
        const phone = document.getElementById('new-supplier-phone')?.value.trim() || '';
        const email = document.getElementById('new-supplier-email')?.value.trim() || '';
        const address = document.getElementById('new-supplier-address')?.value.trim() || '';
        const notes = document.getElementById('new-supplier-notes')?.value.trim() || '';
        
        if (!name) {
            Swal.fire('تنبيه', 'اسم المورد مطلوب', 'warning');
            return;
        }
        
        const newSupplier = {
            id: Date.now(),
            name: name,
            phone: phone,
            email: email,
            address: address,
            notes: notes,
            createdAt: new Date().toISOString()
        };
        
        suppliers.push(newSupplier);
        saveSuppliers();
        
        Swal.fire('نجاح', 'تم إضافة المورد', 'success');
        
        // مسح الحقول
        document.getElementById('new-supplier-name').value = '';
        if (document.getElementById('new-supplier-phone')) document.getElementById('new-supplier-phone').value = '';
        if (document.getElementById('new-supplier-email')) document.getElementById('new-supplier-email').value = '';
        if (document.getElementById('new-supplier-address')) document.getElementById('new-supplier-address').value = '';
        if (document.getElementById('new-supplier-notes')) document.getElementById('new-supplier-notes').value = '';
        
        renderSuppliers();
    }
    
    // عرض الموردين
    function renderSuppliers() {
        const tbody = document.getElementById('suppliers-tbody');
        if (!tbody) return;
        
        if (suppliers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4">لا يوجد موردين</td></tr>';
            return;
        }
        
        tbody.innerHTML = suppliers.map((s, idx) => `
            <tr>
                <td>${s.name}</td>
                <td>${s.phone || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="supplierModule.editSupplier(${idx})">
                        تعديل
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="supplierModule.deleteSupplier(${idx})">
                        حذف
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // تعديل مورد
    function editSupplier(index) {
        const supplier = suppliers[index];
        if (!supplier) return;
        
        Swal.fire({
            title: 'تعديل المورد',
            html: `
                <input type="text" id="edit-name" class="form-control mb-2" value="${supplier.name}" placeholder="الاسم">
                <input type="text" id="edit-phone" class="form-control mb-2" value="${supplier.phone || ''}" placeholder="الهاتف">
            `,
            showCancelButton: true,
            confirmButtonText: 'حفظ',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                const name = document.getElementById('edit-name').value.trim();
                if (!name) {
                    Swal.showValidationMessage('الاسم مطلوب');
                    return false;
                }
                return {
                    name: name,
                    phone: document.getElementById('edit-phone').value.trim()
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const updated = result.value;
                supplier.name = updated.name;
                supplier.phone = updated.phone;
                saveSuppliers();
                renderSuppliers();
                showNotification('نجاح', 'تم التعديل', 'success');
            }
        });
    }
    
    // حذف مورد
    function deleteSupplier(index) {
        const supplier = suppliers[index];
        showConfirmation('تأكيد', `حذف "${supplier.name}"؟`, () => {
            suppliers.splice(index, 1);
            saveSuppliers();
            renderSuppliers();
            showNotification('تم', 'تم الحذف', 'success');
        });
    }
    
    function init() {
        renderSuppliers();
    }
    
    return {
        suppliers: suppliers,
        addSupplier: addSupplier,
        saveNewSupplier: saveNewSupplier,
        renderSuppliers: renderSuppliers,
        editSupplier: editSupplier,
        deleteSupplier: deleteSupplier,
        init: init
    };
})();

window.supplierModule = supplierModule;

// دوال HTML
window.addSupplier = () => supplierModule.addSupplier();
window.saveNewSupplier = () => supplierModule.saveNewSupplier();

// تهيئة
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => supplierModule.init(), 200));
}
