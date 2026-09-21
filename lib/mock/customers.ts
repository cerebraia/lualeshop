import type { Customer } from '../types';

export const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'María González',
    phone: '+58 412-5551234',
    city: 'Caracas',
    address: 'El Hatillo',
    notes: 'Prefiere delivery a domicilio',
    orderIds: ['ord-001', 'ord-002'],
    createdAt: '2024-07-10T00:00:00Z',
  },
  {
    id: 'cust-002',
    name: 'Andreína Rodríguez',
    phone: '+58 414-7778899',
    city: 'Caracas',
    address: 'Las Mercedes',
    notes: '',
    orderIds: ['ord-003'],
    createdAt: '2024-08-05T00:00:00Z',
  },
  {
    id: 'cust-003',
    name: 'Carmen López',
    phone: '+58 424-3334455',
    city: 'Valencia',
    notes: 'Envío por MRW',
    orderIds: [],
    createdAt: '2024-09-01T00:00:00Z',
  },
];
