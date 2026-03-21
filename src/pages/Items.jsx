import { useNavigate } from 'react-router-dom';
import ItemList from '../components/items/ItemList';

export default function Items() {
  const navigate = useNavigate();

  return (
    <main className="pt-8 px-6 max-w-5xl mx-auto pb-8">
      <ItemList />
      <button
        onClick={() => navigate('/add')}
        className="fixed bottom-28 right-6 w-16 h-16 rounded-full bg-primary text-on-primary shadow-[0_10px_30px_rgba(212,175,55,0.4)] flex items-center justify-center transition-transform active:scale-90 hover:scale-110 z-40"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
      </button>
    </main>
  );
}
