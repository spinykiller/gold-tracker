const styles = {
  gold: 'bg-primary-container/20 text-primary-fixed-dim border-primary-container/30',
  silver: 'bg-secondary-container/90 text-on-secondary-container border-on-secondary-container/10',
  platinum: 'bg-tertiary-container/90 text-on-tertiary-container border-on-tertiary-container/10',
  stones: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  others: 'bg-surface-container-highest text-on-surface border-outline-variant/20',
};

export default function Badge({ type = 'gold' }) {
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${styles[type] || styles.other}`}>
      {type}
    </span>
  );
}
