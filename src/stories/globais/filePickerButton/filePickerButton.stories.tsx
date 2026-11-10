import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { Card } from '@/components/global/card/card';
import { FilePickerButton } from '@/components/global/filePickerButton/filePickerButton';

const meta = {
  title: 'Globais/FilePickerButton',
  component: FilePickerButton,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Botão "+" que abre o seletor de arquivos do sistema direto, com vários arquivos e sem modal. Entrega `File[]` em `onFiles`; quem usa é dono do upload.',
      },
    },
  },
  args: { label: 'Anexar documento', onFiles: () => undefined },
} satisfies Meta<typeof FilePickerButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vitrine: Story = {
  render: () => {
    const [names, setNames] = useState<string[]>([]);

    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Normal">
          <div className="flex items-center gap-3">
            <FilePickerButton
              label="Anexar documento"
              onFiles={(files) => setNames(files.map((file) => file.name))}
            />
            <span className="text-sm text-muted-foreground">
              {names.length > 0 ? names.join(', ') : 'Nenhum arquivo escolhido'}
            </span>
          </div>
        </Card>

        <Card title="Com filtro (accept)">
          <FilePickerButton
            label="Anexar PDF ou imagem"
            accept=".pdf,image/*"
            onFiles={() => undefined}
          />
        </Card>

        <Card title="Desabilitado com motivo">
          <FilePickerButton
            label="Anexar documento"
            disabled
            disabledReason="Enviando os arquivos escolhidos"
            onFiles={() => undefined}
          />
        </Card>
      </div>
    );
  },
};
