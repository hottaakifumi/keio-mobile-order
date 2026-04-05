export default function handler(req, res) {
  if (req.method === 'POST') {
    const orderNumber = Math.floor(Math.random() * 100000);
    res.status(200).json({ orderNumber });
  } else {
    res.status(405).end();
  }
}