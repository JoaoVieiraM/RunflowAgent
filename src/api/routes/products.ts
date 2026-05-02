import { Router } from "express";
import { products } from "../data.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(products);
});

router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find((p) => p.id === id);

  if (!product) {
    res.status(404).json({ error: `Produto com id ${id} não encontrado.` });
    return;
  }

  res.json(product);
});

export default router;
