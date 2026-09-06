import * as Switch from '@radix-ui/react-switch';
import { useSettings } from '../hooks/useSettings';

export function LanguageToggle() {
  const { showEnglish, toggleEnglish } = useSettings();
  return (
    <label className="flex items-center gap-2 font-bold text-earth">
      <span>Tiếng Anh</span>
      <Switch.Root
        checked={showEnglish}
        onCheckedChange={toggleEnglish}
        className="relative h-6 w-11 rounded-full bg-grass-soft data-[state=checked]:bg-grass"
      >
        <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[22px]" />
      </Switch.Root>
    </label>
  );
}
