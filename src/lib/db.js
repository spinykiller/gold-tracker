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

db.version(2).stores({
  members: '++id, name',
  items: '++id, name, metalType, registeredBy, registeredAt, status, stoneType',
  schedules: '++id, frequency, nextDueAt',
  reconciliations: '++id, startedAt, completedAt, status',
  verifications: '++id, reconciliationId, itemId, verifiedBy, verifiedAt',
  logs: '++id, itemId, action, performedBy, createdAt',
}).upgrade(tx => {
  return tx.table('items').toCollection().modify(item => {
    item.stoneType = item.stoneType || 'none';
    item.stoneName = item.stoneName || null;
    item.stoneWeightCarat = item.stoneWeightCarat || null;
    item.metalPrice = item.metalPrice || null;
    item.stonePrice = item.stonePrice || null;
  });
});

// v3: profile photos for members
db.version(3).stores({
  members: '++id, name',
  items: '++id, name, metalType, registeredBy, registeredAt, status, stoneType',
  schedules: '++id, frequency, nextDueAt',
  reconciliations: '++id, startedAt, completedAt, status',
  verifications: '++id, reconciliationId, itemId, verifiedBy, verifiedAt',
  logs: '++id, itemId, action, performedBy, createdAt',
}).upgrade(tx => {
  return tx.table('members').toCollection().modify(member => {
    member.profilePhoto = member.profilePhoto || null;
  });
});

// v4: multiple photos per item
db.version(4).stores({
  members: '++id, name',
  items: '++id, name, metalType, registeredBy, registeredAt, status, stoneType',
  itemPhotos: '++id, itemId',
  schedules: '++id, frequency, nextDueAt',
  reconciliations: '++id, startedAt, completedAt, status',
  verifications: '++id, reconciliationId, itemId, verifiedBy, verifiedAt',
  logs: '++id, itemId, action, performedBy, createdAt',
}).upgrade(async tx => {
  const items = await tx.table('items').toArray();
  for (const item of items) {
    if (item.photo) {
      await tx.table('itemPhotos').add({
        itemId: item.id,
        photo: item.photo,
        thumb: item.photoThumb || null,
        order: 0,
        createdAt: item.registeredAt,
      });
    }
  }
  await tx.table('items').toCollection().modify(item => {
    delete item.photo;
    delete item.photoThumb;
  });
});

// v5: PIN auth + biometric credentials
db.version(5).stores({
  members: '++id, name',
  items: '++id, name, metalType, registeredBy, registeredAt, status, stoneType',
  itemPhotos: '++id, itemId',
  schedules: '++id, frequency, nextDueAt',
  reconciliations: '++id, startedAt, completedAt, status',
  verifications: '++id, reconciliationId, itemId, verifiedBy, verifiedAt',
  logs: '++id, itemId, action, performedBy, createdAt',
}).upgrade(tx => {
  return tx.table('members').toCollection().modify(member => {
    member.pinHash = member.pinHash || null;
    member.webauthnCredentialId = member.webauthnCredentialId || null;
    member.webauthnPublicKey = member.webauthnPublicKey || null;
  });
});

// v6: multiple stones per item (stones[] array replaces single stone fields)
db.version(6).stores({
  members: '++id, name',
  items: '++id, name, metalType, registeredBy, registeredAt, status',
  itemPhotos: '++id, itemId',
  schedules: '++id, frequency, nextDueAt',
  reconciliations: '++id, startedAt, completedAt, status',
  verifications: '++id, reconciliationId, itemId, verifiedBy, verifiedAt',
  logs: '++id, itemId, action, performedBy, createdAt',
}).upgrade(tx => {
  return tx.table('items').toCollection().modify(item => {
    // Migrate single stone fields to stones array
    if (item.stoneType && item.stoneType !== 'none' && !item.stones) {
      item.stones = [{
        type: item.stoneType,
        name: item.stoneName || '',
        weightCarat: item.stoneWeightCarat || null,
        price: item.stonePrice || null,
      }];
    } else if (!item.stones) {
      item.stones = [];
    }
    // Keep metalPrice, remove old single-stone fields
    delete item.stoneType;
    delete item.stoneName;
    delete item.stoneWeightCarat;
    delete item.stonePrice;
  });
});

// v7: delete approval workflow
db.version(7).stores({
  members: '++id, name',
  items: '++id, name, metalType, registeredBy, registeredAt, status',
  itemPhotos: '++id, itemId',
  deleteRequests: '++id, itemId, requestedBy, status',
  schedules: '++id, frequency, nextDueAt',
  reconciliations: '++id, startedAt, completedAt, status',
  verifications: '++id, reconciliationId, itemId, verifiedBy, verifiedAt',
  logs: '++id, itemId, action, performedBy, createdAt',
});

// v8: admin role for members (marks "Me" as admin for existing installs)
db.version(8).stores({
  members: '++id, name',
  items: '++id, name, metalType, registeredBy, registeredAt, status',
  itemPhotos: '++id, itemId',
  deleteRequests: '++id, itemId, requestedBy, status',
  schedules: '++id, frequency, nextDueAt',
  reconciliations: '++id, startedAt, completedAt, status',
  verifications: '++id, reconciliationId, itemId, verifiedBy, verifiedAt',
  logs: '++id, itemId, action, performedBy, createdAt',
}).upgrade(tx => {
  return tx.table('members').toCollection().modify(member => {
    if (member.name === 'Me') {
      member.isAdmin = true;
    } else if (member.isAdmin === undefined) {
      member.isAdmin = false;
    }
  });
});

// v9: app settings (configurable app name)
db.version(9).stores({
  members: '++id, name',
  items: '++id, name, metalType, registeredBy, registeredAt, status',
  itemPhotos: '++id, itemId',
  deleteRequests: '++id, itemId, requestedBy, status',
  schedules: '++id, frequency, nextDueAt',
  reconciliations: '++id, startedAt, completedAt, status',
  verifications: '++id, reconciliationId, itemId, verifiedBy, verifiedAt',
  logs: '++id, itemId, action, performedBy, createdAt',
  settings: 'key',
});

export const DEFAULT_APP_NAME = 'Aureum Heritage';

export async function getAppName() {
  const setting = await db.settings.get('appName');
  return setting?.value || DEFAULT_APP_NAME;
}

export async function setAppName(name) {
  await db.settings.put({ key: 'appName', value: name || DEFAULT_APP_NAME });
}

let seedPromise = null;
export function seedMembers() {
  if (!seedPromise) {
    seedPromise = (async () => {
      // Deduplicate members created by concurrent seed calls (React StrictMode)
      const all = await db.members.toArray();
      const seen = new Set();
      const dupes = [];
      for (const m of all) {
        if (seen.has(m.name)) dupes.push(m.id);
        else seen.add(m.name);
      }
      if (dupes.length) await db.members.bulkDelete(dupes);

      const count = await db.members.count();
      if (count === 0) {
        await db.members.bulkAdd([
          { name: 'Dad', avatar: 'D' },
          { name: 'Mom', avatar: 'M' },
          { name: 'Me', avatar: 'Y', isAdmin: true },
          { name: 'Wife', avatar: 'W' },
        ]);
      }
    })();
  }
  return seedPromise;
}
