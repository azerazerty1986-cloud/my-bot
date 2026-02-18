// ================== نظام الديون والتقارير المتكامل ==================
const reportsModule = (function() {
    // ================== المتغيرات الخاصة ==================
    let movements = JSON.parse(localStorage.getItem('ryan_movements')) || [];
    let payments = JSON.parse(localStorage.getItem('payment_history')) || [];
    
    const CONFIG = {
        CURRENCY: 'دج',
        STORAGE_KEYS: {
            MOVEMENTS: 'ryan_movements',
            INVOICES: 'ryan_invoices',
            PURCHASES: 'ryan_purchases',
            CUSTOMERS: 'ryan_customers',
            SUPPLIERS: 'ryan_suppliers',
            STOCK: 'ryan_stock',
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

    // ================== حساب ديون العملاء المتقدم ==================
    function calculateCustomerDebts() {
        const customers = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.CUSTOMERS)) || [];
        const invoices = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        const payments = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PAYMENTS)) || [];
        
        const debts = [];
        let totalDebt = 0;
        let debtorCount = 0;
        let creditorCount = 0;
        let maxDebt = 0;
        let totalPaid = 0;
        
        customers.forEach(customer => {
            // فواتير هذا العميل
            const customerInvoices = invoices.filter(inv => inv.customer === customer.name);
            const totalPurchases = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
            
            // المدفوعات التي تمت
            const paid = payments
                .filter(p => p.customer === customer.name)
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            
            const remaining = totalPurchases - paid;
            totalPaid += paid;
            
            // آخر فاتورة
            let lastInvoice = '-';
            if (customerInvoices.length > 0) {
                const sorted = customerInvoices.sort((a, b) => 
                    new Date(b.date) - new Date(a.date)
                );
                lastInvoice = sorted[0].date;
            }
            
            // آخر دفعة
            let lastPayment = '-';
            const customerPayments = payments.filter(p => p.customer === customer.name);
            if (customerPayments.length > 0) {
                const sorted = customerPayments.sort((a, b) => 
                    new Date(b.date) - new Date(a.date)
                );
                lastPayment = sorted[0].date;
            }
            
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
                alertDays: customer.alertDays || 0,
                lastInvoice: lastInvoice,
                lastPayment: lastPayment,
                paymentCount: customerPayments.length,
                isOverdue: remaining > (customer.maxDebt || 0) && remaining > 0
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

    // ================== حساب ديون الموردين المتقدم ==================
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
            
            // المدفوعات (نفترض 70% مدفوع)
            const paid = totalPurchases * 0.7;
            const remaining = totalPurchases - paid;
            
            let lastInvoice = '-';
            if (supplierPurchases.length > 0) {
                const sorted = supplierPurchases.sort((a, b) => 
                    new Date(b.date) - new Date(a.date)
                );
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
                lastInvoice: lastInvoice,
                invoiceCount: supplierPurchases.length
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

    // ================== تسديد دين عميل ==================
    function payCustomerDebt(customerName) {
        const data = calculateCustomerDebts();
        const customer = data.debts.find(d => d.name === customerName);
        
        if (!customer) {
            _showNotification('خطأ', 'العميل غير موجود', 'error');
            return;
        }
        
        if (customer.remaining <= 0) {
            _showNotification('معلومات', 'لا توجد ديون مستحقة لهذا العميل', 'info');
            return;
        }
        
        Swal.fire({
            title: 'تسديد دين',
            html: `
                <div style="text-align:right; padding:10px;">
                    <p><strong>العميل:</strong> ${customerName}</p>
                    <p><strong>إجمالي الديون:</strong> ${customer.remaining.toFixed(2)} دج</p>
                    <hr>
                    <div class="form-group mb-3">
                        <label class="form-label">المبلغ المدفوع</label>
                        <input type="number" id="payment-amount" class="form-control" value="${customer.remaining}" min="1" max="${customer.remaining}">
                    </div>
                    <div class="form-group mb-3">
                        <label class="form-label">طريقة الدفع</label>
                        <select id="payment-method" class="form-select">
                            <option value="نقدي">💰 نقدي</option>
                            <option value="بطاقة">💳 بطاقة</option>
                            <option value="شيك">📝 شيك</option>
                            <option value="تحويل">🏦 تحويل بنكي</option>
                        </select>
                    </div>
                    <div class="form-group mb-3">
                        <label class="form-label">ملاحظات</label>
                        <textarea id="payment-notes" class="form-control" rows="2" placeholder="ملاحظات إضافية"></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'تأكيد الدفع',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#28a745',
            preConfirm: () => {
                const amount = parseFloat(document.getElementById('payment-amount').value);
                const method = document.getElementById('payment-method').value;
                const notes = document.getElementById('payment-notes').value;
                
                if (isNaN(amount) || amount <= 0) {
                    Swal.showValidationMessage('الرجاء إدخال مبلغ صحيح');
                    return false;
                }
                
                if (amount > customer.remaining) {
                    Swal.showValidationMessage('المبلغ أكبر من الدين المتبقي');
                    return false;
                }
                
                return { amount, method, notes };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const { amount, method, notes } = result.value;
                
                // تسجيل الدفعة
                const payment = {
                    id: Date.now(),
                    customer: customerName,
                    amount: amount,
                    method: method,
                    notes: notes,
                    date: new Date().toLocaleString('ar-DZ'),
                    timestamp: new Date().toISOString()
                };
                
                payments.push(payment);
                localStorage.setItem(CONFIG.STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
                
                const newRemaining = customer.remaining - amount;
                
                // إنشاء إيصال الدفع
                const receipt = `
                    <div style="text-align:right; font-family: 'Courier New', monospace;">
                        <h3 style="text-align:center;">إيصال سداد</h3>
                        <hr>
                        <p><strong>التاريخ:</strong> ${new Date().toLocaleString('ar-DZ')}</p>
                        <p><strong>العميل:</strong> ${customerName}</p>
                        <p><strong>المبلغ:</strong> ${amount.toFixed(2)} دج</p>
                        <p><strong>طريقة الدفع:</strong> ${method}</p>
                        ${notes ? `<p><strong>ملاحظات:</strong> ${notes}</p>` : ''}
                        <hr>
                        <p><strong>المتبقي بعد السداد:</strong> ${newRemaining.toFixed(2)} دج</p>
                        <p style="text-align:center; margin-top:20px;">شكراً لتعاملكم معنا</p>
                    </div>
                `;
                
                Swal.fire({
                    icon: 'success',
                    title: 'تم التسديد بنجاح',
                    html: receipt,
                    showCancelButton: true,
                    confirmButtonText: 'طباعة الإيصال',
                    cancelButtonText: 'إغلاق'
                }).then((printResult) => {
                    if (printResult.isConfirmed) {
                        printPaymentReceipt(payment, customerName, newRemaining);
                    }
                });
                
                // تحديث التقارير
                renderCustomerDebts();
                renderDebtSummary();
            }
        });
    }

    // ================== طباعة إيصال الدفع ==================
    function printPaymentReceipt(payment, customerName, remaining) {
        const receiptWindow = window.open('', '_blank');
        receiptWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>إيصال سداد</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; }
                    .receipt { max-width: 300px; margin: 0 auto; }
                    h3 { text-align: center; }
                    hr { border: 1px dashed #000; }
                    .footer { text-align: center; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <h3>إيصال سداد</h3>
                    <hr>
                    <p><strong>التاريخ:</strong> ${payment.date}</p>
                    <p><strong>العميل:</strong> ${customerName}</p>
                    <p><strong>المبلغ:</strong> ${payment.amount.toFixed(2)} دج</p>
                    <p><strong>طريقة الدفع:</strong> ${payment.method}</p>
                    ${payment.notes ? `<p><strong>ملاحظات:</strong> ${payment.notes}</p>` : ''}
                    <hr>
                    <p><strong>المتبقي:</strong> ${remaining.toFixed(2)} دج</p>
                    <div class="footer">
                        <p>شكراً لتعاملكم معنا</p>
                    </div>
                </div>
            </body>
            </html>
        `);
        receiptWindow.document.close();
        receiptWindow.print();
    }

    // ================== عرض ديون العملاء مع تحسينات ==================
    function renderCustomerDebts() {
        const data = calculateCustomerDebts();
        
        // تحديث الإحصائيات
        document.getElementById('total-customer-debt').innerHTML = data.totalDebt.toFixed(2) + ' دج';
        document.getElementById('debtor-customers-count').innerHTML = data.debtorCount;
        document.getElementById('creditor-customers-count').innerHTML = data.creditorCount;
        
        const tbody = document.getElementById('customer-debts-tbody');
        if (!tbody) return;
        
        if (data.debts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center p-4">لا توجد بيانات</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.debts.map(d => {
            let statusClass = 'bg-success';
            let statusText = 'دائن';
            
            if (d.remaining > 0) {
                if (d.isOverdue) {
                    statusClass = 'bg-danger';
                    statusText = 'متأخر ⚠️';
                } else {
                    statusClass = 'bg-warning';
                    statusText = 'مدين';
                }
            }
            
            return `
            <tr>
                <td>${d.name}</td>
                <td>${d.phone}</td>
                <td>${d.totalPurchases.toFixed(2)} دج</td>
                <td>${d.paid.toFixed(2)} دج</td>
                <td class="${d.remaining > 0 ? 'text-danger fw-bold' : 'text-success'}">${d.remaining.toFixed(2)} دج</td>
                <td>${d.maxDebt} دج</td>
                <td>${d.lastInvoice}</td>
                <td>${d.lastPayment}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${d.remaining > 0 ? 
                        `<button class="btn btn-sm btn-success" onclick="reportsModule.payCustomerDebt('${d.name}')">
                            <i class="material-icons-round">payment</i> تسديد
                        </button>` : 
                        `<span class="badge bg-success">مدفوع</span>`
                    }
                    ${d.paymentCount > 0 ? 
                        `<button class="btn btn-sm btn-info mt-1" onclick="reportsModule.showPaymentHistory('${d.name}')">
                            <i class="material-icons-round">history</i>
                        </button>` : ''
                    }
                </td>
            </tr>
        `}).join('');
    }

    // ================== عرض سجل المدفوعات ==================
    function showPaymentHistory(customerName) {
        const customerPayments = payments
            .filter(p => p.customer === customerName)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (customerPayments.length === 0) {
            _showNotification('معلومات', 'لا يوجد سجل مدفوعات', 'info');
            return;
        }
        
        let html = '<div style="max-height:300px; overflow-y:auto;">';
        html += '<table class="table table-sm">';
        html += '<thead><tr><th>التاريخ</th><th>المبلغ</th><th>طريقة الدفع</th><th>ملاحظات</th></tr></thead>';
        html += '<tbody>';
        
        customerPayments.forEach(p => {
            html += `
                <tr>
                    <td>${p.date}</td>
                    <td class="text-success fw-bold">${p.amount.toFixed(2)} دج</td>
                    <td>${p.method}</td>
                    <td>${p.notes || '-'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        
        Swal.fire({
            title: `سجل مدفوعات ${customerName}`,
            html: html,
            width: '600px',
            confirmButtonText: 'إغلاق'
        });
    }

    // ================== عرض ديون الموردين المحسن ==================
    function renderSupplierDebts() {
        const data = calculateSupplierDebts();
        
        document.getElementById('total-supplier-debt').innerHTML = data.totalDebt.toFixed(2) + ' دج';
        document.getElementById('debtor-suppliers-count').innerHTML = data.debtorCount;
        document.getElementById('creditor-suppliers-count').innerHTML = data.creditorCount;
        
        const tbody = document.getElementById('supplier-debts-tbody');
        if (!tbody) return;
        
        if (data.debts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">لا توجد بيانات</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.debts.map(d => `
            <tr>
                <td>${d.name}</td>
                <td>${d.phone}</td>
                <td>${d.totalPurchases.toFixed(2)} دج</td>
                <td>${d.paid.toFixed(2)} دج</td>
                <td class="${d.remaining > 0 ? 'text-danger fw-bold' : 'text-success'}">${d.remaining.toFixed(2)} دج</td>
                <td>${d.lastInvoice}</td>
                <td>${d.invoiceCount}</td>
            </tr>
        `).join('');
    }

    // ================== عرض ملخص الديون المتقدم ==================
    function renderDebtSummary() {
        const customerData = calculateCustomerDebts();
        const supplierData = calculateSupplierDebts();
        
        // تحديث إحصائيات العملاء
        document.getElementById('summary-customer-debt').innerHTML = customerData.totalDebt.toFixed(2) + ' دج';
        document.getElementById('summary-debtor-customers').innerHTML = customerData.debtorCount;
        document.getElementById('summary-creditor-customers').innerHTML = customerData.creditorCount;
        document.getElementById('max-customer-debt').innerHTML = customerData.maxDebt.toFixed(2) + ' دج';
        document.getElementById('avg-customer-debt').innerHTML = customerData.avgDebt.toFixed(2) + ' دج';
        document.getElementById('total-customer-paid').innerHTML = customerData.totalPaid.toFixed(2) + ' دج';
        
        // تحديث إحصائيات الموردين
        document.getElementById('summary-supplier-debt').innerHTML = supplierData.totalDebt.toFixed(2) + ' دج';
        document.getElementById('summary-debtor-suppliers').innerHTML = supplierData.debtorCount;
        document.getElementById('summary-creditor-suppliers').innerHTML = supplierData.creditorCount;
        document.getElementById('max-supplier-debt').innerHTML = supplierData.maxDebt.toFixed(2) + ' دج';
        document.getElementById('avg-supplier-debt').innerHTML = supplierData.avgDebt.toFixed(2) + ' دج';
        
        // صافي الديون
        const netDebt = customerData.totalDebt - supplierData.totalDebt;
        document.getElementById('net-debt').innerHTML = netDebt.toFixed(2) + ' دج';
        
        // نسبة التحصيل
        const collectionRate = customerData.totalDebt > 0 
            ? ((customerData.totalPaid / (customerData.totalDebt + customerData.totalPaid)) * 100).toFixed(1)
            : 0;
        document.getElementById('collection-rate').innerHTML = collectionRate + '%';
    }

    // ================== فلترة ديون العملاء ==================
    function filterCustomerDebts() {
        const filter = document.getElementById('debt-filter').value;
        const searchTerm = document.getElementById('debt-search').value.toLowerCase().trim();
        
        const data = calculateCustomerDebts();
        let filtered = data.debts;
        
        // تطبيق الفلتر
        switch(filter) {
            case 'debtor':
                filtered = filtered.filter(d => d.remaining > 0);
                break;
            case 'overdue':
                filtered = filtered.filter(d => d.isOverdue);
                break;
            case 'clean':
                filtered = filtered.filter(d => d.remaining <= 0);
                break;
        }
        
        // تطبيق البحث
        if (searchTerm) {
            filtered = filtered.filter(d => 
                d.name.toLowerCase().includes(searchTerm) || 
                d.phone.includes(searchTerm)
            );
        }
        
        // عرض النتائج المفلترة
        renderFilteredCustomerDebts(filtered);
    }

    // ================== عرض ديون العملاء المفلترة ==================
    function renderFilteredCustomerDebts(filteredDebts) {
        const tbody = document.getElementById('customer-debts-tbody');
        if (!tbody) return;
        
        if (filteredDebts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center p-4">لا توجد نتائج للبحث</td></tr>';
            return;
        }
        
        tbody.innerHTML = filteredDebts.map(d => {
            let statusClass = 'bg-success';
            let statusText = 'دائن';
            
            if (d.remaining > 0) {
                if (d.isOverdue) {
                    statusClass = 'bg-danger';
                    statusText = 'متأخر ⚠️';
                } else {
                    statusClass = 'bg-warning';
                    statusText = 'مدين';
                }
            }
            
            return `
            <tr>
                <td>${d.name}</td>
                <td>${d.phone}</td>
                <td>${d.totalPurchases.toFixed(2)} دج</td>
                <td>${d.paid.toFixed(2)} دج</td>
                <td class="${d.remaining > 0 ? 'text-danger fw-bold' : 'text-success'}">${d.remaining.toFixed(2)} دج</td>
                <td>${d.maxDebt} دج</td>
                <td>${d.lastInvoice}</td>
                <td>${d.lastPayment}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${d.remaining > 0 ? 
                        `<button class="btn btn-sm btn-success" onclick="reportsModule.payCustomerDebt('${d.name}')">
                            <i class="material-icons-round">payment</i>
                        </button>` : 
                        `<span class="badge bg-success">✓</span>`
                    }
                    ${d.paymentCount > 0 ? 
                        `<button class="btn btn-sm btn-info mt-1" onclick="reportsModule.showPaymentHistory('${d.name}')">
                            <i class="material-icons-round">history</i>
                        </button>` : ''
                    }
                </td>
            </tr>
        `}).join('');
    }

    // ================== تصدير تقارير الديون إلى Excel ==================
    function exportDebtsToExcel() {
        const customerData = calculateCustomerDebts();
        const supplierData = calculateSupplierDebts();
        
        // تحضير بيانات العملاء
        const customerRows = customerData.debts.map(d => ({
            'العميل': d.name,
            'الهاتف': d.phone,
            'إجمالي المشتريات': d.totalPurchases,
            'المدفوع': d.paid,
            'المتبقي': d.remaining,
            'الحد المسموح': d.maxDebt,
            'آخر فاتورة': d.lastInvoice,
            'آخر دفعة': d.lastPayment,
            'الحالة': d.remaining > 0 ? (d.isOverdue ? 'متأخر' : 'مدين') : 'دائن'
        }));
        
        // تحضير بيانات الموردين
        const supplierRows = supplierData.debts.map(d => ({
            'المورد': d.name,
            'الهاتف': d.phone,
            'إجمالي المشتريات': d.totalPurchases,
            'المدفوع': d.paid,
            'المتبقي': d.remaining,
            'آخر فاتورة': d.lastInvoice,
            'عدد الفواتير': d.invoiceCount
        }));
        
        // إنشاء مصنف Excel
        const wb = XLSX.utils.book_new();
        
        const wsCustomers = XLSX.utils.json_to_sheet(customerRows);
        const wsSuppliers = XLSX.utils.json_to_sheet(supplierRows);
        
        XLSX.utils.book_append_sheet(wb, wsCustomers, "ديون العملاء");
        XLSX.utils.book_append_sheet(wb, wsSuppliers, "ديون الموردين");
        
        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;
        
        XLSX.writeFile(wb, `تقرير_الديون_${dateStr}.xlsx`);
        
        _showNotification('نجاح', 'تم تصدير تقرير الديون بنجاح', 'success');
    }

    // ================== إرجاع الوحدة ==================
    return {
        renderCustomerDebts,
        renderSupplierDebts,
        renderDebtSummary,
        payCustomerDebt,
        showPaymentHistory,
        filterCustomerDebts,
        exportDebtsToExcel,
        calculateCustomerDebts,
        calculateSupplierDebts
    };
})();

window.reportsModule = reportsModule;
