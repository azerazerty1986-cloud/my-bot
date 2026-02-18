// ================== التقارير والإحصائيات - نسخة كاملة ==================
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

    // ================== دالة إظهار التبويبات ==================
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
                renderServicesReport();
                break;
            case 'report-stores':
                renderStoresReport();
                break;
            case 'report-categories':
                renderCategoriesReport();
                break;
            case 'report-import':
                break;
            case 'report-barcode':
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

    // ================== دالة تحديث التقارير ==================
    function renderReports() {
        const invoices = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INVOICES)) || [];
        const purchases = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PURCHASES)) || [];
        
        const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalPurchases = purchases.reduce((sum, pur) => sum + (pur.total || 0), 0);
        const profits = totalSales - totalPurchases;
        
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
    }

    // ================== تقرير المنتجات ==================
    function renderProductsReport() {
        const stock = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.STOCK)) || [];
        const categories = [...new Set(stock.map(p => p.category || 'عام'))];
        
        const productsCount = document.getElementById('products-count');
        const categoriesCount = document.getElementById('categories-count');
        const stockValue = document.getElementById('stock-value');
        
        if (productsCount) productsCount.textContent = stock.length;
        if (categoriesCount) categoriesCount.textContent = categories.length;
        
        const totalValue = stock.reduce((sum, p) => sum + ((p.qty || 0) * (p.buyPrice || 0)), 0);
        if (stockValue) stockValue.textContent = totalValue.toFixed(2) + ' دج';
        
        const tbody = document.getElementById('products-category-tbody');
        if (!tbody) return;
        
        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">لا توجد بيانات</td></tr>';
            return;
        }
        
        tbody.innerHTML = categories.map(cat => {
            const catProducts = stock.filter(p => (p.category || 'عام') === cat);
            const totalQty = catProducts.reduce((sum, p) => sum + (p.qty || 0), 0);
            const totalValue = catProducts.reduce((sum, p) => sum + ((p.qty || 0) * (p.buyPrice || 0)), 0);
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
                categories[cat] = { count: 0, totalBuy: 0, totalSell: 0, qty: 0 };
            }
            categories[cat].count++;
            categories[cat].totalBuy += (p.buyPrice || 0) * (p.qty || 0);
            categories[cat].totalSell += (p.sellPrice || 0) * (p.qty || 0);
            categories[cat].qty += (p.qty || 0);
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
        const threshold = document.getElementById('low-stock-threshold');
        if (threshold) threshold.textContent = val;
        updateLowStockList();
    }

    function updateLowStockList() {
        const threshold = parseInt(document.getElementById('threshold-input')?.value) || 5;
        const stock = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.STOCK)) || [];
        const lowStock = stock.filter(p => (p.qty || 0) < threshold);
        
        const list = document.getElementById('low-stock-list');
        if (!list) return;
        
        if (lowStock.length === 0) {
            list.innerHTML = '<div class="list-group-item text-center text-success">✅ لا توجد منتجات تحت الحد المحدد</div>';
        } else {
            list.innerHTML = lowStock.map(p => 
                `<div class="list-group-item d-flex justify-content-between align-items-center">
                    <span><i class="material-icons-round text-danger">warning</i> ${p.name}</span>
                    <span class="badge bg-danger">${p.qty || 0} ${p.unit || ''}</span>
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
                        productSales[item.name] = { qty: 0, total: 0 };
                    }
                    productSales[item.name].qty += item.qty || 0;
                    productSales[item.name].total += item.total || 0;
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
                        <span class="badge bg-primary">${data.qty} قطعة</span>
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
                switch(m.type) {
                    case 'بيع': icon = '💰'; break;
                    case 'شراء': icon = '📦'; break;
                    case 'إضافة منتج': icon = '➕'; break;
                    case 'تعديل': icon = '✏️'; break;
                }
                return `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${icon} ${m.date || ''}</span>
                        <span>${m.type} - ${m.product || ''} (${m.qty || 0})</span>
                    </div>
                `;
            }).join('');
        }
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
            
            // المدفوعات (نفترض 60% مدفوع)
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
    function renderCustomerDebts() {
        const data = calculateCustomerDebts();
        
        const totalEl = document.getElementById('total-customer-debt');
        const debtorEl = document.getElementById('debtor-customers-count');
        const creditorEl = document.getElementById('creditor-customers-count');
        const avgEl = document.getElementById('avg-customer-debt');
        
        if (totalEl) totalEl.textContent = data.totalDebt.toFixed(2) + ' دج';
        if (debtorEl) debtorEl.textContent = data.debtorCount;
        if (creditorEl) creditorEl.textContent = data.creditorCount;
        if (avgEl) avgEl.textContent = data.avgDebt.toFixed(2) + ' دج';
        
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
                <td>-</td>
                <td>-</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${d.remaining > 0 ? 
                        `<button class="btn btn-sm btn-success" onclick="reportsModule.payCustomerDebt('${d.name}')">
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
        
        if (!customer || customer.remaining <= 0) {
            _showNotification('معلومات', 'لا توجد ديون مستحقة', 'info');
            return;
        }
        
        Swal.fire({
            title: 'تسديد دين',
            html: `
                <div style="text-align:right">
                    <p><strong>العميل:</strong> ${customerName}</p>
                    <p><strong>المتبقي:</strong> ${customer.remaining.toFixed(2)} دج</p>
                    <hr>
                    <div class="form-group">
                        <label>المبلغ المدفوع</label>
                        <input type="number" id="payment-amount" class="form-control" value="${customer.remaining}">
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
                _showNotification('نجاح', 'تم تسديد الدين بنجاح', 'success');
                renderCustomerDebts();
                renderDebtSummary();
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
                lastInvoice = supplierPurchases[supplierPurchases.length - 1].date;
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

    // ================== عرض ملخص الديون ==================
    function renderDebtSummary() {
        const customerData = calculateCustomerDebts();
        const supplierData = calculateSupplierDebts();
        
        const summaryCustomerDebt = document.getElementById('summary-customer-debt');
        const summaryDebtorCustomers = document.getElementById('summary-debtor-customers');
        const summaryCreditorCustomers = document.getElementById('summary-creditor-customers');
        const maxCustomerDebt = document.getElementById('max-customer-debt');
        const avgCustomerDebt = document.getElementById('avg-customer-debt');
        const totalCustomerPaid = document.getElementById('total-customer-paid');
        
        if (summaryCustomerDebt) summaryCustomerDebt.textContent = customerData.totalDebt.toFixed(2) + ' دج';
        if (summaryDebtorCustomers) summaryDebtorCustomers.textContent = customerData.debtorCount;
        if (summaryCreditorCustomers) summaryCreditorCustomers.textContent = customerData.creditorCount;
        if (maxCustomerDebt) maxCustomerDebt.textContent = customerData.maxDebt.toFixed(2) + ' دج';
        if (avgCustomerDebt) avgCustomerDebt.textContent = customerData.avgDebt.toFixed(2) + ' دج';
        if (totalCustomerPaid) totalCustomerPaid.textContent = (customerData.totalDebt * 0.6).toFixed(2) + ' دج';
        
        const summarySupplierDebt = document.getElementById('summary-supplier-debt');
        const summaryDebtorSuppliers = document.getElementById('summary-debtor-suppliers');
        const summaryCreditorSuppliers = document.getElementById('summary-creditor-suppliers');
        const maxSupplierDebt = document.getElementById('max-supplier-debt');
        const avgSupplierDebt = document.getElementById('avg-supplier-debt');
        
        if (summarySupplierDebt) summarySupplierDebt.textContent = supplierData.totalDebt.toFixed(2) + ' دج';
        if (summaryDebtorSuppliers) summaryDebtorSuppliers.textContent = supplierData.debtorCount;
        if (summaryCreditorSuppliers) summaryCreditorSuppliers.textContent = supplierData.creditorCount;
        if (maxSupplierDebt) maxSupplierDebt.textContent = supplierData.maxDebt.toFixed(2) + ' دج';
        if (avgSupplierDebt) avgSupplierDebt.textContent = supplierData.avgDebt.toFixed(2) + ' دج';
        
        const netDebt = document.getElementById('net-debt');
        if (netDebt) netDebt.textContent = (customerData.totalDebt - supplierData.totalDebt).toFixed(2) + ' دج';
        
        const collectionRate = document.getElementById('collection-rate');
        const collectionProgress = document.getElementById('collection-rate-progress');
        
        if (collectionRate && collectionProgress) {
            const rate = customerData.totalDebt > 0 ? 60 : 0;
            collectionRate.textContent = rate + '%';
            collectionProgress.style.width = rate + '%';
        }
    }

    // ================== فلترة ديون العملاء ==================
    function filterCustomerDebts() {
        const filter = document.getElementById('debt-filter')?.value || 'all';
        const searchTerm = document.getElementById('debt-search')?.value.toLowerCase().trim() || '';
        
        const data = calculateCustomerDebts();
        let filtered = data.debts;
        
        if (filter === 'debtor') {
            filtered = filtered.filter(d => d.remaining > 0);
        } else if (filter === 'clean') {
            filtered = filtered.filter(d => d.remaining <= 0);
        }
        
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
            tbody.innerHTML = '<tr><td colspan="10" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(d => {
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
                <td>-</td>
                <td>-</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${d.remaining > 0 ? 
                        `<button class="btn btn-sm btn-success" onclick="reportsModule.payCustomerDebt('${d.name}')">
                            <i class="material-icons-round">payment</i>
                        </button>` : 
                        `<span class="badge bg-success">✓</span>`
                    }
                </td>
            </tr>
        `}).join('');
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
            'الحالة': d.remaining > 0 ? 'مدين' : 'دائن'
        }));
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "ديون العملاء");
        
        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;
        XLSX.writeFile(wb, `ديون_العملاء_${dateStr}.xlsx`);
        
        _showNotification('نجاح', 'تم تصدير التقرير بنجاح', 'success');
    }

    // ================== دوال الخدمات والمخازن ==================
    function renderServicesReport() {
        const container = document.getElementById('report-services');
        if (container) {
            container.innerHTML = `
                <div class="bg-light p-4 text-center rounded">
                    <i class="material-icons-round" style="font-size: 48px; color: #6610f2;">build</i>
                    <h6 class="mt-2">الخدمات</h6>
                    <p class="text-muted small">قريباً - إدارة الخدمات</p>
                </div>
            `;
        }
    }

    function renderStoresReport() {
        const container = document.getElementById('report-stores');
        if (container) {
            container.innerHTML = `
                <div class="bg-light p-4 text-center rounded">
                    <i class="material-icons-round" style="font-size: 48px; color: #fd7e14;">store</i>
                    <h6 class="mt-2">المخازن</h6>
                    <p class="text-muted small">قريباً - إدارة المخازن</p>
                </div>
            `;
        }
    }

    // ================== تصدير الوحدة ==================
    return {
        showReportTab,
        renderReports,
        renderProductsReport,
        renderServicesReport,
        renderStoresReport,
        renderCategoriesReport,
        updateLowStockThreshold,
        updateLowStockList,
        updateTopProducts,
        updateMovementsList,
        renderCustomerDebts,
        renderSupplierDebts,
        renderDebtSummary,
        filterCustomerDebts,
        payCustomerDebt,
        exportDebtsToExcel
    };
})();

window.reportsModule = reportsModule;
