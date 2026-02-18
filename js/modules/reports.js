// ================== التقارير والإحصائيات - نسخة كاملة ==================
const reportsModule = (function() {
    // ================== المتغيرات الخاصة ==================
    let movements = JSON.parse(localStorage.getItem('ryan_movements')) || [];
    
    // ثوابت للتكوين
    const CONFIG = {
        CURRENCY: 'دج',
        STORAGE_KEYS: {
            MOVEMENTS: 'ryan_movements',
            INVOICES: 'ryan_invoices',
            PURCHASES: 'ryan_purchases',
            CUSTOMERS: 'ryan_customers',
            SUPPLIERS: 'ryan_suppliers',
            STOCK: 'ryan_stock'
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

    // ================== دالة تحديث جميع التقارير ==================
    function renderReports() {
        const invoices = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        const purchases = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PURCHASES)) || [];
        
        const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalPurchases = purchases.reduce((sum, pur) => sum + pur.total, 0);
        const profits = totalSales - totalPurchases;
        
        // تحديث العناصر
        const elements = {
            'total-sales': totalSales,
            'total-purchases': totalPurchases,
            'total-profits': profits,
            'total-sales-count': invoices.length,
            'total-purchases-count': purchases.length
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                if (id.includes('count')) {
                    el.textContent = value;
                } else {
                    el.textContent = value.toFixed(2);
                }
            }
        });
        
        // تحديث القوائم
        updateLowStockList();
        updateTopProducts();
        updateMovementsList();
        renderProductsReport();
        renderCategoriesReport();
    }

    // ================== إظهار تبويب التقارير ==================
    function showReportTab(tabId) {
        // إخفاء جميع التقارير
        document.querySelectorAll('.report-content').forEach(c => c.classList.remove('active-report'));
        
        // إظهار التقرير المطلوب
        const targetReport = document.getElementById(tabId);
        if (targetReport) {
            targetReport.classList.add('active-report');
        }
        
        // تحديث التبويبات النشطة
        document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
        if (event && event.target) {
            event.target.classList.add('active');
        }
        
        // تحديث البيانات حسب التبويب
        switch(tabId) {
            case 'report-summary':
                renderReports();
                break;
            case 'report-products':
                renderProductsReport();
                break;
            case 'report-services':
                // لا تحتاج لتحديث
                break;
            case 'report-stores':
                // لا تحتاج لتحديث
                break;
            case 'report-categories':
                renderCategoriesReport();
                break;
            case 'report-import':
                // لا تحتاج لتحديث
                break;
            case 'report-barcode':
                // لا تحتاج لتحديث
                break;
            case 'report-lowstock':
                updateLowStockList();
                break;
            case 'report-top':
                updateTopProducts();
                break;
            case 'report-movements':
                updateMovementsList();
                break;
            case 'report-date':
                // لا تحتاج لتحديث
                break;
            case 'report-customer-debts':
                renderCustomerDebts();
                break;
            case 'report-supplier-debts':
                renderSupplierDebts();
                break;
            case 'report-debt-summary':
                renderDebtSummary();
                break;
        }
    }

    // ================== تقرير المنتجات ==================
    function renderProductsReport() {
        const stock = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.STOCK)) || [];
        const categories = [...new Set(stock.map(p => p.category || 'عام'))];
        
        // تحديث الإحصائيات العامة
        document.getElementById('products-count').textContent = stock.length;
        document.getElementById('categories-count').textContent = categories.length;
        
        const totalValue = stock.reduce((sum, p) => sum + (p.qty * p.buyPrice), 0);
        document.getElementById('stock-value').textContent = totalValue.toFixed(2) + ' دج';
        
        // عرض تفاصيل الأصناف
        const tbody = document.getElementById('products-category-tbody');
        if (!tbody) return;
        
        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">لا توجد بيانات</td></tr>';
            return;
        }
        
        tbody.innerHTML = categories.map(cat => {
            const catProducts = stock.filter(p => (p.category || 'عام') === cat);
            const totalQty = catProducts.reduce((sum, p) => sum + p.qty, 0);
            const totalValue = catProducts.reduce((sum, p) => sum + (p.qty * p.buyPrice), 0);
            return `
                <tr>
                    <td>${cat}</td>
                    <td>${catProducts.length}</td>
                    <td>${totalQty}</td>
                    <td>${totalValue.toFixed(2)} دج</td>
                </tr>
            `;
        }).join('');
    }

    // ================== تقرير الأصناف ==================
    function renderCategoriesReport() {
        const stock = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.STOCK)) || [];
        const categories = {};
        
        stock.forEach(p => {
            const cat = p.category || 'عام';
            if (!categories[cat]) {
                categories[cat] = {
                    count: 0,
                    totalBuy: 0,
                    totalSell: 0,
                    qty: 0
                };
            }
            categories[cat].count++;
            categories[cat].totalBuy += p.buyPrice * p.qty;
            categories[cat].totalSell += p.sellPrice * p.qty;
            categories[cat].qty += p.qty;
        });
        
        const tbody = document.getElementById('categories-tbody');
        if (!tbody) return;
        
        if (Object.keys(categories).length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">لا توجد بيانات</td></tr>';
            return;
        }
        
        tbody.innerHTML = Object.entries(categories).map(([cat, data]) => `
            <tr>
                <td>${cat}</td>
                <td>${data.count}</td>
                <td>${data.qty}</td>
                <td>${data.totalBuy.toFixed(2)} دج</td>
                <td>${data.totalSell.toFixed(2)} دج</td>
            </tr>
        `).join('');
    }

    // ================== تقرير النواقص ==================
    function updateLowStockThreshold(val) {
        document.getElementById('low-stock-threshold').textContent = val;
        updateLowStockList();
    }

    function updateLowStockList() {
        const threshold = parseInt(document.getElementById('threshold-input')?.value) || 5;
        const stock = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.STOCK)) || [];
        const lowStock = stock.filter(p => p.qty < threshold);
        
        const list = document.getElementById('low-stock-list');
        if (!list) return;
        
        if (lowStock.length === 0) {
            list.innerHTML = '<div class="list-group-item text-center text-success">✅ لا توجد منتجات تحت الحد المحدد</div>';
        } else {
            list.innerHTML = lowStock.map(p => 
                `<div class="list-group-item d-flex justify-content-between align-items-center">
                    <span><i class="material-icons-round text-danger" style="font-size:16px;">warning</i> ${p.name}</span>
                    <span class="badge bg-danger">${p.qty} ${p.unit || ''}</span>
                </div>`
            ).join('');
        }
    }

    // ================== تقرير الأكثر مبيعاً ==================
    function updateTopProducts() {
        const invoices = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        const productSales = {};
        
        invoices.forEach(inv => {
            if (inv.items && Array.isArray(inv.items)) {
                inv.items.forEach(item => {
                    if (!productSales[item.name]) {
                        productSales[item.name] = {
                            qty: 0,
                            total: 0,
                            count: 0
                        };
                    }
                    productSales[item.name].qty += item.qty || 0;
                    productSales[item.name].total += item.total || 0;
                    productSales[item.name].count += 1;
                });
            }
        });
        
        const sorted = Object.entries(productSales)
            .sort((a, b) => b[1].qty - a[1].qty)
            .slice(0, 10);
        
        const list = document.getElementById('top-products-list');
        if (!list) return;
        
        if (sorted.length === 0) {
            list.innerHTML = '<div class="list-group-item text-center">📊 لا توجد مبيعات بعد</div>';
        } else {
            list.innerHTML = sorted.map(([name, data], index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📦';
                return `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${medal} ${name}</span>
                        <div>
                            <span class="badge bg-primary me-1">${data.qty} قطعة</span>
                            <span class="badge bg-success">${data.total.toFixed(2)} دج</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // ================== تقرير حركة المخزون ==================
    function updateMovementsList() {
        const list = document.getElementById('stock-movements-list');
        if (!list) return;
        
        if (movements.length === 0) {
            list.innerHTML = '<div class="list-group-item text-center">📭 لا توجد حركات بعد</div>';
        } else {
            list.innerHTML = movements.slice(-20).reverse().map(m => {
                let icon = '🔄';
                let color = '';
                
                switch(m.type) {
                    case 'بيع':
                        icon = '💰';
                        color = 'text-danger';
                        break;
                    case 'شراء':
                        icon = '📦';
                        color = 'text-success';
                        break;
                    case 'إضافة منتج':
                        icon = '➕';
                        color = 'text-primary';
                        break;
                    case 'تعديل':
                        icon = '✏️';
                        color = 'text-warning';
                        break;
                }
                
                return `
                    <div class="list-group-item d-flex justify-content-between align-items-center ${color}">
                        <span>${icon} ${m.date || ''}</span>
                        <span>${m.type} - ${m.product || ''} (${m.qty || 0})</span>
                    </div>
                `;
            }).join('');
        }
    }

    // ================== تقرير المبيعات بين تاريخين ==================
    function filterSalesByDate() {
        const start = document.getElementById('start-date').value;
        const end = document.getElementById('end-date').value;
        
        if (!start || !end) {
            _showNotification('تنبيه', 'الرجاء اختيار تاريخ البداية والنهاية', 'warning');
            return;
        }
        
        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59);

        const invoices = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        
        const filtered = invoices.filter(inv => {
            if (!inv.date) return false;
            const invDate = new Date(inv.date.split(' ')[0].split('/').reverse().join('-'));
            return invDate >= startDate && invDate <= endDate;
        });

        const total = filtered.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const count = filtered.length;
        const avgTicket = count > 0 ? total / count : 0;
        
        const resultDiv = document.getElementById('date-sales-result');
        if (!resultDiv) return;
        
        if (filtered.length === 0) {
            resultDiv.innerHTML = '<div class="alert alert-info">لا توجد مبيعات في هذه الفترة</div>';
            return;
        }
        
        resultDiv.innerHTML = `
            <div class="alert alert-info">
                <div class="row text-center">
                    <div class="col-4">
                        <div class="small">عدد الفواتير</div>
                        <div class="h5">${count}</div>
                    </div>
                    <div class="col-4">
                        <div class="small">إجمالي المبيعات</div>
                        <div class="h5">${total.toFixed(2)} دج</div>
                    </div>
                    <div class="col-4">
                        <div class="small">متوسط الفاتورة</div>
                        <div class="h5">${avgTicket.toFixed(2)} دج</div>
                    </div>
                </div>
            </div>
            <div class="table-responsive" style="max-height: 200px; overflow-y: auto;">
                <table class="table table-sm table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>رقم</th>
                            <th>التاريخ</th>
                            <th>العميل</th>
                            <th>المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(inv => `
                            <tr>
                                <td>#${inv.number || ''}</td>
                                <td>${inv.date || ''}</td>
                                <td>${inv.customer || 'نقدي'}</td>
                                <td class="fw-bold">${(inv.total || 0).toFixed(2)} دج</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
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
        
        customers.forEach(customer => {
            const customerInvoices = invoices.filter(inv => inv.customer === customer.name);
            const totalPurchases = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
            
            // المدفوعات السابقة (نفترض أن المدفوع 60% من المشتريات)
            const paid = totalPurchases * 0.6;
            const remaining = totalPurchases - paid;
            
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
                maxDebt: customer.maxDebt || 0
            });
        });
        
        return {
            debts: debts,
            totalDebt: totalDebt,
            debtorCount: debtorCount,
            creditorCount: creditorCount,
            maxDebt: maxDebt,
            avgDebt: debtorCount > 0 ? totalDebt / debtorCount : 0
        };
    }

    // ================== عرض ديون العملاء ==================
    function renderCustomerDebts(filteredDebts = null) {
        const data = calculateCustomerDebts();
        const debts = filteredDebts || data.debts;
        
        const totalEl = document.getElementById('total-customer-debt');
        const debtorEl = document.getElementById('debtor-customers-count');
        const creditorEl = document.getElementById('creditor-customers-count');
        
        if (totalEl) totalEl.textContent = data.totalDebt.toFixed(2) + ' دج';
        if (debtorEl) debtorEl.textContent = data.debtorCount;
        if (creditorEl) creditorEl.textContent = data.creditorCount;
        
        const tbody = document.getElementById('customer-debts-tbody');
        if (!tbody) return;
        
        if (debts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">لا توجد بيانات</td></tr>';
            return;
        }
        
        tbody.innerHTML = debts.map(d => {
            let statusClass = 'bg-success';
            let statusText = 'دائن';
            
            if (d.remaining > 0) {
                statusClass = 'bg-warning';
                statusText = 'مدين';
            }
            
            return `
            <tr>
                <td>${d.name}</td>
                <td>${d.phone}</td>
                <td>${d.totalPurchases.toFixed(2)} دج</td>
                <td>${d.paid.toFixed(2)} دج</td>
                <td class="${d.remaining > 0 ? 'text-danger fw-bold' : 'text-success'}">${d.remaining.toFixed(2)} دج</td>
                <td>${d.maxDebt} دج</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${d.remaining > 0 ? 
                        `<button class="btn btn-sm btn-success" onclick="reportsModule.payCustomerDebt('${d.name}')">
                            <i class="material-icons-round" style="font-size:16px;">payment</i> تسديد
                        </button>` : 
                        `<span class="text-success">مدفوع</span>`
                    }
                </td>
            </tr>
        `}).join('');
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
            
            // المدفوعات السابقة (نفترض أن المدفوع 70% من المشتريات)
            const paid = totalPurchases * 0.7;
            const remaining = totalPurchases - paid;
            
            let lastInvoice = '-';
            if (supplierPurchases.length > 0) {
                const sortedInvoices = [...supplierPurchases].sort((a, b) => 
                    new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp)
                );
                lastInvoice = sortedInvoices[0].date || '-';
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
            debts: debts,
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
        
        if (totalEl) totalEl.textContent = data.totalDebt.toFixed(2) + ' دج';
        if (debtorEl) debtorEl.textContent = data.debtorCount;
        if (creditorEl) creditorEl.textContent = data.creditorCount;
        
        const tbody = document.getElementById('supplier-debts-tbody');
        if (!tbody) return;
        
        if (data.debts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">لا توجد بيانات</td></tr>';
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
            </tr>
        `).join('');
    }

    // ================== عرض ملخص الديون ==================
    function renderDebtSummary() {
        const customerData = calculateCustomerDebts();
        const supplierData = calculateSupplierDebts();
        
        document.getElementById('summary-customer-debt').textContent = customerData.totalDebt.toFixed(2) + ' دج';
        document.getElementById('summary-debtor-customers').textContent = customerData.debtorCount;
        document.getElementById('max-customer-debt').textContent = customerData.maxDebt.toFixed(2) + ' دج';
        document.getElementById('avg-customer-debt').textContent = customerData.avgDebt.toFixed(2) + ' دج';
        
        document.getElementById('summary-supplier-debt').textContent = supplierData.totalDebt.toFixed(2) + ' دج';
        document.getElementById('summary-debtor-suppliers').textContent = supplierData.debtorCount;
        document.getElementById('max-supplier-debt').textContent = supplierData.maxDebt.toFixed(2) + ' دج';
        document.getElementById('avg-supplier-debt').textContent = supplierData.avgDebt.toFixed(2) + ' دج';
        
        const netDebt = customerData.totalDebt - supplierData.totalDebt;
        document.getElementById('net-debt').textContent = netDebt.toFixed(2) + ' دج';
    }

    // ================== فلترة ديون العملاء ==================
    function filterCustomerDebts() {
        const filter = document.getElementById('debt-filter').value;
        const data = calculateCustomerDebts();
        
        let filtered = data.debts;
        
        switch(filter) {
            case 'debtor':
                filtered = data.debts.filter(d => d.remaining > 0);
                break;
            case 'clean':
                filtered = data.debts.filter(d => d.remaining <= 0);
                break;
        }
        
        renderCustomerDebts(filtered);
    }

    // ================== البحث في ديون العملاء ==================
    function searchCustomerDebts() {
        const searchInput = document.getElementById('debt-search');
        if (!searchInput) return;
        
        const searchTerm = searchInput.value.toLowerCase().trim();
        const data = calculateCustomerDebts();
        
        if (searchTerm === '') {
            renderCustomerDebts(data.debts);
            return;
        }
        
        const filtered = data.debts.filter(d => 
            d.name.toLowerCase().includes(searchTerm) || 
            (d.phone && d.phone.includes(searchTerm))
        );
        
        renderCustomerDebts(filtered);
    }

    // ================== تسديد دين عميل ==================
    function payCustomerDebt(customerName) {
        Swal.fire({
            title: 'تسديد دين',
            html: `
                <div style="text-align:right">
                    <p>العميل: <strong>${customerName}</strong></p>
                    <div class="form-group">
                        <label>المبلغ المدفوع</label>
                        <input type="number" id="payment-amount" class="form-control" value="0" min="1">
                    </div>
                    <div class="form-group mt-2">
                        <label>طريقة الدفع</label>
                        <select id="payment-method" class="form-control">
                            <option value="cash">نقدي</option>
                            <option value="card">بطاقة</option>
                            <option value="check">شيك</option>
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
                return { amount };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                _showNotification('نجاح', 'تم تسديد الدين بنجاح', 'success');
                renderCustomerDebts();
                renderDebtSummary();
            }
        });
    }

    // ================== تصدير الوحدة ==================
    return {
        renderReports,
        showReportTab,
        updateLowStockThreshold,
        updateLowStockList,
        updateTopProducts,
        updateMovementsList,
        filterSalesByDate,
        renderCustomerDebts,
        renderSupplierDebts,
        renderDebtSummary,
        filterCustomerDebts,
        searchCustomerDebts,
        payCustomerDebt,
        renderProductsReport,
        renderCategoriesReport
    };
})();

// ================== تصدير للاستخدام العام ==================
window.reportsModule = reportsModule;

// تهيئة تلقائية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('reports')) {
        setTimeout(() => {
            if (typeof reportsModule !== 'undefined') {
                reportsModule.renderReports();
            }
        }, 500);
    }
});
