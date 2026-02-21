// ================== debt.js - إدارة الديون والمدفوعات المتقدمة ==================
// الرقم 26 في ترتيب الملفات - نسخة نهائية بدون نقائص

const debtModule = (function() {
    // ================== البيانات ==================
    let debts = JSON.parse(localStorage.getItem('debts')) || [];
    let payments = JSON.parse(localStorage.getItem('payments')) || [];
    
    // ================== دوال مساعدة ==================
    function generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }
    
    function formatCurrency(amount) {
        return Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' دج';
    }
    
    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
    
    function formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
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
    
    function showConfirmation(title, text, confirmCallback, cancelCallback = null) {
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
            } else if (cancelCallback) {
                cancelCallback();
            }
        });
    }
    
    function saveDebts() {
        localStorage.setItem('debts', JSON.stringify(debts));
    }
    
    function savePayments() {
        localStorage.setItem('payments', JSON.stringify(payments));
    }
    
    // ================== إنشاء رقم دين ==================
    function generateDebtNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `DEBT-${year}${month}${day}-${random}`;
    }
    
    // ================== إنشاء رقم دفعة ==================
    function generatePaymentNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PAY-${year}${month}${day}-${random}`;
    }
    
    // ================== الحصول على اسم الطرف ==================
    function getPartyName(partyId, partyType) {
        if (partyType === 'customer') {
            const customer = window.customerModule?.getCustomer?.(partyId);
            return customer ? (customer.fullname || customer.name) : 'عميل';
        } else {
            const supplier = window.supplierModule?.getSupplier?.(partyId);
            return supplier ? (supplier.company || supplier.name) : 'مورد';
        }
    }
    
    // ================== تحديث إحصائيات ديون الطرف ==================
    function updatePartyDebtStats(partyId, partyType) {
        const partyDebts = debts.filter(d => d.partyId == partyId && d.partyType === partyType && d.status !== 'paid');
        const totalDebt = partyDebts.reduce((sum, d) => sum + (d.remaining || 0), 0);
        
        if (partyType === 'customer') {
            const customer = window.customerModule?.getCustomer?.(partyId);
            if (customer) {
                customer.totalDebt = totalDebt;
                if (window.customerModule?.updateCustomer) {
                    window.customerModule.updateCustomer(partyId, { totalDebt });
                }
            }
        } else {
            const supplier = window.supplierModule?.getSupplier?.(partyId);
            if (supplier) {
                supplier.totalDebt = totalDebt;
                if (window.supplierModule?.updateSupplier) {
                    window.supplierModule.updateSupplier(partyId, { totalDebt });
                }
            }
        }
    }
    
    // ================== إنشاء دين جديد ==================
    function createDebt(debtData) {
        // التحقق من البيانات المطلوبة
        if (!debtData.partyId || !debtData.partyType || !debtData.amount) {
            showNotification('خطأ', 'البيانات غير مكتملة', 'error');
            return null;
        }
        
        const amount = parseFloat(debtData.amount);
        if (isNaN(amount) || amount <= 0) {
            showNotification('خطأ', 'المبلغ يجب أن يكون أكبر من صفر', 'error');
            return null;
        }
        
        const partyName = getPartyName(debtData.partyId, debtData.partyType);
        
        const newDebt = {
            id: generateId(),
            number: generateDebtNumber(),
            partyId: debtData.partyId,
            partyType: debtData.partyType,
            partyName: partyName,
            amount: amount,
            paid: 0,
            remaining: amount,
            dueDate: debtData.dueDate || null,
            invoiceId: debtData.invoiceId || null,
            invoiceNumber: debtData.invoiceNumber || null,
            description: debtData.description || '',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: debtData.notes || ''
        };
        
        debts.push(newDebt);
        saveDebts();
        
        updatePartyDebtStats(debtData.partyId, debtData.partyType);
        showNotification('نجاح', 'تم تسجيل الدين بنجاح');
        
        // تحديث جميع الجداول
        renderAllDebts();
        renderCustomerDebts();
        renderSupplierDebts();
        
        return newDebt;
    }
    
    // ================== تسجيل دفعة ==================
    function addPayment(paymentData) {
        // التحقق من البيانات
        if (!paymentData.debtId || !paymentData.amount) {
            showNotification('خطأ', 'البيانات غير مكتملة', 'error');
            return null;
        }
        
        const amount = parseFloat(paymentData.amount);
        if (isNaN(amount) || amount <= 0) {
            showNotification('خطأ', 'المبلغ يجب أن يكون أكبر من صفر', 'error');
            return null;
        }
        
        // البحث عن الدين
        const debt = debts.find(d => d.id == paymentData.debtId);
        if (!debt) {
            showNotification('خطأ', 'الدين غير موجود', 'error');
            return null;
        }
        
        if (amount > debt.remaining) {
            showNotification('خطأ', 'المبلغ أكبر من المتبقي', 'error');
            return null;
        }
        
        // إنشاء كائن الدفعة
        const payment = {
            id: generateId(),
            number: generatePaymentNumber(),
            debtId: debt.id,
            debtNumber: debt.number,
            partyId: debt.partyId,
            partyType: debt.partyType,
            partyName: debt.partyName,
            amount: amount,
            method: paymentData.method || 'cash',
            date: paymentData.date || new Date().toISOString(),
            reference: paymentData.reference || '',
            description: paymentData.description || '',
            createdBy: 'admin',
            createdAt: new Date().toISOString()
        };
        
        payments.push(payment);
        
        // تحديث الدين
        debt.paid = (debt.paid || 0) + amount;
        debt.remaining = (debt.remaining || 0) - amount;
        debt.updatedAt = new Date().toISOString();
        
        // تحديث حالة الدين
        if (debt.remaining <= 0) {
            debt.status = 'paid';
        } else if (debt.paid > 0) {
            debt.status = 'partial';
        }
        
        saveDebts();
        savePayments();
        
        updatePartyDebtStats(debt.partyId, debt.partyType);
        showNotification('نجاح', 'تم تسجيل الدفعة بنجاح');
        
        // تحديث جميع الجداول
        renderAllDebts();
        renderCustomerDebts();
        renderSupplierDebts();
        renderPayments();
        updateStats();
        
        return payment;
    }
    
    // ================== تسوية دين كاملة ==================
    function settleDebt(debtId, paymentMethod = 'cash') {
        const debt = debts.find(d => d.id == debtId);
        if (!debt) return false;
        
        if (debt.remaining <= 0) {
            showNotification('معلومة', 'الدين مسدد بالفعل', 'info');
            return false;
        }
        
        return addPayment({
            debtId: debt.id,
            amount: debt.remaining,
            method: paymentMethod,
            description: 'تسوية كاملة'
        });
    }
    
    // ================== حذف دين ==================
    function deleteDebt(debtId) {
        const debt = debts.find(d => d.id == debtId);
        if (!debt) return false;
        
        // التحقق من وجود دفعات
        const debtPayments = payments.filter(p => p.debtId == debtId);
        if (debtPayments.length > 0) {
            showNotification('خطأ', 'لا يمكن حذف دين له دفعات مسجلة', 'error');
            return false;
        }
        
        showConfirmation(
            'تأكيد الحذف',
            `هل أنت متأكد من حذف الدين رقم ${debt.number}؟`,
            () => {
                debts = debts.filter(d => d.id != debtId);
                saveDebts();
                updatePartyDebtStats(debt.partyId, debt.partyType);
                showNotification('تم', 'تم حذف الدين بنجاح');
                
                // تحديث جميع الجداول
                renderAllDebts();
                renderCustomerDebts();
                renderSupplierDebts();
                updateStats();
            }
        );
        
        return true;
    }
    
    // ================== حذف دفعة ==================
    function deletePayment(paymentId) {
        const payment = payments.find(p => p.id == paymentId);
        if (!payment) return false;
        
        showConfirmation(
            'تأكيد الحذف',
            `هل أنت متأكد من حذف الدفعة رقم ${payment.number}؟`,
            () => {
                // استرجاع المبلغ للدين
                const debt = debts.find(d => d.id == payment.debtId);
                if (debt) {
                    debt.paid -= payment.amount;
                    debt.remaining += payment.amount;
                    debt.updatedAt = new Date().toISOString();
                    
                    if (debt.remaining > 0) {
                        debt.status = debt.paid > 0 ? 'partial' : 'active';
                    }
                    
                    saveDebts();
                    updatePartyDebtStats(debt.partyId, debt.partyType);
                }
                
                payments = payments.filter(p => p.id != paymentId);
                savePayments();
                
                showNotification('تم', 'تم حذف الدفعة بنجاح');
                
                // تحديث جميع الجداول
                renderAllDebts();
                renderCustomerDebts();
                renderSupplierDebts();
                renderPayments();
                updateStats();
            }
        );
        
        return true;
    }
    
    // ================== الحصول على ديون عميل ==================
    function getCustomerDebts(customerId) {
        return debts.filter(d => d.partyId == customerId && d.partyType === 'customer')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    // ================== الحصول على ديون مورد ==================
    function getSupplierDebts(supplierId) {
        return debts.filter(d => d.partyId == supplierId && d.partyType === 'supplier')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    // ================== الحصول على جميع الديون النشطة ==================
    function getActiveDebts() {
        return debts.filter(d => d.status !== 'paid')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    // ================== الحصول على الديون المتأخرة ==================
    function getOverdueDebts() {
        const now = new Date();
        return debts.filter(d => {
            if (d.status === 'paid' || !d.dueDate) return false;
            const dueDate = new Date(d.dueDate);
            return dueDate < now;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }
    
    // ================== الحصول على جميع الديون ==================
    function getAllDebts() {
        return [...debts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    // ================== الحصول على دفعات دين معين ==================
    function getDebtPayments(debtId) {
        return payments.filter(p => p.debtId == debtId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    // ================== الحصول على جميع الدفعات ==================
    function getAllPayments(limit = 100) {
        return [...payments]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }
    
    // ================== إجمالي الديون ==================
    function getTotalDebts() {
        const active = debts.filter(d => d.status !== 'paid');
        
        return {
            total: debts.reduce((sum, d) => sum + (d.amount || 0), 0),
            paid: debts.reduce((sum, d) => sum + (d.paid || 0), 0),
            remaining: debts.reduce((sum, d) => sum + (d.remaining || 0), 0),
            active: {
                count: active.length,
                amount: active.reduce((sum, d) => sum + (d.remaining || 0), 0)
            },
            byType: {
                customer: {
                    count: debts.filter(d => d.partyType === 'customer' && d.status !== 'paid').length,
                    amount: debts.filter(d => d.partyType === 'customer' && d.status !== 'paid')
                        .reduce((sum, d) => sum + (d.remaining || 0), 0)
                },
                supplier: {
                    count: debts.filter(d => d.partyType === 'supplier' && d.status !== 'paid').length,
                    amount: debts.filter(d => d.partyType === 'supplier' && d.status !== 'paid')
                        .reduce((sum, d) => sum + (d.remaining || 0), 0)
                }
            }
        };
    }
    
    // ================== إحصائيات الدفعات ==================
    function getPaymentsStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const todayPayments = payments.filter(p => new Date(p.date) >= today);
        const monthPayments = payments.filter(p => new Date(p.date) >= thisMonth);
        
        return {
            total: {
                count: payments.length,
                amount: payments.reduce((sum, p) => sum + (p.amount || 0), 0)
            },
            today: {
                count: todayPayments.length,
                amount: todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
            },
            thisMonth: {
                count: monthPayments.length,
                amount: monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
            },
            byMethod: {
                cash: payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + (p.amount || 0), 0),
                card: payments.filter(p => p.method === 'card').reduce((sum, p) => sum + (p.amount || 0), 0),
                check: payments.filter(p => p.method === 'check').reduce((sum, p) => sum + (p.amount || 0), 0),
                transfer: payments.filter(p => p.method === 'transfer').reduce((sum, p) => sum + (p.amount || 0), 0)
            }
        };
    }
    
    // ================== عرض جميع الديون ==================
    function renderAllDebts() {
        const tbody = document.getElementById('all-debts-tbody');
        if (!tbody) return;
        
        const allDebts = getAllDebts();
        
        if (allDebts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center p-4">لا توجد ديون</td></tr>';
            return;
        }
        
        tbody.innerHTML = allDebts.map(debt => {
            const statusClass = debt.status === 'paid' ? 'badge-success' :
                               debt.status === 'partial' ? 'badge-warning' : 
                               isOverdue(debt) ? 'badge-danger' : 'badge-info';
            const statusText = debt.status === 'paid' ? 'مسدد' :
                              debt.status === 'partial' ? 'مسدد جزئياً' :
                              isOverdue(debt) ? 'متأخر' : 'نشط';
            
            const dueDate = debt.dueDate ? formatDate(debt.dueDate) : '-';
            const isOverdueFlag = isOverdue(debt);
            
            return `
            <tr>
                <td>${debt.number}</td>
                <td>${debt.partyName}</td>
                <td>${debt.partyType === 'customer' ? 'عميل' : 'مورد'}</td>
                <td>${formatCurrency(debt.amount)}</td>
                <td>${formatCurrency(debt.paid)}</td>
                <td>${formatCurrency(debt.remaining)}</td>
                <td>${dueDate} ${isOverdueFlag ? '<span class="badge-danger" style="font-size:10px;">متأخر</span>' : ''}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="debtModule.showDebtDetails('${debt.id}')" title="عرض التفاصيل">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    ${debt.remaining > 0 ? `
                        <button class="btn btn-sm btn-success" onclick="debtModule.showPaymentForm('${debt.id}')" title="تسجيل دفعة">
                            <i class="material-icons-round">payments</i>
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="debtModule.deleteDebt('${debt.id}')" title="حذف">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    // ================== ديون العملاء ==================
    function renderCustomerDebts() {
        const tbody = document.getElementById('customer-debts-tbody');
        if (!tbody) return;
        
        const customerDebts = debts.filter(d => d.partyType === 'customer' && d.remaining > 0);
        
        if (customerDebts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4">لا توجد ديون على عملاء</td></tr>';
            return;
        }
        
        tbody.innerHTML = customerDebts.map(debt => {
            const dueDate = debt.dueDate ? formatDate(debt.dueDate) : '-';
            const statusClass = isOverdue(debt) ? 'badge-danger' : 
                               debt.status === 'partial' ? 'badge-warning' : 'badge-info';
            const statusText = isOverdue(debt) ? 'متأخر' :
                              debt.status === 'partial' ? 'جزئي' : 'نشط';
            
            return `
            <tr>
                <td>${debt.number}</td>
                <td>${debt.partyName}</td>
                <td>${formatCurrency(debt.amount)}</td>
                <td>${formatCurrency(debt.paid)}</td>
                <td>${formatCurrency(debt.remaining)}</td>
                <td>${dueDate}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="debtModule.showPaymentForm('${debt.id}')" title="تسجيل دفعة">
                        <i class="material-icons-round">payments</i> دفع
                    </button>
                    <button class="btn btn-sm btn-info" onclick="debtModule.showDebtDetails('${debt.id}')" title="تفاصيل">
                        <i class="material-icons-round">info</i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    // ================== ديون الموردين ==================
    function renderSupplierDebts() {
        const tbody = document.getElementById('supplier-debts-tbody');
        if (!tbody) return;
        
        const supplierDebts = debts.filter(d => d.partyType === 'supplier' && d.remaining > 0);
        
        if (supplierDebts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4">لا توجد ديون على موردين</td></tr>';
            return;
        }
        
        tbody.innerHTML = supplierDebts.map(debt => {
            const dueDate = debt.dueDate ? formatDate(debt.dueDate) : '-';
            const statusClass = isOverdue(debt) ? 'badge-danger' : 
                               debt.status === 'partial' ? 'badge-warning' : 'badge-info';
            const statusText = isOverdue(debt) ? 'متأخر' :
                              debt.status === 'partial' ? 'جزئي' : 'نشط';
            
            return `
            <tr>
                <td>${debt.number}</td>
                <td>${debt.partyName}</td>
                <td>${formatCurrency(debt.amount)}</td>
                <td>${formatCurrency(debt.paid)}</td>
                <td>${formatCurrency(debt.remaining)}</td>
                <td>${dueDate}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="debtModule.showPaymentForm('${debt.id}')" title="تسجيل دفعة">
                        <i class="material-icons-round">payments</i> دفع
                    </button>
                    <button class="btn btn-sm btn-info" onclick="debtModule.showDebtDetails('${debt.id}')" title="تفاصيل">
                        <i class="material-icons-round">info</i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    // ================== عرض سجل الدفعات ==================
    function renderPayments() {
        const tbody = document.getElementById('payments-tbody');
        if (!tbody) return;
        
        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد دفعات</td></tr>';
            return;
        }
        
        const sortedPayments = [...payments].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        tbody.innerHTML = sortedPayments.slice(0, 50).map(p => `
            <tr>
                <td>${p.number}</td>
                <td>${p.debtNumber}</td>
                <td>${p.partyName}</td>
                <td>${formatCurrency(p.amount)}</td>
                <td>${p.method === 'cash' ? 'نقدي' : p.method === 'card' ? 'بطاقة' : p.method === 'check' ? 'شيك' : 'تحويل'}</td>
                <td>${formatDateTime(p.date)}</td>
            </tr>
        `).join('');
    }
    
    // ================== التحقق من تأخر الدين ==================
    function isOverdue(debt) {
        return debt.dueDate && debt.status !== 'paid' && new Date(debt.dueDate) < new Date();
    }
    
    // ================== البحث في الديون ==================
    function searchDebts(term) {
        const tbody = document.getElementById('all-debts-tbody');
        if (!tbody) return;
        
        if (!term || term.length < 2) {
            renderAllDebts();
            return;
        }
        
        term = term.toLowerCase();
        const filtered = debts.filter(d => 
            d.partyName.toLowerCase().includes(term) ||
            d.number.toLowerCase().includes(term) ||
            (d.partyType === 'customer' ? 'عميل' : 'مورد').includes(term)
        );
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(debt => {
            const statusClass = debt.status === 'paid' ? 'badge-success' :
                               debt.status === 'partial' ? 'badge-warning' : 
                               isOverdue(debt) ? 'badge-danger' : 'badge-info';
            const statusText = debt.status === 'paid' ? 'مسدد' :
                              debt.status === 'partial' ? 'مسدد جزئياً' :
                              isOverdue(debt) ? 'متأخر' : 'نشط';
            
            const dueDate = debt.dueDate ? formatDate(debt.dueDate) : '-';
            
            return `
            <tr>
                <td>${debt.number}</td>
                <td>${debt.partyName}</td>
                <td>${debt.partyType === 'customer' ? 'عميل' : 'مورد'}</td>
                <td>${formatCurrency(debt.amount)}</td>
                <td>${formatCurrency(debt.paid)}</td>
                <td>${formatCurrency(debt.remaining)}</td>
                <td>${dueDate}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="debtModule.showDebtDetails('${debt.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    ${debt.remaining > 0 ? `
                        <button class="btn btn-sm btn-success" onclick="debtModule.showPaymentForm('${debt.id}')">
                            <i class="material-icons-round">payments</i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `}).join('');
    }
    
    // ================== تصفية الديون ==================
    function filterDebts() {
        const type = document.getElementById('debt-type-filter')?.value || 'all';
        let filtered = debts;
        
        if (type !== 'all') {
            filtered = debts.filter(d => d.partyType === type);
        }
        
        const tbody = document.getElementById('all-debts-tbody');
        if (!tbody) return;
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(debt => {
            const statusClass = debt.status === 'paid' ? 'badge-success' :
                               debt.status === 'partial' ? 'badge-warning' : 
                               isOverdue(debt) ? 'badge-danger' : 'badge-info';
            const statusText = debt.status === 'paid' ? 'مسدد' :
                              debt.status === 'partial' ? 'مسدد جزئياً' :
                              isOverdue(debt) ? 'متأخر' : 'نشط';
            
            const dueDate = debt.dueDate ? formatDate(debt.dueDate) : '-';
            
            return `
            <tr>
                <td>${debt.number}</td>
                <td>${debt.partyName}</td>
                <td>${debt.partyType === 'customer' ? 'عميل' : 'مورد'}</td>
                <td>${formatCurrency(debt.amount)}</td>
                <td>${formatCurrency(debt.paid)}</td>
                <td>${formatCurrency(debt.remaining)}</td>
                <td>${dueDate}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="debtModule.showDebtDetails('${debt.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    ${debt.remaining > 0 ? `
                        <button class="btn btn-sm btn-success" onclick="debtModule.showPaymentForm('${debt.id}')">
                            <i class="material-icons-round">payments</i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `}).join('');
    }
    
    // ================== عرض تفاصيل الدين ==================
    function showDebtDetails(debtId) {
        const debt = debts.find(d => d.id == debtId);
        if (!debt) return;
        
        const debtPayments = getDebtPayments(debtId);
        
        let paymentsHtml = '';
        if (debtPayments.length > 0) {
            paymentsHtml = `
                <h6 class="mt-3">الدفعات:</h6>
                <div style="max-height:200px; overflow-y:auto;">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>التاريخ</th>
                                <th>المبلغ</th>
                                <th>طريقة الدفع</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${debtPayments.map((p, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${formatDateTime(p.date)}</td>
                                    <td>${formatCurrency(p.amount)}</td>
                                    <td>${p.method === 'cash' ? 'نقدي' : p.method === 'card' ? 'بطاقة' : p.method === 'check' ? 'شيك' : 'تحويل'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        Swal.fire({
            title: `تفاصيل الدين ${debt.number}`,
            html: `
                <div style="text-align:right; max-height:500px; overflow-y:auto; padding:10px;">
                    <p><strong>الطرف:</strong> ${debt.partyName} (${debt.partyType === 'customer' ? 'عميل' : 'مورد'})</p>
                    <p><strong>تاريخ الإنشاء:</strong> ${formatDateTime(debt.createdAt)}</p>
                    <p><strong>تاريخ الاستحقاق:</strong> ${debt.dueDate ? formatDate(debt.dueDate) : 'غير محدد'}</p>
                    <p><strong>المبلغ الأصلي:</strong> ${formatCurrency(debt.amount)}</p>
                    <p><strong>المدفوع:</strong> ${formatCurrency(debt.paid)}</p>
                    <p><strong>المتبقي:</strong> ${formatCurrency(debt.remaining)}</p>
                    <p><strong>الحالة:</strong> ${debt.status === 'paid' ? 'مسدد' : debt.status === 'partial' ? 'مسدد جزئياً' : isOverdue(debt) ? 'متأخر' : 'نشط'}</p>
                    ${debt.invoiceNumber ? `<p><strong>رقم الفاتورة:</strong> ${debt.invoiceNumber}</p>` : ''}
                    ${debt.description ? `<p><strong>الوصف:</strong> ${debt.description}</p>` : ''}
                    ${debt.notes ? `<p><strong>ملاحظات:</strong> ${debt.notes}</p>` : ''}
                    ${paymentsHtml}
                </div>
            `,
            width: '700px',
            confirmButtonText: 'إغلاق'
        });
    }
    
    // ================== عرض نموذج الدفع ==================
    function showPaymentForm(debtId) {
        const debt = debts.find(d => d.id == debtId);
        if (!debt) return;
        
        Swal.fire({
            title: 'تسجيل دفعة جديدة',
            html: `
                <div style="text-align:right;">
                    <p><strong>الدين:</strong> ${debt.number}</p>
                    <p><strong>الطرف:</strong> ${debt.partyName}</p>
                    <p><strong>المتبقي:</strong> ${formatCurrency(debt.remaining)}</p>
                    <hr>
                    <div class="form-group">
                        <label>المبلغ</label>
                        <input type="number" id="payment-amount" class="form-control" value="${debt.remaining}" min="1" max="${debt.remaining}" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>طريقة الدفع</label>
                        <select id="payment-method" class="form-control">
                            <option value="cash">نقدي</option>
                            <option value="card">بطاقة</option>
                            <option value="check">شيك</option>
                            <option value="transfer">تحويل بنكي</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>التاريخ</label>
                        <input type="date" id="payment-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>ملاحظات</label>
                        <textarea id="payment-notes" class="form-control" rows="2" placeholder="اختياري"></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'تسجيل',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                const amount = parseFloat(document.getElementById('payment-amount').value);
                if (!amount || amount <= 0) {
                    Swal.showValidationMessage('المبلغ مطلوب');
                    return false;
                }
                if (amount > debt.remaining) {
                    Swal.showValidationMessage('المبلغ أكبر من المتبقي');
                    return false;
                }
                return {
                    amount: amount,
                    method: document.getElementById('payment-method').value,
                    date: document.getElementById('payment-date').value,
                    notes: document.getElementById('payment-notes').value
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                addPayment({
                    debtId: debt.id,
                    amount: result.value.amount,
                    method: result.value.method,
                    date: new Date(result.value.date).toISOString(),
                    description: result.value.notes
                });
            }
        });
    }
    
    // ================== تحديث الإحصائيات ==================
    function updateStats() {
        const stats = getTotalDebts();
        const paymentsStats = getPaymentsStats();
        
        const elements = {
            'total-debt': stats.remaining,
            'customer-debt': stats.byType.customer.amount,
            'supplier-debt': stats.byType.supplier.amount,
            'active-debts': stats.active.count,
            'total-paid': stats.paid,
            'today-payments': paymentsStats.today.amount,
            'month-payments': paymentsStats.thisMonth.amount
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                if (id.includes('debt') || id.includes('paid') || id.includes('payments')) {
                    el.textContent = formatCurrency(value);
                } else {
                    el.textContent = value;
                }
            }
        });
    }
    
    // ================== تصدير الديون إلى CSV ==================
    function exportDebtsToCSV() {
        if (debts.length === 0) {
            showNotification('تنبيه', 'لا توجد ديون للتصدير', 'warning');
            return;
        }
        
        const headers = ['رقم الدين', 'الطرف', 'النوع', 'المبلغ', 'المدفوع', 'المتبقي', 'تاريخ الاستحقاق', 'الحالة'];
        let csv = headers.join(',') + '\n';
        
        debts.forEach(d => {
            const row = [
                d.number,
                `"${d.partyName}"`,
                d.partyType === 'customer' ? 'عميل' : 'مورد',
                d.amount,
                d.paid,
                d.remaining,
                d.dueDate ? formatDate(d.dueDate) : '-',
                d.status === 'paid' ? 'مسدد' : d.status === 'partial' ? 'مسدد جزئياً' : isOverdue(d) ? 'متأخر' : 'نشط'
            ];
            csv += row.join(',') + '\n';
        });
        
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `debts_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        
        showNotification('نجاح', 'تم تصدير الديون بنجاح');
    }
    
    // ================== تصدير الدفعات إلى CSV ==================
    function exportPaymentsToCSV() {
        if (payments.length === 0) {
            showNotification('تنبيه', 'لا توجد دفعات للتصدير', 'warning');
            return;
        }
        
        const headers = ['رقم الدفعة', 'رقم الدين', 'الطرف', 'النوع', 'المبلغ', 'طريقة الدفع', 'التاريخ'];
        let csv = headers.join(',') + '\n';
        
        payments.forEach(p => {
            const row = [
                p.number,
                p.debtNumber,
                `"${p.partyName}"`,
                p.partyType === 'customer' ? 'عميل' : 'مورد',
                p.amount,
                p.method === 'cash' ? 'نقدي' : p.method === 'card' ? 'بطاقة' : p.method === 'check' ? 'شيك' : 'تحويل',
                formatDateTime(p.date)
            ];
            csv += row.join(',') + '\n';
        });
        
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `payments_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        
        showNotification('نجاح', 'تم تصدير الدفعات بنجاح');
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ debtModule initialized - الرقم 26');
        console.log(`   عدد الديون: ${debts.length}`);
        console.log(`   إجمالي المتبقي: ${formatCurrency(debts.reduce((sum, d) => sum + (d.remaining || 0), 0))}`);
        
        // تحديث جميع الجداول
        renderAllDebts();
        renderCustomerDebts();
        renderSupplierDebts();
        renderPayments();
        updateStats();
    }
    
    // ================== واجهة الوحدة ==================
    return {
        // البيانات
        debts,
        payments,
        
        // إنشاء
        createDebt,
        addPayment,
        settleDebt,
        
        // استعلام
        getCustomerDebts,
        getSupplierDebts,
        getActiveDebts,
        getOverdueDebts,
        getAllDebts,
        getDebtPayments,
        getAllPayments,
        
        // إحصائيات
        getTotalDebts,
        getPaymentsStats,
        
        // عرض
        renderAllDebts,
        renderCustomerDebts,
        renderSupplierDebts,
        renderPayments,
        showDebtDetails,
        showPaymentForm,
        updateStats,
        
        // بحث وتصفية
        searchDebts,
        filterDebts,
        
        // عمليات
        deleteDebt,
        deletePayment,
        
        // تصدير
        exportDebtsToCSV,
        exportPaymentsToCSV,
        
        // تهيئة
        init
    };
})();

window.debtModule = debtModule;

// ================== دوال مختصرة للاستخدام في HTML ==================
window.showDebtDetails = (id) => debtModule.showDebtDetails(id);
window.showPaymentForm = (id) => debtModule.showPaymentForm(id);
window.exportDebts = () => debtModule.exportDebtsToCSV();
window.exportPayments = () => debtModule.exportPaymentsToCSV();
window.searchDebts = (term) => debtModule.searchDebts(term);
window.filterDebts = () => debtModule.filterDebts();

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => debtModule.init());
    document.addEventListener('html-loaded', () => debtModule.init());
}
