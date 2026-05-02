import express from "express";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/products", productsRouter);
app.use("/orders", ordersRouter);

app.listen(PORT, () => {
  console.log(`API mock rodando em http://localhost:${PORT}`);
});
