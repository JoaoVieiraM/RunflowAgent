import { Router } from "express";
import { products, orders, Order, getNextOrderId } from "../data.js";

const router = Router();

router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const order = orders.find((o) => o.id === id);

  if (!order) {
    res.status(404).json({ error: `Pedido com id ${id} não encontrado.` });
    return;
  }

  res.json(order);
});

router.post("/", (req, res) => {
  const body = req.body as { productId: number; quantity: number }[];

  if (!Array.isArray(body) || body.length === 0) {
    res.status(400).json({ error: "O corpo da requisição deve ser um array com pelo menos um item." });
    return;
  }

  // Validar todos os itens antes de processar
  for (const item of body) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      res.status(400).json({ error: "Cada item deve ter productId e quantity (maior que zero)." });
      return;
    }

    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      res.status(400).json({ error: `Produto com id ${item.productId} não encontrado.` });
      return;
    }

    if (product.stock < item.quantity) {
      res.status(400).json({
        error: `Estoque insuficiente para "${product.name}" (disponível: ${product.stock}, solicitado: ${item.quantity}).`,
      });
      return;
    }
  }

  // Criar o pedido e deduzir estoque
  const orderItems = body.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    product.stock -= item.quantity;
    return {
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const newOrder: Order = {
    id: getNextOrderId(),
    status: "processando",
    items: orderItems,
    total: Math.round(total * 100) / 100,
    createdAt: new Date().toISOString(),
  };

  orders.push(newOrder);
  res.status(201).json(newOrder);
});

export default router;
