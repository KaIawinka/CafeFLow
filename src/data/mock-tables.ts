export type CafeTable = {
  id: string;
  name: string;
  zone: 'Зал' | 'Веранда' | 'Тихая зона';
  capacity: number;
  description: string;
  features: string[];
};

export const cafeTables: CafeTable[] = [
  { id: 'table-01', name: 'Столик 01', zone: 'Зал', capacity: 2, description: 'У окна, рядом с розеткой.', features: ['У окна', 'Розетка'] },
  { id: 'table-02', name: 'Столик 02', zone: 'Зал', capacity: 4, description: 'Уютный стол для компании.', features: ['Мягкие кресла'] },
  { id: 'table-03', name: 'Столик 03', zone: 'Тихая зона', capacity: 2, description: 'Спокойное место для работы и встреч.', features: ['Тихо', 'Wi-Fi'] },
  { id: 'table-04', name: 'Столик 04', zone: 'Веранда', capacity: 4, description: 'Светлая веранда с видом на улицу.', features: ['Свежий воздух'] },
  { id: 'table-05', name: 'Столик 05', zone: 'Веранда', capacity: 6, description: 'Большой стол для друзей и семьи.', features: ['Для компании', 'Веранда'] },
  { id: 'table-06', name: 'Столик 06', zone: 'Зал', capacity: 8, description: 'Большой общий стол для мероприятий.', features: ['Для компании', 'Доступность'] },
];
