
// ================== إدارة الموردين - وحدة منفصلة ==================
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

    // ================== حفظ البيانات ==================
    function saveSuppliers() {
        localStorage.setItem('ryan_suppliers', JSON.stringify(suppliers));
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

    // ================== إضافة مورد جديد ==================
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
        _clearForm();
        
        _showNotification('نجاح', 'تم إضافة المورد', 'success');
    }

    function _clearForm() {
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
        
        let filtered = suppliers;
        
        if (searchTerm !== '') {
            filtered = suppliers.filter(s => 
                s.name.toLowerCase().includes(searchTerm) || 
                (s.phone && s.phone.includes(searchTerm))
            );
        }
        
        renderFiltered(filtered);
    }

    function renderFiltered(filtered) {
        const tbody = document.getElementById('suppliers-tbody');
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center p-4 text-muted">
                        <i class="material-icons-round" style="font-size:48px;">search_off</i>
                        <p>لا توجد نتائج</p>
                    </td>
                </tr>
            `;
            return;
        }

        const purchases = JSON.parse(localStorage.getItem('ryan_purchases')) || [];

        tbody.innerHTML = filtered.map((s, idx
