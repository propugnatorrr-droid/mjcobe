export type SongUpdateAdminState = {
  ok?: string;
  error?: string;
};

export async function createSongUpdate(
  previous: SongUpdateAdminState,
  formData: FormData,
): Promise<SongUpdateAdminState>;

export async function updateSongUpdate(
  previous: SongUpdateAdminState,
  formData: FormData,
): Promise<SongUpdateAdminState>;

export async function setSongUpdatePublication(
  formData: FormData,
): Promise<void>;

export async function setSongUpdateVisibility(
  formData: FormData,
): Promise<void>;
