import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import ItemForm from '../components/items/ItemForm';

export default function EditItem({ memberId }) {
  const { id } = useParams();
  const itemId = Number(id);
  const item = useLiveQuery(() => db.items.get(itemId), [itemId]);
  const photos = useLiveQuery(() => db.itemPhotos.where('itemId').equals(itemId).sortBy('order'), [itemId]);

  if (!item || !photos) return null;

  return (
    <main className="max-w-2xl mx-auto px-6 pt-10 pb-32">
      <header className="mb-12">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-2">Edit Asset</h1>
        <p className="text-on-surface-variant text-sm tracking-wide">Update the details of {item.name}.</p>
      </header>
      <ItemForm memberId={memberId} editItem={item} editPhotos={photos} />
    </main>
  );
}
