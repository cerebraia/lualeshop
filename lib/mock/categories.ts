import type { Category } from '../types';

export const mockCategories: Category[] = [
  {
    id: 'cat-bebes',
    name: 'Bebés',
    slug: 'bebes',
    description: 'Ropa tierna y cómoda para los más pequeños',
    order: 1,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-ninas',
    name: 'Niñas',
    slug: 'ninas',
    description: 'Prendas especiales para ellas',
    order: 2,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-ninos',
    name: 'Niños',
    slug: 'ninos',
    description: 'Ropa cómoda y resistente para ellos',
    order: 3,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
];
