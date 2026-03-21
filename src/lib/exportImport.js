import { db } from './db';
import { blobToBase64, base64ToBlob } from './photos';

export async function exportData() {
  const members = await db.members.toArray();
  const items = await db.items.toArray();
  const schedules = await db.schedules.toArray();
  const reconciliations = await db.reconciliations.toArray();
  const verifications = await db.verifications.toArray();
  const logs = await db.logs.toArray();

  const itemsWithPhotos = await Promise.all(
    items.map(async (item) => ({
      ...item,
      photo: item.photo ? await blobToBase64(item.photo) : null,
      photoThumb: item.photoThumb ? await blobToBase64(item.photoThumb) : null,
    }))
  );

  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    members,
    items: itemsWithPhotos,
    schedules,
    reconciliations,
    verifications,
    logs,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aureum-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(file) {
  const text = await file.text();
  const data = JSON.parse(text);

  const items = data.items.map((item) => ({
    ...item,
    photo: item.photo ? base64ToBlob(item.photo) : null,
    photoThumb: item.photoThumb ? base64ToBlob(item.photoThumb) : null,
  }));

  await db.transaction('rw', db.members, db.items, db.schedules, db.reconciliations, db.verifications, db.logs, async () => {
    await db.members.clear();
    await db.items.clear();
    await db.schedules.clear();
    await db.reconciliations.clear();
    await db.verifications.clear();
    await db.logs.clear();
    if (data.members?.length) await db.members.bulkAdd(data.members);
    if (items.length) await db.items.bulkAdd(items);
    if (data.schedules?.length) await db.schedules.bulkAdd(data.schedules);
    if (data.reconciliations?.length) await db.reconciliations.bulkAdd(data.reconciliations);
    if (data.verifications?.length) await db.verifications.bulkAdd(data.verifications);
    if (data.logs?.length) await db.logs.bulkAdd(data.logs);
  });
}
