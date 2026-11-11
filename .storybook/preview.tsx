import { withThemeByClassName } from '@storybook/addon-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Preview } from '@storybook/tanstack-react';

import '../src/index.css';
import { AddonThemeSync } from './addonThemeSync';

import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/hooks/useThemeProvider';

const addonThemes = { Claro: 'light', Escuro: 'dark' } as const;
const defaultAddonTheme = 'Escuro';
const themeByAddonName = new Map<string, 'light' | 'dark'>(
  Object.entries(addonThemes)
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: { test: 'todo' },
    layout: 'padded',
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Introdução',
          'Globais',
          [
            'Button',
            'Card',
            'Empty',
            'Modal',
            'ConfirmDialog',
            'PageHeader',
            'Skeleton',
            'SocialIcons',
          ],
          'Formulário',
          'DataTable',
          'Padrões',
          'UI primitivos',
          '*',
        ],
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: addonThemes,
      defaultTheme: defaultAddonTheme,
    }),
    (Story, context) => (
      <ThemeProvider>
        <AddonThemeSync
          themes={themeByAddonName}
          themeName={String(context.globals.theme || defaultAddonTheme)}
        />
        <QueryClientProvider client={queryClient}>
          <div className="min-h-50 bg-background p-4 text-foreground">
            <Story />
            <Toaster />
          </div>
        </QueryClientProvider>
      </ThemeProvider>
    ),
  ],
};

export default preview;
