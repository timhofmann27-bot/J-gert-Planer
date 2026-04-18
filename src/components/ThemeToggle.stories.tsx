import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from '../components/ThemeToggle';
import { ThemeProvider } from '../components/ThemeProvider';

const meta = {
  title: 'UI/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithBackgrounds: Story = {
  render: () => (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Theme Toggle Demo</h1>
        <ThemeToggle />
      </div>
      <div className="grid gap-4">
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <h2 className="text-lg font-semibold mb-2">Card 1</h2>
          <p className="text-white/60">This card adapts to the current theme.</p>
        </div>
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <h2 className="text-lg font-semibold mb-2">Card 2</h2>
          <p className="text-white/60">Try switching between light, dark, and system themes.</p>
        </div>
      </div>
    </div>
  ),
};
