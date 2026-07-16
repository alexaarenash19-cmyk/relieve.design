import { useParams } from 'react-router-dom';

export default function Collection() {
  const { slug } = useParams();
  return <h1 className="p-8 text-2xl">Colección: {slug}</h1>;
}
