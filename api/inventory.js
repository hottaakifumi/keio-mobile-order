const { Redis } = require('@upstash/redis');
const redis = Redis.fromEnv();

const categories = {
  "B カレー": ["カレーライス", "コロッケカレー", "カツカレー", "大盛りカレー", "エベレストカレー", "ミニカレー"],
  "C 定食・丼": ["たらふく丼", "たらふくランチ", "鶏竜田揚定食", "タルタル竜田定食"],
  "D 鉄板焼": ["金ちゃん焼肉"],
  "E 中華麺": ["豚天タルタルぶっかけうどん", "醤油ラーメン", "塩ラーメン", "味噌ラーメン", "とんこつラーメン", "まぜそば", "味噌カツラーメン", "ミニカレー/ラーメンセット"],
  "F 和麺": ["きつねうどん・そば", "ぶっかけうどん", "明太ぶっかけうどん", "カツカレーうどん", "ミートスパ", "カレースパ"],
  "さぼてん": ["ロースカツ定食", "東京レトロ勝丼", "味噌カツ丼"]
};

module.exports = async (req, res) => {
  // 今日の日付を取得（日本時間）
  const today = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
  
  // Upstash Redisから現在の在庫データを取得
  let inventoryData = await redis.get('keio_inventory_data');

  // データがない、または日付が変わっている（0:00を過ぎた）場合は10個にリセット
  if (!inventoryData || inventoryData.lastDate !== today) {
    let newInventory = {};
    for (const items of Object.values(categories)) {
      items.forEach(item => newInventory[item] = 10);
    }
    inventoryData = {
      lastDate: today,
      items: newInventory
    };
    // 新しいデータをデータベースに保存
    await redis.set('keio_inventory_data', inventoryData);
  }

  // 最新の在庫をスマホに返す
  res.status(200).json(inventoryData.items);
};