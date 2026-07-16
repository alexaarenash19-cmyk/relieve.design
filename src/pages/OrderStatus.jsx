import { useParams } from 'react-router-dom';

export default function OrderStatus() {
  const { token } = useParams();
  return <h1 className="p-8 text-2xl">Pedido: {token}</h1>;
}
