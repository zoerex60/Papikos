export type UserRole = 'seeker' | 'owner';

export interface KostListing {
  id: string;
  name: string;
  location: string;
  price: number;
  type: 'putra' | 'putri' | 'campur';
  rating: number;
  image: string;
  facilities: string[];
  distanceToCampus?: string;
  isFavorite?: boolean;
}

export interface OwnerStats {
  totalProperties: number;
  activeResidents: number;
  emptyRooms: number;
}
