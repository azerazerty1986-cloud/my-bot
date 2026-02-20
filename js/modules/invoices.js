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
                color: '#dc3545'
            })),
            ...purchaseInvoices.map(inv => ({
                ...inv,
                type: 'purchase',
                typeText: 'مشتريات',
                party: inv.supplier,
                partyId: inv.supplierId,
                icon: 'shopping_cart',
                color: '#28a745'
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
            utilsModule.formatDate(inv.date).includes(term)
        );
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
                    <span style="background: ${inv.color}; color: white; padding: 5px 10px; border-radius: 50px; font-size: 12px;">
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
                <td>${inv.paymentText || 'نقدي'}</td>
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
                <td>${inv.paymentText || 'نقدي'}</td>
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
                        <strong>طريقة الدفع:</strong> ${invoice.paymentText || 'نقدي'}
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
                                <td style="padding:8px; font-weight:bold; color:#dc3545;">
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
        const printWindow = window.open('', '_blank');
        
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
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>فاتورة ${invoice.number}</title>
                <style>
                    body { font-family: Arial; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    h1 { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; }
                    td { padding: 8px; border: 1px solid #ddd; text-align: center; }
                    .total { font-size: 18px; font-weight: bold; text-align: left; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 50px; color: #999; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>سوبر - النظام المتكامل</h1>
                    <h3>فاتورة ${type === 'sale' ? 'بيع' : 'شراء'}</h3>
                    <p>رقم: ${invoice.number}</p>
                    <p>التاريخ: ${utilsModule.formatDate(invoice.date)}</p>
                    <p>${party}: ${partyName}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>المنتج</th>
                            <th>الكمية</th>
                            <th>السعر</th>
                            ${type === 'sale' ? '<th>الخصم</th>' : ''}
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                
                <div class="total">
                    <p>الإجمالي: ${utilsModule.formatCurrency(invoice.grandTotal)} دج</p>
                </div>
                
                <div class="footer">
                    <p>شكراً لتعاملكم معنا</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
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
        
        const thisMonthSales = salesInvoices.filter(inv => new Date(inv.date) >= startOfMonth);
        const thisMonthPurchases = purchaseInvoices.filter(inv => new Date(inv.date) >= startOfMonth);
        
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
            totals: {
                salesTotal: salesInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
                purchasesTotal: purchaseInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0)
            }
        };
        
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
    
    // ================== تحديث جميع الجداول ==================
    function refresh() {
        renderAllInvoices();
        renderSalesInvoices();
        renderPurchaseInvoices();
        getStats();
    }
    
    // ================== دالة التصفية للاستخدام في HTML ==================
    function filterInvoices() {
        const type = document.getElementById('invoices-type-filter')?.value || 'all';
        const searchTerm = document.getElementById('invoices-search')?.value || '';
        
        if (searchTerm) {
            const results = searchInvoices(searchTerm);
            renderFilteredResults(results);
        } else {
            const filtered = filterByType(type);
            renderFilteredResults(filtered);
        }
    }
    
    function renderFilteredResults(results) {
        const tbody = document.getElementById('all-invoices-tbody');
        if (!tbody) return;
        
        if (results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = results.map(inv => `
            <tr>
                <td>${inv.number}</td>
                <td>
                    <span style="background: ${inv.color}; color: white; padding: 5px 10px; border-radius: 50px; font-size: 12px;">
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
                        عرض
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="invoicesModule.confirmDelete('${inv.id}', '${inv.type}')">
                        حذف
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ invoicesModule initialized - الرقم 24');
        console.log(`   فواتير المبيعات: ${salesInvoices.length}`);
        console.log(`   فواتير المشتريات: ${purchaseInvoices.length}`);
        
        refresh();
    }
    
    // ================== واجهة الوحدة ==================
    return {
        salesInvoices,
        purchaseInvoices,
        getAllInvoices,
        getSalesInvoices,
        getPurchaseInvoices,
        getInvoice,
        searchInvoices,
        filterByType,
        renderAllInvoices,
        renderSalesInvoices,
        renderPurchaseInvoices,
        showInvoiceDetails,
        deleteInvoice,
        confirmDelete,
        getStats,
        refresh,
        filterInvoices,
        init
    };
})();

// ================== تصدير للاستخدام العام ==================
window.invoicesModule = invoicesModule;

// ================== دوال مختصرة للاستخدام في HTML ==================
window.showInvoiceDetails = (id, type) => invoicesModule.showInvoiceDetails(id, type);
window.deleteInvoice = (id, type) => invoicesModule.confirmDelete(id, type);
window.filterInvoices = () => invoicesModule.filterInvoices();

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
