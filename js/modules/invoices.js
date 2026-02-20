// ================== invoices.js - إدارة الفواتير الموحدة ==================
// الرقم 24 في ترتيب الملفات - يعتمد على utils.js, sales.js, purchases.js

const invoicesModule = (function() {
    // ================== البيانات ==================
    let salesInvoices = JSON.parse(localStorage.getItem('sales_invoices')) || [];
    let purchaseInvoices = JSON.parse(localStorage.getItem('purchase_invoices')) || [];
    
    // ================== دوال مساعدة داخلية ==================
    function saveSalesInvoices() {
        localStorage.setItem('sales_invoices', JSON.stringify(salesInvoices));
    }
    
    function savePurchaseInvoices() {
        localStorage.setItem('purchase_invoices', JSON.stringify(purchaseInvoices));
    }
    
    // ================== الحصول على جميع الفواتير ==================
    function getAllInvoices() {
        const all = [
            ...salesInvoices.map(inv => ({
                ...inv,
                type: 'sale',
                typeText: 'مبيعات',
                party: inv.customer,
                partyId: inv.customerId,
                icon: 'payments',
                color: 'var(--main-red)'
            })),
            ...purchaseInvoices.map(inv => ({
                ...inv,
                type: 'purchase',
                typeText: 'مشتريات',
                party: inv.supplier,
                partyId: inv.supplierId,
                icon: 'shopping_cart',
                color: 'var(--main-green)'
            }))
        ];
        
        return all.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    // ================== الحصول على فواتير المبيعات ==================
    function getSalesInvoices() {
        return [...salesInvoices].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    // ================== الحصول على فواتير المشتريات ==================
    function getPurchaseInvoices() {
        return [...purchaseInvoices].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    // ================== الحصول على فاتورة محددة ==================
    function getInvoice(id, type = null) {
        if (type === 'sale') {
            return salesInvoices.find(inv => inv.id == id);
        } else if (type === 'purchase') {
            return purchaseInvoices.find(inv => inv.id == id);
        } else {
            // بحث في الكل
            return salesInvoices.find(inv => inv.id == id) || purchaseInvoices.find(inv => inv.id == id);
        }
    }
    
    // ================== البحث في الفواتير ==================
    function searchInvoices(term) {
        term = term.toLowerCase();
        const all = getAllInvoices();
        
        return all.filter(inv => 
            inv.number.toLowerCase().includes(term) ||
            (inv.party && inv.party.toLowerCase().includes(term)) ||
            utilsModule.formatDate(inv.date).includes(term) ||
            inv.typeText.includes(term)
        );
    }
    
    // ================== تصفية الفواتير حسب التاريخ ==================
    function filterByDateRange(startDate, endDate) {
        const all = getAllInvoices();
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        
        return all.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= start && invDate <= end;
        });
    }
    
    // ================== تصفية حسب النوع ==================
    function filterByType(type) {
        if (type === 'all') return getAllInvoices();
        if (type === 'sale') return getSalesInvoices();
        if (type === 'purchase') return getPurchaseInvoices();
        return [];
    }
    
    // ================== عرض جميع الفواتير في الجدول ==================
    function renderAllInvoices() {
        const tbody = document.getElementById('all-invoices-tbody');
        if (!tbody) return;
        
        const allInvoices = getAllInvoices();
        
        if (allInvoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">receipt</i><br>لا توجد فواتير</td></tr>';
            return;
        }
        
        tbody.innerHTML = allInvoices.map(inv => `
            <tr>
                <td>${inv.number}</td>
                <td>
                    <span class="badge" style="background: ${inv.color}; color: white;">
                        <i class="material-icons-round" style="font-size:14px;">${inv.icon}</i>
                        ${inv.typeText}
                    </span>
                </td>
                <td>${utilsModule.formatDate(inv.date)}</td>
                <td>${inv.party}</td>
                <td>${utilsModule.formatCurrency(inv.grandTotal)}</td>
                <td>${inv.items?.length || 0}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="invoicesModule.showInvoiceDetails('${inv.id}', '${inv.type}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="invoicesModule.editInvoice('${inv.id}', '${inv.type}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="invoicesModule.confirmDelete('${inv.id}', '${inv.type}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== عرض فواتير المبيعات ==================
    function renderSalesInvoices() {
        const tbody = document.getElementById('sales-invoices-tbody');
        if (!tbody) return;
        
        const invoices = getSalesInvoices();
        
        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد فواتير مبيعات</td></tr>';
            return;
        }
        
        tbody.innerHTML = invoices.map(inv => `
            <tr>
                <td>${inv.number}</td>
                <td>${utilsModule.formatDate(inv.date)}</td>
                <td>${inv.customer}</td>
                <td>${utilsModule.formatCurrency(inv.grandTotal)}</td>
                <td>${inv.paymentText}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="invoicesModule.showInvoiceDetails('${inv.id}', 'sale')">
                        عرض
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== عرض فواتير المشتريات ==================
    function renderPurchaseInvoices() {
        const tbody = document.getElementById('purchases-invoices-tbody');
        if (!tbody) return;
        
        const invoices = getPurchaseInvoices();
        
        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد فواتير مشتريات</td></tr>';
            return;
        }
        
        tbody.innerHTML = invoices.map(inv => `
            <tr>
                <td>${inv.number}</td>
                <td>${utilsModule.formatDate(inv.date)}</td>
                <td>${inv.supplier}</td>
                <td>${utilsModule.formatCurrency(inv.grandTotal)}</td>
                <td>${inv.paymentText}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="invoicesModule.showInvoiceDetails('${inv.id}', 'purchase')">
                        عرض
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== عرض تفاصيل الفاتورة ==================
    function showInvoiceDetails(id, type) {
        const invoice = getInvoice(id, type);
        if (!invoice) return;
        
        let itemsHtml = '';
        invoice.items.forEach((item, i) => {
            itemsHtml += `
                <tr>
                    <td style="padding:8px; border:1px solid #ddd;">${i + 1}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${item.name}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${item.qty}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${utilsModule.formatCurrency(item.price)}</td>
                    ${type === 'sale' ? `<td style="padding:8px; border:1px solid #ddd;">${item.discount || 0}%</td>` : ''}
                    <td style="padding:8px; border:1px solid #ddd;">${utilsModule.formatCurrency(item.total)}</td>
                </tr>
            `;
        });
        
        const party = type === 'sale' ? 'العميل' : 'المورد';
        const partyName = type === 'sale' ? invoice.customer : invoice.supplier;
        
        Swal.fire({
            title: `فاتورة ${invoice.number}`,
            html: `
                <div style="text-align:right; max-height:500px; overflow-y:auto; padding:10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom:15px;">
                        <span><strong>التاريخ:</strong> ${utilsModule.formatDate(invoice.date)}</span>
                        <span><strong>${party}:</strong> ${partyName}</span>
                    </div>
                    <div style="margin-bottom:15px;">
                        <strong>طريقة الدفع:</strong> ${invoice.paymentText}
                    </div>
                    <hr>
                    <table style="width:100%; border-collapse:collapse; text-align:center; font-size:14px;">
                        <thead>
                            <tr style="background:#f5f5f5;">
                                <th style="padding:8px; border:1px solid #ddd;">#</th>
                                <th style="padding:8px; border:1px solid #ddd;">المنتج</th>
                                <th style="padding:8px; border:1px solid #ddd;">الكمية</th>
                                <th style="padding:8px; border:1px solid #ddd;">السعر</th>
                                ${type === 'sale' ? '<th style="padding:8px; border:1px solid #ddd;">الخصم</th>' : ''}
                                <th style="padding:8px; border:1px solid #ddd;">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="${type === 'sale' ? '5' : '4'}" style="text-align:left; padding:8px;">
                                    <strong>الإجمالي:</strong>
                                </td>
                                <td style="padding:8px; font-weight:bold; color:var(--main-red);">
                                    ${utilsModule.formatCurrency(invoice.grandTotal)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    ${invoice.notes ? `<hr><p><strong>ملاحظات:</strong> ${invoice.notes}</p>` : ''}
                </div>
            `,
            width: '900px',
            showCancelButton: true,
            confirmButtonText: 'طباعة',
            cancelButtonText: 'إغلاق',
            cancelButtonColor: '#3085d6',
            confirmButtonColor: '#28a745'
        }).then((result) => {
            if (result.isConfirmed) {
                printInvoice(invoice, type);
            }
        });
    }
    
    // ================== طباعة فاتورة ==================
    function printInvoice(invoice, type) {
        // استخدام منطقة الطباعة المناسبة
        if (type === 'sale') {
            prepareSalesPrint(invoice);
        } else {
            preparePurchasePrint(invoice);
        }
    }
    
    // ================== تجهيز طباعة فاتورة مبيعات ==================
    function prepareSalesPrint(invoice) {
        const dateTimeEl = document.getElementById('print-date-time');
        const invoiceNoEl = document.getElementById('print-invoice-no');
        const customerEl = document.getElementById('print-customer');
        const tbody = document.getElementById('print-cart-items');
        const totalDiscountEl = document.getElementById('print-total-discount');
        const grandTotalEl = document.getElementById('print-grand-total');
        
        if (dateTimeEl) dateTimeEl.textContent = utilsModule.formatDate(invoice.date);
        if (invoiceNoEl) invoiceNoEl.textContent = invoice.number;
        if (customerEl) customerEl.textContent = invoice.customer;
        
        if (tbody) {
            tbody.innerHTML = invoice.items.map((item, i) => `
                <tr>
                    <td style="padding:8px; border:1px solid #ddd;">${i + 1}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${item.name}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${item.qty}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${utilsModule.formatCurrency(item.price)}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${item.discount || 0}%</td>
                    <td style="padding:8px; border:1px solid #ddd;">${utilsModule.formatCurrency(item.total)}</td>
                </tr>
            `).join('');
        }
        
        if (totalDiscountEl) totalDiscountEl.textContent = utilsModule.formatCurrency(invoice.totalDiscount || 0);
        if (grandTotalEl) grandTotalEl.textContent = utilsModule.formatCurrency(invoice.grandTotal);
        
        setTimeout(() => {
            window.print();
        }, 100);
    }
    
    // ================== تجهيز طباعة فاتورة مشتريات ==================
    function preparePurchasePrint(invoice) {
        const dateTimeEl = document.getElementById('purchase-print-date-time');
        const invoiceNoEl = document.getElementById('purchase-print-invoice-no');
        const supplierEl = document.getElementById('print-supplier');
        const tbody = document.getElementById('purchase-print-cart-items');
        const grandTotalEl = document.getElementById('purchase-print-grand-total');
        
        if (dateTimeEl) dateTimeEl.textContent = utilsModule.formatDate(invoice.date);
        if (invoiceNoEl) invoiceNoEl.textContent = invoice.number;
        if (supplierEl) supplierEl.textContent = invoice.supplier;
        
        if (tbody) {
            tbody.innerHTML = invoice.items.map((item, i) => `
                <tr>
                    <td style="padding:8px; border:1px solid #ddd;">${i + 1}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${item.name}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${item.qty}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${utilsModule.formatCurrency(item.price)}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${utilsModule.formatCurrency(item.total)}</td>
                </tr>
            `).join('');
        }
        
        if (grandTotalEl) grandTotalEl.textContent = utilsModule.formatCurrency(invoice.grandTotal);
        
        setTimeout(() => {
            window.print();
        }, 100);
    }
    
    // ================== تعديل فاتورة ==================
    function editInvoice(id, type) {
        if (type === 'sale') {
            // التوجيه إلى sales.js للتعديل
            if (window.salesModule && window.salesModule.editInvoice) {
                window.salesModule.editInvoice(id);
                // التبديل إلى قسم المبيعات
                const salesSection = document.getElementById('sales');
                if (salesSection && window.app) {
                    window.app.showSection('sales');
                }
            }
        } else {
            // التوجيه إلى purchases.js للتعديل
            if (window.purchasesModule && window.purchasesModule.editInvoice) {
                window.purchasesModule.editInvoice(id);
                // التبديل إلى قسم المشتريات
                const purchasesSection = document.getElementById('purchases');
                if (purchasesSection && window.app) {
                    window.app.showSection('purchases');
                }
            }
        }
    }
    
    // ================== حذف فاتورة ==================
    function deleteInvoice(id, type) {
        if (type === 'sale') {
            salesInvoices = salesInvoices.filter(inv => inv.id != id);
            saveSalesInvoices();
        } else {
            purchaseInvoices = purchaseInvoices.filter(inv => inv.id != id);
            savePurchaseInvoices();
        }
        
        // تحديث العرض
        refresh();
        return true;
    }
    
    // ================== تأكيد حذف فاتورة ==================
    function confirmDelete(id, type) {
        const invoice = getInvoice(id, type);
        if (!invoice) return;
        
        utilsModule.showConfirmation(
            'تأكيد الحذف',
            `هل أنت متأكد من حذف الفاتورة رقم ${invoice.number}؟`,
            () => {
                deleteInvoice(id, type);
                utilsModule.showNotification('تم', 'تم حذف الفاتورة');
            }
        );
    }
    
    // ================== إحصائيات الفواتير ==================
    function getStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        
        // فواتير هذا الشهر
        const thisMonthSales = salesInvoices.filter(inv => new Date(inv.date) >= startOfMonth);
        const thisMonthPurchases = purchaseInvoices.filter(inv => new Date(inv.date) >= startOfMonth);
        
        // فواتير هذا العام
        const thisYearSales = salesInvoices.filter(inv => new Date(inv.date) >= startOfYear);
        const thisYearPurchases = purchaseInvoices.filter(inv => new Date(inv.date) >= startOfYear);
        
        const stats = {
            total: {
                sales: salesInvoices.length,
                purchases: purchaseInvoices.length,
                all: salesInvoices.length + purchaseInvoices.length
            },
            thisMonth: {
                sales: thisMonthSales.length,
                purchases: thisMonthPurchases.length,
                salesTotal: thisMonthSales.reduce((sum, inv) => sum + inv.grandTotal, 0),
                purchasesTotal: thisMonthPurchases.reduce((sum, inv) => sum + inv.grandTotal, 0)
            },
            thisYear: {
                sales: thisYearSales.length,
                purchases: thisYearPurchases.length,
                salesTotal: thisYearSales.reduce((sum, inv) => sum + inv.grandTotal, 0),
                purchasesTotal: thisYearPurchases.reduce((sum, inv) => sum + inv.grandTotal, 0)
            },
            totals: {
                salesTotal: salesInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
                purchasesTotal: purchaseInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
                profit: salesInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0) - 
                       purchaseInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0)
            }
        };
        
        // تحديث واجهة الإحصائيات
        updateStatsDisplay(stats);
        
        return stats;
    }
    
    // ================== تحديث عرض الإحصائيات ==================
    function updateStatsDisplay(stats) {
        const elements = {
            'stats-total-sales': stats.totals.salesTotal,
            'stats-total-purchases': stats.totals.purchasesTotal,
            'stats-count-sales': stats.total.sales,
            'stats-count-purchases': stats.total.purchases,
            'stats-month-sales': stats.thisMonth.salesTotal,
            'stats-month-purchases': stats.thisMonth.purchasesTotal
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                if (id.includes('sales') || id.includes('purchases')) {
                    el.textContent = utilsModule.formatCurrency(value);
                } else {
                    el.textContent = value;
                }
            }
        });
    }
    
    // ================== أكثر العملاء شراءً ==================
    function getTopCustomers(limit = 5) {
        const customerTotals = {};
        
        salesInvoices.forEach(inv => {
            const customer = inv.customer || 'زبون نقدي';
            if (!customerTotals[customer]) {
                customerTotals[customer] = {
                    name: customer,
                    count: 0,
                    total: 0
                };
            }
            customerTotals[customer].count++;
            customerTotals[customer].total += inv.grandTotal;
        });
        
        return Object.values(customerTotals)
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    }
    
    // ================== أكثر الموردين تعاملاً ==================
    function getTopSuppliers(limit = 5) {
        const supplierTotals = {};
        
        purchaseInvoices.forEach(inv => {
            const supplier = inv.supplier || 'مورد';
            if (!supplierTotals[supplier]) {
                supplierTotals[supplier] = {
                    name: supplier,
                    count: 0,
                    total: 0
                };
            }
            supplierTotals[supplier].count++;
            supplierTotals[supplier].total += inv.grandTotal;
        });
        
        return Object.values(supplierTotals)
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    }
    
    // ================== أكثر المنتجات مبيعاً ==================
    function getTopProducts(limit = 10) {
        const productSales = {};
        
        salesInvoices.forEach(inv => {
            inv.items.forEach(item => {
                if (!productSales[item.name]) {
                    productSales[item.name] = {
                        name: item.name,
                        quantity: 0,
                        total: 0
                    };
                }
                productSales[item.name].quantity += item.qty;
                productSales[item.name].total += item.total;
            });
        });
        
        return Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, limit);
    }
    
    // ================== تصدير جميع الفواتير إلى CSV ==================
    function exportAllToCSV() {
        const all = getAllInvoices();
        
        if (all.length === 0) {
            utilsModule.showNotification('تنبيه', 'لا توجد فواتير للتصدير', 'warning');
            return;
        }
        
        const headers = ['رقم الفاتورة', 'النوع', 'التاريخ', 'الطرف', 'المبلغ', 'طريقة الدفع', 'عدد الأصناف'];
        const data = all.map(inv => ({
            number: inv.number,
            type: inv.typeText,
            date: utilsModule.formatDate(inv.date),
            party: inv.party,
            amount: inv.grandTotal,
            payment: inv.paymentText,
            items: inv.items.length
        }));
        
        utilsModule.exportToCSV(data, 'all_invoices', headers);
    }
    
    // ================== تحديث جميع الجداول ==================
    function refresh() {
        renderAllInvoices();
        renderSalesInvoices();
        renderPurchaseInvoices();
        getStats();
    }
    
    // ================== البحث المتقدم ==================
    function advancedSearch(criteria) {
        let results = getAllInvoices();
        
        // تصفية حسب النوع
        if (criteria.type && criteria.type !== 'all') {
            results = results.filter(inv => inv.type === criteria.type);
        }
        
        // تصفية حسب التاريخ
        if (criteria.startDate) {
            const start = new Date(criteria.startDate);
            results = results.filter(inv => new Date(inv.date) >= start);
        }
        
        if (criteria.endDate) {
            const end = new Date(criteria.endDate);
            results = results.filter(inv => new Date(inv.date) <= end);
        }
        
        // تصفية حسب المبلغ
        if (criteria.minAmount) {
            results = results.filter(inv => inv.grandTotal >= criteria.minAmount);
        }
        
        if (criteria.maxAmount) {
            results = results.filter(inv => inv.grandTotal <= criteria.maxAmount);
        }
        
        // تصفية حسب طريقة الدفع
        if (criteria.paymentMethod && criteria.paymentMethod !== 'all') {
            results = results.filter(inv => inv.paymentMethod === criteria.paymentMethod);
        }
        
        return results;
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ invoicesModule initialized - الرقم 24');
        console.log(`   فواتير المبيعات: ${salesInvoices.length}`);
        console.log(`   فواتير المشتريات: ${purchaseInvoices.length}`);
        console.log(`   إجمالي الفواتير: ${salesInvoices.length + purchaseInvoices.length}`);
        
        refresh();
    }
    
    // ================== واجهة الوحدة ==================
    return {
        // البيانات
        salesInvoices,
        purchaseInvoices,
        
        // استعلام
        getAllInvoices,
        getSalesInvoices,
        getPurchaseInvoices,
        getInvoice,
        
        // بحث
        searchInvoices,
        advancedSearch,
        
        // تصفية
        filterByDateRange,
        filterByType,
        
        // عرض
        renderAllInvoices,
        renderSalesInvoices,
        renderPurchaseInvoices,
        showInvoiceDetails,
        
        // عمليات
        deleteInvoice,
        confirmDelete,
        editInvoice,
        
        // إحصائيات
        getStats,
        getTopCustomers,
        getTopSuppliers,
        getTopProducts,
        
        // تصدير
        exportAllToCSV,
        printInvoice,
        
        // تحديث
        refresh,
        
        // تهيئة
        init
    };
})();

// ================== تصدير للاستخدام العام ==================
window.invoicesModule = invoicesModule;

// ================== دوال مختصرة للاستخدام في HTML ==================
window.showInvoiceDetails = (id, type) => invoicesModule.showInvoiceDetails(id, type);
window.deleteInvoice = (id, type) => invoicesModule.confirmDelete(id, type);
window.exportAllInvoices = () => invoicesModule.exportAllToCSV();
window.filterInvoices = () => {
    const type = document.getElementById('invoices-type-filter')?.value || 'all';
    const searchTerm = document.getElementById('invoices-search')?.value || '';
    
    if (searchTerm) {
        const results = invoicesModule.searchInvoices(searchTerm);
        invoicesModule.renderAllInvoices(results);
    } else {
        const filtered = invoicesModule.filterByType(type);
        invoicesModule.renderAllInvoices(filtered);
    }
};

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (invoicesModule && invoicesModule.init) {
            invoicesModule.init();
        }
    });
    
    document.addEventListener('html-loaded', function() {
        if (invoicesModule && invoicesModule.init) {
            invoicesModule.init();
        }
    });
}
