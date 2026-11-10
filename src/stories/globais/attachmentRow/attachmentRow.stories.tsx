import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { AttachmentRow } from '@/components/global/attachmentRow/attachmentRow';
import { Card } from '@/components/global/card/card';

const TEXT_SAMPLE = 'Linha 1 do arquivo de exemplo\nLinha 2 do arquivo\n';

const PDF_SAMPLE = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 44>>stream
BT /F1 18 Tf 20 70 Td (Documento de exemplo) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R/Size 6>>
%%EOF`;

const noop = (): Promise<void> => Promise.resolve();

/** Endereço `blob:` de exemplo, como o `fetchFileObjectUrl` devolveria. */
function sampleUrl(name: string) {
  if (name.endsWith('.pdf')) {
    return () =>
      Promise.resolve(
        URL.createObjectURL(new Blob([PDF_SAMPLE], { type: 'application/pdf' }))
      );
  }
  if (name.endsWith('.txt')) {
    return () =>
      Promise.resolve(
        URL.createObjectURL(new Blob([TEXT_SAMPLE], { type: 'text/plain' }))
      );
  }
  return () => pngSampleUrl();
}

/** PNG de exemplo (canvas), com o MIME `image/png` que o visualizador espera de `.png`. */
function pngSampleUrl(): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 200;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#6366f1';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(URL.createObjectURL(blob));
      else reject(new Error('PNG de exemplo indisponível'));
    }, 'image/png');
  });
}

const meta = {
  title: 'Globais/AttachmentRow',
  component: AttachmentRow,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Anexo em cartão: ícone, nome e ações. O lápis renomeia sem tocar na extensão (Enter grava, Esc desiste); o nome abre o visualizador (imagem, PDF ou texto) quando há `getPreviewUrl`; "Baixar" chama `onDownload`.',
      },
    },
  },
  args: { name: 'Contrato.pdf', onDownload: noop },
} satisfies Meta<typeof AttachmentRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vitrine: Story = {
  render: () => (
    <div className="grid max-w-xl gap-6">
      <Card title="Com renomear e visualizador">
        <div className="flex flex-col gap-2">
          <AttachmentRow
            name="Foto da vistoria.png"
            onDownload={noop}
            onRename={noop}
            getPreviewUrl={sampleUrl('a.png')}
          />
          <AttachmentRow
            name="Proposta.pdf"
            onDownload={noop}
            onRename={noop}
            getPreviewUrl={sampleUrl('a.pdf')}
          />
          <AttachmentRow
            name="Anotações.txt"
            onDownload={noop}
            onRename={noop}
            getPreviewUrl={sampleUrl('a.txt')}
          />
          <AttachmentRow
            name="Pacote.zip"
            onDownload={noop}
            getPreviewUrl={sampleUrl('a.zip')}
          />
        </div>
      </Card>

      <Card title="Sem renomear e sem visualizador">
        <AttachmentRow name="Contrato 3.1 assinado.pdf" onDownload={noop} />
      </Card>

      <Card title="Arquivo ainda não gravado (hideDownload)">
        <AttachmentRow name="Novo anexo.pdf" onDownload={noop} hideDownload />
      </Card>

      <Card title="Desabilitado com motivo">
        <AttachmentRow
          name="Contrato.pdf"
          onDownload={noop}
          onRename={noop}
          getPreviewUrl={sampleUrl('a.png')}
          disabled
          disabledReason="Sem permissão para baixar"
        />
      </Card>
    </div>
  ),
};
