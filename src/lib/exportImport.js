import { db } from './db';
import { blobToBase64, base64ToBlob } from './photos';

export async function exportData() {
  const members = await db.members.toArray();
  const items = await db.items.toArray();
  const itemPhotos = await db.itemPhotos.toArray();
  const schedules = await db.schedules.toArray();
  const reconciliations = await db.reconciliations.toArray();
  const verifications = await db.verifications.toArray();
  const deleteRequests = await db.deleteRequests.toArray();
  const logs = await db.logs.toArray();

  // Convert member profile photos
  const membersExport = await Promise.all(
    members.map(async (m) => {
      let profilePhoto = null;
      try {
        if (m.profilePhoto) profilePhoto = await blobToBase64(m.profilePhoto);
      } catch (_) {}
      return { ...m, profilePhoto };
    })
  );

  // Convert item photos (legacy fields if any remain)
  const itemsExport = await Promise.all(
    items.map(async (item) => {
      let photo = null, photoThumb = null;
      try {
        if (item.photo) photo = await blobToBase64(item.photo);
        if (item.photoThumb) photoThumb = await blobToBase64(item.photoThumb);
      } catch (_) {}
      return { ...item, photo, photoThumb };
    })
  );

  // Convert itemPhotos blobs
  const itemPhotosExport = await Promise.all(
    itemPhotos.map(async (p) => {
      let photo = null, thumb = null;
      try {
        if (p.photo) photo = await blobToBase64(p.photo);
        if (p.thumb) thumb = await blobToBase64(p.thumb);
      } catch (_) {}
      return { ...p, photo, thumb };
    })
  );

  const data = {
    version: 3,
    exportedAt: new Date().toISOString(),
    members: membersExport,
    items: itemsExport,
    itemPhotos: itemPhotosExport,
    deleteRequests,
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

  // Convert member profile photos back to blobs
  const members = (data.members || []).map((m) => {
    let profilePhoto = null;
    try {
      if (m.profilePhoto && typeof m.profilePhoto === 'string') profilePhoto = base64ToBlob(m.profilePhoto);
    } catch (_) {}
    return { ...m, profilePhoto };
  });

  // Convert item photos (legacy)
  const items = (data.items || []).map((item) => {
    let photo = null, photoThumb = null;
    try {
      if (item.photo && typeof item.photo === 'string') photo = base64ToBlob(item.photo);
      if (item.photoThumb && typeof item.photoThumb === 'string') photoThumb = base64ToBlob(item.photoThumb);
    } catch (_) {}
    return { ...item, photo, photoThumb };
  });

  // Convert itemPhotos blobs
  const itemPhotos = (data.itemPhotos || []).map((p) => {
    let photo = null, thumb = null;
    try {
      if (p.photo && typeof p.photo === 'string') photo = base64ToBlob(p.photo);
      if (p.thumb && typeof p.thumb === 'string') thumb = base64ToBlob(p.thumb);
    } catch (_) {}
    return { ...p, photo, thumb };
  });

  await db.transaction('rw', db.members, db.items, db.itemPhotos, db.deleteRequests, db.schedules, db.reconciliations, db.verifications, db.logs, async () => {
    await db.members.clear();
    await db.items.clear();
    await db.itemPhotos.clear();
    await db.deleteRequests.clear();
    await db.schedules.clear();
    await db.reconciliations.clear();
    await db.verifications.clear();
    await db.logs.clear();
    if (members.length) await db.members.bulkAdd(members);
    if (items.length) await db.items.bulkAdd(items);
    if (itemPhotos.length) await db.itemPhotos.bulkAdd(itemPhotos);
    if (data.deleteRequests?.length) await db.deleteRequests.bulkAdd(data.deleteRequests);
    if (data.schedules?.length) await db.schedules.bulkAdd(data.schedules);
    if (data.reconciliations?.length) await db.reconciliations.bulkAdd(data.reconciliations);
    if (data.verifications?.length) await db.verifications.bulkAdd(data.verifications);
    if (data.logs?.length) await db.logs.bulkAdd(data.logs);
  });
}
