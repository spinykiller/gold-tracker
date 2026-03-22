import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';

const actionIcons = {
  registered: 'add_circle',
  verified: 'verified',
  photo_updated: 'photo_camera',
  comment_updated: 'edit_note',
  status_changed: 'swap_horiz',
  edited: 'edit',
  delete_requested: 'delete',
  delete_cancelled: 'cancel',
};

export default function Timeline({ itemId }) {
  const logs = useLiveQuery(
    () => db.logs.where('itemId').equals(itemId).reverse().sortBy('createdAt'),
    [itemId]
  );
  const members = useLiveQuery(() => db.members.toArray());

  if (!logs || !members) return null;

  const getMember = (id) => members.find((m) => m.id === id);

  return (
    <div className="relative space-y-10">
      <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-outline-variant/20" />
      {logs.map((log) => {
        const member = getMember(log.performedBy);
        const isVerified = log.action === 'verified';
        return (
          <div key={log.id} className="relative flex items-start gap-6 pl-10">
            <div className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center ${
              isVerified
                ? 'bg-primary-container shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                : 'bg-surface-container-highest border border-outline-variant/40'
            }`}>
              <span
                className={`material-symbols-outlined text-sm ${isVerified ? 'text-on-primary' : 'text-primary-fixed-dim'}`}
                style={isVerified ? {fontVariationSettings: "'FILL' 1"} : undefined}
              >
                {log.action === 'status_changed'
                  ? (log.details?.newStatus === 'missing' ? 'flag' : 'check_circle')
                  : (actionIcons[log.action] || 'info')}
              </span>
            </div>
            <div>
              <p className="text-on-surface font-bold">
                {log.action === 'registered' && 'Asset Created'}
                {log.action === 'verified' && `Verified by ${member?.name || 'Unknown'}`}
                {log.action === 'photo_updated' && `Photo Updated by ${member?.name || 'Unknown'}`}
                {log.action === 'comment_updated' && `Comment by ${member?.name || 'Unknown'}`}
                {log.action === 'status_changed' && (
                  log.details?.newStatus === 'missing'
                    ? `Marked as Missing by ${member?.name || 'Unknown'}`
                    : log.details?.newStatus === 'active'
                      ? `Marked as Found by ${member?.name || 'Unknown'}`
                      : `Status Changed by ${member?.name || 'Unknown'}`
                )}
                {log.action === 'edited' && `Edited by ${member?.name || 'Unknown'}`}
                {log.action === 'delete_requested' && `Deletion requested by ${member?.name || 'Unknown'}`}
                {log.action === 'delete_cancelled' && `Deletion cancelled by ${member?.name || 'Unknown'}`}
                {log.action === 'deleted' && `Deleted by ${member?.name || 'Unknown'}`}
              </p>
              {log.details?.comment && (
                <p className="text-on-surface-variant text-sm">{log.details.comment}</p>
              )}
              <p className="text-on-surface-variant/50 text-[10px] uppercase tracking-wider mt-2">
                {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' \u2022 '}
                {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        );
      })}
      {logs.length === 0 && (
        <p className="text-on-surface-variant/40 text-sm text-center py-8">No activity recorded yet.</p>
      )}
    </div>
  );
}
