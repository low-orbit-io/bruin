import { Badge, Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { HeadlessTimelineList } from '../../headless';
import type { StoreApi } from '../../../../../src/vanilla';
import type { HistoryEntry } from '../../headless';

/**
 * Timeline component using Mantine UI
 *
 * Demonstrates how to use the headless HeadlessTimelineList component
 * with Mantine's design system.
 *
 * @example
 * ```tsx
 * <MantineTimeline store={myStore} title="State History" />
 * ```
 */
interface MantineTimelineProps<T = any> {
  /** The Bruin store instance */
  store: StoreApi<T>;

  /** Optional title for the timeline */
  title?: string;

  /** Optional description text */
  description?: string;

  /** Custom render function for entry content */
  renderEntryContent?: (state: T, timestamp: number) => React.ReactNode;
}

export function MantineTimeline<T = any>({
  store,
  title = 'History Timeline',
  description,
  renderEntryContent,
}: MantineTimelineProps<T>) {
  return (
    <Card withBorder shadow="sm" padding="lg">
      <Stack gap="md">
        <div>
          <Title order={3}>{title}</Title>
          {description && (
            <Text c="dimmed" size="sm" mt="xs">
              {description}
            </Text>
          )}
        </div>

        <HeadlessTimelineList
          store={store}
          renderEntry={(
            entry: HistoryEntry<T>,
            index: number,
            isCurrent: boolean,
          ) => (
            <Card
              key={index}
              withBorder
              padding="sm"
              mb="xs"
              bg={isCurrent ? 'blue.0' : undefined}
              style={{
                borderColor: isCurrent
                  ? 'var(--mantine-color-blue-5)'
                  : undefined,
                borderWidth: isCurrent ? 2 : 1,
              }}
            >
              <Group justify="space-between" wrap="nowrap">
                <div style={{ flex: 1 }}>
                  {renderEntryContent ? (
                    renderEntryContent(entry.state, entry.timestamp)
                  ) : (
                    <Text size="sm" ff="monospace">
                      {JSON.stringify(entry.state)}
                    </Text>
                  )}
                </div>
                <Group gap="xs">
                  {isCurrent && (
                    <Badge color="blue" variant="filled">
                      Current
                    </Badge>
                  )}
                  <Text size="xs" c="dimmed">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </Text>
                </Group>
              </Group>
            </Card>
          )}
          emptyMessage={
            <Text c="dimmed" ta="center" py="xl">
              No history entries yet. Make some changes to see history!
            </Text>
          }
        />
      </Stack>
    </Card>
  );
}
