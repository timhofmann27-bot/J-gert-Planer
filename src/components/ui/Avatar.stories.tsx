import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarGroup } from './Avatar';

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    variant: {
      control: 'select',
      options: ['circle', 'square'],
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fallback: 'JD',
  },
};

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    alt: 'User',
    fallback: 'JD',
  },
};

export const Square: Story = {
  args: {
    fallback: 'JD',
    variant: 'square',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar fallback="S" size="sm" />
      <Avatar fallback="M" size="md" />
      <Avatar fallback="L" size="lg" />
      <Avatar fallback="X" size="xl" />
    </div>
  ),
};

export const AvatarGroupExample: Story = {
  render: () => (
    <AvatarGroup max={3}>
      <Avatar fallback="JD" size="md" />
      <Avatar fallback="AS" size="md" />
      <Avatar fallback="MK" size="md" />
      <Avatar fallback="TP" size="md" />
      <Avatar fallback="LB" size="md" />
    </AvatarGroup>
  ),
};
