import { KostListing } from '../types';

export const MOCK_KOSTS: KostListing[] = [
  {
    id: '1',
    name: 'Kost Exclusive Margonda',
    location: 'Depok, Jawa Barat',
    price: 1500000,
    type: 'putra',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400',
    facilities: ['WiFi', 'AC', 'Parkir'],
    distanceToCampus: '0.5 km dari UI',
  },
  {
    id: '2',
    name: 'Wisma Putri Telkom',
    location: 'Bandung, Jawa Barat',
    price: 1200000,
    type: 'putri',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=400',
    facilities: ['WiFi', 'Dapur', 'Keamanan 24 jam'],
    distanceToCampus: '0.8 km dari Telkom University',
  },
  {
    id: '3',
    name: 'Kost Campur Modern Grogol',
    location: 'Jakarta Barat',
    price: 2100000,
    type: 'campur',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=400',
    facilities: ['WiFi', 'AC', 'Kolam Renang'],
    distanceToCampus: '1.2 km dari Trisakti',
  },
  {
    id: '4',
    name: 'Apartemen Student Choice',
    location: 'Surabaya, Jawa Timur',
    price: 3500000,
    type: 'campur',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1512918766671-56f0b17132d6?auto=format&fit=crop&q=80&w=400',
    facilities: ['WiFi', 'Gym', 'Parkir City View'],
    distanceToCampus: '0.3 km dari ITS',
  },
];

export const CAMPUSES = ['UI', 'ITB', 'UGM', 'ITS', 'Telkom University', 'Binus', 'UPH'];
