// ==========================================
// 1. 変数の準備
// ==========================================
let inventory = {}; // サーバーから受け取った在庫データを入れる箱
let orderDateStr = ""; // 注文日時を保持する変数

// ==========================================
// 2. 画面を開いた時の処理（初期設定）
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
  // --- A. 今日の日付・時間を画面に表示する ---
  const now = new Date();
  orderDateStr = now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  const dateElement = document.getElementById('orderDate');
  if (dateElement) {
    dateElement.innerText = orderDateStr;
  }

  // --- B. サーバーから最新の在庫を取得して画面に反映する ---
  try {
    const response = await fetch('/api/inventory');
    inventory = await response.json();
    renderInventory();
  } catch (error) {
    console.error("在庫データの取得に失敗しました", error);
  }
});

// ==========================================
// 3. 在庫状況を画面（HTML）に反映する関数
// ==========================================
function renderInventory() {
  const checkboxes = document.querySelectorAll('.menu');
  
  checkboxes.forEach(chk => {
    const itemName = chk.value;
    
    // もしサーバーの在庫データの中に、この商品の名前があれば処理する
    if (inventory.hasOwnProperty(itemName)) {
      const stockCount = inventory[itemName];
      const label = chk.parentElement; // チェックボックスを囲んでいるタグ(labelなど)を取得
      
      // 以前表示した「残り○個」の文字があれば一旦消す
      const oldStockSpan = label.querySelector('.stock-info');
      if (oldStockSpan) oldStockSpan.remove();

      // 新しく文字を表示するための枠（span）を作る
      const stockSpan = document.createElement('span');
      stockSpan.className = 'stock-info';
      stockSpan.style.marginLeft = '10px';
      stockSpan.style.fontWeight = 'bold';

      // 在庫がある場合と無い場合で表示を変える
      if (stockCount > 0) {
        stockSpan.innerText = `(残り${stockCount}個)`;
        stockSpan.style.color = '#333';
        chk.disabled = false; // 選択可能にする
      } else {
        stockSpan.innerHTML = `<br><span style="color:red; font-size:0.85em;">こちらでは注文できません。当日券売機で買ってください。</span>`;
        chk.disabled = true;  // 選択不可にする
        chk.checked = false;  // もしチェックされていたら外す
      }
      
      // 文字をHTMLに追加する
      label.appendChild(stockSpan);
    }
  });
}

// ==========================================
// 4. 合計金額を計算する処理（チェックボックス操作時）
// ==========================================
// ※ もしHTML側に金額のデータ(data-price等)がある場合の一般的な計算処理です
const menuCheckboxes = document.querySelectorAll('.menu');
menuCheckboxes.forEach(chk => {
  chk.addEventListener('change', () => {
    let total = 0;
    const checkedMenus = document.querySelectorAll('.menu:checked');
    checkedMenus.forEach(checked => {
      // HTMLの data-price 属性から金額を取得（設定されている場合）
      const price = parseInt(checked.getAttribute('data-price') || "0", 10);
      total += price;
    });
    
    const totalPriceElement = document.getElementById('totalPrice');
    if (totalPriceElement) {
      totalPriceElement.innerText = total + "円";
    }
  });
});

// ==========================================
// 5. 注文確定ボタンを押したときの処理
// ==========================================
const confirmBtn = document.getElementById('confirmYes');

if (confirmBtn) {
  confirmBtn.addEventListener('click', async () => {
    // 画面から選択されたメニュー、合計金額、支払い方法のデータを集める
    const selectedMenus = Array.from(document.querySelectorAll('.menu:checked')).map(m => m.value);
    
    // 何も選ばれていない場合は警告を出して止める
    if (selectedMenus.length === 0) {
      alert("メニューが選択されていません。");
      return;
    }

    const totalEl = document.getElementById('totalPrice');
    const total = totalEl ? totalEl.innerText : "0円";
    
    const paymentEl = document.querySelector('input[name="payment"]:checked');
    const payment = paymentEl ? paymentEl.value : "未選択";
    
    try {
      // --- A. サーバーへ注文データを送る（ここで自動的に在庫が減る） ---
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedMenus, total, orderDate: orderDateStr, payment })
      });
      
      const data = await res.json();
      
      // --- B. 注文が完了したら、もう一度サーバーから最新の在庫を取得して画面を更新 ---
      const invRes = await fetch('/api/inventory');
      inventory = await invRes.json();
      renderInventory(); // 最新の在庫数に書き換え

      // --- C. 注文完了の案内を出す ---
      alert(`注文が完了しました！\n注文番号: ${data.orderNumber}`);
      
      // ※ここに必要に応じて、確認画面を閉じる処理や、バーコードを表示する処理などを追加してください
      // 例: document.getElementById('confirmationModal').style.display = 'none';

    } catch (error) {
      console.error("注文処理に失敗しました", error);
      alert("通信エラーが発生しました。もう一度お試しください。");
    }
  });
}