import { useParams } from 'react-router-dom';

export default function Product() {
  const { slug } = useParams();
  return <h1 className="p-8 text-2xl">Pieza: {slug}</h1>;
}
