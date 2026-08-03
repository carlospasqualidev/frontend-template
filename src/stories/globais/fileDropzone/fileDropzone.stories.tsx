import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { FileDropzone } from '@/components/global/fileDropzone/fileDropzone';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'Globais/FileDropzone',
  component: FileDropzone,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Área de upload com arrastar-e-soltar, seleção por clique/teclado e prévia do arquivo (nome + tamanho + remover). Controlado por `file`/`onFileChange`.',
      },
    },
  },
  args: { file: null, onFileChange: () => undefined },
} satisfies Meta<typeof FileDropzone>;

export default meta;
type Story = StoryObj<typeof meta>;

function makeFile(name: string, sizeInKb: number): File {
  const content = new Uint8Array(sizeInKb * 1024);
  return new File([content], name, { type: 'text/csv' });
}

export const Vitrine: Story = {
  render: () => {
    const [file, setFile] = useState<File | null>(null);

    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Vazio" description="Arraste ou clique para selecionar.">
          <FileDropzone
            file={file}
            onFileChange={setFile}
            accept=".xlsx,.csv"
            hint="Formatos aceitos: .xlsx, .csv"
          />
        </Card>

        <Card
          title="Com arquivo"
          description="Prévia com nome, tamanho e remover."
        >
          <FileDropzone
            file={makeFile('planilha.csv', 42)}
            onFileChange={() => undefined}
            accept=".xlsx,.csv"
          />
        </Card>

        <Card title="Desabilitado" description="Sem interação.">
          <FileDropzone
            file={null}
            onFileChange={() => undefined}
            accept=".xlsx,.csv"
            hint="Formatos aceitos: .xlsx, .csv"
            disabled
          />
        </Card>
      </div>
    );
  },
};
