import Dexie, { type Table } from 'dexie';

export interface PhotoItem {
  id: string;
  fileName: string;
  thumbnail: string;
  fullImage: string;
  type: 'screenshot' | 'memory' | 'unknown';
  ocrText?: string;
  noteCategory?: 'shopping' | 'location' | 'quote' | 'recipe' | 'work' | 'other';
  postStatus?: 'posted' | 'unposted' | 'keep';
  isDeleted?: boolean;
  createdAt: number;
}

export interface Journey {
  id: string;
  name: string;
  startDate: number;
  endDate: number;
  photoIds: string[];
  location?: string;
  description?: string;
  coverPhotoId?: string;
  aiGenerated?: boolean;
}

class AlbumDB extends Dexie {
  photos!: Table<PhotoItem>;
  journeys!: Table<Journey>;

  constructor() {
    super('AlbumOrganizer');
    this.version(2).stores({
      photos: '++id, type, noteCategory, postStatus, createdAt',
      journeys: '++id, startDate, endDate',
    });
  }
}

export const db = new AlbumDB();
