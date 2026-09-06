import * as Slider from '@radix-ui/react-slider';

interface DifficultySelectorProps {
  value: number;
  onChange: (pairs: number) => void;
  min: number;
  max: number;
}

const PRESETS = [
  { label: 'Dễ', pairs: 4 },
  { label: 'Vừa', pairs: 6 },
  { label: 'Khó', pairs: 8 },
];

export function DifficultySelector({ value, onChange, min, max }: DifficultySelectorProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.pairs)}
            className={`rounded-xl px-4 py-2 font-bold text-earth shadow ${
              value === p.pairs ? 'bg-peach' : 'bg-grass-soft'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex w-64 items-center gap-3">
        <span className="font-bold text-earth">{value} cặp</span>
        <Slider.Root
          className="relative flex h-5 flex-1 touch-none items-center"
          value={[value]}
          min={min}
          max={max}
          step={1}
          onValueChange={([v]) => onChange(v)}
        >
          <Slider.Track className="relative h-2 flex-1 rounded-full bg-grass-soft">
            <Slider.Range className="absolute h-full rounded-full bg-grass" />
          </Slider.Track>
          <Slider.Thumb
            aria-label="Số cặp"
            className="block h-6 w-6 rounded-full bg-flower shadow"
          />
        </Slider.Root>
      </div>
    </div>
  );
}
