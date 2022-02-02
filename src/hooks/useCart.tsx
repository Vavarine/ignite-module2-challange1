import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const alreadyAdded = cart.find((cart) => cart.id === productId);

      if (alreadyAdded) {
        const amount = alreadyAdded.amount + 1;
        updateProductAmount({ productId, amount });

        return;
      }

      const { data } = await api.get<Product>("products/" + productId);

      data.amount = 1;
      const newCartValue = [...cart, data];

      setCart(newCartValue);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCartValue));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCartValue = cart.filter((product) => product.id !== productId);

      setCart(newCartValue);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCartValue));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    try {
      const { data } = await api.get<Stock>("stock/" + productId);

      if (amount > data.amount) {
        toast.error("Quantidade solicitada fora de estoque");

        return;
      }

      const newCartValue = cart.map((product) => {
        if (product.id === productId) {
          return { ...product, amount };
        }

        return product;
      });

      setCart(newCartValue);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCartValue));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
