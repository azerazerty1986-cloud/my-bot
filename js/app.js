// ================== تهيئة التطبيق ==================
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل تطبيق سوبر');
    
    // تهيئة الوحدات
    if (typeof salesModule !== 'undefined' && salesModule.initVoiceSearch) {
        salesModule.initVoiceSearch();
    }
    if (typeof purchasesModule !== 'undefined' && purchasesModule.initVoiceSearch) {
        purchasesModule.initVoiceSearch();
    }
 
    // عرض البيانات الأولية
    if (typeof salesModule !== 'undefined' && salesModule.renderCart) {
        salesModule.renderCart();
    }
    if (typeof purchasesModule !== 'undefined' && purchasesModule.renderPurchaseCart) {
        purchasesModule.renderPurchaseCart();
    }
    if (typeof inventoryModule !== 'undefined' && inventoryModule.renderStock) {
        inventoryModule.renderStock();
    }
    if (typeof customerModule !== 'undefined' && customerModule.renderCustomers) {
        customerModule.renderCustomers();
    }
    if (typeof supplierModule !== 'undefined' && supplierModule.renderSuppliers) {
        supplierModule.renderSuppliers();
    }
    if (typeof reportsModule !== 'undefined' && reportsModule.renderReports) {
        reportsModule.renderReports();
    }
    
    // التحقق من حالة تسجيل الدخول
    if (typeof utils !== 'undefined' && utils.checkLoginStatus) {
        utils.checkLoginStatus();
    }
});
