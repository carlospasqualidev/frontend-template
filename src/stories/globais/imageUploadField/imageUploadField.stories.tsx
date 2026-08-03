import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import {
  ImageUploadField,
  type UploadedImage,
} from '@/components/global/imageUploadField/imageUploadField';
import { Card } from '@/components/global/card/card';

const meta = {
  title: 'Globais/ImageUploadField',
  component: ImageUploadField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Upload + galeria de imagens com prévia e remoção (o "X" é o badge circular vermelho padrão). Abstração única para qualquer tela que anexa fotos — nunca duplique dropzone+galeria numa tela. Controlada por `images` + `onChange` (setter de estado com updater funcional). `type` filtra/rotula por seção (para duas galerias dividirem o mesmo array); sem `type`, é galeria única.',
      },
    },
  },
  args: { images: [], onChange: () => undefined },
} satisfies Meta<typeof ImageUploadField>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE: UploadedImage[] = [
  {
    id: '1',
    name: 'frente.png',
    url: 'https://placehold.co/120x120/7c3aed/ffffff?text=Foto',
    type: 'stamp',
  },
  {
    id: '2',
    name: 'produto.png',
    url: 'https://placehold.co/120x120/0ea5e9/ffffff?text=Produto',
    type: 'product',
  },
];

function Demo() {
  const [images, setImages] = React.useState<UploadedImage[]>(SAMPLE);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        title="Por seção (com type e label)"
        description="Mostra só as imagens do type e marca novos uploads."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <ImageUploadField
            label="Foto da frente"
            type="stamp"
            images={images}
            onChange={setImages}
          />
          <ImageUploadField
            label="Foto do produto embalado"
            type="product"
            images={images}
            onChange={setImages}
          />
        </div>
      </Card>

      <Card title="Somente leitura" description="Sem remover nem dropzone.">
        <ImageUploadField
          label="Fotos"
          images={SAMPLE}
          onChange={() => undefined}
          readOnly
        />
      </Card>
    </div>
  );
}

export const Vitrine: Story = {
  render: () => <Demo />,
};
