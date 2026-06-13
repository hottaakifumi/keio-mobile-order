let currentStep = 1;
let orderDateStr = "";

window.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const isAfter14 = now.getHours() > 14 || (now.getHours() === 14 && now.getMinutes() >= 0);
  const orderDate = new Date(now);
  if (isAfter14) orderDate.setDate(orderDate.getDate() + 1);
  const month = orderDate.getMonth() + 1;
  const date = orderDate.getDate();
  orderDateStr = `${month}月${date}日`;
  document.getElementById('autoOrderDate').innerText = `注文日: ${orderDateStr}`;

  // (単) ご飯 と ご飯大盛 の制御
  const rice = document.querySelector('input[value="(単) ご飯"]');
  const largeRice = document.querySelector('input[value="ご飯大盛"]');

  if (rice && largeRice) {
    largeRice.disabled = !rice.checked;

    rice.addEventListener('change', () => {
      largeRice.disabled = !rice.checked;
      if (!rice.checked) {
        largeRice.checked = false;
      }
      updateTotal();
    });
  }

  // 麺大盛 の制御
  const noodleItems = [
    "豚天タルタルぶっかけうどん",
    "醤油ラーメン",
    "塩ラーメン",
    "味噌ラーメン",
    "とんこつラーメン",
    "まぜそば",
    "味噌カツラーメン",
    "ミニカレー/ラーメンセット"
  ];

  const noodleToppings = document.querySelectorAll('.menu');
  const largeNoodle = Array.from(noodleToppings).find(
    item => item.value === "麺大盛 (1玉)"
  );

  function updateNoodleAddonState() {
    const isAnyNoodleSelected = Array.from(noodleToppings).some(menu =>
      noodleItems.includes(menu.value) && menu.checked
    );

    if (largeNoodle) {
      largeNoodle.disabled = !isAnyNoodleSelected;
      if (!isAnyNoodleSelected) {
        largeNoodle.checked = false;
      }
    }
  }

  updateNoodleAddonState();
  noodleToppings.forEach(menu => {
    menu.addEventListener('change', () => {
      updateTotal();
      updateNoodleAddonState();
      const anySelected = document.querySelectorAll('.menu:checked').length > 0;
      document.querySelector('#step2 .nextBtn').disabled = !anySelected;
    });
  });
});

// 支払い方法選択の監視
document.querySelectorAll('input[name="payment"]').forEach(payment => {
  payment.addEventListener('change', () => {
    document.getElementById('submitBtn').disabled = false;
  });
});
// 次へボタンの制御
document.querySelectorAll('.nextBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    goToStep(currentStep + 1);
  });
});

// 戻るボタンの制御
document.body.addEventListener('click', (e) => {
  if (e.target.classList.contains('backBtn') && currentStep > 1) {
    goToStep(currentStep - 1);
  }
});

// 注文内容確認・表示
document.getElementById('submitBtn').addEventListener('click', () => {
  const selectedMenus = Array.from(document.querySelectorAll('.menu:checked')).map(m => m.value);
  const total = document.getElementById('totalPrice').innerText;
  const payment = document.querySelector('input[name="payment"]:checked')?.value;
  document.getElementById('orderSummary').innerHTML = `
    <p>注文日: ${orderDateStr}</p>
    <p>メニュー: ${selectedMenus.join(', ')}</p>
    <p>合計: ${total}円</p>
    <p>支払い方法: ${payment}</p>
  `;
  goToStep(4);
});

// 注文確定とサーバーへの送信
// 注文確定とサーバーへの送信
document.getElementById('confirmYes').addEventListener('click', async () => {
  const selectedMenus = Array.from(document.querySelectorAll('.menu:checked')).map(m => m.value);
  const total = document.getElementById('totalPrice').innerText;
  const payment = document.querySelector('input[name="payment"]:checked')?.value;
  const res = await fetch('/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedMenus, total, orderDate: orderDateStr, payment })
  });
  const data = await res.json();
  // メニューのカテゴリーをチェック
  let categoryDisplay = [];

  // ※トリミングミスを防ぐため、配列内のメニュー名に紛れていた半角スペースを修正しています
  const categories = {
    "B カレー": ["カレーライス", "コロッケカレー", "カツカレー", "大盛りカレー", "エベレストカレー", "ミニカレー"],
    "C 定食・丼": ["たらふく丼", "たらふくランチ", "鶏竜田揚定食", "タルタル竜田定食"],
    "D 鉄板焼": ["金ちゃん焼肉"],
    "E 中華麺": ["豚天タルタルぶっかけうどん", "醤油ラーメン", "塩ラーメン", "味噌ラーメン", "とんこつラーメン", "まぜそば", "味噌カツラーメン", "ミニカレー/ラーメンセット"],
    "F 和麺": ["きつねうどん・そば", "ぶっかけうどん", "明太ぶっかけうどん", "カツカレーうどん", "ミートスパ", "カレースパ"],
    "さぼてん": ["ロースカツ定食", "東京レトロ勝丼", "味噌カツ丼"]
  };

  for (const [category, items] of Object.entries(categories)) {
    const isCategorySelected = selectedMenus.some(menu => items.includes(menu));
    if (isCategorySelected) {
      categoryDisplay.push(category);
    }
  }

  // 最終的な表示メッセージとバーコードの制御
  let guideMessage;
  
  if (payment && payment.includes("QR")) {
    guideMessage = `当日はこの画面と支払い用のQRコードまたはバーコードを見せて「${categoryDisplay.join("、")}」と書かれてあるところへお越しください。`;
    
    // ▼▼ QRコード決済「のみ」バーコードを表示する処理 ▼▼
    // 注文番号（data.orderNumber）を元にバーコードを生成
    setTimeout(() => {
      JsBarcode("#barcode", data.orderNumber, {
        format: "CODE128", // 標準的なバーコード規格
        lineColor: "#000",
        width: 2,
        height: 60,
        displayValue: false
      });
    }, 50); // 要素が確実に表示されてから描画するためのわずかなディレイ

  } else {
    guideMessage = `当日はこの画面を見せて「${categoryDisplay.join("、")}」と書かれてあるところへお越しください。`;
    
    // ▼▼ 現金・クレカの場合はバーコードの中身を空にする ▼▼
    document.getElementById("barcode").innerHTML = "";
  }

  document.getElementById("result").innerHTML = `
    注文が完了しました! 注文番号: ${data.orderNumber}<br><br>
    <p>${guideMessage}</p>
  `;

  goToStep(5);  // ステップ5（完了画面）へ遷移
});

// 合計金額の更新
function updateTotal() {
  let total = 0;
  document.querySelectorAll('.menu:checked').forEach(menu => {
    total += parseInt(menu.getAttribute('data-price')) || 0;
  });
  document.getElementById('totalPrice').innerText = total;
}

// ステップの表示切り替え
function goToStep(step) {
  document.getElementById(`step${currentStep}`).classList.add('hidden');
  document.getElementById(`step${step}`).classList.remove('hidden');
  currentStep = step;
}

// スムーズスクロール（カテゴリ遷移用）
function scrollToCategory(categoryId) {
  const target = document.getElementById(categoryId);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}