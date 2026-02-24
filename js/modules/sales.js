// ================================================
//       salesModule – النسخة النهائية المدمجة مع بحث داخل الجدول
// ================================================

const salesModule = (function() {
  let currentCart = [];
  let currentCustomerId = null;
  let activeCustomers = [];
  let customers = JSON.parse(localStorage.getItem('customers') || '[]');

  // ─── مساعدات أساسية ───
  function formatCurrency(n) {
    return Number(n||0).toLocaleString('ar-DZ', {minimumFractionDigits:2, maximumFractionDigits:2});
  }

  function parseNumber(v) {
    if (!v && v !== 0) return 0;
    return parseFloat(
      String(v)
        .replace(/[\u0660-\u0669]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
        .replace(/[٬,]/g, '')
        .replace(/[^0-9.-]/g, '')
    ) || 0;
  }

  // ─── تحميل المنتجات ───
  function loadProducts() {
    try {
      return JSON.parse(localStorage.getItem('products') || '[]');
    } catch {
      return [];
    }
  }

  // ─── إضافة منتج إلى السلة ───
  function addProductToCart(product) {
    if (!product || parseNumber(product.quantity) <= 0) {
      Swal.fire({title:'تنبيه', text:'المنتج غير متوفر', icon:'warning', timer:1800});
      return false;
    }

    let item = currentCart.find(i => i.productId === product.id);

    if (item) {
      if (item.qty + 1 > item.stock) {
        Swal.fire({title:'تنبيه', text:'الكمية أكبر من المخزون', icon:'warning'});
        return false;
      }
      item.qty += 1;
    } else {
      item = {
        id: Date.now() + Math.random(),
        productId: product.id,
        name: product.name || 'منتج',
        qty: 1,
        unit: product.unit || 'piece',
        piecesPerUnit: product.piecesPerUnit || 1,
        price: parseNumber(product.sellPrice || product.price || 0),
        discount: 0,
        stock: parseNumber(product.quantity),
        total: 0
      };
      currentCart.push(item);
    }

    recalculateItem(item.id);
    renderCart(true);
    updateCartCount();
    saveCart();

    return true;
  }

  // ─── حساب سطر واحد + إجماليات ───
  function recalculateItem(itemId) {
    const item = currentCart.find(i => i.id == itemId);
    if (!item) return;

    const subtotal = item.qty * item.price;
    item.total = subtotal * (1 - item.discount / 100);

    const row = document.querySelector(`tr[data-item-id="${itemId}"]`);
    if (row) {
      row.querySelector(`#total-${itemId}`).value  = formatCurrency(item.total);
      row.querySelector(`#pieces-${itemId}`).value = (item.qty * (item.piecesPerUnit||1)).toFixed(2);
    }

    updateTotals();
    updateRemainingAmount();
  }

  function updateTotals() {
    let disc = 0, grand = 0, pcs = 0;
    currentCart.forEach(i => {
      disc += (i.qty * i.price) * (i.discount / 100);
      grand += i.total;
      pcs += i.qty * (i.piecesPerUnit || 1);
    });

    document.getElementById('total-discount').textContent   = formatCurrency(disc);
    document.getElementById('grand-total').textContent      = formatCurrency(grand);
    document.getElementById('final-grand-total').textContent = formatCurrency(grand);
    document.getElementById('total-pieces').textContent     = pcs.toLocaleString('ar-DZ') + ' قطعة';
  }

  function updateRemainingAmount() {
    const paid = parseNumber(document.getElementById('paid-amount')?.value || 0);
    const total = parseNumber(document.getElementById('final-grand-total')?.textContent || 0);
    const rem = paid - total;

    const el = document.getElementById('remaining-amount');
    if (el) {
      el.textContent = rem >= 0
        ? `${formatCurrency(rem)} دج (باقي)`
        : `${formatCurrency(Math.abs(rem))} دج (دين)`;
      el.className = rem >= 0 ? 'text-success' : 'text-danger';
    }
  }

  function setPaidFull() {
    const total = document.getElementById('final-grand-total').textContent.replace(/[^0-9.]/g,'');
    document.getElementById('paid-amount').value = total;
    updateRemainingAmount();
  }

  // ─── عرض السلة مع دعم التحديث الجزئي ───
  function renderCart(partial = false) {
    const tbody = document.querySelector('#cart-table tbody');
    if (!tbody) return;

    if (partial) {
      updateTotals();
      updateRemainingAmount();
      return;
    }

    let html = `
      <tr id="product-search-row" class="table-primary">
        <td colspan="10" class="p-2">
          <div class="input-group">
            <span class="input-group-text"><i class="material-icons-round">search</i></span>
            <input type="text" id="product-search-input" class="form-control" placeholder="ابحث عن منتج بالاسم أو الباركود..." oninput="salesModule.searchProducts(this.value)">
            <button class="btn btn-success" type="button" onclick="salesModule.addFromSearchInput()">
              <i class="material-icons-round">add</i> إضافة
            </button>
          </div>
          <div id="product-search-results" class="search-results mt-1" style="display:none;"></div>
        </td>
      </tr>
    `;

    currentCart.forEach((item, idx) => {
      const pieces = item.qty * (item.piecesPerUnit || 1);
      html += `
        <tr data-item-id="${item.id}">
          <td>${idx+1}</td>
          <td class="text-end">${item.name}</td>
          <td>
            <input type="number" class="form-control text-center" value="${item.qty.toFixed(2)}" min="0.01" step="any"
                   onchange="salesModule.updateItemQuantity('${item.id}', this.value)">
          </td>
          <td>
            <input type="number" class="form-control text-center" value="${pieces.toFixed(2)}" min="0.01" step="any"
                   onchange="salesModule.updateItemPieces('${item.id}', this.value)">
          </td>
          <td>
            <select class="form-select form-select-sm" onchange="salesModule.updateItemUnit('${item.id}', this.value)">
              <option value="piece" ${item.unit==='piece'?'selected':''}>قطعة</option>
              <option value="kg"    ${item.unit==='kg'?'selected':''}>كيلو</option>
              <option value="box"   ${item.unit==='box'?'selected':''}>علبة</option>
              <option value="pack"  ${item.unit==='pack'?'selected':''}>كرتونة</option>
            </select>
          </td>
          <td>
            <input type="number" class="form-control text-center" value="${item.price}" min="0" step="0.01"
                   onchange="salesModule.updateItemPrice('${item.id}', this.value)">
          </td>
          <td>
            <input type="text" class="form-control text-center total-field" id="total-\( {item.id}" value=" \){formatCurrency(item.total)}" readonly>
          </td>
          <td><span class="badge \( {item.stock>5?'bg-success':'bg-danger'}"> \){item.stock}</span></td>
          <td>
            <input type="number" class="form-control text-center" value="${item.discount}" min="0" max="100" step="0.1"
                   onchange="salesModule.updateItemDiscount('${item.id}', this.value)">
          </td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="salesModule.removeFromCart('${item.id}')">
              <i class="material-icons-round">delete</i>
            </button>
          </td>
        </tr>
      `;
    });

    if (currentCart.length === 0) {
      html += '<tr><td colspan="10" class="text-center py-5 text-muted">السلة فارغة – ابدأ بالبحث أو الماسح</td></tr>';
    }

    tbody.innerHTML = html;

    updateCartCount();
  }

  function updateCartCount() {
    document.getElementById('cart-count').textContent = currentCart.length;
  }

  // ─── دوال تعديل البيانات من الجدول ───
  function updateItemQuantity(id, val) {
    const item = currentCart.find(i => i.id == id);
    if (!item) return;
    let q = parseNumber(val);
    if (q <= 0) return removeFromCart(id);
    if (q > item.stock) {
      q = item.stock;
      Swal.fire({title:'تنبيه', text:'تم تقييد الكمية للمخزون المتاح', icon:'info', timer:1200});
    }
    item.qty = q;
    recalculateItem(id);
  }

  function updateItemPieces(id, val) {
    const item = currentCart.find(i => i.id == id);
    if (!item) return;
    let p = parseNumber(val);
    if (p <= 0) return removeFromCart(id);
    const ppu = item.piecesPerUnit || 1;
    item.qty = p / ppu;
    if (item.qty > item.stock) item.qty = item.stock;
    recalculateItem(id);
  }

  function updateItemPrice(id, val) {
    const item = currentCart.find(i => i.id == id);
    if (item) {
      item.price = Math.max(0, parseNumber(val));
      recalculateItem(id);
    }
  }

  function updateItemDiscount(id, val) {
    const item = currentCart.find(i => i.id == id);
    if (item) {
      item.discount = Math.min(100, Math.max(0, parseNumber(val)));
      recalculateItem(id);
    }
  }

  function updateItemUnit(id, val) {
    const item = currentCart.find(i => i.id == id);
    if (!item) return;

    const oldPPU = item.piecesPerUnit || 1;
    let newPPU = 1;

    switch(val) {
      case 'kg':   newPPU = 1000; break;
      case 'box':  newPPU = 24;   break;
      case 'pack': newPPU = 12;   break;
      default:     newPPU = 1;
    }

    const currentPieces = item.qty * oldPPU;
    item.qty = currentPieces / newPPU;
    item.unit = val;
    item.piecesPerUnit = newPPU;

    recalculateItem(id);
  }

  function removeFromCart(id) {
    currentCart = currentCart.filter(i => i.id != id);
    renderCart();
    saveCart();
  }

  function clearCart() {
    if (!currentCart.length) return;
    Swal.fire({
      title: 'تأكيد التفريغ',
      text: 'هل أنت متأكد؟',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، تفريغ',
      cancelButtonText: 'إلغاء'
    }).then(r => {
      if (r.isConfirmed) {
        currentCart = [];
        renderCart();
        saveCart();
      }
    });
  }

  // ─── حفظ وتحميل السلة ───
  function saveCart() {
    localStorage.setItem('currentSalesCart', JSON.stringify(currentCart));
  }

  function loadCart() {
    try {
      const saved = localStorage.getItem('currentSalesCart');
      if (saved) currentCart = JSON.parse(saved);
    } catch {}
    renderCart();
  }

  // ─── بحث العملاء ───
  function searchCustomers(query) {
    const resultsDiv = document.getElementById('customer-results');
    if (!resultsDiv) return;

    if (!query || query.length < 2) {
      resultsDiv.style.display = 'none';
      return;
    }

    const filtered = customers.filter(c =>
      (c.name?.toLowerCase().includes(query.toLowerCase())) ||
      (c.phone?.includes(query))
    ).slice(0, 6);

    if (filtered.length === 0) {
      resultsDiv.innerHTML = '<div class="search-result-item text-muted p-3">لا توجد نتائج</div>';
      resultsDiv.style.display = 'block';
      return;
    }

    let html = '';
    filtered.forEach(c => {
      html += `
        <div class="search-result-item" onclick="salesModule.selectCustomer('${c.id}')">
          <strong>${c.name || c.fullname || 'بدون اسم'}</strong><br>
          <small>${c.phone || 'لا يوجد هاتف'}</small>
        </div>
      `;
    });

    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
  }

  // ─── بحث المنتجات داخل الجدول ───
  function searchProducts(query) {
    const resultsDiv = document.getElementById('product-search-results');
    if (!resultsDiv) return;

    if (!query || query.length < 2) {
      resultsDiv.style.display = 'none';
      return;
    }

    const products = loadProducts();
    const filtered = products.filter(p =>
      (p.name?.toLowerCase().includes(query.toLowerCase())) ||
      (p.barcode?.includes(query))
    ).slice(0, 8);

    if (filtered.length === 0) {
      resultsDiv.innerHTML = '<div class="search-result-item text-muted p-3">لا توجد نتائج</div>';
      resultsDiv.style.display = 'block';
      return;
    }

    let html = '';
    filtered.forEach(p => {
      html += `
        <div class="search-result-item" onclick="salesModule.addProductToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">
          <strong>${p.name}</strong> 
          <small class="text-muted ms-2">(${p.barcode || 'بدون باركود'})</small><br>
          <small>السعر: ${formatCurrency(p.sellPrice || p.price)} د.ج – المخزون: ${p.quantity}</small>
        </div>
      `;
    });

    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
  }

  function addFromSearchInput() {
    const input = document.getElementById('product-search-input');
    if (!input || !input.value.trim()) return;

    const products = loadProducts();
    const found = products.find(p =>
      p.name?.toLowerCase() === input.value.trim().toLowerCase() ||
      p.barcode === input.value.trim()
    );

    if (found) {
      addProductToCart(found);
      input.value = '';
      document.getElementById('product-search-results').style.display = 'none';
    } else {
      Swal.fire('غير موجود', 'لم يتم العثور على المنتج', 'info');
    }
  }

  // ─── الباركود ───
  let barcodeBuffer = '';
  let barcodeTimer = null;

  document.addEventListener('keydown', e => {
    if (e.target.matches('#customer-search, #paid-amount, textarea, [contenteditable]')) return;

    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      barcodeBuffer += e.key;

      clearTimeout(barcodeTimer);
      barcodeTimer = setTimeout(() => {
        if (barcodeBuffer.length >= 6) {
          const code = barcodeBuffer.trim();
          barcodeBuffer = '';
          const product = loadProducts().find(p => p.barcode === code);
          if (product) {
            addProductToCart(product);
          } else {
            Swal.fire({title:'غير موجود', text:`باركود: ${code}`, icon:'info', timer:1600});
          }
        }
      }, 80);
    }
  });

  // ─── تهيئة ───
  function init() {
    loadCart();
    renderActiveCustomers();
    console.log("نظام المبيعات جاهز – النسخة المدمجة مع بحث داخل الجدول");
  }

  return {
    addProductToCart,
    updateItemQuantity,
    updateItemPieces,
    updateItemPrice,
    updateItemDiscount,
    updateItemUnit,
    removeFromCart,
    clearCart,
    setPaidFull,
    updateRemainingAmount,
    searchCustomers,
    selectCustomer,
    clearSelectedCustomer,
    removeActiveCustomer,
    openAddCustomerModal,
    searchProducts,
    addFromSearchInput,
    finishSale,
    finishSaleAndPrint,
    init
  };
})();

window.salesModule = salesModule;

document.addEventListener('DOMContentLoaded', salesModule.init);
