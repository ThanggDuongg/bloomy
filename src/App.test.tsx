import { render, screen } from '@testing-library/react';
import App from './App';
import { SettingsProvider } from './context/SettingsContext';

test('renders the Bloomy home menu with the game list', () => {
  render(
    <SettingsProvider>
      <App />
    </SettingsProvider>,
  );
  expect(screen.getByRole('heading', { name: 'Bloomy' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Lật hình/ })).toBeInTheDocument();
});
