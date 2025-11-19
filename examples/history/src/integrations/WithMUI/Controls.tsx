import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { HeadlessTimelineCompact } from '../../headless';
import type { StoreApi } from '../../../../../src/vanilla';
import type { HistoryEntry } from '../../headless';

/**
 * Compact history controls using Material-UI (MUI)
 *
 * Demonstrates how to use the headless HeadlessTimelineCompact component
 * with Material-UI's component library.
 *
 * @example
 * ```tsx
 * <MUIControls store={myStore} title="History Controls" />
 * ```
 */
interface MUIControlsProps<T = any> {
  /** The Bruin store instance */
  store: StoreApi<T>;

  /** Optional title for the controls */
  title?: string;

  /** Optional description text */
  description?: string;

  /** Custom render function for timeline entries when expanded */
  renderEntryContent?: (state: T, timestamp: number) => React.ReactNode;
}

export function MUIControls<T = any>({
  store,
  title = 'History Controls',
  description,
  renderEntryContent,
}: MUIControlsProps<T>) {
  return (
    <Card elevation={2}>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" component="h3" gutterBottom>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>

          <Divider />

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
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Button
                    variant="contained"
                    onClick={undo}
                    disabled={!canUndo}
                    sx={{ minWidth: 100 }}
                  >
                    ← Undo
                  </Button>

                  <Chip
                    label={`${currentIndex + 1} / ${totalEntries}`}
                    color="default"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      px: 1,
                    }}
                  />

                  <Button
                    variant="contained"
                    onClick={redo}
                    disabled={!canRedo}
                    sx={{ minWidth: 100 }}
                  >
                    Redo →
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={toggleList}
                    sx={{ ml: 'auto' }}
                  >
                    {showList ? 'Hide' : 'Show'} Timeline
                  </Button>
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Chip
                    label={`Can Undo: ${canUndo}`}
                    color={canUndo ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Can Redo: ${canRedo}`}
                    color={canRedo ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </Stack>

                <Collapse in={showList}>
                  <Box>
                    <Divider sx={{ my: 2 }} />
                    {/* Placeholder for list rendering */}
                  </Box>
                </Collapse>
              </Stack>
            )}
            renderList={(entries: HistoryEntry<T>[], currentIndex: number) => (
              <Stack spacing={1}>
                <Typography variant="subtitle2" fontWeight="bold">
                  History Timeline:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {entries.map((entry, index) => {
                    const isCurrent = index === currentIndex;
                    return (
                      <Chip
                        key={index}
                        label={
                          renderEntryContent
                            ? renderEntryContent(entry.state, entry.timestamp)
                            : `#${index + 1}`
                        }
                        color={isCurrent ? 'primary' : 'default'}
                        variant={isCurrent ? 'filled' : 'outlined'}
                        sx={{
                          fontWeight: isCurrent ? 'bold' : 'normal',
                        }}
                      />
                    );
                  })}
                </Stack>
              </Stack>
            )}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
