import * as React from 'react';

import { useTheme } from '@/hooks/useThemeProvider';

interface AddonThemeSyncProps {
  themes: ReadonlyMap<string, 'light' | 'dark'>;
  themeName: string;
}

// O ThemeProvider do app resolve o tema sozinho (gravado ou sistema) e
// sobrescreve a classe do addon; aqui o tema escolhido no addon vence.
export function AddonThemeSync({
  themes,
  themeName,
}: AddonThemeSyncProps): null {
  const { setTheme } = useTheme();

  React.useLayoutEffect(() => {
    const theme = themes.get(themeName);
    if (theme) {
      setTheme(theme);
    }
  }, [themes, themeName, setTheme]);

  return null;
}
