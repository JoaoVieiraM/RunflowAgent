export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  status: "processando" | "enviado" | "entregue" | "cancelado";
  items: OrderItem[];
  total: number;
  createdAt: string;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Camiseta Básica",
    description: "Camiseta 100% algodão, disponível em várias cores.",
    price: 49.9,
    stock: 50,
  },
  {
    id: 2,
    name: "Calça Jeans Slim",
    description: "Calça jeans com corte slim, confortável para o dia a dia.",
    price: 159.9,
    stock: 30,
  },
  {
    id: 3,
    name: "Tênis Running",
    description: "Tênis leve e respirável ideal para corridas e academia.",
    price: 299.9,
    stock: 15,
  },
  {
    id: 4,
    name: "Boné Snapback",
    description: "Boné com aba reta e fecho ajustável snapback.",
    price: 79.9,
    stock: 100,
  },
  {
    id: 5,
    name: "Mochila Urbana",
    description: "Mochila resistente com compartimento para notebook de até 15 polegadas.",
    price: 189.9,
    stock: 20,
  },
  {
    id: 6,
    name: "Óculos de Sol",
    description: "Óculos de sol com proteção UV400 e armação reforçada.",
    price: 129.9,
    stock: 0,
  },
  {
    id: 7,
    name: "Meias Kit 3 Pares",
    description: "Kit com 3 pares de meias cano curto em algodão.",
    price: 29.9,
    stock: 200,
  },
  {
    id: 8,
    name: "Cinto de Couro",
    description: "Cinto de couro legítimo com fivela metálica clássica.",
    price: 89.9,
    stock: 10,
  },
];

export const orders: Order[] = [
  {
    id: 1042,
    status: "entregue",
    items: [
      { productId: 1, productName: "Camiseta Básica", quantity: 2, unitPrice: 49.9 },
      { productId: 4, productName: "Boné Snapback", quantity: 1, unitPrice: 79.9 },
    ],
    total: 179.7,
    createdAt: "2025-04-10T14:30:00Z",
  },
  {
    id: 1043,
    status: "processando",
    items: [
      { productId: 3, productName: "Tênis Running", quantity: 1, unitPrice: 299.9 },
    ],
    total: 299.9,
    createdAt: "2025-04-28T09:15:00Z",
  },
  {
    id: 1044,
    status: "enviado",
    items: [
      { productId: 7, productName: "Meias Kit 3 Pares", quantity: 3, unitPrice: 29.9 },
    ],
    total: 89.7,
    createdAt: "2025-04-30T11:00:00Z",
  },
];

let nextOrderId = 1045;

export function getNextOrderId(): number {
  return nextOrderId++;
}
