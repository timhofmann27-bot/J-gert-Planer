import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Button } from './Button';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-white/60 text-sm">
          This is the card content. You can put anything here.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="primary" size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const Elevated: Story = {
  render: () => (
    <Card variant="elevated" className="w-80">
      <CardHeader>
        <CardTitle>Elevated Card</CardTitle>
        <CardDescription>With shadow effect</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-white/60 text-sm">
          This card has an elevated appearance with shadows.
        </p>
      </CardContent>
    </Card>
  ),
};

export const Outlined: Story = {
  render: () => (
    <Card variant="outlined" className="w-80">
      <CardHeader>
        <CardTitle>Outlined Card</CardTitle>
        <CardDescription>With border emphasis</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-white/60 text-sm">
          This card has a prominent border.
        </p>
      </CardContent>
    </Card>
  ),
};

export const Hoverable: Story = {
  render: () => (
    <div className="space-y-4">
      <Card hover className="w-80">
        <CardHeader>
          <CardTitle>Hoverable Card</CardTitle>
          <CardDescription>Hover over me</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-white/60 text-sm">
            This card lifts on hover.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
};
