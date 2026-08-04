// ▼▼ 一番上に追加 ▼▼
const { Redis } = require('@upstash/redis');
const redis = Redis.fromEnv();
// ▲▲ 追加ここまで ▲▲

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { selectedMenus, total, orderDate, payment } = req.body;

    // ▼▼ ここから追加：現在の在庫データを取得して減らす ▼▼
    let inventoryData = await redis.get('keio_inventory_data');
    
    if (inventoryData) {
      selectedMenus.forEach(item => {
        // 注文された商品が在庫データに存在し、1個以上ある場合は減らす
        if (inventoryData.items[item] !== undefined && inventoryData.items[item] > 0) {
          inventoryData.items[item] -= 1;
        }
      });
      // 減らした後の最新データを上書き保存
      await redis.set('keio_inventory_data', inventoryData);
    }
    // ▲▲ 追加ここまで ▲▲


    // ↓↓↓ これより下は、元からあった「注文番号の生成」や「orders.jsonの保存」処理をそのまま残します ↓↓↓
    const generatedOrderNumber = Math.floor(Math.random() * 1000000); 

    // レスポンスを返す
    res.status(200).json({ orderNumber: generatedOrderNumber, message: '注文を受け付けました' });
  }
};