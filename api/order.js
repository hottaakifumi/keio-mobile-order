export default function handler(req, res) {
  if (req.method === 'POST') {
    const { selectedMenus, total, orderDate, payment } = req.body;

    const orderNumber = Math.floor(Math.random() * 10000);

    return res.status(200).json({ orderNumber });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}