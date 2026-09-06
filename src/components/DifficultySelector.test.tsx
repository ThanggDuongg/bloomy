import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DifficultySelector } from './DifficultySelector';

describe('DifficultySelector', () => {
  it('calls onChange with the preset pair count', async () => {
    const onChange = vi.fn();
    render(<DifficultySelector value={6} onChange={onChange} min={3} max={10} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dễ' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});
