import Dexie from 'dexie';

export const db = new Dexie('GoldTrackerDB');

db.version(1).stores({
  members: '++id, name',
  items: '++id, name, metalType, registeredBy, registeredAt, status',
  schedules: '++id, frequency, nextDueAt',
  reconciliations: '++id, startedAt, completedAt, status',
  verifications: '++id, reconciliationId, itemId, verifiedBy, verifiedAt',
  logs: '++id, itemId, action, performedBy, createdAt',
});

export async function seedMembers() {
  const count = await db.members.count();
  if (count === 0) {
    await db.members.bulkAdd([
      { name: 'Dad', avatar: 'D' },
      { name: 'Mom', avatar: 'M' },
      { name: 'Me', avatar: 'Y' },
      { name: 'Wife', avatar: 'W' },
    ]);
  }
}
