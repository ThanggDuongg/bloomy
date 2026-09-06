import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsProvider } from './SettingsContext';
import { useSettings } from '../hooks/useSettings';

function Probe() {
  const { showEnglish, toggleEnglish } = useSettings();
  return <button onClick={toggleEnglish}>{showEnglish ? 'english-on' : 'english-off'}</button>;
}

describe('SettingsContext', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to english off and toggles', async () => {
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('english-off');
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('english-on');
    expect(localStorage.getItem('bloomy:showEnglish')).toBe('true');
  });
});
