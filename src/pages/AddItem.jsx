import ItemForm from '../components/items/ItemForm';

export default function AddItem({ memberId }) {
  return (
    <main className="max-w-2xl mx-auto px-6 pt-10 pb-32">
      <header className="mb-12">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-2">New Asset Registration</h1>
        <p className="text-on-surface-variant text-sm tracking-wide">Secure your heritage in the digital ledger.</p>
      </header>
      <ItemForm memberId={memberId} />
    </main>
  );
}
