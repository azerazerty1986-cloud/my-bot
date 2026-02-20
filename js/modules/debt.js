// ================== debt.js - إدارة الديون والمدفوعات ==================
// الرقم 26 في ترتيب الملفات - يعتمد على utils.js, customer.js, supplier.js

const debtModule = (function() {
    // ================== البيانات ==================
    let debts = JSON.parse(localStorage.getItem('debts')) || [];
    let payments = JSON.parse(localStorage.getItem('payments')) || [];
    
    // ================== دوال مساعدة داخلية ==================
    function saveDebts() {
        localStorage.setItem('debts', JSON.stringify(debts));
    }
    
    function savePayments() {
        localStorage.setItem('payments', JSON.stringify(payments));
    }
    
    // ================== إنشاء دين جديد ==================
    function createDebt(debtData) {
        // التحقق من البيانات المطلوبة
        if (!debtData.partyId || !debtData.partyType || !debtData.amount) {
            utilsModule.showNotification('خطأ', 'البيانات غير مكتملة', 'error');
            return null;
        }
        
        if (debtData.amount <= 0) {
            utilsModule.showNotification('خطأ', 'المبلغ يجب أن يكون أكبر من صفر', 'error');
            return null;
        }
        
        // الحصول على اسم الطرف
        let partyName = '';
        if (debtData.partyType === 'customer') {
            const customer = window.customerModule?.getCustomer(debtData.partyId);
            partyName = customer ? customer.name : 'عميل';
        } else {
            const supplier = window.supplierModule?.getSupplier(debtData.partyId);
            partyName = supplier ? supplier.name : 'مورد';
        }
        
        // إنشاء كائن الدين الجديد
        const newDebt = {
            id: utilsModule.generateId(),
            number: generateDebtNumber(),
            partyId: debtData.partyId,
            partyType: debtData.partyType,
            partyName: partyName,
            amount: parseFloat(debtData.amount),
            paid: 0,
            remaining: parseFloat(debtData.amount),
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
        
        // تحديث إحصائيات الطرف
        updatePartyDebtStats(debtData.partyId, debtData.partyType);
        
        utilsModule.showNotification('نجاح', 'تم تسجيل الدين');
        return newDebt;
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
    
    // ================== تسجيل دفعة ==================
    function addPayment(paymentData) {
        // التحقق من البيانات
        if (!paymentData.debtId || !paymentData.amount) {
            utilsModule.showNotification('خطأ', 'البيانات غير مكتملة', 'error');
            return null;
        }
        
        if (paymentData.amount <= 0) {
            utilsModule.showNotification('خطأ', 'المبلغ يجب أن يكون أكبر من صفر', 'error');
            return null;
        }
        
        // البحث عن الدين
        const debt = debts.find(d => d.id == paymentData.debtId);
        if (!debt) {
            utilsModule.showNotification('خطأ', 'الدين غير موجود', 'error');
            return null;
        }
        
        if (paymentData.amount > debt.remaining) {
            utilsModule.showNotification('خطأ', 'المبلغ أكبر من المتبقي', 'error');
            return null;
        }
        
        // إنشاء كائن الدفعة
        const payment = {
            id: utilsModule.generateId(),
            number: generatePaymentNumber(),
            debtId: debt.id,
            debtNumber: debt.number,
            partyId: debt.partyId,
            partyType: debt.partyType,
            partyName: debt.partyName,
            amount: parseFloat(paymentData.amount),
            method: paymentData.method || 'cash',
            date: paymentData.date || new Date().toISOString(),
            reference: paymentData.reference || '',
            description: paymentData.description || '',
            createdBy: 'admin',
            createdAt: new Date().toISOString()
        };
        
        payments.push(payment);
        
        // تحديث الدين
        debt.paid += payment.amount;
        debt.remaining -= payment.amount;
        debt.updatedAt = new Date().toISOString();
        
        // تحديث حالة الدين
        if (debt.remaining <= 0) {
            debt.status = 'paid';
        } else if (debt.paid > 0) {
            debt.status = 'partial';
        }
        
        saveDebts();
        savePayments();
        
        // تحديث إحصائيات الطرف
        updatePartyDebtStats(debt.partyId, debt.partyType);
        
        utilsModule.showNotification('نجاح', 'تم تسجيل الدفعة');
        return payment;
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
    
    // ================== تحديث إحصائيات ديون الطرف ==================
    function updatePartyDebtStats(partyId, partyType) {
        const partyDebts = debts.filter(d => d.partyId == partyId && d.partyType === partyType);
        const totalDebt = partyDebts.reduce((sum, d) => sum + d.remaining, 0);
        
        if (partyType === 'customer') {
            const customer = window.customerModule?.getCustomer(partyId);
            if (customer) {
                customer.totalDebt = totalDebt;
                window.customerModule?.updateCustomer(partyId, { totalDebt });
            }
        } else {
            const supplier = window.supplierModule?.getSupplier(partyId);
            if (supplier) {
                supplier.totalDebt = totalDebt;
                window.supplierModule?.updateSupplier(partyId, { totalDebt });
            }
        }
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
            total: debts.reduce((sum, d) => sum + d.amount, 0),
            paid: debts.reduce((sum, d) => sum + d.paid, 0),
            remaining: debts.reduce((sum, d) => sum + d.remaining, 0),
            active: {
                count: active.length,
                amount: active.reduce((sum, d) => sum + d.remaining, 0)
            },
            byType: {
                customer: {
                    count: debts.filter(d => d.partyType === 'customer' && d.status !== 'paid').length,
                    amount: debts.filter(d => d.partyType === 'customer' && d.status !== 'paid')
                        .reduce((sum, d) => sum + d.remaining, 0)
                },
                supplier: {
                    count: debts.filter(d => d.partyType === 'supplier' && d.status !== 'paid').length,
                    amount: debts.filter(d => d.partyType === 'supplier' && d.status !== 'paid')
                        .reduce((sum, d) => sum + d.remaining, 0)
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
                amount: payments.reduce((sum, p) => sum + p.amount, 0)
            },
            today: {
                count: todayPayments.length,
                amount: todayPayments.reduce((sum, p) => sum + p.amount, 0)
            },
            thisMonth: {
                count: monthPayments.length,
                amount: monthPayments.reduce((sum, p) => sum + p.amount, 0)
            },
            byMethod: {
                cash: payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0),
                card: payments.filter(p => p.method === 'card').reduce((sum, p) => sum + p.amount, 0),
                check: payments.filter(p => p.method === 'check').reduce((sum, p) => sum + p.amount, 0),
                transfer: payments.filter(p => p.method === 'transfer').reduce((sum, p) => sum + p.amount, 0)
            }
        };
    }
    
    // ================== تسوية دين ==================
    function settleDebt(debtId, paymentMethod = 'cash') {
        const debt = debts.find(d => d.id == debtId);
        if (!debt) return false;
        
        if (debt.remaining <= 0) {
            utilsModule.showNotification('معلومة', 'الدين مسدد بالفعل', 'info');
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
        
        const debtPayments = payments.filter(p => p.debtId == debtId);
        if (debtPayments.length > 0) {
            utilsModule.showNotification('خطأ', 'لا يمكن حذف دين له دفعات', 'error');
            return false;
        }
        
        utilsModule.showConfirmation(
            'تأكيد الحذف',
            `هل أنت متأكد من حذف الدين رقم ${debt.number}؟`,
            () => {
                debts = debts.filter(d => d.id != debtId);
                saveDebts();
                updatePartyDebtStats(debt.partyId, debt.partyType);
                utilsModule.showNotification('تم', 'تم حذف الدين');
                renderDebts();
                renderAllDebts();
                renderCustomerDebts();
                renderSupplierDebts();
            }
        );
        
        return true;
    }
    
    // ================== عرض الديون في الجدول (الرئيسي) ==================
    function renderDebts() {
        const tbody = document.getElementById('debts-tbody');
        if (!tbody) return;
        
        const activeDebts = getActiveDebts();
        
        if (activeDebts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center p-4">لا توجد ديون نشطة</td></tr>';
            return;
        }
        
        tbody.innerHTML = activeDebts.map(debt => {
            const statusClass = debt.status === 'overdue' ? 'badge-danger' : 
                               debt.status === 'partial' ? 'badge-warning' : 'badge-info';
            const statusText = debt.status === 'overdue' ? 'متأخر' :
                              debt.status === 'partial' ? 'مسدد جزئياً' : 'نشط';
            
            const dueDate = debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('ar-EG') : '-';
            const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date() && debt.status !== 'paid';
            
            return `
            <tr>
                <td>${debt.number}</td>
                <td>${debt.partyName}</td>
                <td>${debt.partyType === 'customer' ? 'عميل' : 'مورد'}</td>
                <td>${utilsModule.formatCurrency(debt.amount)}</td>
                <td>${utilsModule.formatCurrency(debt.paid)}</td>
                <td>${utilsModule.formatCurrency(debt.remaining)}</td>
                <td>${dueDate} ${isOverdue ? '⚠️' : ''}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="debtModule.showDebtDetails('${debt.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="debtModule.showPaymentForm('${debt.id}')">
                        <i class="material-icons-round">payments</i>
                    </button>
                    ${debt.paid === 0 ? `
                        <button class="btn btn-sm btn-danger" onclick="debtModule.deleteDebt('${debt.id}')">
                            <i class="material-icons-round">delete</i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `}).join('');
    }
    
    // ================== عرض جميع الديون (للصفحة الرئيسية) ==================
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
                               debt.status === 'overdue' ? 'badge-danger' : 'badge-info';
            const statusText = debt.status === 'paid' ? 'مسدد' :
                              debt.status === 'partial' ? 'مسدد جزئياً' :
                              debt.status === 'overdue' ? 'متأخر' : 'نشط';
            
            const dueDate = debt.dueDate ? utilsModule.formatDateOnly(debt.dueDate) : '-';
            
            return `
            <tr>
                <td>${debt.number}</td>
                <td>${debt.partyName}</td>
                <td>${debt.partyType === 'customer' ? 'عميل' : 'مورد'}</td>
                <td>${utilsModule.formatCurrency(debt.amount)}</td>
                <td>${utilsModule.formatCurrency(debt.paid)}</td>
                <td>${utilsModule.formatCurrency(debt.remaining)}</td>
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
    
    // ================== عرض ديون العملاء ==================
    function renderCustomerDebts() {
        const tbody = document.getElementById('customer-debts-tbody');
        if (!tbody) return;
        
        const customerDebts = debts.filter(d => d.partyType === 'customer' && d.remaining > 0);
        
        if (customerDebts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4">لا توجد ديون على عملاء</td></tr>';
            return;
        }
        
        tbody.innerHTML = customerDebts.map(debt => {
            const dueDate = debt.dueDate ? utilsModule.formatDateOnly(debt.dueDate) : '-';
            const statusClass = debt.status === 'overdue' ? 'badge-danger' : 
                               debt.status === 'partial' ? 'badge-warning' : 'badge-info';
            
            return `
            <tr>
                <td>${debt.number}</td>
                <td>${debt.partyName}</td>
                <td>${utilsModule.formatCurrency(debt.amount)}</td>
                <td>${utilsModule.formatCurrency(debt.paid)}</td>
                <td>${utilsModule.formatCurrency(debt.remaining)}</td>
                <td>${dueDate}</td>
                <td><span class="${statusClass}">${debt.status === 'overdue' ? 'متأخر' : debt.status === 'partial' ? 'جزئي' : 'نشط'}</span></td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="debtModule.showPaymentForm('${debt.id}')">
                        <i class="material-icons-round">payments</i> دفع
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    // ================== عرض ديون الموردين ==================
    function renderSupplierDebts() {
        const tbody = document.getElementById('supplier-debts-tbody');
        if (!tbody) return;
        
        const supplierDebts = debts.filter(d => d.partyType === 'supplier' && d.remaining > 0);
        
        if (supplierDebts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4">لا توجد ديون على موردين</td></tr>';
            return;
        }
        
        tbody.innerHTML = supplierDebts.map(debt => {
            const dueDate = debt.dueDate ? utilsModule.formatDateOnly(debt.dueDate) : '-';
            const statusClass = debt.status === 'overdue' ? 'badge-danger' : 
                               debt.status === 'partial' ? 'badge-warning' : 'badge-info';
            
            return `
            <tr>
                <td>${debt.number}</td>
                <td>${debt.partyName}</td>
                <td>${utilsModule.formatCurrency(debt.amount)}</td>
                <td>${utilsModule.formatCurrency(debt.paid)}</td>
                <td>${utilsModule.formatCurrency(debt.remaining)}</td>
                <td>${dueDate}</td>
                <td><span class="${statusClass}">${debt.status === 'overdue' ? 'متأخر' : debt.status === 'partial' ? 'جزئي' : 'نشط'}</span></td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="debtModule.showPaymentForm('${debt.id}')">
                        <i class="material-icons-round">payments</i> دفع
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
                <td>${utilsModule.formatCurrency(p.amount)}</td>
                <td>${p.method === 'cash' ? 'نقدي' : p.method === 'card' ? 'بطاقة' : p.method === 'check' ? 'شيك' : 'تحويل'}</td>
                <td>${utilsModule.formatDate(p.date)}</td>
            </tr>
        `).join('');
    }
    
    // ================== البحث في الديون ==================
    function searchDebts(term) {
        term = term.toLowerCase();
        const filtered = debts.filter(d => 
            d.partyName.toLowerCase().includes(term) ||
            d.number.toLowerCase().includes(term)
        );
        
        const tbody = document.getElementById('all-debts-tbody');
        if (!tbody) return;
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(debt => {
            const statusClass = debt.status === 'paid' ? 'badge-success' :
                               debt.status === 'partial' ? 'badge-warning' : 
                               debt.status === 'overdue' ? 'badge-danger' : 'badge-info';
            const statusText = debt.status === 'paid' ? 'مسدد' :
                              debt.status === 'partial' ? 'مسدد جزئياً' :
                              debt.status === 'overdue' ? 'متأخر' : 'نشط';
            
            const dueDate = debt.dueDate ? utilsModule.formatDateOnly(debt.dueDate) : '-';
            
            return `
            <tr>
                <td>${debt.number}</td>
                <td>${debt.partyName}</td>
                <td>${debt.partyType === 'customer' ? 'عميل' : 'مورد'}</td>
                <td>${utilsModule.formatCurrency(debt.amount)}</td>
                <td>${utilsModule.formatCurrency(debt.paid)}</td>
                <td>${utilsModule.formatCurrency(debt.remaining)}</td>
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
                               debt.status === 'overdue' ? 'badge-danger' : 'badge-info';
            const statusText = debt.status === 'paid' ? 'مسدد' :
                              debt.status === 'partial' ? 'مسدد جزئياً' :
                              debt.status === 'overdue' ? 'متأخر' : 'نشط';
            
            const dueDate = debt.dueDate ? utilsModule.formatDateOnly(debt.dueDate) : '-';
            
            return `
            <tr>
                <td>${debt.number}</td>
                <td>${debt.partyName}</td>
                <td>${debt.partyType === 'customer' ? 'عميل' : 'مورد'}</td>
                <td>${utilsModule.formatCurrency(debt.amount)}</td>
                <td>${utilsModule.formatCurrency(debt.paid)}</td>
                <td>${utilsModule.formatCurrency(debt.remaining)}</td>
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
                <h4 style="margin-top:20px;">الدفعات</h4>
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f5f5f5;">
                            <th style="padding:8px; border:1px solid #ddd;">#</th>
                            <th style="padding:8px; border:1px solid #ddd;">التاريخ</th>
                            <th style="padding:8px; border:1px solid #ddd;">المبلغ</th>
                            <th style="padding:8px; border:1px solid #ddd;">طريقة الدفع</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${debtPayments.map((p, i) => `
                            <tr>
                                <td style="padding:8px; border:1px solid #ddd;">${i + 1}</td>
                                <td style="padding:8px; border:1px solid #ddd;">${utilsModule.formatDate(p.date)}</td>
                                <td style="padding:8px; border:1px solid #ddd;">${utilsModule.formatCurrency(p.amount)}</td>
                                <td style="padding:8px; border:1px solid #ddd;">${p.method === 'cash' ? 'نقدي' : p.method === 'card' ? 'بطاقة' : p.method === 'check' ? 'شيك' : 'تحويل'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        Swal.fire({
            title: `تفاصيل الدين ${debt.number}`,
            html: `
                <div style="text-align:right; max-height:500px; overflow-y:auto; padding:10px;">
                    <p><strong>الطرف:</strong> ${debt.partyName} (${debt.partyType === 'customer' ? 'عميل' : 'مورد'})</p>
                    <p><strong>تاريخ الإنشاء:</strong> ${utilsModule.formatDate(debt.createdAt)}</p>
                    <p><strong>تاريخ الاستحقاق:</strong> ${debt.dueDate ? utilsModule.formatDate(debt.dueDate) : 'غير محدد'}</p>
                    <p><strong>المبلغ الأصلي:</strong> ${utilsModule.formatCurrency(debt.amount)}</p>
                    <p><strong>المدفوع:</strong> ${utilsModule.formatCurrency(debt.paid)}</p>
                    <p><strong>المتبقي:</strong> ${utilsModule.formatCurrency(debt.remaining)}</p>
                    <p><strong>الحالة:</strong> ${debt.status === 'paid' ? 'مسدد' : debt.status === 'partial' ? 'مسدد جزئياً' : debt.status === 'overdue' ? 'متأخر' : 'نشط'}</p>
                    ${debt.invoiceNumber ? `<p><strong>رقم الفاتورة:</strong> ${debt.invoiceNumber}</p>` : ''}
                    ${debt.description ? `<p><strong>الوصف:</strong> ${debt.description}</p>` : ''}
                    ${debt.notes ? `<p><strong>ملاحظات:</strong> ${debt.notes}</p>` : ''}
                    ${paymentsHtml}
                </div>
            `,
            width: '800px',
            confirmButtonText: 'إغلاق'
        });
    }
    
    // ================== عرض نموذج الدفع ==================
    function showPaymentForm(debtId) {
        const debt = debts.find(d => d.id == debtId);
        if (!debt) return;
        
        Swal.fire({
            title: 'تسجيل دفعة',
            html: `
                <div style="text-align:right;">
                    <p><strong>الدين:</strong> ${debt.number}</p>
                    <p><strong>الطرف:</strong> ${debt.partyName}</p>
                    <p><strong>المتبقي:</strong> ${utilsModule.formatCurrency(debt.remaining)}</p>
                    <hr>
                    <div class="form-group">
                        <label>المبلغ</label>
                        <input type="number" id="payment-amount" class="form-control" value="${debt.remaining}" min="1" max="${debt.remaining}">
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
                const payment = addPayment({
                    debtId: debt.id,
                    amount: result.value.amount,
                    method: result.value.method,
                    date: new Date(result.value.date).toISOString(),
                    description: result.value.notes
                });
                
                if (payment) {
                    renderDebts();
                    renderAllDebts();
                    renderCustomerDebts();
                    renderSupplierDebts();
                    renderPayments();
                    updateStats();
                }
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
                    el.textContent = utilsModule.formatCurrency(value);
                } else {
                    el.textContent = value;
                }
            }
        });
    }
    
    // ================== تقرير الديون ==================
    function getDebtReport() {
        const stats = getTotalDebts();
        const overdue = getOverdueDebts();
        
        return {
            summary: stats,
            overdue: {
                count: overdue.length,
                amount: overdue.reduce((sum, d) => sum + d.remaining, 0),
                details: overdue
            },
            byParty: {
                customers: debts.filter(d => d.partyType === 'customer' && d.status !== 'paid')
                    .map(d => ({
                        name: d.partyName,
                        amount: d.remaining,
                        dueDate: d.dueDate
                    })),
                suppliers: debts.filter(d => d.partyType === 'supplier' && d.status !== 'paid')
                    .map(d => ({
                        name: d.partyName,
                        amount: d.remaining,
                        dueDate: d.dueDate
                    }))
            }
        };
    }
    
    // ================== تصدير الديون إلى CSV ==================
    function exportDebtsToCSV() {
        const headers = ['رقم الدين', 'الطرف', 'النوع', 'المبلغ', 'المدفوع', 'المتبقي', 'تاريخ الاستحقاق', 'الحالة'];
        const data = debts.map(d => ({
            number: d.number,
            party: d.partyName,
            type: d.partyType === 'customer' ? 'عميل' : 'مورد',
            amount: d.amount,
            paid: d.paid,
            remaining: d.remaining,
            dueDate: d.dueDate ? utilsModule.formatDate(d.dueDate) : '-',
            status: d.status === 'paid' ? 'مسدد' : d.status === 'partial' ? 'مسدد جزئياً' : d.status === 'overdue' ? 'متأخر' : 'نشط'
        }));
        
        utilsModule.exportToCSV(data, 'debts', headers);
    }
    
    // ================== تصدير الدفعات إلى CSV ==================
    function exportPaymentsToCSV() {
        const headers = ['رقم الدفعة', 'رقم الدين', 'الطرف', 'النوع', 'المبلغ', 'طريقة الدفع', 'التاريخ'];
        const data = payments.map(p => ({
            number: p.number,
            debtNumber: p.debtNumber,
            party: p.partyName,
            type: p.partyType === 'customer' ? 'عميل' : 'مورد',
            amount: p.amount,
            method: p.method === 'cash' ? 'نقدي' : p.method === 'card' ? 'بطاقة' : p.method === 'check' ? 'شيك' : 'تحويل',
            date: utilsModule.formatDate(p.date)
        }));
        
        utilsModule.exportToCSV(data, 'payments', headers);
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ debtModule initialized - الرقم 26');
        console.log(`   عدد الديون: ${debts.length}`);
        console.log(`   إجمالي المتبقي: ${utilsModule.formatCurrency(debts.reduce((sum, d) => sum + d.remaining, 0))}`);
        
        renderDebts();
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
        getDebtReport,
        
        // عرض
        renderDebts,
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
        
        // تصدير
        exportDebtsToCSV,
        exportPaymentsToCSV,
        
        // تهيئة
        init
    };
})();

// ================== تصدير للاستخدام العام ==================
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
    document.addEventListener('DOMContentLoaded', function() {
        if (debtModule && debtModule.init) {
            debtModule.init();
        }
    });
    
    document.addEventListener('html-loaded', function() {
        if (debtModule && debtModule.init) {
            debtModule.init();
        }
    });
}
