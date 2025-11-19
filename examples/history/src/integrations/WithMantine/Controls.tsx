import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { HeadlessTimelineCompact } from '../../headless';
import type { StoreApi } from '../../../../../src/vanilla';
import type { HistoryEntry } from '../../headless';

/**
 * Compact history controls using Mantine UI
 *
 * Demonstrates how to use the headless HeadlessTimelineCompact component
 * with Mantine's design system.
 *
 * @example
 * ```tsx
 * <MantineControls store={myStore} title="History Controls" />
 * ```
 */
interface MantineControlsProps<T = any> {
  /** The Bruin store instance */
  store: StoreApi<T>;

  /** Optional title for the controls */
  title?: string;

  /** Optional description text */
  description?: string;

  /** Custom render function for timeline entries when expanded */
  renderEntryContent?: (state: T, timestamp: number) => React.ReactNode;
}

export function MantineControls<T = any>({
  store,
  title = 'History Controls',
  description,
  renderEntryContent,
}: MantineControlsProps<T>) {
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

        <HeadlessTimelineCompact
          store={store}
          renderControls={({
            canUndo,
            canRedo,
            currentIndex,
            totalEntries,
            undo,
            redo,
            toggleList,
            showList,
          }) => (
            <Stack gap="md">
              <Group>
                <Button onClick={undo} disabled={!canUndo} variant="filled">
                  ← Undo
                </Button>

                <Badge size="xl" variant="light">
                  {currentIndex + 1} / {totalEntries}
                </Badge>

                <Button onClick={redo} disabled={!canRedo} variant="filled">
                  Redo →
                </Button>

                <Button onClick={toggleList} variant="light" ml="auto">
                  {showList ? 'Hide' : 'Show'} Timeline
                </Button>
              </Group>

              <Group gap="xs">
                <Badge color={canUndo ? 'green' : 'gray'} variant="dot">
                  Can Undo: {canUndo.toString()}
                </Badge>
                <Badge color={canRedo ? 'green' : 'gray'} variant="dot">
                  Can Redo: {canRedo.toString()}
                </Badge>
              </Group>
            </Stack>
          )}
          renderList={(entries: HistoryEntry<T>[], currentIndex: number) => (
            <>
              <Divider my="md" />
              <Stack gap="xs">
                <Text fw={500} size="sm">
                  History Timeline:
                </Text>
                <Group gap="xs">
                  {entries.map((entry, index) => {
                    const isCurrent = index === currentIndex;
                    return (
                      <Badge
                        key={index}
                        size="lg"
                        variant={isCurrent ? 'filled' : 'light'}
                        color={isCurrent ? 'blue' : 'gray'}
                      >
                        {renderEntryContent
                          ? renderEntryContent(entry.state, entry.timestamp)
                          : `#${index + 1}`}
                      </Badge>
                    );
                  })}
                </Group>
              </Stack>
            </>
          )}
        />
      </Stack>
    </Card>
  );
}
