const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.static('.'));
app.use(express.json());

app.post('/order', (req, res) => {
  const { selectedMenus, total, orderDate, payment } = req.body;

  let orders = [];
  if (fs.existsSync('orders.json')) {
    orders = JSON.parse(fs.readFileSync('orders.json', 'utf8'));
  }

  const newOrder = {
    id: orders.length + 1,
    menus: selectedMenus,
    total,
    orderDate,
    payment
  };

  orders.push(newOrder);
  fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));

  res.json({ orderNumber: newOrder.id });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
