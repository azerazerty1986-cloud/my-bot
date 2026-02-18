
// ================== نظام الديون المتكامل - وحدة منفصلة ==================
const debtModule = (function() {
    let payments = JSON.parse(localStorage.getItem('payment_history')) || [];
    
    const CONFIG = {
        CURRENCY: 'دج',
        STORAGE_KEYS: {
            INVOICES: 'ryan_invoices',
            PURCHASES: 'ryan_purchases',
            CUSTOMERS: 'ryan_customers',
            SUPPLIERS: 'ryan_suppliers',
            PAYMENTS: 'payment_history'
        }
    };

    // ================== دوال مساعدة ==================
    function _formatCurrency(amount) {
        return `${Number(amount).toFixed(2)} ${CONFIG.CURRENCY}`;
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

    function _savePayments() {
        localStorage.setItem(CONFIG.STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    }

    // ================== حساب ديون العملاء ==================
    function calculateCustomerDebts() {
        const customers = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.CUSTOMERS)) || [];
        const invoices = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        
        const debts = [];
        let totalDebt = 0;
        let debtorCount = 0;
        let creditorCount = 0;
        let maxDebt = 0;
        let totalPaid = 0;
        
        customers.forEach(customer => {
            const customerInvoices = invoices.filter(inv => inv.customer === customer.name);
            const totalPurchases = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
            
            const paid = payments
                .filter(p => p.customer === customer.name)
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            
            const remaining = totalPurchases - paid;
            totalPaid += paid;
            
            let lastInvoice = '-';
            if (customerInvoices.length > 0) {
                const sorted = customerInvoices.sort((a, b) => new Date(b.date) - new Date(a.date));
                lastInvoice = sorted[0].date;
            }
            
            let lastPayment = '-';
            const customerPayments = payments.filter(p => p.customer === customer.name);
            if (customerPayments.length > 0) {
                const sorted = customerPayments.sort((a, b) => new Date(b.date) - new Date(a.date));
                lastPayment = sorted[0].date;
            }
            
            const isOverdue = remaining > (customer.maxDebt || 0) && remaining > 0;
            
            if (remaining > 0) {
                totalDebt += remaining;
                debtorCount++;
                if (remaining > maxDebt) maxDebt = remaining;
            } else {
                creditorCount++;
            }
            
            debts.push({
                name: customer.name,
                phone: customer.phone || '-',
                totalPurchases: totalPurchases,
                paid: paid,
                remaining: remaining,
                maxDebt: customer.maxDebt || 0,
                lastInvoice: lastInvoice,
                lastPayment: lastPayment,
                paymentCount: customerPayments.length,
                isOverdue: isOverdue
            });
        });
        
        return {
            debts: debts.sort((a, b) => b.remaining - a.remaining),
            totalDebt: totalDebt,
            totalPaid: totalPaid,
            debtorCount: debtorCount,
            creditorCount: creditorCount,
            maxDebt: maxDebt,
            avgDebt: debtorCount > 0 ? totalDebt / debtorCount : 0
        };
    }

    // ================== عرض ديون العملاء ==================
    function renderCustomerDebts() {
        const data = calculateCustomerDebts();
        
        const totalEl = document.getElementById('total-customer-debt');
        const debtorEl = document.getElementById('debtor-customers-count');
        const creditorEl = document.getElementById('creditor-customers-count');
        
        if (totalEl) totalEl.innerHTML = data.totalDebt.toFixed(2) + ' دج';
        if (debtorEl) debtorEl.innerHTML = data.debtorCount;
        if (creditorEl) creditorEl.innerHTML = data.creditorCount;
        
        const tbody = document.getElementById('customer-debts-tbody');
        if (!tbody) return;
        
        if (data.debts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4">لا توجد بيانات</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.debts.map(d => {
            let statusClass = 'bg-success';
            let statusText = 'دائن';
            
            if (d.remaining > 0) {
                statusClass = d.isOverdue ? 'bg-danger' : 'bg-warning';
                statusText = d.isOverdue ? 'متأخر' : 'مدين';
            }
            
            return `
            <tr>
                <td>${d.name}</td>
                <td>${d.phone}</td>
                <td>${_formatCurrency(d.totalPurchases)}</td>
                <td>${_formatCurrency(d.paid)}</td>
                <td class="${d.remaining > 0 ? 'text-danger fw-bold' : 'text-success'}">${_formatCurrency(d.remaining)}</td>
                <td>${_formatCurrency(d.maxDebt)}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${d.remaining > 0 ? 
                        `<button class="btn btn-sm btn-success" onclick="debtModule.payCustomerDebt('${d.name}')">
                            <i class="material-icons-round">payment</i> تسديد
                        </button>` : 
                        `<span class="badge bg-success">مدفوع</span>`
                    }
                </td>
            </tr>
        `}).join('');
    }

    // ================== تسديد دين عميل ==================
    function payCustomerDebt(customerName) {
        const data = calculateCustomerDebts();
        const customer = data.debts.find(d => d.name === customerName);
        
        if (!customer) {
            _showNotification('خطأ', 'العميل غير موجود', 'error');
            return;
        }
        
        if (customer.remaining <= 0) {
            _showNotification('معلومات', 'لا توجد ديون مستحقة', 'info');
            return;
        }
        
        Swal.fire({
            title: 'تسديد دين',
            html: `
                <div style="text-align:right; padding:10px;">
                    <p><strong>العميل:</strong> ${customerName}</p>
                    <p><strong>المتبقي:</strong> ${_formatCurrency(customer.remaining)}</p>
                    <hr>
                    <div class="form-group">
                        <label>المبلغ المدفوع</label>
                        <input type="number" id="payment-amount" class="form-control" value="${customer.remaining}" min="1" max="${customer.remaining}">
                    </div>
                    <div class="form-group">
                        <label>طريقة الدفع</label>
                        <select id="payment-method" class="form-select">
                            <option value="نقدي">💰 نقدي</option>
                            <option value="بطاقة">💳 بطاقة</option>
                            <option value="شيك">📝 شيك</option>
                        </select>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'تأكيد الدفع',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                const amount = parseFloat(document.getElementById('payment-amount').value);
                if (isNaN(amount) || amount <= 0) {
                    Swal.showValidationMessage('الرجاء إدخال مبلغ صحيح');
                    return false;
                }
                return amount;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const amount = result.value;
                const method = document.getElementById('payment-method').value;
                
                payments.push({
                    id: Date.now(),
                    customer: customerName,
                    amount: amount,
                    method: method,
                    date: new Date().toLocaleString('ar-DZ'),
                    timestamp: new Date().toISOString()
                });
                
                _savePayments();
                
                _showNotification('نجاح', 'تم تسديد الدين بنجاح', 'success');
                renderCustomerDebts();
            }
        });
    }

    // ================== حساب ديون الموردين ==================
    function calculateSupplierDebts() {
        const suppliers = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SUPPLIERS)) || [];
        const purchases = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PURCHASES)) || [];
        
        const debts = [];
        let totalDebt = 0;
        let debtorCount = 0;
        let creditorCount = 0;
        let maxDebt = 0;
        
        suppliers.forEach(supplier => {
            const supplierPurchases = purchases.filter(p => p.supplier === supplier.name);
            const totalPurchases = supplierPurchases.reduce((sum, p) => sum + (p.total || 0), 0);
            
            const paid = totalPurchases * 0.7;
            const remaining = totalPurchases - paid;
            
            let lastInvoice = '-';
            if (supplierPurchases.length > 0) {
                const sorted = supplierPurchases.sort((a, b) => new Date(b.date) - new Date(a.date));
                lastInvoice = sorted[0].date;
            }
            
            if (remaining > 0) {
                totalDebt += remaining;
                debtorCount++;
                if (remaining > maxDebt) maxDebt = remaining;
            } else {
                creditorCount++;
            }
            
            debts.push({
                name: supplier.name,
                phone: supplier.phone || '-',
                totalPurchases: totalPurchases,
                paid: paid,
                remaining: remaining,
                lastInvoice: lastInvoice
            });
        });
        
        return {
            debts: debts.sort((a, b) => b.remaining - a.remaining),
            totalDebt: totalDebt,
            debtorCount: debtorCount,
            creditorCount: creditorCount,
            maxDebt: maxDebt,
            avgDebt: debtorCount > 0 ? totalDebt / debtorCount : 0
        };
    }

    // ================== عرض ديون الموردين ==================
    function renderSupplierDebts() {
        const data = calculateSupplierDebts();
        
        const totalEl = document.getElementById('total-supplier-debt');
        const debtorEl = document.getElementById('debtor-suppliers-count');
        const creditorEl = document.getElementById('creditor-suppliers-count');
        
        if (totalEl) totalEl.innerHTML = data.totalDebt.toFixed(2) + ' دج';
        if (debtorEl) debtorEl.innerHTML = data.debtorCount;
        if (creditorEl) creditorEl.innerHTML = data.creditorCount;
        
        const tbody = document.getElementById('supplier-debts-tbody');
        if (!tbody) return;
        
        if (data.debts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد بيانات</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.debts.map(d => `
            <tr>
                <td>${d.name}</td>
                <td>${d.phone}</td>
                <td>${_formatCurrency(d.totalPurchases)}</td>
                <td>${_formatCurrency(d.paid)}</td>
                <td class="${d.remaining > 0 ? 'text-danger fw-bold' : 'text-success'}">${_formatCurrency(d.remaining)}</td>
                <td>${d.lastInvoice}</td>
            </tr>
        `).join('');
    }

    // ================== عرض ملخص الديون ==================
    function renderDebtSummary() {
        const customerData = calculateCustomerDebts();
        const supplierData = calculateSupplierDebts();
        
        const summaryCustomerDebt = document.getElementById('summary-customer-debt');
        const summaryDebtorCustomers = document.getElementById('summary-debtor-customers');
        const maxCustomerDebt = document.getElementById('max-customer-debt');
        const avgCustomerDebt = document.getElementById('avg-customer-debt');
        
        if (summaryCustomerDebt) summaryCustomerDebt.innerHTML = customerData.totalDebt.toFixed(2) + ' دج';
        if (summaryDebtorCustomers) summaryDebtorCustomers.innerHTML = customerData.debtorCount;
        if (maxCustomerDebt) maxCustomerDebt.innerHTML = customerData.maxDebt.toFixed(2) + ' دج';
        if (avgCustomerDebt) avgCustomerDebt.innerHTML = customerData.avgDebt.toFixed(2) + ' دج';
        
        const summarySupplierDebt = document.getElementById('summary-supplier-debt');
        const summaryDebtorSuppliers = document.getElementById('summary-debtor-suppliers');
        const maxSupplierDebt = document.getElementById('max-supplier-debt');
        const avgSupplierDebt = document.getElementById('avg-supplier-debt');
        
        if (summarySupplierDebt) summarySupplierDebt.innerHTML = supplierData.totalDebt.toFixed(2) + ' دج';
        if (summaryDebtorSuppliers) summaryDebtorSuppliers.innerHTML = supplierData.debtorCount;
        if (maxSupplierDebt) maxSupplierDebt.innerHTML = supplierData.maxDebt.toFixed(2) + ' دج';
        if (avgSupplierDebt) avgSupplierDebt.innerHTML = supplierData.avgDebt.toFixed(2) + ' دج';
        
        const netDebt = document.getElementById('net-debt');
        if (netDebt) netDebt.innerHTML = (customerData.totalDebt - supplierData.totalDebt).toFixed(2) + ' دج';
    }

    // ================== فلترة ديون العملاء ==================
    function filterCustomerDebts() {
        const filter = document.getElementById('debt-filter')?.value || 'all';
        const searchTerm = document.getElementById('debt-search')?.value.toLowerCase().trim() || '';
        
        const data = calculateCustomerDebts();
        let filtered = data.debts;
        
        if (filter === 'debtor') filtered = filtered.filter(d => d.remaining > 0);
        else if (filter === 'clean') filtered = filtered.filter(d => d.remaining <= 0);
        
        if (searchTerm) {
            filtered = filtered.filter(d => 
                d.name.toLowerCase().includes(searchTerm) || 
                d.phone.includes(searchTerm)
            );
        }
        
        renderFilteredCustomerDebts(filtered);
    }

    function renderFilteredCustomerDebts(filtered) {
        const tbody = document.getElementById('customer-debts-tbody');
        if (!tbody) return;
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(d => {
            let statusClass = 'bg-success';
            let statusText = 'دائن';
            
            if (d.remaining > 0) {
                statusClass = d.isOverdue ? 'bg-danger' : 'bg-warning';
                statusText = d.isOverdue ? 'متأخر' : 'مدين';
            }
            
            return `
            <tr>
                <td>${d.name}</td>
                <td>${d.phone}</td>
                <td>${_formatCurrency(d.totalPurchases)}</td>
                <td>${_formatCurrency(d.paid)}</td>
                <td class="${d.remaining > 0 ? 'text-danger fw-bold' : 'text-success'}">${_formatCurrency(d.remaining)}</td>
                <td>${_formatCurrency(d.maxDebt)}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${d.remaining > 0 ? 
                        `<button class="btn btn-sm btn-success" onclick="debtModule.payCustomerDebt('${d.name}')">
                            <i class="material-icons-round">payment</i>
                        </button>` : 
                        `<span class="badge bg-success">✓</span>`
                    }
                </td>
            </tr>
        `}).join('');
    }

    function searchCustomerDebts() {
        filterCustomerDebts();
    }

    // ================== تصدير ديون العملاء إلى Excel ==================
    function exportDebtsToExcel() {
        const data = calculateCustomerDebts();
        
        const rows = data.debts.map(d => ({
            'العميل': d.name,
            'الهاتف': d.phone,
            'إجمالي المشتريات': d.totalPurchases.toFixed(2),
            'المدفوع': d.paid.toFixed(2),
            'المتبقي': d.remaining.toFixed(2),
            'الحد المسموح': d.maxDebt,
            'آخر فاتورة': d.lastInvoice,
            'آخر دفعة': d.lastPayment,
            'الحالة': d.remaining > 0 ? (d.isOverdue ? 'متأخر' : 'مدين') : 'دائن'
        }));
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "ديون العملاء");
        
        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;
        XLSX.writeFile(wb, `ديون_العملاء_${dateStr}.xlsx`);
        
        _showNotification('نجاح', 'تم تصدير التقرير', 'success');
    }

    function init() {
        if (document.getElementById('customer-debts-tbody')) renderCustomerDebts();
        if (document.getElementById('supplier-debts-tbody')) renderSupplierDebts();
        if (document.getElementById('summary-customer-debt')) renderDebtSummary();
    }

    return {
        calculateCustomerDebts,
        calculateSupplierDebts,
        renderCustomerDebts,
        renderSupplierDebts,
        renderDebtSummary,
        payCustomerDebt,
        filterCustomerDebts,
        searchCustomerDebts,
        exportDebtsToExcel,
        init
    };
})();

window.debtModule = debtModule;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof debtModule !== 'undefined' && debtModule.init) debtModule.init();
});
