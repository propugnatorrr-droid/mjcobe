const now = Date.now();

const publicationState = !update.publishedAt
  ? admin.songs.updateDraft
  : update.publishedAt.getTime() > now
    ? admin.songs.updateScheduled
    : admin.songs.updatePublished;
