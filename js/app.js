// ================== تهيئة التطبيق ==================
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة جميع الوحدات
    console.log('تم تحميل تطبيق سوبيرات ريان');
    
    // تهيئة البحث الصوتي
    salesModule.initVoiceSearch();
    purchasesModule.initVoiceSearch();
    
    // عرض البيانات الأولية
    salesModule.renderCart();
    purchasesModule.renderPurchaseCart();
    inventoryModule.renderStock();
    customerModule.renderCustomers();
    supplierModule.renderSuppliers();
    reportsModule.renderReports();
    
    // إضافة منتج افتراضي إذا كان المخزون فارغاً
    if (inventoryModule.stock.length === 0) {
        inventoryModule.stock.push({
            id: Date.now(),
            name: "مثال - زيت زيتون",
            barcode: "123456",
            sellPrice: 1200,
            buyPrice: 900,
            qty: 45,
            unit: "لتر",
            image: null
        });
        inventoryModule.saveStock();
        inventoryModule.renderStock();
    }
});
