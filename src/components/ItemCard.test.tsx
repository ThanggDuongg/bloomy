import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ItemCard } from './ItemCard';
import { SettingsProvider } from '../context/SettingsContext';
import type { Item } from '../data/types';

const apple: Item = {
  id: 'apple',
  vi: 'Táo',
  en: 'Apple',
  category: 'fruit',
  image: '/images/fruit/apple.webp',
};

describe('ItemCard', () => {
  it('shows the Vietnamese name', () => {
    render(
      <SettingsProvider>
        <ItemCard item={apple} />
      </SettingsProvider>,
    );
    expect(screen.getByText('Táo')).toBeInTheDocument();
  });

  it('hides the English name when the toggle is off (default)', () => {
    render(
      <SettingsProvider>
        <ItemCard item={apple} />
      </SettingsProvider>,
    );
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
  });
});
